'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { createBrowserClient } from '@supabase/ssr'

type Props = {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function AddChildModal({ isOpen, onClose, onSuccess }: Props) {
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // メインのSupabaseクライアント（親のセッション）
    const supabase = createClient()

    try {
      // 現在の親ユーザーを取得
      const {
        data: { user: parentUser },
      } = await supabase.auth.getUser()

      if (!parentUser) {
        setError('ログインが必要です')
        setLoading(false)
        return
      }

      // 子供用の別のSupabaseクライアントを作成（セッションを共有しない）
      const childSupabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          auth: {
            persistSession: false, // セッションを保存しない
            autoRefreshToken: false,
          },
        }
      )

      // 子供アカウントを作成（別クライアントで）
      const { data: childAuth, error: childAuthError } = await childSupabase.auth.signUp({
        email,
        password,
      })

      if (childAuthError) {
        if (childAuthError.message.includes('already registered')) {
          setError('このメールアドレスは既に登録されています')
        } else {
          setError(`登録に失敗しました: ${childAuthError.message}`)
        }
        setLoading(false)
        return
      }

      if (childAuth.user) {
        // 子供としてログインしてプロフィール作成（別クライアントで）
        const { error: childSignInError } = await childSupabase.auth.signInWithPassword({
          email,
          password,
        })

        if (childSignInError) {
          console.error('Child sign in error:', childSignInError)
          setError('子供のログインに失敗しました')
          setLoading(false)
          return
        }

        // 子供のプロフィール作成（子供としてログイン中、別クライアント）
        const { error: profileError } = await childSupabase.from('user_profiles').insert({
          id: childAuth.user.id,
          display_name: displayName,
          role: 'child',
          start_date: new Date().toISOString().split('T')[0],
        })

        if (profileError) {
          console.error('Profile error:', profileError)
        }

        // 親子関係を登録（親のセッションを使用、メインクライアント）
        const { error: relationError } = await supabase.from('family_relations').insert({
          parent_id: parentUser.id,
          child_id: childAuth.user.id,
        })

        if (relationError) {
          console.error('Relation error:', relationError)
          setError('親子関係の登録に失敗しました')
          setLoading(false)
          return
        }
      }

      // フォームをリセット
      setDisplayName('')
      setEmail('')
      setPassword('')
      setLoading(false)
      onSuccess()
      onClose()
    } catch (err) {
      console.error('Add child error:', err)
      setError('登録中にエラーが発生しました')
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-[#E5E5E5]">
          <h2 className="text-lg font-medium text-[#202020]">子どもを追加</h2>
          <button
            onClick={onClose}
            className="text-[#666666] hover:text-[#202020] text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm text-[#666666] mb-1">名前</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-[#E5E5E5] rounded-md focus:outline-none focus:ring-2 focus:ring-[#DC4C3E] focus:border-transparent"
              placeholder="子どもの名前"
            />
          </div>

          <div>
            <label className="block text-sm text-[#666666] mb-1">メールアドレス</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-[#E5E5E5] rounded-md focus:outline-none focus:ring-2 focus:ring-[#DC4C3E] focus:border-transparent"
              placeholder="子どものメールアドレス"
            />
          </div>

          <div>
            <label className="block text-sm text-[#666666] mb-1">パスワード</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-3 py-2 border border-[#E5E5E5] rounded-md focus:outline-none focus:ring-2 focus:ring-[#DC4C3E] focus:border-transparent"
              placeholder="パスワード（6文字以上）"
            />
          </div>

          {error && (
            <div className="text-[#DC4C3E] text-sm bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-4 border border-[#E5E5E5] text-[#666666] rounded-md hover:bg-[#FAFAFA] transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 px-4 bg-[#DC4C3E] hover:bg-[#B03D32] text-white rounded-md transition-colors disabled:opacity-50"
            >
              {loading ? '追加中...' : '追加する'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

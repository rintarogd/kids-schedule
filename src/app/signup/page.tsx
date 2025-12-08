'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()

    try {
      // アカウント作成
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (authError) {
        if (authError.message.includes('already registered')) {
          setError('このメールアドレスは既に登録されています')
        } else {
          setError('登録に失敗しました。もう一度お試しください')
        }
        setLoading(false)
        return
      }

      if (authData.user) {
        // ログイン
        await supabase.auth.signInWithPassword({
          email,
          password,
        })

        // プロフィール作成
        const { error: profileError } = await supabase.from('user_profiles').insert({
          id: authData.user.id,
          display_name: name,
          role: 'parent',
          start_date: new Date().toISOString().split('T')[0],
        })

        if (profileError) {
          console.error('Profile error:', profileError)
        }
      }

      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      console.error('Signup error:', err)
      setError('登録中にエラーが発生しました')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* ロゴ */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#202020]">じかんバンク</h1>
          <p className="text-[#666666] mt-2">勉強と習い事の記録アプリ</p>
        </div>

        {/* サインアップフォーム */}
        <div className="bg-white rounded-lg shadow-sm border border-[#E5E5E5] p-8">
          <h2 className="text-xl font-semibold text-[#202020] mb-6">
            親アカウントを登録
          </h2>

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-sm text-[#666666] mb-1">名前</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-2 border border-[#E5E5E5] rounded-md focus:outline-none focus:ring-2 focus:ring-[#DC4C3E] focus:border-transparent"
                placeholder="お名前"
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
                placeholder="メールアドレス"
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

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-[#DC4C3E] hover:bg-[#B03D32] text-white font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '登録中...' : '登録する'}
            </button>
          </form>

          <p className="mt-4 text-sm text-[#666666] text-center">
            登録後、右上のメニューから子どもを追加できます
          </p>

          <div className="mt-6 text-center text-sm text-[#666666]">
            すでにアカウントをお持ちの方は
            <Link href="/login" className="text-[#DC4C3E] hover:underline ml-1">
              ログイン
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

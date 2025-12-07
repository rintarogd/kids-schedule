'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type ChildInput = {
  displayName: string
  email: string
  password: string
}

export default function SignupPage() {
  const router = useRouter()
  const [parentName, setParentName] = useState('')
  const [parentEmail, setParentEmail] = useState('')
  const [parentPassword, setParentPassword] = useState('')
  const [children, setChildren] = useState<ChildInput[]>([
    { displayName: '', email: '', password: '' },
  ])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const addChild = () => {
    if (children.length < 3) {
      setChildren([...children, { displayName: '', email: '', password: '' }])
    }
  }

  const removeChild = (index: number) => {
    if (children.length > 1) {
      setChildren(children.filter((_, i) => i !== index))
    }
  }

  const updateChild = (index: number, field: keyof ChildInput, value: string) => {
    const newChildren = [...children]
    newChildren[index][field] = value
    setChildren(newChildren)
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const childIds: string[] = []

    try {
      // 1. 子供アカウントを先に作成
      for (const child of children) {
        if (!child.displayName || !child.email || !child.password) {
          setError('子どもの情報をすべて入力してください')
          setLoading(false)
          return
        }

        const { data: childAuth, error: childAuthError } = await supabase.auth.signUp({
          email: child.email,
          password: child.password,
        })

        if (childAuthError) {
          if (childAuthError.message.includes('already registered')) {
            setError(`${child.email} は既に登録されています`)
          } else {
            setError(`子どもの登録に失敗しました: ${childAuthError.message}`)
          }
          setLoading(false)
          return
        }

        if (childAuth.user) {
          childIds.push(childAuth.user.id)

          // 子供のプロフィール作成
          await supabase.from('user_profiles').insert({
            id: childAuth.user.id,
            display_name: child.displayName,
            role: 'child',
            start_date: new Date().toISOString().split('T')[0],
          })
        }
      }

      // 2. 親アカウントを作成
      const { data: parentAuth, error: parentAuthError } = await supabase.auth.signUp({
        email: parentEmail,
        password: parentPassword,
      })

      if (parentAuthError) {
        if (parentAuthError.message.includes('already registered')) {
          setError('このメールアドレスは既に登録されています')
        } else {
          setError('親の登録に失敗しました。もう一度お試しください')
        }
        setLoading(false)
        return
      }

      if (parentAuth.user) {
        // 親のプロフィール作成
        await supabase.from('user_profiles').insert({
          id: parentAuth.user.id,
          display_name: parentName,
          role: 'parent',
          start_date: new Date().toISOString().split('T')[0],
        })

        // 3. 親子関係を登録
        for (const childId of childIds) {
          await supabase.from('family_relations').insert({
            parent_id: parentAuth.user.id,
            child_id: childId,
          })
        }
      }

      // 親アカウントでログイン
      await supabase.auth.signInWithPassword({
        email: parentEmail,
        password: parentPassword,
      })

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
      <div className="w-full max-w-lg">
        {/* ロゴ */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#202020]">Kids Schedule</h1>
          <p className="text-[#666666] mt-2">勉強と習い事の記録アプリ</p>
        </div>

        {/* サインアップフォーム */}
        <div className="bg-white rounded-lg shadow-sm border border-[#E5E5E5] p-8">
          <h2 className="text-xl font-semibold text-[#202020] mb-6">
            家族で登録
          </h2>

          <form onSubmit={handleSignup} className="space-y-6">
            {/* 親アカウント */}
            <div className="bg-[#FAFAFA] rounded-lg p-4">
              <h3 className="text-sm font-medium text-[#666666] mb-3">親アカウント</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-[#E5E5E5] rounded-md focus:outline-none focus:ring-2 focus:ring-[#DC4C3E] focus:border-transparent"
                  placeholder="親の名前"
                />
                <input
                  type="email"
                  value={parentEmail}
                  onChange={(e) => setParentEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-[#E5E5E5] rounded-md focus:outline-none focus:ring-2 focus:ring-[#DC4C3E] focus:border-transparent"
                  placeholder="親のメールアドレス"
                />
                <input
                  type="password"
                  value={parentPassword}
                  onChange={(e) => setParentPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-3 py-2 border border-[#E5E5E5] rounded-md focus:outline-none focus:ring-2 focus:ring-[#DC4C3E] focus:border-transparent"
                  placeholder="パスワード（6文字以上）"
                />
              </div>
            </div>

            {/* 子どもアカウント */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-[#666666]">
                  子どもアカウント（{children.length}/3）
                </h3>
                {children.length < 3 && (
                  <button
                    type="button"
                    onClick={addChild}
                    className="flex items-center gap-1 text-sm text-[#DC4C3E] hover:underline"
                  >
                    <span className="text-lg">+</span>
                    子どもを追加
                  </button>
                )}
              </div>

              <div className="space-y-4">
                {children.map((child, index) => (
                  <div key={index} className="bg-[#FAFAFA] rounded-lg p-4 relative">
                    {children.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeChild(index)}
                        className="absolute top-2 right-2 text-[#999999] hover:text-[#DC4C3E] text-lg"
                      >
                        ×
                      </button>
                    )}
                    <div className="text-xs text-[#999999] mb-2">子ども {index + 1}</div>
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={child.displayName}
                        onChange={(e) => updateChild(index, 'displayName', e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-[#E5E5E5] rounded-md focus:outline-none focus:ring-2 focus:ring-[#DC4C3E] focus:border-transparent"
                        placeholder="子どもの名前"
                      />
                      <input
                        type="email"
                        value={child.email}
                        onChange={(e) => updateChild(index, 'email', e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-[#E5E5E5] rounded-md focus:outline-none focus:ring-2 focus:ring-[#DC4C3E] focus:border-transparent"
                        placeholder="子どものメールアドレス"
                      />
                      <input
                        type="password"
                        value={child.password}
                        onChange={(e) => updateChild(index, 'password', e.target.value)}
                        required
                        minLength={6}
                        className="w-full px-3 py-2 border border-[#E5E5E5] rounded-md focus:outline-none focus:ring-2 focus:ring-[#DC4C3E] focus:border-transparent"
                        placeholder="パスワード（6文字以上）"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* エラーメッセージ */}
            {error && (
              <div className="text-[#DC4C3E] text-sm bg-red-50 p-3 rounded-md">
                {error}
              </div>
            )}

            {/* 登録ボタン */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-[#DC4C3E] hover:bg-[#B03D32] text-white font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '登録中...' : '家族を登録する'}
            </button>
          </form>

          {/* ログインリンク */}
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

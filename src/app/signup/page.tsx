'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { UserRole } from '@/types'

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [role, setRole] = useState<UserRole>('child')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()

    // ユーザー登録
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

    // プロフィール作成
    if (authData.user) {
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: authData.user.id,
          display_name: displayName,
          role: role,
          start_date: new Date().toISOString().split('T')[0],
        })

      if (profileError) {
        console.error('Profile creation error:', profileError)
        // プロフィール作成に失敗してもログインは成功している
      }
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* ロゴ */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#202020]">Kids Schedule</h1>
          <p className="text-[#666666] mt-2">勉強と習い事の記録アプリ</p>
        </div>

        {/* サインアップフォーム */}
        <div className="bg-white rounded-lg shadow-sm border border-[#E5E5E5] p-8">
          <h2 className="text-xl font-semibold text-[#202020] mb-6">
            新規登録
          </h2>

          <form onSubmit={handleSignup} className="space-y-4">
            {/* 表示名 */}
            <div>
              <label
                htmlFor="displayName"
                className="block text-sm font-medium text-[#202020] mb-1"
              >
                なまえ
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                className="w-full px-3 py-2 border border-[#E5E5E5] rounded-md focus:outline-none focus:ring-2 focus:ring-[#DC4C3E] focus:border-transparent"
                placeholder="たろう"
              />
            </div>

            {/* メールアドレス */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-[#202020] mb-1"
              >
                メールアドレス
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 border border-[#E5E5E5] rounded-md focus:outline-none focus:ring-2 focus:ring-[#DC4C3E] focus:border-transparent"
                placeholder="example@email.com"
              />
            </div>

            {/* パスワード */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-[#202020] mb-1"
              >
                パスワード
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-3 py-2 border border-[#E5E5E5] rounded-md focus:outline-none focus:ring-2 focus:ring-[#DC4C3E] focus:border-transparent"
                placeholder="6文字以上"
              />
            </div>

            {/* 役割選択 */}
            <div>
              <label className="block text-sm font-medium text-[#202020] mb-2">
                あなたは？
              </label>
              <div className="flex gap-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="role"
                    value="child"
                    checked={role === 'child'}
                    onChange={() => setRole('child')}
                    className="w-4 h-4 text-[#DC4C3E] focus:ring-[#DC4C3E]"
                  />
                  <span className="ml-2 text-[#202020]">子ども</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="role"
                    value="parent"
                    checked={role === 'parent'}
                    onChange={() => setRole('parent')}
                    className="w-4 h-4 text-[#DC4C3E] focus:ring-[#DC4C3E]"
                  />
                  <span className="ml-2 text-[#202020]">親</span>
                </label>
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
              className="w-full py-2 px-4 bg-[#DC4C3E] hover:bg-[#B03D32] text-white font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '登録中...' : '登録する'}
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

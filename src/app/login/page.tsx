'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError('メールアドレスまたはパスワードが正しくありません')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* ロゴ */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#202020]">じかんバンク</h1>
          <p className="text-[#666666] mt-2">勉強と習い事の記録アプリ</p>
        </div>

        {/* ログインフォーム */}
        <div className="bg-white rounded-lg shadow-sm border border-[#E5E5E5] p-8">
          <h2 className="text-xl font-semibold text-[#202020] mb-6">ログイン</h2>

          <form onSubmit={handleLogin} className="space-y-4">
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
                className="w-full px-3 py-2 border border-[#E5E5E5] rounded-md focus:outline-none focus:ring-2 focus:ring-[#DC4C3E] focus:border-transparent"
                placeholder="••••••••"
              />
            </div>

            {/* エラーメッセージ */}
            {error && (
              <div className="text-[#DC4C3E] text-sm bg-red-50 p-3 rounded-md">
                {error}
              </div>
            )}

            {/* ログインボタン */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 bg-[#DC4C3E] hover:bg-[#B03D32] text-white font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'ログイン中...' : 'ログイン'}
            </button>
          </form>

          {/* サインアップリンク */}
          <div className="mt-6 text-center text-sm text-[#666666]">
            アカウントをお持ちでない方は
            <Link
              href="/signup"
              className="text-[#DC4C3E] hover:underline ml-1"
            >
              新規登録
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'

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

    try {
      // API経由で子供アカウントを作成（サーバーサイドで処理）
      const response = await fetch('/api/children', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          displayName,
          email,
          password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || '登録に失敗しました')
        setLoading(false)
        return
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

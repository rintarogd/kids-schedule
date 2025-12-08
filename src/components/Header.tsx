'use client'

import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import ChildSwitcher from './ChildSwitcher'

type HeaderProps = {
  userName: string
}

export default function Header({ userName }: HeaderProps) {
  const today = new Date()
  const formattedDate = format(today, 'M月d日（E）', { locale: ja })

  return (
    <header className="h-14 bg-white border-b border-[#E5E5E5] flex items-center justify-between px-4 md:px-6">
      {/* モバイル: ロゴ */}
      <div className="md:hidden">
        <h1 className="text-lg font-bold text-[#202020]">じかんバンク</h1>
      </div>

      {/* PC: 日付 */}
      <div className="hidden md:block">
        <span className="text-[#202020] font-medium">{formattedDate}</span>
      </div>

      {/* 右側: 子供切り替え + ユーザー情報 */}
      <div className="flex items-center gap-3">
        {/* 子供切り替え（親の場合のみ表示） */}
        <ChildSwitcher />

        {/* ユーザー情報（モバイルのみ表示） */}
        <div className="flex items-center gap-3 md:hidden">
          <span className="text-sm text-[#666666]">{userName}</span>
          <div className="w-8 h-8 rounded-full bg-[#DC4C3E] flex items-center justify-center text-white text-sm font-medium">
            {userName.charAt(0)}
          </div>
        </div>
      </div>
    </header>
  )
}

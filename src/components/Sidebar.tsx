'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/dashboard', label: '今日', icon: '📊' },
  { href: '/schedule', label: 'スケジュール', icon: '📅' },
  { href: '/weekly', label: '週間レポート', icon: '📈' },
  { href: '/monthly', label: '月間レポート', icon: '📊' },
]

type SidebarProps = {
  userName: string
  onLogout: () => void
}

export default function Sidebar({ userName, onLogout }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="w-[280px] h-screen bg-[#FAFAFA] border-r border-[#E5E5E5] flex flex-col">
      {/* ロゴ */}
      <div className="p-4 border-b border-[#E5E5E5]">
        <h1 className="text-lg font-bold text-[#202020]">じかんバンク</h1>
      </div>

      {/* ナビゲーション */}
      <nav className="flex-1 py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center px-4 py-3 text-sm transition-colors ${
                isActive
                  ? 'bg-[#EBEBEB] border-l-4 border-[#DC4C3E] pl-3'
                  : 'hover:bg-[#F5F5F5] border-l-4 border-transparent'
              }`}
            >
              <span className="mr-3 text-lg">{item.icon}</span>
              <span className={isActive ? 'font-medium text-[#202020]' : 'text-[#666666]'}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </nav>

      {/* フッター */}
      <div className="border-t border-[#E5E5E5] p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-[#202020] font-medium">{userName}</span>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center text-sm text-[#666666] hover:text-[#DC4C3E] transition-colors"
        >
          <span className="mr-2">🚪</span>
          ログアウト
        </button>
      </div>
    </aside>
  )
}

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Calendar, BarChart2, TrendingUp, LogOut, Clock, type LucideIcon } from 'lucide-react'

type NavItem = {
  href: string
  label: string
  icon: LucideIcon
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: '今日やること', icon: LayoutDashboard },
  { href: '/schedule', label: 'スケジュール', icon: Calendar },
  { href: '/weekly', label: '週間レポート', icon: BarChart2 },
  { href: '/monthly', label: '月間レポート', icon: TrendingUp },
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
        <h1 className="flex items-center gap-1.5 text-lg font-bold text-[#202020]">
          <Clock className="w-5 h-5" />
          じかんバンク
        </h1>
      </div>

      {/* ナビゲーション */}
      <nav className="flex-1 py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
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
              <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-[#DC4C3E]' : 'text-[#666666]'}`} />
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
          <LogOut className="w-4 h-4 mr-2" />
          ログアウト
        </button>
        <div className="mt-3 text-xs text-[#CCCCCC]">ver 1.0.1</div>
      </div>
    </aside>
  )
}

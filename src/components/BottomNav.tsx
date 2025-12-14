'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Calendar, BarChart2, TrendingUp, type LucideIcon } from 'lucide-react'

type NavItem = {
  href: string
  label: string
  icon: LucideIcon
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: '今日', icon: LayoutDashboard },
  { href: '/schedule', label: '予定', icon: Calendar },
  { href: '/weekly', label: '週間', icon: BarChart2 },
  { href: '/monthly', label: '月間', icon: TrendingUp },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E5E5E5] md:hidden z-50">
      <div className="flex justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center py-2 px-3 min-w-[64px] ${
                isActive ? 'text-[#DC4C3E]' : 'text-[#666666]'
              }`}
            >
              <Icon className="w-5 h-5 mb-1" />
              <span className="text-xs">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

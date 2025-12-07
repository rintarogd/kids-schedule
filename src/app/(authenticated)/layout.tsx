'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Sidebar from '@/components/Sidebar'
import BottomNav from '@/components/BottomNav'
import Header from '@/components/Header'
import type { UserProfile } from '@/types'

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProfile = async () => {
      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      // プロフィール取得
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileData) {
        setProfile({
          id: profileData.id,
          displayName: profileData.display_name,
          role: profileData.role,
          startDate: profileData.start_date,
          createdAt: profileData.created_at,
          updatedAt: profileData.updated_at,
        })
      } else {
        // プロフィールがない場合はメールアドレスから表示名を生成
        setProfile({
          id: user.id,
          displayName: user.email?.split('@')[0] || 'ユーザー',
          role: 'child',
          startDate: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
      }

      setLoading(false)
    }

    fetchProfile()
  }, [router])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="text-[#666666]">読み込み中...</div>
      </div>
    )
  }

  const userName = profile?.displayName || 'ユーザー'

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* PC: サイドバー */}
      <div className="hidden md:block fixed left-0 top-0 h-screen">
        <Sidebar userName={userName} onLogout={handleLogout} />
      </div>

      {/* メインコンテンツ */}
      <div className="md:ml-[280px]">
        <Header userName={userName} />
        <main className="p-4 md:p-6 pb-20 md:pb-6">{children}</main>
      </div>

      {/* モバイル: ボトムナビ */}
      <BottomNav />
    </div>
  )
}

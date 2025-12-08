'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ChildInfo, UserProfile } from '@/types'

type FamilyContextType = {
  isParent: boolean
  children: ChildInfo[]
  selectedChildId: string | null
  setSelectedChildId: (id: string | null) => void
  loading: boolean
  refreshFamily: () => Promise<void>
}

const FamilyContext = createContext<FamilyContextType | undefined>(undefined)

export function FamilyProvider({ children: reactChildren }: { children: ReactNode }) {
  const [isParent, setIsParent] = useState(false)
  const [childrenList, setChildrenList] = useState<ChildInfo[]>([])
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchFamilyData = async () => {
    const supabase = createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    console.log('FamilyContext: Current user:', user?.id)

    if (!user) {
      setLoading(false)
      return
    }

    // ユーザーのプロフィールを取得
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    console.log('FamilyContext: Profile:', profile, 'Error:', profileError)

    if (profile?.role === 'parent') {
      setIsParent(true)

      // 子供の一覧を取得
      const { data: relations, error: relationsError } = await supabase
        .from('family_relations')
        .select('child_id')
        .eq('parent_id', user.id)

      console.log('FamilyContext: Relations:', relations, 'Error:', relationsError)

      if (relations && relations.length > 0) {
        const childIds = relations.map((r) => r.child_id)

        // 子供のプロフィールを取得
        const { data: childProfiles, error: childProfilesError } = await supabase
          .from('user_profiles')
          .select('id, display_name')
          .in('id', childIds)

        console.log('FamilyContext: Child profiles:', childProfiles, 'Error:', childProfilesError)

        if (childProfiles) {
          const children: ChildInfo[] = childProfiles.map((p) => ({
            id: p.id,
            displayName: p.display_name,
          }))
          setChildrenList(children)

          // 最初の子供を選択（まだ選択されていない場合）
          if (children.length > 0 && !selectedChildId) {
            setSelectedChildId(children[0].id)
          }
        }
      }
    }

    setLoading(false)
  }

  useEffect(() => {
    fetchFamilyData()
  }, [])

  return (
    <FamilyContext.Provider
      value={{
        isParent,
        children: childrenList,
        selectedChildId,
        setSelectedChildId,
        loading,
        refreshFamily: fetchFamilyData,
      }}
    >
      {reactChildren}
    </FamilyContext.Provider>
  )
}

export function useFamily() {
  const context = useContext(FamilyContext)
  if (context === undefined) {
    throw new Error('useFamily must be used within a FamilyProvider')
  }
  return context
}

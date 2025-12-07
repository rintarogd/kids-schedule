'use client'

import { useEffect, useState } from 'react'
import { format, startOfWeek, addDays } from 'date-fns'
import { ja } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/client'
import { useFamily } from '@/contexts/FamilyContext'
import { WEEKDAYS } from '@/types'

type DayStat = {
  date: string
  dayOfWeek: number
  planned: number
  actual: number
}

export default function WeeklyPage() {
  const [stats, setStats] = useState<DayStat[]>([])
  const [loading, setLoading] = useState(true)
  const { isParent, selectedChildId } = useFamily()
  const today = new Date()
  const weekStart = startOfWeek(today, { weekStartsOn: 1 })

  useEffect(() => {
    const fetchWeeklyStats = async () => {
      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      // 親の場合は選択した子供のデータ、子供の場合は自分のデータ
      const targetUserId = isParent && selectedChildId ? selectedChildId : user.id

      const weekStartStr = format(weekStart, 'yyyy-MM-dd')

      // スケジュール取得
      const { data: tasks } = await supabase
        .from('scheduled_tasks')
        .select('*')
        .eq('user_id', targetUserId)
        .eq('week_start', weekStartStr)

      // 記録取得
      const { data: records } = await supabase
        .from('daily_records')
        .select('*')
        .eq('user_id', targetUserId)
        .gte('record_date', weekStartStr)
        .lte('record_date', format(addDays(weekStart, 6), 'yyyy-MM-dd'))

      // 曜日ごとに集計
      const dayStats: DayStat[] = Array.from({ length: 7 }, (_, i) => {
        const dayIndex = i === 6 ? 0 : i + 1 // 月=1, 火=2, ... 日=0
        const date = addDays(weekStart, i)
        const dateStr = format(date, 'yyyy-MM-dd')

        const planned = (tasks || [])
          .filter((t) => t.day_of_week === dayIndex)
          .reduce((sum, t) => sum + t.planned_minutes, 0)

        const actual = (records || [])
          .filter((r) => r.record_date === dateStr)
          .reduce((sum, r) => sum + (r.actual_minutes || 0), 0)

        return {
          date: dateStr,
          dayOfWeek: dayIndex,
          planned,
          actual,
        }
      })

      setStats(dayStats)
      setLoading(false)
    }

    fetchWeeklyStats()
  }, [selectedChildId, isParent])

  const totalPlanned = stats.reduce((sum, s) => sum + s.planned, 0)
  const totalActual = stats.reduce((sum, s) => sum + s.actual, 0)
  const achievementRate =
    totalPlanned > 0 ? Math.round((totalActual / totalPlanned) * 100) : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#666666]">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* ヘッダー */}
      <h2 className="text-lg font-medium text-[#202020] mb-6">
        {format(weekStart, 'M月d日', { locale: ja })} 〜 の週間レポート
      </h2>

      {/* サマリー */}
      <div className="bg-white rounded-lg border border-[#E5E5E5] p-6 mb-6">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-[#202020]">
              {Math.floor(totalPlanned / 60)}:{(totalPlanned % 60)
                .toString()
                .padStart(2, '0')}
            </div>
            <div className="text-sm text-[#666666]">予定</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-[#DC4C3E]">
              {Math.floor(totalActual / 60)}:{(totalActual % 60)
                .toString()
                .padStart(2, '0')}
            </div>
            <div className="text-sm text-[#666666]">実績</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-[#058527]">
              {achievementRate}%
            </div>
            <div className="text-sm text-[#666666]">達成率</div>
          </div>
        </div>
      </div>

      {/* 日別グラフ */}
      <div className="bg-white rounded-lg border border-[#E5E5E5] p-4">
        <div className="space-y-4">
          {stats.map((stat, i) => {
            const dayLabel = ['月', '火', '水', '木', '金', '土', '日'][i]
            const maxMinutes = Math.max(...stats.map((s) => Math.max(s.planned, s.actual)), 60)
            const plannedWidth = (stat.planned / maxMinutes) * 100
            const actualWidth = (stat.actual / maxMinutes) * 100
            const isToday = stat.date === format(today, 'yyyy-MM-dd')

            return (
              <div key={stat.date} className="flex items-center gap-3">
                <span
                  className={`w-8 text-sm font-medium ${
                    isToday ? 'text-[#DC4C3E]' : 'text-[#666666]'
                  }`}
                >
                  {dayLabel}
                </span>
                <div className="flex-1 space-y-1">
                  <div className="h-3 bg-[#E5E5E5] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#999999] rounded-full"
                      style={{ width: `${plannedWidth}%` }}
                    />
                  </div>
                  <div className="h-3 bg-[#E5E5E5] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#DC4C3E] rounded-full"
                      style={{ width: `${actualWidth}%` }}
                    />
                  </div>
                </div>
                <div className="w-20 text-right text-sm">
                  <div className="text-[#666666]">{stat.planned}分</div>
                  <div className="text-[#DC4C3E]">{stat.actual}分</div>
                </div>
              </div>
            )
          })}
        </div>
        <div className="flex justify-center gap-6 mt-4 pt-4 border-t border-[#E5E5E5]">
          <div className="flex items-center gap-2 text-sm text-[#666666]">
            <div className="w-3 h-3 bg-[#999999] rounded" />
            予定
          </div>
          <div className="flex items-center gap-2 text-sm text-[#666666]">
            <div className="w-3 h-3 bg-[#DC4C3E] rounded" />
            実績
          </div>
        </div>
      </div>
    </div>
  )
}

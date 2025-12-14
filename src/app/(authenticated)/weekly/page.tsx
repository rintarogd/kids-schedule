'use client'

import { useEffect, useState } from 'react'
import { format, startOfWeek, addDays, addWeeks, subWeeks } from 'date-fns'
import { ja } from 'date-fns/locale'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useFamily } from '@/contexts/FamilyContext'
import { WEEKDAYS_MONDAY_START } from '@/types'
import { getWeekdayColorClass } from '@/lib/weekendColors'

type DayStat = {
  date: string
  dayOfWeek: number
  planned: number
  actual: number
}

export default function WeeklyPage() {
  const [stats, setStats] = useState<DayStat[]>([])
  const [loading, setLoading] = useState(true)
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  )
  const { isParent, selectedChildId } = useFamily()
  const today = new Date()

  // データがある週かどうかをチェック
  const [hasDataPrevWeek, setHasDataPrevWeek] = useState(false)
  const [hasDataNextWeek, setHasDataNextWeek] = useState(false)

  useEffect(() => {
    const fetchWeeklyStats = async () => {
      setLoading(true)
      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      // 親の場合は選択した子供のデータ、子供の場合は自分のデータ
      const targetUserId = isParent && selectedChildId ? selectedChildId : user.id

      const weekStartStr = format(currentWeekStart, 'yyyy-MM-dd')

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
        .lte('record_date', format(addDays(currentWeekStart, 6), 'yyyy-MM-dd'))

      // 曜日ごとに集計（月曜始まり）
      const dayStats: DayStat[] = Array.from({ length: 7 }, (_, i) => {
        const dayIndex = i === 6 ? 0 : i + 1 // 月=1, 火=2, ... 日=0
        const date = addDays(currentWeekStart, i)
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

      // 前後の週にデータがあるかチェック
      const prevWeekStart = format(subWeeks(currentWeekStart, 1), 'yyyy-MM-dd')
      const nextWeekStart = format(addWeeks(currentWeekStart, 1), 'yyyy-MM-dd')

      const { count: prevCount } = await supabase
        .from('scheduled_tasks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', targetUserId)
        .eq('week_start', prevWeekStart)

      const { count: nextCount } = await supabase
        .from('scheduled_tasks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', targetUserId)
        .eq('week_start', nextWeekStart)

      setHasDataPrevWeek((prevCount || 0) > 0)
      setHasDataNextWeek((nextCount || 0) > 0)
      setLoading(false)
    }

    fetchWeeklyStats()
  }, [selectedChildId, isParent, currentWeekStart])

  const goToPrevWeek = () => setCurrentWeekStart((prev) => subWeeks(prev, 1))
  const goToNextWeek = () => setCurrentWeekStart((prev) => addWeeks(prev, 1))

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

  const weekEnd = addDays(currentWeekStart, 6)

  return (
    <div className="max-w-2xl mx-auto">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={goToPrevWeek}
          disabled={!hasDataPrevWeek}
          className={`px-3 py-1 text-sm rounded ${
            hasDataPrevWeek
              ? 'text-[#666666] hover:bg-[#F5F5F5]'
              : 'text-[#CCCCCC] cursor-not-allowed'
          }`}
        >
          ← 前へ
        </button>
        <h2 className="text-lg font-medium text-[#202020]">
          {format(currentWeekStart, 'M/d', { locale: ja })} 〜 {format(weekEnd, 'M/d', { locale: ja })} の週間レポート
        </h2>
        <button
          onClick={goToNextWeek}
          disabled={!hasDataNextWeek}
          className={`px-3 py-1 text-sm rounded ${
            hasDataNextWeek
              ? 'text-[#666666] hover:bg-[#F5F5F5]'
              : 'text-[#CCCCCC] cursor-not-allowed'
          }`}
        >
          次へ →
        </button>
      </div>

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
            const dayLabel = WEEKDAYS_MONDAY_START[i]
            const date = addDays(currentWeekStart, i)
            const maxMinutes = Math.max(...stats.map((s) => Math.max(s.planned, s.actual)), 60)
            const plannedWidth = (stat.planned / maxMinutes) * 100
            const actualWidth = (stat.actual / maxMinutes) * 100
            const isToday = stat.date === format(today, 'yyyy-MM-dd')

            return (
              <div key={stat.date} className="flex items-center gap-3">
                <span
                  className={`w-16 text-sm font-medium ${
                    isToday ? 'text-[#DC4C3E]' : getWeekdayColorClass(i) || 'text-[#666666]'
                  }`}
                >
                  {dayLabel} {format(date, 'M/d')}
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
                <Link
                  href={`/dashboard?date=${stat.date}`}
                  className="text-xs text-[#999999] hover:text-[#DC4C3E] transition-colors whitespace-nowrap"
                >
                  修正
                </Link>
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

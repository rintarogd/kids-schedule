'use client'

import { useEffect, useState } from 'react'
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
} from 'date-fns'
import { ja } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/client'
import { useFamily } from '@/contexts/FamilyContext'
import { getWeekdayColorClassFromLabel } from '@/lib/weekendColors'

type DayData = {
  date: Date
  actual: number
}

export default function MonthlyPage() {
  const [dayData, setDayData] = useState<Map<string, number>>(new Map())
  const [plannedTotal, setPlannedTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState<Date>(() => new Date())
  const [hasDataPrevMonth, setHasDataPrevMonth] = useState(false)
  const [hasDataNextMonth, setHasDataNextMonth] = useState(false)
  const { isParent, selectedChildId } = useFamily()
  const today = new Date()
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)

  useEffect(() => {
    const fetchMonthlyData = async () => {
      setLoading(true)
      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      // 親の場合は選択した子供のデータ、子供の場合は自分のデータ
      const targetUserId = isParent && selectedChildId ? selectedChildId : user.id

      // 実績取得
      const { data: records } = await supabase
        .from('daily_records')
        .select('record_date, actual_minutes')
        .eq('user_id', targetUserId)
        .gte('record_date', format(monthStart, 'yyyy-MM-dd'))
        .lte('record_date', format(monthEnd, 'yyyy-MM-dd'))

      const dataMap = new Map<string, number>()
      records?.forEach((r) => {
        const current = dataMap.get(r.record_date) || 0
        dataMap.set(r.record_date, current + (r.actual_minutes || 0))
      })

      setDayData(dataMap)

      // 予定時間取得（月内の全週間スケジュールから）
      const { data: tasks } = await supabase
        .from('scheduled_tasks')
        .select('planned_minutes')
        .eq('user_id', targetUserId)
        .gte('week_start', format(monthStart, 'yyyy-MM-dd'))
        .lte('week_start', format(monthEnd, 'yyyy-MM-dd'))

      const planned = (tasks || []).reduce((sum, t) => sum + t.planned_minutes, 0)
      setPlannedTotal(planned)

      // 前後の月にデータがあるかチェック
      const prevMonthStart = format(startOfMonth(subMonths(currentMonth, 1)), 'yyyy-MM-dd')
      const prevMonthEnd = format(endOfMonth(subMonths(currentMonth, 1)), 'yyyy-MM-dd')
      const nextMonthStart = format(startOfMonth(addMonths(currentMonth, 1)), 'yyyy-MM-dd')
      const nextMonthEnd = format(endOfMonth(addMonths(currentMonth, 1)), 'yyyy-MM-dd')

      const { count: prevCount } = await supabase
        .from('daily_records')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', targetUserId)
        .gte('record_date', prevMonthStart)
        .lte('record_date', prevMonthEnd)

      const { count: nextCount } = await supabase
        .from('daily_records')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', targetUserId)
        .gte('record_date', nextMonthStart)
        .lte('record_date', nextMonthEnd)

      setHasDataPrevMonth((prevCount || 0) > 0)
      setHasDataNextMonth((nextCount || 0) > 0)
      setLoading(false)
    }

    fetchMonthlyData()
  }, [selectedChildId, isParent, currentMonth])

  const goToPrevMonth = () => setCurrentMonth((prev) => subMonths(prev, 1))
  const goToNextMonth = () => setCurrentMonth((prev) => addMonths(prev, 1))

  // カレンダーの日付を生成（週の始まりから終わりまで）
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  // 月間合計
  const totalMinutes = Array.from(dayData.values()).reduce((sum, m) => sum + m, 0)

  // 色の濃さを計算
  const getIntensity = (minutes: number): string => {
    if (minutes === 0) return 'bg-[#E5E5E5]'
    if (minutes < 30) return 'bg-red-100'
    if (minutes < 60) return 'bg-red-200'
    if (minutes < 120) return 'bg-red-300'
    return 'bg-red-400'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#666666]">読み込み中...</div>
      </div>
    )
  }

  const achievementRate =
    plannedTotal > 0 ? Math.round((totalMinutes / plannedTotal) * 100) : 0

  return (
    <div className="max-w-2xl mx-auto">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <button
          type="button"
          onClick={goToPrevMonth}
          disabled={!hasDataPrevMonth}
          className={`px-3 py-1 text-sm rounded ${
            hasDataPrevMonth
              ? 'text-[#666666] hover:bg-[#F5F5F5]'
              : 'text-[#CCCCCC] cursor-not-allowed'
          }`}
        >
          ← 前へ
        </button>
        <h2 className="text-xl font-medium text-[#202020]">
          {format(currentMonth, 'yyyy年M月', { locale: ja })}の月間レポート
        </h2>
        <button
          type="button"
          onClick={goToNextMonth}
          disabled={!hasDataNextMonth}
          className={`px-3 py-1 text-sm rounded ${
            hasDataNextMonth
              ? 'text-[#666666] hover:bg-[#F5F5F5]'
              : 'text-[#CCCCCC] cursor-not-allowed'
          }`}
        >
          次へ →
        </button>
      </div>

      {/* サマリー（週間レポートと同じ形式） */}
      <div className="bg-white rounded-lg border border-[#E5E5E5] p-6 mb-6">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-[#202020]">
              {Math.floor(plannedTotal / 60)}:{(plannedTotal % 60)
                .toString()
                .padStart(2, '0')}
            </div>
            <div className="text-sm text-[#666666]">予定</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-[#DC4C3E]">
              {Math.floor(totalMinutes / 60)}:{(totalMinutes % 60)
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

      {/* カレンダー */}
      <div className="bg-white rounded-lg border border-[#E5E5E5] p-4">
        {/* 曜日ヘッダー */}
        <div className="grid grid-cols-7 gap-2 mb-3">
          {['月', '火', '水', '木', '金', '土', '日'].map((day) => (
            <div
              key={day}
              className={`text-center text-sm font-medium py-2 ${getWeekdayColorClassFromLabel(day) || 'text-[#666666]'}`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* 日付グリッド */}
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((date) => {
            const dateStr = format(date, 'yyyy-MM-dd')
            const minutes = dayData.get(dateStr) || 0
            const isCurrentMonth = isSameMonth(date, today)
            const isToday = dateStr === format(today, 'yyyy-MM-dd')

            return (
              <div
                key={dateStr}
                className={`aspect-square flex flex-col items-center justify-center rounded-lg text-sm ${
                  isCurrentMonth ? '' : 'opacity-30'
                } ${isToday ? 'ring-2 ring-[#DC4C3E]' : ''} ${getIntensity(
                  minutes
                )}`}
              >
                <span
                  className={isToday ? 'text-[#DC4C3E] font-bold text-base' : 'text-[#666666]'}
                >
                  {format(date, 'd')}
                </span>
                {minutes > 0 && (
                  <span className="text-xs text-[#666666] mt-0.5">{minutes}分</span>
                )}
              </div>
            )
          })}
        </div>

        {/* 凡例 */}
        <div className="flex justify-center items-center gap-3 mt-6 pt-4 border-t border-[#E5E5E5]">
          <span className="text-sm text-[#666666]">少ない</span>
          <div className="w-5 h-5 bg-[#E5E5E5] rounded" />
          <div className="w-5 h-5 bg-red-100 rounded" />
          <div className="w-5 h-5 bg-red-200 rounded" />
          <div className="w-5 h-5 bg-red-300 rounded" />
          <div className="w-5 h-5 bg-red-400 rounded" />
          <span className="text-sm text-[#666666]">多い</span>
        </div>
      </div>
    </div>
  )
}

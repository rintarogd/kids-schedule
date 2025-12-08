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
} from 'date-fns'
import { ja } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/client'
import { useFamily } from '@/contexts/FamilyContext'

type DayData = {
  date: Date
  actual: number
}

export default function MonthlyPage() {
  const [dayData, setDayData] = useState<Map<string, number>>(new Map())
  const [loading, setLoading] = useState(true)
  const { isParent, selectedChildId } = useFamily()
  const today = new Date()
  const monthStart = startOfMonth(today)
  const monthEnd = endOfMonth(today)

  useEffect(() => {
    const fetchMonthlyData = async () => {
      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      // 親の場合は選択した子供のデータ、子供の場合は自分のデータ
      const targetUserId = isParent && selectedChildId ? selectedChildId : user.id

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
      setLoading(false)
    }

    fetchMonthlyData()
  }, [selectedChildId, isParent])

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

  return (
    <div className="max-w-2xl mx-auto">
      {/* ヘッダー */}
      <h2 className="text-xl font-medium text-[#202020] mb-6">
        {format(today, 'yyyy年M月', { locale: ja })}の月間レポート
      </h2>

      {/* サマリー */}
      <div className="bg-white rounded-lg border border-[#E5E5E5] p-6 mb-6 text-center">
        <div className="text-4xl font-bold text-[#DC4C3E]">
          {Math.floor(totalMinutes / 60)}時間{totalMinutes % 60}分
        </div>
        <div className="text-base text-[#666666] mt-2">今月の合計達成時間</div>
      </div>

      {/* カレンダー */}
      <div className="bg-white rounded-lg border border-[#E5E5E5] p-4">
        {/* 曜日ヘッダー */}
        <div className="grid grid-cols-7 gap-2 mb-3">
          {['月', '火', '水', '木', '金', '土', '日'].map((day) => (
            <div
              key={day}
              className="text-center text-sm font-medium text-[#666666] py-2"
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

'use client'

import { useEffect, useState } from 'react'
import { format, startOfWeek, addDays, addWeeks, subWeeks } from 'date-fns'
import { ja } from 'date-fns/locale'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useFamily } from '@/contexts/FamilyContext'
import TaskItem from '@/components/TaskItem'
import { WEEKDAYS_MONDAY_START, mondayIndexToDayOfWeek, type ScheduledTask } from '@/types'
import { getWeekdayColorClass } from '@/lib/weekendColors'

export default function SchedulePage() {
  const [tasks, setTasks] = useState<ScheduledTask[]>([])
  const [loading, setLoading] = useState(true)
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  )
  const { isParent, selectedChildId } = useFamily()
  const today = new Date()

  useEffect(() => {
    const fetchWeeklyTasks = async () => {
      setLoading(true)
      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      // 親の場合は選択した子供のデータ、子供の場合は自分のデータ
      const targetUserId = isParent && selectedChildId ? selectedChildId : user.id

      const weekStartStr = format(currentWeekStart, 'yyyy-MM-dd')

      const { data } = await supabase
        .from('scheduled_tasks')
        .select('*')
        .eq('user_id', targetUserId)
        .eq('week_start', weekStartStr)
        .order('day_of_week')

      if (data) {
        setTasks(
          data.map((t) => ({
            id: t.id,
            userId: t.user_id,
            templateId: t.template_id,
            weekStart: t.week_start,
            dayOfWeek: t.day_of_week,
            plannedMinutes: t.planned_minutes,
            category: t.category,
            subcategory: t.subcategory,
            taskType: t.task_type,
            createdAt: t.created_at,
            updatedAt: t.updated_at,
          }))
        )
      }

      setLoading(false)
    }

    fetchWeeklyTasks()
  }, [selectedChildId, isParent, currentWeekStart])

  const goToPrevWeek = () => setCurrentWeekStart((prev) => subWeeks(prev, 1))
  const goToNextWeek = () => setCurrentWeekStart((prev) => addWeeks(prev, 1))

  // 曜日ごとにタスクをグループ化（月曜始まり）
  const tasksByDay = WEEKDAYS_MONDAY_START.map((_, mondayIndex) => {
    const dayOfWeek = mondayIndexToDayOfWeek(mondayIndex)
    return tasks.filter((t) => t.dayOfWeek === dayOfWeek)
  })

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
      <div className="flex items-center justify-between mb-2 mt-2">
        <button
          type="button"
          onClick={goToPrevWeek}
          className="px-3 py-1 text-sm text-[#666666] hover:bg-[#F5F5F5] rounded"
        >
          ← 前へ
        </button>
        <h2 className="text-lg font-medium text-[#202020]">
          {format(currentWeekStart, 'M/d', { locale: ja })} 〜 {format(weekEnd, 'M/d', { locale: ja })} のスケジュール
        </h2>
        <button
          type="button"
          onClick={goToNextWeek}
          className="px-3 py-1 text-sm text-[#666666] hover:bg-[#F5F5F5] rounded"
        >
          次へ →
        </button>
      </div>
      <div className="flex justify-end mb-4">
        <Link
          href="/schedule/edit"
          className="px-4 py-2 bg-[#DC4C3E] text-white text-sm rounded-md hover:bg-[#B03D32] transition-colors"
        >
          編集する
        </Link>
      </div>

      {/* 週間スケジュール */}
      <div className="space-y-4 overflow-visible">
        {WEEKDAYS_MONDAY_START.map((day, mondayIndex) => {
          const date = addDays(currentWeekStart, mondayIndex)
          const dayTasks = tasksByDay[mondayIndex]
          const isToday = format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')

          return (
            <div
              key={day}
              className={`bg-white rounded-lg border overflow-hidden ${
                isToday ? 'border-[#DC4C3E]' : 'border-[#E5E5E5]'
              }`}
            >
              {/* 曜日ヘッダー */}
              <div
                className={`px-4 py-2 border-b rounded-t-lg ${
                  isToday
                    ? 'bg-red-50 border-[#DC4C3E]'
                    : 'bg-[#FAFAFA] border-[#E5E5E5]'
                }`}
              >
                <span
                  className={`text-sm font-medium ${
                    isToday ? 'text-[#DC4C3E]' : getWeekdayColorClass(mondayIndex) || 'text-[#202020]'
                  }`}
                >
                  {day}曜日
                </span>
                <span className="text-sm text-[#666666] ml-2">
                  {format(date, 'M/d')}
                </span>
              </div>

              {/* タスク一覧 */}
              {dayTasks.length === 0 ? (
                <div className="px-4 py-6 text-center text-[#999999] text-sm">
                  やることの登録なし
                </div>
              ) : (
                <div className="divide-y divide-[#E5E5E5]">
                  {dayTasks.map((task) => (
                    <TaskItem key={task.id} task={task} showTime />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

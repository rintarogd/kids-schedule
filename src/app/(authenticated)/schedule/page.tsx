'use client'

import { useEffect, useState } from 'react'
import { format, startOfWeek, addDays } from 'date-fns'
import { ja } from 'date-fns/locale'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import TaskItem from '@/components/TaskItem'
import { WEEKDAYS, type ScheduledTask } from '@/types'

export default function SchedulePage() {
  const [tasks, setTasks] = useState<ScheduledTask[]>([])
  const [loading, setLoading] = useState(true)
  const today = new Date()
  const weekStart = startOfWeek(today, { weekStartsOn: 1 }) // 月曜始まり

  useEffect(() => {
    const fetchWeeklyTasks = async () => {
      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const weekStartStr = format(weekStart, 'yyyy-MM-dd')

      const { data } = await supabase
        .from('scheduled_tasks')
        .select('*')
        .eq('user_id', user.id)
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
  }, [])

  // 曜日ごとにタスクをグループ化
  const tasksByDay = WEEKDAYS.map((_, index) => {
    // 日曜=0, 月曜=1...に変換
    const dayIndex = index
    return tasks.filter((t) => t.dayOfWeek === dayIndex)
  })

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
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-medium text-[#202020]">
          {format(weekStart, 'M月d日', { locale: ja })} 〜 の週
        </h2>
        <Link
          href="/schedule/edit"
          className="px-4 py-2 bg-[#DC4C3E] text-white text-sm rounded-md hover:bg-[#B03D32] transition-colors"
        >
          編集する
        </Link>
      </div>

      {/* 週間スケジュール */}
      <div className="space-y-4 overflow-visible">
        {WEEKDAYS.map((day, index) => {
          const date = addDays(weekStart, index === 0 ? 6 : index - 1) // 月曜始まりに調整
          const dayTasks = tasksByDay[index]
          const isToday = format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')

          return (
            <div
              key={day}
              className={`bg-white rounded-lg border ${
                isToday ? 'border-[#DC4C3E]' : 'border-[#E5E5E5]'
              }`}
            >
              {/* 曜日ヘッダー */}
              <div
                className={`px-4 py-2 border-b ${
                  isToday
                    ? 'bg-red-50 border-[#DC4C3E]'
                    : 'bg-[#FAFAFA] border-[#E5E5E5]'
                }`}
              >
                <span
                  className={`text-sm font-medium ${
                    isToday ? 'text-[#DC4C3E]' : 'text-[#202020]'
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
                  タスクなし
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

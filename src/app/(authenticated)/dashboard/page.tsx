'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/client'
import TodayAchievement from '@/components/TodayAchievement'
import TaskItem from '@/components/TaskItem'
import type { ScheduledTask, DailyRecord } from '@/types'

type TaskWithRecord = ScheduledTask & {
  record?: DailyRecord
}

export default function DashboardPage() {
  const [tasks, setTasks] = useState<TaskWithRecord[]>([])
  const [loading, setLoading] = useState(true)
  const today = new Date()

  useEffect(() => {
    const fetchTodayTasks = async () => {
      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const todayStr = format(today, 'yyyy-MM-dd')
      const dayOfWeek = today.getDay()

      // 今週の月曜日を計算
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
      const weekStart = new Date(today)
      weekStart.setDate(today.getDate() + mondayOffset)
      const weekStartStr = format(weekStart, 'yyyy-MM-dd')

      // 今日のスケジュールを取得
      const { data: scheduledTasks } = await supabase
        .from('scheduled_tasks')
        .select('*')
        .eq('user_id', user.id)
        .eq('week_start', weekStartStr)
        .eq('day_of_week', dayOfWeek)

      // 今日の記録を取得
      const { data: records } = await supabase
        .from('daily_records')
        .select('*')
        .eq('user_id', user.id)
        .eq('record_date', todayStr)

      // タスクと記録を結合
      const tasksWithRecords: TaskWithRecord[] = (scheduledTasks || []).map(
        (task) => ({
          id: task.id,
          userId: task.user_id,
          templateId: task.template_id,
          weekStart: task.week_start,
          dayOfWeek: task.day_of_week,
          plannedMinutes: task.planned_minutes,
          category: task.category,
          subcategory: task.subcategory,
          taskType: task.task_type,
          createdAt: task.created_at,
          updatedAt: task.updated_at,
          record: records?.find((r) => r.scheduled_task_id === task.id)
            ? {
                id: records.find((r) => r.scheduled_task_id === task.id)!.id,
                userId: records.find((r) => r.scheduled_task_id === task.id)!
                  .user_id,
                scheduledTaskId: records.find(
                  (r) => r.scheduled_task_id === task.id
                )!.scheduled_task_id,
                recordDate: records.find(
                  (r) => r.scheduled_task_id === task.id
                )!.record_date,
                startTime: records.find((r) => r.scheduled_task_id === task.id)!
                  .start_time,
                endTime: records.find((r) => r.scheduled_task_id === task.id)!
                  .end_time,
                actualMinutes: records.find(
                  (r) => r.scheduled_task_id === task.id
                )!.actual_minutes,
                isCompleted: records.find(
                  (r) => r.scheduled_task_id === task.id
                )!.is_completed,
                createdAt: records.find((r) => r.scheduled_task_id === task.id)!
                  .created_at,
                updatedAt: records.find((r) => r.scheduled_task_id === task.id)!
                  .updated_at,
              }
            : undefined,
        })
      )

      setTasks(tasksWithRecords)
      setLoading(false)
    }

    fetchTodayTasks()
  }, [])

  // 達成時間を計算
  const totalAchievedMinutes = tasks.reduce((sum, task) => {
    return sum + (task.record?.actualMinutes || 0)
  }, 0)

  // カテゴリ別の達成時間
  const categoryStats = {
    study: tasks
      .filter((t) => t.category === 'study')
      .reduce((sum, t) => sum + (t.record?.actualMinutes || 0), 0),
    lesson: tasks
      .filter((t) => t.category === 'lesson')
      .reduce((sum, t) => sum + (t.record?.actualMinutes || 0), 0),
    chore: tasks
      .filter((t) => t.category === 'chore')
      .reduce((sum, t) => sum + (t.record?.actualMinutes || 0), 0),
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
      {/* 日付 */}
      <div className="md:hidden mb-4">
        <h2 className="text-lg font-medium text-[#202020]">
          {format(today, 'M月d日（E）', { locale: ja })}
        </h2>
      </div>

      {/* 達成時間表示 */}
      <TodayAchievement
        totalMinutes={totalAchievedMinutes}
        categoryStats={categoryStats}
      />

      {/* 今日のタスク */}
      <div className="mt-6">
        <h3 className="text-sm font-medium text-[#666666] mb-3">今日のタスク</h3>

        {tasks.length === 0 ? (
          <div className="bg-white rounded-lg border border-[#E5E5E5] p-8 text-center">
            <p className="text-[#666666]">今日のタスクはありません</p>
            <p className="text-sm text-[#999999] mt-2">
              スケジュールでタスクを追加してください
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-[#E5E5E5] divide-y divide-[#E5E5E5]">
            {tasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                record={task.record}
                showTime
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/client'
import TaskRecorder from '@/components/TaskRecorder'
import type { ScheduledTask, DailyRecord } from '@/types'

type TaskWithRecord = ScheduledTask & {
  record?: DailyRecord
}

export default function RecordPage() {
  const [tasks, setTasks] = useState<TaskWithRecord[]>([])
  const [loading, setLoading] = useState(true)
  const today = new Date()

  const fetchTasks = async () => {
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
      (task) => {
        const record = records?.find((r) => r.scheduled_task_id === task.id)
        return {
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
          record: record
            ? {
                id: record.id,
                userId: record.user_id,
                scheduledTaskId: record.scheduled_task_id,
                recordDate: record.record_date,
                startTime: record.start_time,
                endTime: record.end_time,
                actualMinutes: record.actual_minutes,
                isCompleted: record.is_completed,
                createdAt: record.created_at,
                updatedAt: record.updated_at,
              }
            : undefined,
        }
      }
    )

    setTasks(tasksWithRecords)
    setLoading(false)
  }

  useEffect(() => {
    fetchTasks()
  }, [])

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
      <h2 className="text-lg font-medium text-[#202020] mb-6">
        {format(today, 'M月d日（E）', { locale: ja })}の記録
      </h2>

      {/* タスク一覧 */}
      {tasks.length === 0 ? (
        <div className="bg-white rounded-lg border border-[#E5E5E5] p-8 text-center">
          <p className="text-[#666666]">今日のタスクはありません</p>
          <p className="text-sm text-[#999999] mt-2">
            スケジュールでタスクを追加してください
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {tasks.map((task) => (
            <TaskRecorder
              key={task.id}
              task={task}
              record={task.record}
              onUpdate={fetchTasks}
            />
          ))}
        </div>
      )}
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { format, addDays, subDays, startOfWeek } from 'date-fns'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { ja } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/client'
import { useFamily } from '@/contexts/FamilyContext'
import TodayAchievement from '@/components/TodayAchievement'
import TaskRecorder from '@/components/TaskRecorder'
import type { ScheduledTask, DailyRecord } from '@/types'

type TaskWithRecords = ScheduledTask & {
  records: DailyRecord[]
}

export default function DashboardPage() {
  const searchParams = useSearchParams()
  const dateParam = searchParams.get('date')

  const [tasks, setTasks] = useState<TaskWithRecords[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    if (dateParam) {
      const parsed = new Date(dateParam)
      if (!isNaN(parsed.getTime())) return parsed
    }
    return new Date()
  })
  const { isParent, selectedChildId } = useFamily()
  const today = new Date()

  // URL パラメータが変わったら日付を更新
  useEffect(() => {
    if (dateParam) {
      const parsed = new Date(dateParam)
      if (!isNaN(parsed.getTime())) {
        setSelectedDate(parsed)
      }
    }
  }, [dateParam])

  const fetchTasks = async (targetDate: Date) => {
    setLoading(true)
    const supabase = createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    // 親の場合は選択した子供のデータ、子供の場合は自分のデータ
    const targetUserId = isParent && selectedChildId ? selectedChildId : user.id

    const dateStr = format(targetDate, 'yyyy-MM-dd')
    const dayOfWeek = targetDate.getDay()

    // その日の週の月曜日を計算
    const weekStart = startOfWeek(targetDate, { weekStartsOn: 1 })
    const weekStartStr = format(weekStart, 'yyyy-MM-dd')

    // 選択日のスケジュールを取得
    const { data: scheduledTasks } = await supabase
      .from('scheduled_tasks')
      .select('*')
      .eq('user_id', targetUserId)
      .eq('week_start', weekStartStr)
      .eq('day_of_week', dayOfWeek)

    // 選択日の記録を取得
    const { data: records } = await supabase
      .from('daily_records')
      .select('*')
      .eq('user_id', targetUserId)
      .eq('record_date', dateStr)

    // タスクと記録を結合（複数セッション対応）
    const tasksWithRecords: TaskWithRecords[] = (scheduledTasks || []).map(
      (task) => {
        // このタスクに関連するすべての記録を取得
        const taskRecords = (records || [])
          .filter((r) => r.scheduled_task_id === task.id)
          .map((record) => ({
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
          }))

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
          records: taskRecords,
        }
      }
    )

    setTasks(tasksWithRecords)
    setLoading(false)
  }

  useEffect(() => {
    fetchTasks(selectedDate)
  }, [selectedChildId, isParent, selectedDate])

  const goToPrevDay = () => setSelectedDate((prev) => subDays(prev, 1))
  const goToNextDay = () => setSelectedDate((prev) => addDays(prev, 1))

  const isToday = format(selectedDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')

  // 達成時間を計算（複数セッション対応）
  const getTaskTotalMinutes = (task: TaskWithRecords) => {
    return task.records.reduce((sum, r) => sum + (r.actualMinutes || 0), 0)
  }

  const totalAchievedMinutes = tasks.reduce((sum, task) => {
    return sum + getTaskTotalMinutes(task)
  }, 0)

  // カテゴリ別の達成時間
  const categoryStats = {
    study: tasks
      .filter((t) => t.category === 'study')
      .reduce((sum, t) => sum + getTaskTotalMinutes(t), 0),
    lesson: tasks
      .filter((t) => t.category === 'lesson')
      .reduce((sum, t) => sum + getTaskTotalMinutes(t), 0),
    chore: tasks
      .filter((t) => t.category === 'chore')
      .reduce((sum, t) => sum + getTaskTotalMinutes(t), 0),
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
      {/* 日付ナビゲーション */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={goToPrevDay}
          className="px-3 py-1 text-sm text-[#666666] hover:bg-[#F5F5F5] rounded"
        >
          ← 前へ
        </button>
        <h2 className="text-lg font-medium text-[#202020]">
          {format(selectedDate, 'M/d', { locale: ja })}のやること
          {isToday && <span className="ml-2 text-sm text-[#DC4C3E]">（今日）</span>}
        </h2>
        <button
          type="button"
          onClick={goToNextDay}
          className="px-3 py-1 text-sm text-[#666666] hover:bg-[#F5F5F5] rounded"
        >
          次へ →
        </button>
      </div>

      {/* 達成時間表示 */}
      <TodayAchievement
        totalMinutes={totalAchievedMinutes}
        categoryStats={categoryStats}
      />

      {/* 今日のタスク */}
      <div className="mt-6">
        <h3 className="text-sm font-medium text-[#666666] mb-3">今日やること</h3>

        {tasks.length === 0 ? (
          <div className="bg-white rounded-lg border border-[#E5E5E5] p-8 text-center">
            <p className="text-[#666666]">今日やることはありません</p>
            <p className="text-sm text-[#999999] mt-2">
              スケジュールでやることを追加してください
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {tasks.map((task) => (
              <TaskRecorder
                key={task.id}
                task={task}
                records={task.records}
                selectedDate={selectedDate}
                onUpdate={() => fetchTasks(selectedDate)}
              />
            ))}
          </div>
        )}

        {/* スケジュールにない実績を追加するボタン */}
        <Link
          href={`/schedule/add-record?date=${format(selectedDate, 'yyyy-MM-dd')}`}
          className="mt-4 w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-[#E5E5E5] text-[#666666] rounded-lg hover:border-[#DC4C3E] hover:text-[#DC4C3E] transition-colors"
        >
          <Plus className="w-4 h-4" />
          スケジュールにない実績を追加する
        </Link>
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { format, startOfWeek, addDays, addWeeks, subWeeks } from 'date-fns'
import { ja } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/client'
import { useFamily } from '@/contexts/FamilyContext'
import TaskForm from '@/components/TaskForm'
import { WEEKDAYS_MONDAY_START, mondayIndexToDayOfWeek, CATEGORY_CONFIG, type ScheduledTask, type TaskCategory } from '@/types'
import { getWeekdayColorClass } from '@/lib/weekendColors'

export default function ScheduleEditPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const dayParam = searchParams.get('day')

  const [tasks, setTasks] = useState<ScheduledTask[]>([])
  const [selectedDayMondayIndex, setSelectedDayMondayIndex] = useState<number>(() => {
    if (dayParam) {
      const parsed = parseInt(dayParam, 10)
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 6) return parsed
    }
    return 0
  })
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  )
  const { isParent, selectedChildId } = useFamily()
  const today = new Date()

  // URL パラメータが変わったら日付を更新
  useEffect(() => {
    if (dayParam) {
      const parsed = parseInt(dayParam, 10)
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 6) {
        setSelectedDayMondayIndex(parsed)
      }
    }
  }, [dayParam])

  const fetchTasks = async () => {
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

  useEffect(() => {
    fetchTasks()
  }, [currentWeekStart, selectedChildId, isParent])

  const goToPrevWeek = () => setCurrentWeekStart((prev) => subWeeks(prev, 1))
  const goToNextWeek = () => setCurrentWeekStart((prev) => addWeeks(prev, 1))

  const handleAddTask = async (taskData: {
    category: TaskCategory
    subcategory: string
    taskType: string | null
    plannedMinutes: number
  }) => {
    const supabase = createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    // 親の場合は選択した子供のデータ、子供の場合は自分のデータ
    const targetUserId = isParent && selectedChildId ? selectedChildId : user.id

    const selectedDayOfWeek = mondayIndexToDayOfWeek(selectedDayMondayIndex)

    console.log('handleAddTask: targetUserId=', targetUserId, 'isParent=', isParent, 'selectedChildId=', selectedChildId)

    // API Route経由でタスクを追加（RLSをバイパス）
    const response = await fetch('/api/scheduled-tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: targetUserId,
        week_start: format(currentWeekStart, 'yyyy-MM-dd'),
        day_of_week: selectedDayOfWeek,
        category: taskData.category,
        subcategory: taskData.subcategory,
        task_type: taskData.taskType,
        planned_minutes: taskData.plannedMinutes,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('タスク追加エラー:', error)
      alert(`やることの追加に失敗しました: ${error.error}`)
      return
    }

    setShowForm(false)
    fetchTasks()
  }

  const handleDeleteTask = async (taskId: string, taskName: string) => {
    const confirmed = window.confirm(`「${taskName}」を削除しますか？\nこの操作は元に戻せません。`)
    if (!confirmed) return

    const response = await fetch(`/api/scheduled-tasks?id=${taskId}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('タスク削除エラー:', error)
      alert(`やることの削除に失敗しました: ${error.error}`)
      return
    }

    fetchTasks()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#666666]">読み込み中...</div>
      </div>
    )
  }

  const selectedDayOfWeek = mondayIndexToDayOfWeek(selectedDayMondayIndex)
  const dayTasks = tasks.filter((t) => t.dayOfWeek === selectedDayOfWeek)
  const weekEnd = addDays(currentWeekStart, 6)

  return (
    <div className="max-w-2xl mx-auto">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-[#202020]">
          スケジュール編集
        </h2>
        <button
          type="button"
          onClick={() => router.push('/schedule')}
          className="px-4 py-2 text-sm bg-[#202020] text-white rounded-md hover:bg-[#404040] transition-colors"
        >
          完了
        </button>
      </div>

      {/* 週ナビゲーション */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={goToPrevWeek}
          className="px-3 py-1 text-sm text-[#666666] hover:bg-[#F5F5F5] rounded"
        >
          ← 前へ
        </button>
        <span className="text-sm text-[#666666]">
          {format(currentWeekStart, 'M/d', { locale: ja })} 〜 {format(weekEnd, 'M/d', { locale: ja })}
        </span>
        <button
          type="button"
          onClick={goToNextWeek}
          className="px-3 py-1 text-sm text-[#666666] hover:bg-[#F5F5F5] rounded"
        >
          次へ →
        </button>
      </div>

      {/* 曜日タブ（月曜始まり） */}
      <div className="grid grid-cols-7 gap-1 mb-6">
        {WEEKDAYS_MONDAY_START.map((day, mondayIndex) => {
          const dayOfWeek = mondayIndexToDayOfWeek(mondayIndex)
          const date = addDays(currentWeekStart, mondayIndex)
          const isSelected = selectedDayMondayIndex === mondayIndex
          const taskCount = tasks.filter((t) => t.dayOfWeek === dayOfWeek).length

          return (
            <button
              type="button"
              key={day}
              onClick={() => {
                setSelectedDayMondayIndex(mondayIndex)
                setShowForm(false)
              }}
              className={`py-2 rounded-md text-sm text-center transition-colors ${
                isSelected
                  ? 'bg-[#DC4C3E] text-white'
                  : `bg-white border border-[#E5E5E5] hover:border-[#DC4C3E] ${getWeekdayColorClass(mondayIndex) || 'text-[#666666]'}`
              }`}
            >
              <div>{day}</div>
              <div className="text-xs">{format(date, 'M/d')}</div>
              {taskCount > 0 && (
                <div
                  className={`text-xs ${
                    isSelected ? 'text-white/80' : 'text-[#999999]'
                  }`}
                >
                  ({taskCount})
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* タスク一覧 */}
      <div className="bg-white rounded-lg border border-[#E5E5E5]">
        {dayTasks.length === 0 ? (
          <div className="p-8 text-center text-[#999999]">
            やることがありません
          </div>
        ) : (
          <div className="divide-y divide-[#E5E5E5]">
            {dayTasks.map((task) => {
              const categoryConfig = CATEGORY_CONFIG[task.category as TaskCategory]
              const typeLabel = categoryConfig?.types?.find(
                (t) => t.value === task.taskType
              )?.label

              return (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-4"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: categoryConfig?.color }}
                    />
                    <div>
                      <div className="text-sm text-[#202020]">
                        {task.subcategory}
                        {typeLabel && `（${typeLabel}）`}
                      </div>
                      <div className="text-xs text-[#999999]">
                        {categoryConfig?.label} · {task.plannedMinutes}分
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteTask(task.id, task.subcategory)}
                    className="flex items-center gap-1 text-sm text-[#DC4C3E] hover:text-[#B03D32] transition-colors"
                    aria-label="やることを削除"
                  >
                    <span>✗</span>
                    <span>削除する</span>
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {/* タスク追加 */}
        {showForm ? (
          <div className="p-4 border-t border-[#E5E5E5]">
            <TaskForm
              onSubmit={handleAddTask}
              onCancel={() => setShowForm(false)}
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="w-full p-4 text-left text-sm text-[#666666] hover:text-[#DC4C3E] hover:bg-[#F5F5F5] transition-colors border-t border-[#E5E5E5]"
          >
            ＋ やることを追加
          </button>
        )}
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { format, startOfWeek, addDays } from 'date-fns'
import { ja } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/client'
import TaskForm from '@/components/TaskForm'
import { WEEKDAYS, CATEGORY_CONFIG, type ScheduledTask, type TaskCategory } from '@/types'

export default function ScheduleEditPage() {
  const router = useRouter()
  const [tasks, setTasks] = useState<ScheduledTask[]>([])
  const [selectedDay, setSelectedDay] = useState<number>(1) // 月曜
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const today = new Date()
  const weekStart = startOfWeek(today, { weekStartsOn: 1 })

  const fetchTasks = async () => {
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

  useEffect(() => {
    fetchTasks()
  }, [])

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

    await supabase.from('scheduled_tasks').insert({
      user_id: user.id,
      week_start: format(weekStart, 'yyyy-MM-dd'),
      day_of_week: selectedDay,
      category: taskData.category,
      subcategory: taskData.subcategory,
      task_type: taskData.taskType,
      planned_minutes: taskData.plannedMinutes,
    })

    setShowForm(false)
    fetchTasks()
  }

  const handleDeleteTask = async (taskId: string) => {
    const supabase = createClient()
    await supabase.from('scheduled_tasks').delete().eq('id', taskId)
    fetchTasks()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#666666]">読み込み中...</div>
      </div>
    )
  }

  const dayTasks = tasks.filter((t) => t.dayOfWeek === selectedDay)

  return (
    <div className="max-w-2xl mx-auto">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-medium text-[#202020]">
          スケジュール編集
        </h2>
        <button
          onClick={() => router.push('/schedule')}
          className="text-sm text-[#666666] hover:text-[#202020]"
        >
          完了
        </button>
      </div>

      {/* 曜日タブ */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-2">
        {WEEKDAYS.map((day, index) => {
          const dayIndex = index // 日=0, 月=1, ...
          const date = addDays(weekStart, index === 0 ? 6 : index - 1)
          const isSelected = selectedDay === dayIndex
          const taskCount = tasks.filter((t) => t.dayOfWeek === dayIndex).length

          return (
            <button
              key={day}
              onClick={() => {
                setSelectedDay(dayIndex)
                setShowForm(false)
              }}
              className={`px-4 py-2 rounded-md text-sm whitespace-nowrap transition-colors ${
                isSelected
                  ? 'bg-[#DC4C3E] text-white'
                  : 'bg-white border border-[#E5E5E5] text-[#666666] hover:border-[#DC4C3E]'
              }`}
            >
              {day}
              {taskCount > 0 && (
                <span
                  className={`ml-1 ${
                    isSelected ? 'text-white/80' : 'text-[#999999]'
                  }`}
                >
                  ({taskCount})
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* タスク一覧 */}
      <div className="bg-white rounded-lg border border-[#E5E5E5]">
        {dayTasks.length === 0 ? (
          <div className="p-8 text-center text-[#999999]">
            タスクがありません
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
                    onClick={() => handleDeleteTask(task.id)}
                    className="text-[#999999] hover:text-[#DC4C3E] transition-colors"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
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
            onClick={() => setShowForm(true)}
            className="w-full p-4 text-left text-sm text-[#666666] hover:text-[#DC4C3E] hover:bg-[#F5F5F5] transition-colors border-t border-[#E5E5E5]"
          >
            ＋ タスクを追加
          </button>
        )}
      </div>
    </div>
  )
}

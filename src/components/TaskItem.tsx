'use client'

import { Check } from 'lucide-react'
import { CATEGORY_CONFIG, type ScheduledTask, type DailyRecord, type TaskCategory } from '@/types'

type TaskItemProps = {
  task: ScheduledTask
  record?: DailyRecord
  showTime?: boolean
  onClick?: () => void
}

export default function TaskItem({
  task,
  record,
  showTime = false,
  onClick,
}: TaskItemProps) {
  const isCompleted = record?.isCompleted || false
  const categoryConfig = CATEGORY_CONFIG[task.category as TaskCategory]
  const color = categoryConfig?.color || '#666666'

  // タスク種別のラベル取得
  const getTaskTypeLabel = () => {
    if (!task.taskType) return ''
    const types = categoryConfig?.types
    if (!types) return ''
    const found = types.find((t) => t.value === task.taskType)
    return found ? `（${found.label}）` : ''
  }

  // 時間表示
  const getTimeDisplay = () => {
    if (record?.actualMinutes) {
      return `${record.actualMinutes}分`
    }
    return `予定${task.plannedMinutes}分`
  }

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 hover:bg-[#F5F5F5] transition-colors ${
        onClick ? 'cursor-pointer' : ''
      }`}
      onClick={onClick}
    >
      {/* チェックボックス */}
      <div
        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
          isCompleted ? 'bg-[#058527] border-[#058527]' : ''
        }`}
        style={{ borderColor: isCompleted ? '#058527' : color }}
      >
        {isCompleted && (
          <Check className="w-3 h-3 text-white" strokeWidth={3} />
        )}
      </div>

      {/* タスク情報 */}
      <div className="flex-1 min-w-0">
        <div
          className={`text-sm ${
            isCompleted ? 'text-[#999999] line-through' : 'text-[#202020]'
          }`}
        >
          {task.subcategory}
          {getTaskTypeLabel()}
        </div>
        <div className="text-xs text-[#999999]">{categoryConfig?.label}</div>
      </div>

      {/* 時間表示 */}
      {showTime && (
        <div
          className={`text-sm flex-shrink-0 ${
            isCompleted ? 'text-[#058527]' : 'text-[#666666]'
          }`}
        >
          {getTimeDisplay()}
        </div>
      )}
    </div>
  )
}

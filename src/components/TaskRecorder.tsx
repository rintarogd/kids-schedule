'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import {
  CATEGORY_CONFIG,
  type ScheduledTask,
  type DailyRecord,
  type TaskCategory,
} from '@/types'

type TaskRecorderProps = {
  task: ScheduledTask
  record?: DailyRecord
  onUpdate: () => void
}

export default function TaskRecorder({
  task,
  record,
  onUpdate,
}: TaskRecorderProps) {
  const [loading, setLoading] = useState(false)
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

  const handleStart = async () => {
    setLoading(true)
    const supabase = createClient()
    const now = new Date()
    const todayStr = format(now, 'yyyy-MM-dd')
    const timeStr = format(now, 'HH:mm:ss')

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    if (record) {
      // 既存レコードを更新
      await supabase
        .from('daily_records')
        .update({ start_time: timeStr })
        .eq('id', record.id)
    } else {
      // 新規レコード作成
      await supabase.from('daily_records').insert({
        user_id: user.id,
        scheduled_task_id: task.id,
        record_date: todayStr,
        start_time: timeStr,
      })
    }

    setLoading(false)
    onUpdate()
  }

  const handleEnd = async () => {
    setLoading(true)
    const supabase = createClient()
    const now = new Date()
    const timeStr = format(now, 'HH:mm:ss')

    if (!record) return

    // 実績時間を計算
    let actualMinutes = 0
    if (record.startTime) {
      const [startH, startM] = record.startTime.split(':').map(Number)
      const [endH, endM] = timeStr.split(':').map(Number)
      actualMinutes = (endH * 60 + endM) - (startH * 60 + startM)
      if (actualMinutes < 0) actualMinutes = 0
    }

    await supabase
      .from('daily_records')
      .update({
        end_time: timeStr,
        actual_minutes: actualMinutes,
        is_completed: true,
      })
      .eq('id', record.id)

    setLoading(false)
    onUpdate()
  }

  const isStarted = !!record?.startTime
  const isCompleted = !!record?.isCompleted

  return (
    <div className="bg-white rounded-lg border border-[#E5E5E5] p-4">
      {/* タスク情報 */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: color }}
        />
        <div className="flex-1">
          <div className="text-[#202020] font-medium">
            {task.subcategory}
            {getTaskTypeLabel()}
          </div>
          <div className="text-xs text-[#999999]">
            {categoryConfig?.label} · 予定{task.plannedMinutes}分
          </div>
        </div>
        {isCompleted && (
          <div className="text-sm text-[#058527] font-medium">
            {record?.actualMinutes}分達成！
          </div>
        )}
      </div>

      {/* アクションボタン */}
      {isCompleted ? (
        <div className="flex items-center justify-between text-sm text-[#666666]">
          <span>
            {record?.startTime?.slice(0, 5)} 〜 {record?.endTime?.slice(0, 5)}
          </span>
          <span className="text-[#058527]">完了</span>
        </div>
      ) : isStarted ? (
        <div className="flex items-center justify-between">
          <span className="text-sm text-[#666666]">
            {record?.startTime?.slice(0, 5)} から開始中
          </span>
          <button
            onClick={handleEnd}
            disabled={loading}
            className="px-4 py-2 bg-[#058527] text-white text-sm rounded-md hover:bg-[#046a1f] transition-colors disabled:opacity-50"
          >
            {loading ? '処理中...' : '終了する'}
          </button>
        </div>
      ) : (
        <button
          onClick={handleStart}
          disabled={loading}
          className="w-full py-3 border-2 border-dashed border-[#E5E5E5] text-[#666666] rounded-md hover:border-[#DC4C3E] hover:text-[#DC4C3E] transition-colors disabled:opacity-50"
        >
          {loading ? '処理中...' : '開始する'}
        </button>
      )}
    </div>
  )
}

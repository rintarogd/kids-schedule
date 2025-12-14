'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { Play, Square, RotateCcw, Check, Pencil, Save, X, Clock } from 'lucide-react'
import {
  CATEGORY_CONFIG,
  type ScheduledTask,
  type DailyRecord,
  type TaskCategory,
} from '@/types'

type TaskRecorderProps = {
  task: ScheduledTask
  records: DailyRecord[] // 複数の記録に対応
  onUpdate: () => void
}

export default function TaskRecorder({
  task,
  records,
  onUpdate,
}: TaskRecorderProps) {
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editMinutes, setEditMinutes] = useState<number>(0)
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

  // 合計時間を計算
  const totalMinutes = records.reduce((sum, r) => sum + (r.actualMinutes || 0), 0)

  // 進行中のセッション（endTimeがないもの）
  const activeSession = records.find((r) => r.startTime && !r.endTime)

  // 完了したセッション
  const completedSessions = records.filter((r) => r.endTime)

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

    // 新規セッションを作成
    await supabase.from('daily_records').insert({
      user_id: task.userId,
      scheduled_task_id: task.id,
      record_date: todayStr,
      start_time: timeStr,
      is_completed: false,
    })

    setLoading(false)
    onUpdate()
  }

  const handleEnd = async () => {
    if (!activeSession) return

    setLoading(true)
    const supabase = createClient()
    const now = new Date()
    const timeStr = format(now, 'HH:mm:ss')

    // 実績時間を計算
    let sessionMinutes = 0
    if (activeSession.startTime) {
      const [startH, startM] = activeSession.startTime.split(':').map(Number)
      const [endH, endM] = timeStr.split(':').map(Number)
      sessionMinutes = endH * 60 + endM - (startH * 60 + startM)
      if (sessionMinutes < 0) sessionMinutes = 0
    }

    await supabase
      .from('daily_records')
      .update({
        end_time: timeStr,
        actual_minutes: sessionMinutes,
        is_completed: true,
      })
      .eq('id', activeSession.id)

    setLoading(false)
    onUpdate()
  }

  const handleEditStart = (record: DailyRecord) => {
    setEditingId(record.id)
    setEditMinutes(record.actualMinutes || 0)
  }

  const handleEditSave = async () => {
    if (!editingId) return

    setLoading(true)
    const supabase = createClient()

    // 編集中のセッションを取得
    const editingSession = records.find((r) => r.id === editingId)

    // 開始時間から新しい終了時間を計算
    let newEndTime: string | undefined
    if (editingSession?.startTime) {
      const [startH, startM] = editingSession.startTime.split(':').map(Number)
      const totalMinutesFromStart = startH * 60 + startM + editMinutes
      const newEndH = Math.floor(totalMinutesFromStart / 60) % 24
      const newEndM = totalMinutesFromStart % 60
      newEndTime = `${String(newEndH).padStart(2, '0')}:${String(newEndM).padStart(2, '0')}:00`
    }

    await supabase
      .from('daily_records')
      .update({
        actual_minutes: editMinutes,
        end_time: newEndTime || editingSession?.endTime,
      })
      .eq('id', editingId)

    setEditingId(null)
    setLoading(false)
    onUpdate()
  }

  const handleEditCancel = () => {
    setEditingId(null)
  }

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
        {totalMinutes > 0 && (
          <div className="flex items-center gap-1 text-sm text-[#058527] font-medium">
            <Check className="w-4 h-4" />
            合計{totalMinutes}分達成！
          </div>
        )}
      </div>

      {/* 完了したセッション一覧 */}
      {completedSessions.length > 0 && (
        <div className="mb-4 space-y-2">
          {completedSessions.map((session) => (
            <div
              key={session.id}
              className="flex items-center justify-between text-sm bg-[#F5F5F5] rounded px-3 py-2"
            >
              {editingId === session.id ? (
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-[#666666]">
                    {session.startTime?.slice(0, 5)}〜{session.endTime?.slice(0, 5)}
                  </span>
                  <input
                    type="number"
                    value={editMinutes}
                    onChange={(e) => setEditMinutes(Number(e.target.value))}
                    className="w-16 px-2 py-1 border border-[#E5E5E5] rounded text-center text-sm"
                    min={0}
                    aria-label="時間を修正"
                  />
                  <span className="text-[#666666]">分</span>
                  <button
                    type="button"
                    onClick={handleEditSave}
                    disabled={loading}
                    className="flex items-center gap-1 px-2 py-1 bg-[#058527] text-white text-xs rounded hover:bg-[#046a1f]"
                    aria-label="保存"
                  >
                    <Save className="w-3.5 h-3.5" />
                    保存
                  </button>
                  <button
                    type="button"
                    onClick={handleEditCancel}
                    className="flex items-center gap-1 px-2 py-1 bg-[#666666] text-white text-xs rounded hover:bg-[#555555]"
                    aria-label="取消"
                  >
                    <X className="w-3.5 h-3.5" />
                    取消
                  </button>
                </div>
              ) : (
                <>
                  <span className="text-[#666666]">
                    {session.startTime?.slice(0, 5)}〜{session.endTime?.slice(0, 5)}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[#058527] font-medium">
                      {session.actualMinutes}分
                    </span>
                    <button
                      type="button"
                      onClick={() => handleEditStart(session)}
                      className="flex items-center gap-1 text-xs text-[#999999] hover:text-[#666666]"
                      aria-label="修正"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      修正
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* アクションボタン */}
      {activeSession ? (
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-sm text-[#666666]">
            <Clock className="w-4 h-4" />
            {activeSession.startTime?.slice(0, 5)} から開始中
          </span>
          <button
            type="button"
            onClick={handleEnd}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#058527] text-white text-sm rounded-md hover:bg-[#046a1f] transition-colors disabled:opacity-50"
          >
            <Square className="w-4 h-4" />
            {loading ? '処理中...' : '終了する'}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleStart}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-[#E5E5E5] text-[#666666] rounded-md hover:border-[#DC4C3E] hover:text-[#DC4C3E] transition-colors disabled:opacity-50"
        >
          {completedSessions.length > 0 ? (
            <RotateCcw className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4" />
          )}
          {loading ? '処理中...' : completedSessions.length > 0 ? '再開する' : '開始する'}
        </button>
      )}
    </div>
  )
}

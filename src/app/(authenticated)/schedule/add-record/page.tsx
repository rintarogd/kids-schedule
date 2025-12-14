'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { format, startOfWeek } from 'date-fns'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useFamily } from '@/contexts/FamilyContext'
import { CATEGORY_CONFIG, type TaskCategory } from '@/types'

export default function AddRecordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const dateParam = searchParams.get('date')
  const { isParent, selectedChildId } = useFamily()

  // 日付をパース
  const selectedDate = dateParam ? new Date(dateParam) : new Date()
  const dateStr = format(selectedDate, 'yyyy-MM-dd')

  const [category, setCategory] = useState<TaskCategory>('study')
  const [subcategory, setSubcategory] = useState('')
  const [taskType, setTaskType] = useState<string | null>(null)
  const [plannedMinutes, setPlannedMinutes] = useState(30)
  const [actualMinutes, setActualMinutes] = useState(30)
  const [customText, setCustomText] = useState('')
  const [loading, setLoading] = useState(false)

  const categoryConfig = CATEGORY_CONFIG[category]
  const subcategories = categoryConfig.subcategories
  const types = categoryConfig.types

  const handleCategoryChange = (newCategory: TaskCategory) => {
    setCategory(newCategory)
    setSubcategory('')
    setTaskType(null)
    setCustomText('')
    const defaultMin = CATEGORY_CONFIG[newCategory].defaultMinutes
    setPlannedMinutes(defaultMin)
    setActualMinutes(defaultMin)
  }

  const isOtherSelected = subcategory === 'その他'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!subcategory) return

    setLoading(true)
    const supabase = createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setLoading(false)
      return
    }

    // 親の場合は選択した子供のID、子供の場合は自分のID
    const targetUserId = isParent && selectedChildId ? selectedChildId : user.id

    // 選択日の週の月曜日を計算
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 })
    const weekStartStr = format(weekStart, 'yyyy-MM-dd')
    const dayOfWeek = selectedDate.getDay()

    // 「その他」の場合はカスタムテキストを含める
    const finalSubcategory =
      isOtherSelected && customText.trim()
        ? `その他: ${customText.trim()}`
        : subcategory

    // 1. まずスケジュールを作成
    const { data: scheduleData, error: scheduleError } = await supabase
      .from('scheduled_tasks')
      .insert({
        user_id: targetUserId,
        week_start: weekStartStr,
        day_of_week: dayOfWeek,
        category,
        subcategory: finalSubcategory,
        task_type: taskType,
        planned_minutes: plannedMinutes,
      })
      .select()
      .single()

    if (scheduleError || !scheduleData) {
      console.error('スケジュール作成エラー:', scheduleError)
      setLoading(false)
      return
    }

    // 2. 実績も作成
    const { error: recordError } = await supabase.from('daily_records').insert({
      user_id: targetUserId,
      scheduled_task_id: scheduleData.id,
      record_date: dateStr,
      start_time: null,
      end_time: null,
      actual_minutes: actualMinutes,
      is_completed: true,
    })

    if (recordError) {
      console.error('実績作成エラー:', recordError)
      setLoading(false)
      return
    }

    setLoading(false)
    // 今日やること画面に戻る
    router.push(`/dashboard?date=${dateStr}`)
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* ヘッダー */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/dashboard?date=${dateStr}`}
          className="p-2 hover:bg-[#F5F5F5] rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-[#666666]" />
        </Link>
        <h1 className="text-lg font-medium text-[#202020]">
          スケジュールにない実績を追加
        </h1>
      </div>

      <div className="bg-white rounded-lg border border-[#E5E5E5] p-6">
        {/* 対象日付 */}
        <div className="mb-6 pb-4 border-b border-[#E5E5E5]">
          <span className="text-sm text-[#666666]">対象日: </span>
          <span className="text-[#202020] font-medium">
            {format(selectedDate, 'yyyy年M月d日')}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* カテゴリ選択 */}
          <div>
            <label className="block text-sm font-medium text-[#202020] mb-2">
              カテゴリ
            </label>
            <div className="flex gap-2">
              {(Object.keys(CATEGORY_CONFIG) as TaskCategory[]).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleCategoryChange(cat)}
                  className={`px-3 py-2 rounded-md text-sm transition-colors ${
                    category === cat
                      ? 'text-white'
                      : 'bg-white border border-[#E5E5E5] text-[#666666] hover:border-current'
                  }`}
                  style={{
                    backgroundColor:
                      category === cat ? CATEGORY_CONFIG[cat].color : undefined,
                    borderColor:
                      category !== cat ? undefined : CATEGORY_CONFIG[cat].color,
                  }}
                >
                  {CATEGORY_CONFIG[cat].label}
                </button>
              ))}
            </div>
          </div>

          {/* サブカテゴリ選択 */}
          <div>
            <label className="block text-sm font-medium text-[#202020] mb-2">
              {category === 'study'
                ? '教科'
                : category === 'lesson'
                  ? '習い事'
                  : 'お手伝い'}
            </label>
            <div className="flex flex-wrap gap-2">
              {subcategories.map((sub) => (
                <button
                  key={sub}
                  type="button"
                  onClick={() => {
                    setSubcategory(sub)
                    if (sub !== 'その他') setCustomText('')
                  }}
                  className={`px-3 py-2 rounded-md text-sm transition-colors ${
                    subcategory === sub
                      ? 'bg-[#202020] text-white'
                      : 'bg-white border border-[#E5E5E5] text-[#666666] hover:border-[#202020]'
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>

            {/* その他選択時のカスタムテキスト入力 */}
            {isOtherSelected && (
              <div className="mt-3">
                <input
                  type="text"
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder="内容を入力（例: 漢字練習、お風呂掃除）"
                  maxLength={30}
                  className="w-full px-3 py-2 border border-[#E5E5E5] rounded-md focus:outline-none focus:ring-2 focus:ring-[#202020] focus:border-transparent text-sm"
                />
                <p className="text-xs text-[#999999] mt-1">
                  {customText.length}/30文字
                </p>
              </div>
            )}
          </div>

          {/* タスク種別選択（お手伝い以外） */}
          {types && (
            <div>
              <label className="block text-sm font-medium text-[#202020] mb-2">
                種別
              </label>
              <div className="flex gap-2">
                {types.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setTaskType(type.value)}
                    className={`px-3 py-2 rounded-md text-sm transition-colors ${
                      taskType === type.value
                        ? 'bg-[#202020] text-white'
                        : 'bg-white border border-[#E5E5E5] text-[#666666] hover:border-[#202020]'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 予定時間 */}
          <div>
            <label className="block text-sm font-medium text-[#202020] mb-2">
              予定時間
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={plannedMinutes}
                onChange={(e) => setPlannedMinutes(Number(e.target.value))}
                min={5}
                max={180}
                step={5}
                className="w-20 px-3 py-2 border border-[#E5E5E5] rounded-md text-center"
              />
              <span className="text-[#666666]">分</span>
            </div>
            <div className="flex gap-2 mt-2">
              {[15, 30, 45, 60].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPlannedMinutes(m)}
                  className={`px-3 py-1 rounded text-xs ${
                    plannedMinutes === m
                      ? 'bg-[#202020] text-white'
                      : 'bg-[#F5F5F5] text-[#666666] hover:bg-[#E5E5E5]'
                  }`}
                >
                  {m}分
                </button>
              ))}
            </div>
          </div>

          {/* 実績時間 */}
          <div>
            <label className="block text-sm font-medium text-[#202020] mb-2">
              実績時間
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={actualMinutes}
                onChange={(e) => setActualMinutes(Number(e.target.value))}
                min={1}
                max={180}
                step={5}
                className="w-20 px-3 py-2 border border-[#E5E5E5] rounded-md text-center"
              />
              <span className="text-[#666666]">分</span>
            </div>
            <div className="flex gap-2 mt-2">
              {[15, 30, 45, 60].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setActualMinutes(m)}
                  className={`px-3 py-1 rounded text-xs ${
                    actualMinutes === m
                      ? 'bg-[#DC4C3E] text-white'
                      : 'bg-[#F5F5F5] text-[#666666] hover:bg-[#E5E5E5]'
                  }`}
                >
                  {m}分
                </button>
              ))}
            </div>
          </div>

          {/* ボタン */}
          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              disabled={!subcategory || loading}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#DC4C3E] text-white rounded-md hover:bg-[#B03D32] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {loading ? '保存中...' : '保存する'}
            </button>
            <Link
              href={`/dashboard?date=${dateStr}`}
              className="px-6 py-3 border border-[#E5E5E5] text-[#666666] rounded-md hover:bg-[#F5F5F5] transition-colors text-center"
            >
              キャンセル
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

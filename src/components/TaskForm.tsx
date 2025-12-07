'use client'

import { useState } from 'react'
import { CATEGORY_CONFIG, type TaskCategory } from '@/types'

type TaskFormProps = {
  onSubmit: (data: {
    category: TaskCategory
    subcategory: string
    taskType: string | null
    plannedMinutes: number
  }) => void
  onCancel: () => void
}

export default function TaskForm({ onSubmit, onCancel }: TaskFormProps) {
  const [category, setCategory] = useState<TaskCategory>('study')
  const [subcategory, setSubcategory] = useState('')
  const [taskType, setTaskType] = useState<string | null>(null)
  const [minutes, setMinutes] = useState(30)

  const categoryConfig = CATEGORY_CONFIG[category]
  const subcategories = categoryConfig.subcategories
  const types = categoryConfig.types

  const handleCategoryChange = (newCategory: TaskCategory) => {
    setCategory(newCategory)
    setSubcategory('')
    setTaskType(null)
    setMinutes(CATEGORY_CONFIG[newCategory].defaultMinutes)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!subcategory) return

    onSubmit({
      category,
      subcategory,
      taskType,
      plannedMinutes: minutes,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
                backgroundColor: category === cat ? CATEGORY_CONFIG[cat].color : undefined,
                borderColor: category !== cat ? undefined : CATEGORY_CONFIG[cat].color,
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
          {category === 'study' ? '教科' : category === 'lesson' ? '習い事' : 'お手伝い'}
        </label>
        <div className="flex flex-wrap gap-2">
          {subcategories.map((sub) => (
            <button
              key={sub}
              type="button"
              onClick={() => setSubcategory(sub)}
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
            value={minutes}
            onChange={(e) => setMinutes(Number(e.target.value))}
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
              onClick={() => setMinutes(m)}
              className={`px-3 py-1 rounded text-xs ${
                minutes === m
                  ? 'bg-[#202020] text-white'
                  : 'bg-[#F5F5F5] text-[#666666] hover:bg-[#E5E5E5]'
              }`}
            >
              {m}分
            </button>
          ))}
        </div>
      </div>

      {/* ボタン */}
      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          disabled={!subcategory}
          className="flex-1 py-2 bg-[#DC4C3E] text-white rounded-md hover:bg-[#B03D32] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          追加
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-[#E5E5E5] text-[#666666] rounded-md hover:bg-[#F5F5F5] transition-colors"
        >
          キャンセル
        </button>
      </div>
    </form>
  )
}

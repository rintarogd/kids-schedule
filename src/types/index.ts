// ユーザー関連
export type UserRole = 'child' | 'parent'

export type UserProfile = {
  id: string
  displayName: string
  role: UserRole
  startDate: string | null
  createdAt: string
  updatedAt: string
}

// 親子関係
export type FamilyRelation = {
  id: string
  parentId: string
  childId: string
  createdAt: string
}

// 子供情報（親が見る用）
export type ChildInfo = {
  id: string
  displayName: string
}

// タスクカテゴリ
export type TaskCategory = 'study' | 'lesson' | 'chore'

// 勉強のサブカテゴリ
export type StudySubcategory = '国語' | '数学' | '英語' | '理科' | '社会' | 'その他'

// 習い事のサブカテゴリ
export type LessonSubcategory = 'ピアノ' | '習字'

// お手伝いのサブカテゴリ
export type ChoreSubcategory = '洗濯物を畳む' | '部屋を片付ける' | 'その他'

// 勉強の種別
export type StudyType = 'homework' | 'correspondence' | 'cram_school'

// 習い事の種別
export type LessonType = 'lesson' | 'practice'

// タスクテンプレート
export type TaskTemplate = {
  id: string
  userId: string
  category: TaskCategory
  subcategory: string
  taskType: string | null
  defaultMinutes: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// 週間スケジュール
export type ScheduledTask = {
  id: string
  userId: string
  templateId: string | null
  weekStart: string
  dayOfWeek: number // 0=日, 1=月, ..., 6=土
  plannedMinutes: number
  category: TaskCategory
  subcategory: string
  taskType: string | null
  createdAt: string
  updatedAt: string
}

// 日々の実績記録
export type DailyRecord = {
  id: string
  userId: string
  scheduledTaskId: string | null
  recordDate: string
  startTime: string | null
  endTime: string | null
  actualMinutes: number | null
  isCompleted: boolean
  createdAt: string
  updatedAt: string
}

// 日別統計
export type DailyStat = {
  date: string
  totalPlannedMinutes: number
  totalActualMinutes: number
  achievementRate: number
}

// カテゴリ設定（UIで使用）
export const CATEGORY_CONFIG = {
  study: {
    label: '勉強',
    color: '#7C3AED', // 紫
    subcategories: ['国語', '数学', '英語', '理科', '社会', 'その他'] as const,
    types: [
      { value: 'homework', label: '宿題' },
      { value: 'correspondence', label: '通信講座' },
      { value: 'cram_school', label: '塾' },
    ],
    defaultMinutes: 30,
  },
  lesson: {
    label: '習い事',
    color: '#DB2777', // ピンク
    subcategories: ['ピアノ', '習字'] as const,
    types: [
      { value: 'lesson', label: '通塾' },
      { value: 'practice', label: '練習' },
    ],
    defaultMinutes: 30,
  },
  chore: {
    label: 'お手伝い',
    color: '#0D9488', // ティール
    subcategories: ['洗濯物を畳む', '部屋を片付ける', 'その他'] as const,
    types: null,
    defaultMinutes: 15,
  },
} as const

// 曜日の定義
export const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'] as const

// 曜日の英語定義（date-fns用）
export const WEEKDAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const

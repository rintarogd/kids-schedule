// 曜日に基づいて色クラスを返すユーティリティ
// 土曜日: 青 (#3B82F6)
// 日曜日: 赤 (#DC4C3E)

/**
 * 月曜始まりのインデックス（0=月, 1=火, ..., 5=土, 6=日）から色クラスを取得
 */
export function getWeekdayColorClass(mondayIndex: number): string {
  if (mondayIndex === 5) return 'text-blue-500' // 土曜
  if (mondayIndex === 6) return 'text-[#DC4C3E]' // 日曜
  return ''
}

/**
 * Date オブジェクトから曜日の色クラスを取得
 * getDay() は 0=日, 1=月, ..., 6=土
 */
export function getWeekdayColorClassFromDate(date: Date): string {
  const day = date.getDay()
  if (day === 6) return 'text-blue-500' // 土曜
  if (day === 0) return 'text-[#DC4C3E]' // 日曜
  return ''
}

/**
 * 曜日ラベル（月, 火, ...）から色クラスを取得
 */
export function getWeekdayColorClassFromLabel(label: string): string {
  if (label === '土') return 'text-blue-500'
  if (label === '日') return 'text-[#DC4C3E]'
  return ''
}

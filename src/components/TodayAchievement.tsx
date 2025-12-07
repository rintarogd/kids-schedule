'use client'

import { CATEGORY_CONFIG } from '@/types'

type TodayAchievementProps = {
  totalMinutes: number
  categoryStats: {
    study: number
    lesson: number
    chore: number
  }
}

function formatTime(minutes: number): { hours: number; mins: number } {
  return {
    hours: Math.floor(minutes / 60),
    mins: minutes % 60,
  }
}

function getMessage(minutes: number): string {
  if (minutes === 0) {
    return 'さあ、今日もがんばろう！'
  } else if (minutes < 30) {
    return 'いいスタート！この調子でがんばろう！'
  } else if (minutes < 60) {
    return 'すごい！もう少しで1時間だ！'
  } else if (minutes < 120) {
    return 'すばらしい！よくがんばってるね！'
  } else {
    return '今日は最高のがんばりだ！'
  }
}

export default function TodayAchievement({
  totalMinutes,
  categoryStats,
}: TodayAchievementProps) {
  const { hours, mins } = formatTime(totalMinutes)
  const message = getMessage(totalMinutes)

  const categories = [
    { key: 'study', ...CATEGORY_CONFIG.study, minutes: categoryStats.study },
    { key: 'lesson', ...CATEGORY_CONFIG.lesson, minutes: categoryStats.lesson },
    { key: 'chore', ...CATEGORY_CONFIG.chore, minutes: categoryStats.chore },
  ]

  // 最大時間（プログレスバー用）
  const maxMinutes = Math.max(totalMinutes, 120) // 最低2時間を基準

  return (
    <div className="bg-white rounded-lg border border-[#E5E5E5] p-6">
      {/* タイトル */}
      <h2 className="text-center text-[#666666] text-sm mb-4">
        今日のがんばり時間
      </h2>

      {/* メイン時間表示 */}
      <div className="text-center mb-2">
        <span className="text-5xl font-bold text-[#202020]">
          {hours > 0 && `${hours}:`}
          {mins.toString().padStart(2, '0')}
        </span>
      </div>

      {/* 時間ラベル */}
      <div className="text-center text-[#666666] text-sm mb-4">
        {hours > 0 ? `${hours}時間 ${mins}分` : `${mins}分`}
      </div>

      {/* メッセージ */}
      <div className="text-center mb-6">
        <p className="text-[#DC4C3E] font-medium">{message}</p>
      </div>

      {/* カテゴリ別内訳 */}
      <div className="space-y-3">
        {categories.map((cat) => {
          const { hours: h, mins: m } = formatTime(cat.minutes)
          const percentage = maxMinutes > 0 ? (cat.minutes / maxMinutes) * 100 : 0

          return (
            <div key={cat.key} className="flex items-center gap-3">
              <span
                className="text-sm w-20 truncate"
                style={{ color: cat.color }}
              >
                {cat.label}
              </span>
              <span className="text-sm text-[#666666] w-12">
                {h > 0 ? `${h}:${m.toString().padStart(2, '0')}` : `${m}分`}
              </span>
              <div className="flex-1 h-2 bg-[#E5E5E5] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: cat.color,
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

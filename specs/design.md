# 設計書

**プロジェクト名**: Kids-schedule
**作成日**: 2025-12-07

---

## 技術スタック

### フロントエンド
- **フレームワーク**: Next.js 14 (App Router)
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS

### バックエンド・データ管理
- **認証**: Supabase Auth
- **データベース**: Supabase (PostgreSQL)
- **API**: Supabase Client SDK

### デプロイ
- **ホスティング**: Vercel
- **環境変数**: Vercel Environment Variables

---

## システムアーキテクチャ

```
┌─────────────────────────────────────────────────────────┐
│                      クライアント                        │
│                  (iPad / PC / スマホ)                    │
└─────────────────────┬───────────────────────────────────┘
                      │ HTTPS
                      ▼
┌─────────────────────────────────────────────────────────┐
│                    Vercel (Next.js)                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │   Pages     │  │ Components  │  │  Server Actions │  │
│  │  (App Dir)  │  │             │  │                 │  │
│  └─────────────┘  └─────────────┘  └─────────────────┘  │
└─────────────────────┬───────────────────────────────────┘
                      │ Supabase Client SDK
                      ▼
┌─────────────────────────────────────────────────────────┐
│                      Supabase                           │
│  ┌─────────────┐  ┌─────────────────────────────────┐   │
│  │    Auth     │  │      PostgreSQL Database        │   │
│  │             │  │  ・users  ・tasks  ・records    │   │
│  └─────────────┘  └─────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## ページ構成

```
app/
├── page.tsx                    # ランディング → ログインへリダイレクト
├── login/
│   └── page.tsx               # ログインページ
├── signup/
│   └── page.tsx               # サインアップページ
├── dashboard/
│   └── page.tsx               # ダッシュボード（今日の達成時間）
├── schedule/
│   ├── page.tsx               # 週間スケジュール一覧
│   └── edit/
│       └── page.tsx           # 週間スケジュール編集
├── record/
│   └── page.tsx               # 日々のタスク記録
├── weekly/
│   └── page.tsx               # 週間予定vs実績
├── monthly/
│   └── page.tsx               # 月間レポート
└── layout.tsx                 # 共通レイアウト（ナビゲーション）
```

---

## コンポーネント設計

### 共通コンポーネント

#### Component: Header

**責務**: ナビゲーションとユーザー情報表示

```typescript
type HeaderProps = {
  userName: string;
  onLogout: () => void;
};
```

---

#### Component: BottomNav

**責務**: モバイル用ボトムナビゲーション（iPad最適化）

```typescript
type NavItem = {
  href: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
};
```

---

#### Component: TaskCard

**責務**: タスク情報の表示カード

```typescript
type TaskCardProps = {
  task: Task;
  onStart?: () => void;
  onEnd?: () => void;
  showActions?: boolean;
};
```

---

### ダッシュボード関連

#### Component: TodayAchievement

**責務**: 今日の達成時間を大きく表示

```typescript
type TodayAchievementProps = {
  totalMinutes: number;
  message?: string;
};
```

**表示例**:
```
┌─────────────────────────────┐
│     今日のがんばり時間       │
│                             │
│      2時間 30分             │
│                             │
│  「今日は2時間30分、        │
│   好きなことができるよ！」   │
└─────────────────────────────┘
```

---

#### Component: TaskBreakdown

**責務**: タスクごとの達成時間内訳

```typescript
type TaskBreakdownProps = {
  records: DailyRecord[];
};
```

---

### スケジュール関連

#### Component: WeeklyScheduleGrid

**責務**: 週間スケジュールのグリッド表示・編集

```typescript
type WeeklyScheduleGridProps = {
  weekStart: Date;
  tasks: ScheduledTask[];
  onTaskAdd: (day: number, task: TaskInput) => void;
  onTaskRemove: (taskId: string) => void;
  editable: boolean;
};
```

---

#### Component: TaskForm

**責務**: タスク追加・編集フォーム

```typescript
type TaskFormProps = {
  onSubmit: (task: TaskInput) => void;
  initialValues?: Partial<TaskInput>;
  categories: TaskCategory[];
};
```

---

### 記録関連

#### Component: TaskRecorder

**責務**: タスクの開始・終了時間を記録

```typescript
type TaskRecorderProps = {
  task: ScheduledTask;
  record?: DailyRecord;
  onStart: (taskId: string, startTime: Date) => void;
  onEnd: (taskId: string, endTime: Date) => void;
};
```

**表示例**:
```
┌─────────────────────────────┐
│ 📚 数学（宿題）    予定30分  │
│                             │
│  [開始する]                 │
│                             │
│  または時刻を入力:          │
│  開始 [15:00] 終了 [15:30]  │
└─────────────────────────────┘
```

---

### レポート関連

#### Component: WeeklyComparison

**責務**: 週間の予定vs実績を比較表示

```typescript
type WeeklyComparisonProps = {
  weekStart: Date;
  scheduled: ScheduledTask[];
  records: DailyRecord[];
};
```

---

#### Component: MonthlyCalendar

**責務**: 月間カレンダー形式で達成状況を表示

```typescript
type MonthlyCalendarProps = {
  year: number;
  month: number;
  dailyStats: DailyStat[];
};
```

---

#### Component: AchievementRate

**責務**: 達成率をビジュアル表示（プログレスバー/円グラフ）

```typescript
type AchievementRateProps = {
  planned: number;  // 予定時間（分）
  actual: number;   // 実績時間（分）
  size?: 'sm' | 'md' | 'lg';
};
```

---

## データモデル

### ER図

```
users (Supabase Auth)
  │
  ├──< task_templates (タスクのマスタ/デフォルト設定)
  │
  ├──< scheduled_tasks (週間スケジュール)
  │       │
  │       └──< daily_records (日々の実績記録)
  │
  └──< user_settings (ユーザー設定)
```

---

### テーブル定義

#### users（Supabase Auth管理）

Supabase Authが自動管理。追加のプロフィール情報は `user_profiles` で管理。

```sql
-- user_profiles
create table user_profiles (
  id uuid primary key references auth.users(id),
  display_name text not null,
  role text not null default 'child', -- 'child' | 'parent'
  start_date date, -- 継続月数計算用
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
```

---

#### task_templates（タスクテンプレート）

```sql
create table task_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  category text not null, -- 'study' | 'lesson' | 'chore'
  subcategory text not null, -- 教科名、習い事名、お手伝い種類
  task_type text, -- 'homework' | 'correspondence' | 'cram_school' | 'lesson' | 'practice'
  default_minutes integer not null default 30,
  is_active boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
```

---

#### scheduled_tasks（週間スケジュール）

```sql
create table scheduled_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  template_id uuid references task_templates(id),
  week_start date not null, -- その週の月曜日
  day_of_week integer not null, -- 0=日, 1=月, ..., 6=土
  planned_minutes integer not null,
  category text not null,
  subcategory text not null,
  task_type text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
```

---

#### daily_records（日々の実績）

```sql
create table daily_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  scheduled_task_id uuid references scheduled_tasks(id),
  record_date date not null,
  start_time time,
  end_time time,
  actual_minutes integer, -- 自動計算 or 手動入力
  is_completed boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
```

---

### TypeScript型定義

```typescript
// types/index.ts

export type UserRole = 'child' | 'parent';

export type TaskCategory = 'study' | 'lesson' | 'chore';

export type StudySubcategory = '国語' | '数学' | '英語' | '理科' | '社会' | 'その他';
export type LessonSubcategory = 'ピアノ' | '習字';
export type ChoreSubcategory = '洗濯物を畳む' | '部屋を片付ける' | 'その他';

export type StudyType = 'homework' | 'correspondence' | 'cram_school';
export type LessonType = 'lesson' | 'practice';

export type UserProfile = {
  id: string;
  displayName: string;
  role: UserRole;
  startDate: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TaskTemplate = {
  id: string;
  userId: string;
  category: TaskCategory;
  subcategory: string;
  taskType: string | null;
  defaultMinutes: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ScheduledTask = {
  id: string;
  userId: string;
  templateId: string | null;
  weekStart: string;
  dayOfWeek: number;
  plannedMinutes: number;
  category: TaskCategory;
  subcategory: string;
  taskType: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DailyRecord = {
  id: string;
  userId: string;
  scheduledTaskId: string | null;
  recordDate: string;
  startTime: string | null;
  endTime: string | null;
  actualMinutes: number | null;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
};

export type DailyStat = {
  date: string;
  totalPlannedMinutes: number;
  totalActualMinutes: number;
  achievementRate: number;
};
```

---

## UI/UXデザイン

### デザインコンセプト（Todoist風）

Todoistのデザイン哲学を参考に、以下を重視:

- **クリーンでミニマル**: 余計な装飾を排除し、コンテンツにフォーカス
- **ホワイトスペース**: 十分な余白で視認性を確保
- **フラットデザイン**: シンプルなアイコンとボタン
- **直感的な操作**: タスクの追加・完了がワンタップで可能
- **子ども対応**: Todoistのシンプルさを維持しつつ、タッチしやすい大きさに

---

### カラーパレット（Todoist風）

```css
:root {
  /* Primary - Todoist Red（アクセント） */
  --color-primary: #DC4C3E;      /* Todoist Red */
  --color-primary-hover: #B03D32;

  /* Background - クリーンな白ベース */
  --color-bg: #FAFAFA;           /* 背景 */
  --color-surface: #FFFFFF;      /* カード・パネル */
  --color-border: #E5E5E5;       /* ボーダー */

  /* Text - 高コントラスト */
  --color-text: #202020;         /* メインテキスト */
  --color-text-secondary: #666666; /* サブテキスト */
  --color-text-tertiary: #999999;  /* 補足テキスト */

  /* Task Priority Colors（Todoist風） */
  --color-priority-1: #DC4C3E;   /* 最優先 - 赤 */
  --color-priority-2: #EB8909;   /* 高 - オレンジ */
  --color-priority-3: #246FE0;   /* 中 - 青 */
  --color-priority-4: #666666;   /* 低 - グレー */

  /* Category Colors（カスタム） */
  --color-study: #7C3AED;        /* 勉強 - 紫 */
  --color-lesson: #DB2777;       /* 習い事 - ピンク */
  --color-chore: #0D9488;        /* お手伝い - ティール */

  /* Status Colors */
  --color-success: #058527;      /* 完了 - グリーン */
  --color-warning: #EB8909;      /* 注意 - オレンジ */

  /* Interactive */
  --color-hover: #F5F5F5;        /* ホバー時背景 */
  --color-active: #EBEBEB;       /* アクティブ時背景 */
}
```

---

### タイポグラフィ

```css
/* フォント - Todoist風のシステムフォント */
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Hiragino Sans',
             'Noto Sans JP', sans-serif;

/* サイズ */
--text-xs: 0.75rem;    /* 12px - タイムスタンプ */
--text-sm: 0.8125rem;  /* 13px - 補足情報 */
--text-base: 0.875rem; /* 14px - 本文（Todoistは小さめ） */
--text-lg: 1rem;       /* 16px - 強調 */
--text-xl: 1.25rem;    /* 20px - セクション見出し */
--text-2xl: 1.5rem;    /* 24px - ページタイトル */
--text-4xl: 2.5rem;    /* 40px - 達成時間（大きく表示） */

/* Line Height */
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.75;
```

---

### コンポーネントスタイル（Todoist風）

#### タスクアイテム
```
┌─────────────────────────────────────────────────────┐
│ ○  数学（宿題）                        予定 30分   │
│    └─ 勉強                                         │
└─────────────────────────────────────────────────────┘

完了時:
┌─────────────────────────────────────────────────────┐
│ ✓  数学（宿題）                        実績 35分   │
│    └─ 勉強                             ──────────  │
└─────────────────────────────────────────────────────┘
```

**スタイル特徴**:
- 左側に円形チェックボックス（カテゴリカラーのボーダー）
- ホバー時に薄いグレー背景
- 完了時はテキストに取り消し線 + グレーアウト
- 右側に予定/実績時間

---

#### サイドバーナビゲーション（Todoist風）
```
┌──────────────────┐
│  Kids Schedule   │
├──────────────────┤
│  📊 今日         │ ← アクティブ時は背景色
│  📅 スケジュール  │
│  ✏️ 記録         │
│  📈 週間レポート  │
│  📊 月間レポート  │
├──────────────────┤
│  ⚙️ 設定         │
│  🚪 ログアウト    │
└──────────────────┘
```

**スタイル特徴**:
- 幅: 280px（固定）
- 背景: #FAFAFA
- アクティブ項目: 薄いグレー背景 + 左ボーダー（赤）
- ホバー: 背景色変化

---

#### 追加ボタン（Todoist風）
```
┌─────────────────────────────────────────────────────┐
│  ＋ タスクを追加                                    │
└─────────────────────────────────────────────────────┘
```

**スタイル特徴**:
- テキストリンクスタイル（ボタンではない）
- ホバー時に赤色に変化
- クリックでインライン入力フォームが展開

---

#### 達成時間表示（カスタム：子ども向け大きな表示）
```
┌─────────────────────────────────────────────────────┐
│                                                     │
│              今日のがんばり時間                      │
│                                                     │
│                 2:30                                │
│              ───────────                            │
│              2時間 30分                              │
│                                                     │
│       今日は2時間30分、好きなことができるよ！        │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ 勉強      1:30  ████████████░░░░░░          │   │
│  │ ピアノ    0:45  ████████████████████        │   │
│  │ お手伝い  0:15  ████████████████████        │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

### レスポンシブデザイン

```css
/* ブレークポイント */
--breakpoint-sm: 640px;   /* スマートフォン */
--breakpoint-md: 768px;   /* タブレット（iPad mini） */
--breakpoint-lg: 1024px;  /* タブレット（iPad）・PC */
--breakpoint-xl: 1280px;  /* 大画面 */
```

**レイアウト切り替え**:

| 画面幅 | ナビゲーション | コンテンツ |
|--------|---------------|-----------|
| < 768px | ボトムナビ | フル幅 |
| >= 768px | サイドバー（280px） | 残り幅 |

**iPad（主要デバイス）での表示**:
- 横向き（1024px+）: サイドバー + メインコンテンツ
- 縦向き（768px）: サイドバー + メインコンテンツ（コンパクト）

---

### インタラクション

#### ホバー・フォーカス
- タスク行: 背景 → #F5F5F5
- ボタン: 不透明度変化 or 色変化
- リンク: 赤色（#DC4C3E）に変化

#### アニメーション
- タスク完了: チェックマーク + 取り消し線アニメーション
- リスト追加/削除: フェードイン/アウト
- ページ遷移: なし（即座に切り替え）

#### タッチ対応（子ども向け）
- タップ領域: 最低 44px × 44px
- チェックボックス: 24px → 32px に拡大
- スワイプ: 左スワイプでタスク削除（オプション）

---

### 画面遷移図

```
[ログイン] ──→ [今日（ダッシュボード）]
                    │
    ┌───────────────┼───────────────┐
    ▼               ▼               ▼
[スケジュール]   [記録]         [レポート]
    │                               │
    ▼                           ┌───┴───┐
[スケジュール編集]              ▼       ▼
                            [週間]   [月間]
```

---

### 画面モックアップ

#### 今日（ダッシュボード）
```
┌─────────────────────────────────────────────────────────────┐
│ ☰ Kids Schedule                          太郎 ▼  🔔        │
├──────────────────┬──────────────────────────────────────────┤
│                  │                                          │
│  📊 今日         │   12月7日（土）                          │
│  📅 スケジュール  │                                          │
│  ✏️ 記録         │   ┌────────────────────────────────────┐ │
│  📈 週間         │   │      今日のがんばり時間             │ │
│  📊 月間         │   │                                    │ │
│                  │   │           1:45                     │ │
│                  │   │         1時間 45分                 │ │
│                  │   │                                    │ │
│                  │   │  あと15分で2時間達成！がんばれ！    │ │
│                  │   └────────────────────────────────────┘ │
│                  │                                          │
│                  │   今日のタスク                           │
│                  │   ───────────────────────────────────── │
│                  │   ✓ 数学（宿題）              45分       │
│                  │   ✓ 英語（通信講座）          30分       │
│                  │   ○ ピアノ（練習）            予定30分   │
│                  │   ○ 洗濯物を畳む              予定15分   │
│                  │                                          │
│  ───────────     │   ＋ タスクを追加                        │
│  ⚙️ 設定         │                                          │
└──────────────────┴──────────────────────────────────────────┘
```

---

## セキュリティ設計

### 認証フロー

```
1. ユーザーがメール/パスワードを入力
2. Supabase Authで認証
3. セッショントークン発行
4. クライアントにトークン保存
5. 以降のリクエストにトークン添付
```

### Row Level Security (RLS)

```sql
-- ユーザーは自分のデータのみアクセス可能
alter table user_profiles enable row level security;

create policy "Users can view own profile"
  on user_profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on user_profiles for update
  using (auth.uid() = id);

-- 他のテーブルも同様にRLSを設定
```

### 環境変数

```bash
# .env.local（ローカル開発用）
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Vercel環境変数（本番用）
# Vercel Dashboard → Settings → Environment Variables で設定
```

---

**作成日**: 2025-12-07

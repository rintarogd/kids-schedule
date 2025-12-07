# 実装タスク

**プロジェクト名**: Kids-schedule
**作成日**: 2025-12-07

---

## タスク概要

### 全体の進め方

```
Phase 1: 環境セットアップ + Supabase設定
    ↓
Phase 2: 認証機能
    ↓
Phase 3: 基本UI（レイアウト・ナビゲーション）
    ↓
Phase 4: 週間スケジュール機能
    ↓
Phase 5: 日々の記録機能
    ↓
Phase 6: ダッシュボード（達成時間表示）
    ↓
Phase 7: レポート機能（週間・月間）
    ↓
Phase 8: 仕上げ・デプロイ
```

### 機能と対応するユーザーストーリー

| Phase | 機能 | 対応US |
|-------|------|--------|
| Phase 2 | 認証 | US-1 |
| Phase 4 | 週間スケジュール | US-2 |
| Phase 5 | 日々の記録 | US-3 |
| Phase 6 | ダッシュボード | US-4 |
| Phase 7 | 週間レポート | US-5 |
| Phase 7 | 月間レポート | US-6 |
| Phase 8 | 継続月数 | US-7 |

---

## Phase 1: 環境セットアップ + Supabase設定

### 1.1 Next.jsプロジェクト初期化

**タスク**: Next.js 14 プロジェクトを作成

```bash
npx create-next-app@latest . --typescript --tailwind --app --src-dir --import-alias "@/*"
```

**完了条件**:

- [ ] プロジェクトが生成される
- [ ] `npm run dev` でローカルサーバーが起動する
- [ ] http://localhost:3000 でデフォルトページが表示される

---

### 1.2 必要なパッケージのインストール

**タスク**: Supabase関連パッケージをインストール

```bash
npm install @supabase/supabase-js @supabase/ssr
npm install date-fns  # 日付操作用
```

**完了条件**:

- [ ] パッケージがインストールされる
- [ ] package.json に依存関係が追加される

---

### 1.3 Supabaseプロジェクト作成

**タスク**: Supabaseでプロジェクトを作成

1. https://supabase.com にアクセス
2. 新規プロジェクト作成
3. プロジェクト名: `kids-schedule`
4. リージョン: Northeast Asia (Tokyo)
5. パスワード設定（安全な場所に保管）

**完了条件**:

- [ ] Supabaseプロジェクトが作成される
- [ ] Project URL と anon key を取得

---

### 1.4 環境変数の設定

**タスク**: `.env.local` ファイルを作成

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**完了条件**:

- [ ] `.env.local` ファイルが作成される
- [ ] `.gitignore` に `.env.local` が含まれている

---

### 1.5 Supabaseクライアント設定

**タスク**: Supabaseクライアントの初期化ファイルを作成

**参照**: @specs/design.md のシステムアーキテクチャ

**ファイル構成**:

```
src/
├── lib/
│   └── supabase/
│       ├── client.ts      # ブラウザ用クライアント
│       ├── server.ts      # サーバー用クライアント
│       └── middleware.ts  # ミドルウェア用
```

**完了条件**:

- [ ] Supabaseクライアントが作成される
- [ ] TypeScriptエラーがない

---

### 1.6 データベーステーブル作成

**タスク**: Supabase SQLエディタでテーブルを作成

**参照**: @specs/design.md のテーブル定義

```sql
-- 1. user_profiles テーブル
create table user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  role text not null default 'child',
  start_date date,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 2. task_templates テーブル
create table task_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  category text not null,
  subcategory text not null,
  task_type text,
  default_minutes integer not null default 30,
  is_active boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 3. scheduled_tasks テーブル
create table scheduled_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  template_id uuid references task_templates(id) on delete set null,
  week_start date not null,
  day_of_week integer not null,
  planned_minutes integer not null,
  category text not null,
  subcategory text not null,
  task_type text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 4. daily_records テーブル
create table daily_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  scheduled_task_id uuid references scheduled_tasks(id) on delete cascade,
  record_date date not null,
  start_time time,
  end_time time,
  actual_minutes integer,
  is_completed boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- RLS有効化
alter table user_profiles enable row level security;
alter table task_templates enable row level security;
alter table scheduled_tasks enable row level security;
alter table daily_records enable row level security;

-- RLSポリシー
create policy "Users can view own profile" on user_profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on user_profiles
  for update using (auth.uid() = id);

create policy "Users can insert own profile" on user_profiles
  for insert with check (auth.uid() = id);

create policy "Users can manage own task_templates" on task_templates
  for all using (auth.uid() = user_id);

create policy "Users can manage own scheduled_tasks" on scheduled_tasks
  for all using (auth.uid() = user_id);

create policy "Users can manage own daily_records" on daily_records
  for all using (auth.uid() = user_id);
```

**完了条件**:

- [ ] 4つのテーブルが作成される
- [ ] RLSポリシーが設定される

---

### 1.7 型定義ファイルの作成

**タスク**: `src/types/index.ts` を作成

**参照**: @specs/design.md のTypeScript型定義

**完了条件**:

- [ ] 型定義ファイルが作成される
- [ ] TypeScriptエラーがない

---

## Phase 2: 認証機能

### 2.1 ログインページ作成

**タスク**: `src/app/login/page.tsx` を作成

**参照**:

- @specs/requirements.md US-1
- @specs/design.md ページ構成

**機能**:

- メールアドレス入力フィールド
- パスワード入力フィールド
- ログインボタン
- サインアップへのリンク
- エラーメッセージ表示

**完了条件**:

- [ ] ログインページが表示される
- [ ] フォームが動作する
- [ ] Todoist風のシンプルなデザイン

---

### 2.2 サインアップページ作成

**タスク**: `src/app/signup/page.tsx` を作成

**機能**:

- メールアドレス入力
- パスワード入力
- 表示名入力
- 役割選択（子ども / 親）
- サインアップボタン

**完了条件**:

- [ ] サインアップページが表示される
- [ ] ユーザー登録ができる
- [ ] user_profiles にレコードが作成される

---

### 2.3 認証状態管理

**タスク**: 認証コンテキストを作成

**ファイル**: `src/contexts/AuthContext.tsx`

**機能**:

- ログイン状態の管理
- ユーザー情報の提供
- ログアウト機能

**完了条件**:

- [ ] 認証コンテキストが作成される
- [ ] アプリ全体で認証状態を参照できる

---

### 2.4 ミドルウェア（認証保護）

**タスク**: `src/middleware.ts` を作成

**機能**:

- 未認証ユーザーを /login にリダイレクト
- 認証済みユーザーを /dashboard にリダイレクト（/login アクセス時）

**完了条件**:

- [ ] 認証が必要なページが保護される
- [ ] ログイン後に /dashboard に遷移する

---

## Phase 3: 基本UI（レイアウト・ナビゲーション）

### 3.1 共通レイアウト作成

**タスク**: `src/app/(authenticated)/layout.tsx` を作成

**参照**: @specs/design.md のサイドバーナビゲーション

**機能**:

- サイドバー（PC/タブレット）
- ボトムナビ（スマホ）
- ヘッダー（ユーザー名・ログアウト）

**完了条件**:

- [ ] レイアウトが表示される
- [ ] レスポンシブ対応
- [ ] Todoist風のデザイン

---

### 3.2 サイドバーコンポーネント

**タスク**: `src/components/Sidebar.tsx` を作成

**参照**: @specs/design.md のサイドバーナビゲーション

**完了条件**:

- [ ] ナビゲーションリンクが動作する
- [ ] アクティブ状態が表示される
- [ ] 幅280px固定

---

### 3.3 ボトムナビコンポーネント

**タスク**: `src/components/BottomNav.tsx` を作成

**完了条件**:

- [ ] モバイル表示時に表示される
- [ ] タップでページ遷移する

---

### 3.4 ヘッダーコンポーネント

**タスク**: `src/components/Header.tsx` を作成

**完了条件**:

- [ ] ユーザー名が表示される
- [ ] ログアウトボタンが動作する

---

## Phase 4: 週間スケジュール機能

### 4.1 スケジュール一覧ページ

**タスク**: `src/app/(authenticated)/schedule/page.tsx` を作成

**参照**: @specs/requirements.md US-2

**機能**:

- 今週のスケジュール表示
- 曜日ごとのタスク一覧
- 編集ページへのリンク

**完了条件**:

- [ ] 週間スケジュールが表示される
- [ ] 曜日ごとにタスクがグループ化される

---

### 4.2 スケジュール編集ページ

**タスク**: `src/app/(authenticated)/schedule/edit/page.tsx` を作成

**機能**:

- タスクの追加
- カテゴリ・サブカテゴリ選択
- 予定時間の設定
- タスクの削除

**完了条件**:

- [ ] タスクを追加できる
- [ ] タスクを削除できる
- [ ] データベースに保存される

---

### 4.3 タスクフォームコンポーネント

**タスク**: `src/components/TaskForm.tsx` を作成

**参照**: @specs/design.md のタスクカテゴリ

**機能**:

- カテゴリ選択（勉強/習い事/お手伝い）
- サブカテゴリ選択（教科/習い事種類等）
- タスク種別選択（宿題/通信講座等）
- 予定時間入力

**完了条件**:

- [ ] フォームが動作する
- [ ] デフォルト時間が設定される
- [ ] バリデーションが動作する

---

### 4.4 週間グリッドコンポーネント

**タスク**: `src/components/WeeklyScheduleGrid.tsx` を作成

**完了条件**:

- [ ] 7日間のグリッドが表示される
- [ ] 各曜日にタスクが表示される

---

## Phase 5: 日々の記録機能

### 5.1 記録ページ

**タスク**: `src/app/(authenticated)/record/page.tsx` を作成

**参照**: @specs/requirements.md US-3

**機能**:

- 今日のタスク一覧
- 開始/終了ボタン
- 時刻手動入力

**完了条件**:

- [ ] 今日のタスクが表示される
- [ ] 開始/終了を記録できる

---

### 5.2 タスクレコーダーコンポーネント

**タスク**: `src/components/TaskRecorder.tsx` を作成

**参照**: @specs/design.md のTaskRecorder

**機能**:

- 「開始する」ボタン
- 「終了する」ボタン
- 経過時間表示
- 時刻手動入力オプション

**完了条件**:

- [ ] ワンタップで記録開始
- [ ] 実績時間が自動計算される
- [ ] 完了状態が視覚的にわかる

---

### 5.3 タスクアイテムコンポーネント

**タスク**: `src/components/TaskItem.tsx` を作成

**参照**: @specs/design.md のタスクアイテム

**完了条件**:

- [ ] Todoist風のチェックボックス
- [ ] カテゴリカラーのボーダー
- [ ] 完了時の取り消し線

---

## Phase 6: ダッシュボード（達成時間表示）

### 6.1 ダッシュボードページ

**タスク**: `src/app/(authenticated)/dashboard/page.tsx` を作成

**参照**:

- @specs/requirements.md US-4
- @specs/design.md 画面モックアップ

**機能**:

- 今日の達成時間（大きく表示）
- 励ましメッセージ
- 今日のタスク一覧
- カテゴリ別内訳

**完了条件**:

- [ ] 達成時間が大きく表示される
- [ ] メッセージが表示される
- [ ] タスク一覧が表示される

---

### 6.2 達成時間表示コンポーネント

**タスク**: `src/components/TodayAchievement.tsx` を作成

**参照**: @specs/design.md の達成時間表示

**完了条件**:

- [ ] 時間が大きく表示される（40px）
- [ ] 励ましメッセージが表示される
- [ ] カテゴリ別プログレスバー

---

### 6.3 タスク内訳コンポーネント

**タスク**: `src/components/TaskBreakdown.tsx` を作成

**完了条件**:

- [ ] カテゴリごとの時間が表示される
- [ ] プログレスバーで視覚化

---

## Phase 7: レポート機能

### 7.1 週間レポートページ

**タスク**: `src/app/(authenticated)/weekly/page.tsx` を作成

**参照**: @specs/requirements.md US-5

**機能**:

- 週間カレンダー表示
- 予定 vs 実績の比較
- 達成率表示

**完了条件**:

- [ ] 週間の予定と実績が表示される
- [ ] 達成率が計算・表示される

---

### 7.2 週間比較コンポーネント

**タスク**: `src/components/WeeklyComparison.tsx` を作成

**完了条件**:

- [ ] 曜日ごとの比較が表示される
- [ ] 達成/未達成が視覚的にわかる

---

### 7.3 月間レポートページ

**タスク**: `src/app/(authenticated)/monthly/page.tsx` を作成

**参照**: @specs/requirements.md US-6

**機能**:

- 月間カレンダー表示
- 日ごとの達成状況
- 月間サマリー

**完了条件**:

- [ ] 月間カレンダーが表示される
- [ ] 達成状況がヒートマップ的に表示される

---

### 7.4 月間カレンダーコンポーネント

**タスク**: `src/components/MonthlyCalendar.tsx` を作成

**完了条件**:

- [ ] カレンダー形式で表示される
- [ ] 日付をクリックで詳細表示

---

## Phase 8: 仕上げ・デプロイ

### 8.1 継続月数表示（オプション）

**タスク**: 継続月数をダッシュボードに追加

**参照**: @specs/requirements.md US-7

**完了条件**:

- [ ] 継続月数が計算される
- [ ] ダッシュボードに表示される

---

### 8.2 UIブラッシュアップ

**タスク**: 全体的なUI調整

- Todoist風デザインの統一
- レスポンシブ対応の確認
- タッチ操作の最適化

**完了条件**:

- [ ] 全ページでデザインが統一されている
- [ ] iPad での操作が快適

---

### 8.3 エラーハンドリング

**タスク**: エラー処理の追加

- API エラー時のメッセージ表示
- ローディング状態の表示
- 空状態の表示

**完了条件**:

- [ ] エラー時に適切なメッセージが表示される
- [ ] ローディング中の表示がある

---

### 8.4 Vercel デプロイ

**タスク**: Vercel にデプロイ

1. GitHub にプッシュ
2. Vercel でプロジェクトをインポート
3. 環境変数を設定
4. デプロイ

**完了条件**:

- [ ] Vercel にデプロイされる
- [ ] 公開 URL でアクセスできる
- [ ] 認証が動作する

---

### 8.5 最終確認

**タスク**: 全機能の動作確認

**確認項目**:

- [ ] ユーザー登録・ログインができる
- [ ] 週間スケジュールを作成できる
- [ ] タスクの開始・終了を記録できる
- [ ] 今日の達成時間が表示される
- [ ] 週間レポートが表示される
- [ ] 月間レポートが表示される
- [ ] iPad で快適に操作できる

---

## 全体の完了条件

- [ ] すべてのPhaseが完了している
- [ ] @specs/requirements.md のすべての受け入れ基準を満たす
- [ ] Vercelにデプロイされ、公開URLでアクセス可能
- [ ] 子ども（小5・中1）が自分で操作できる

---

## クイックリファレンス

### 実装の順序

```
1. npm create → Supabase設定 → テーブル作成
2. 認証（ログイン・サインアップ）
3. レイアウト（サイドバー・ナビ）
4. スケジュール作成
5. 記録機能
6. ダッシュボード
7. レポート
8. デプロイ
```

### よく使うコマンド

```bash
# 開発サーバー起動
npm run dev

# ビルド
npm run build

# 型チェック
npx tsc --noEmit
```

### 参照ドキュメント

- @specs/requirements.md - 要件定義
- @specs/design.md - 設計書

---

**作成日**: 2025-12-07

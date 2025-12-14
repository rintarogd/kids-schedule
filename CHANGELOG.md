# 更新履歴 (CHANGELOG)

このファイルはプロジェクトの主要な変更履歴を記録しています。

---

## みんなへのおしらせ

### 2024年12月14日のアップデート

**あたらしくなったところ：**

- 🎨 ボタンやメニューにわかりやすいアイコンがついたよ
- 🔵 土曜日は青い文字、🔴 日曜日は赤い文字になったよ
- ✏️ 「その他」をえらんだときに、なにをやるか書けるようになったよ
- ⏱️ 記録した時間をあとから修正できるようになったよ

---

## 開発者向け詳細

---

## [2024-12-14] UI改善アップデート

**コミット**: 39c3bd2
**前回のデプロイ**: d4e8269 (Rename app to じかんバンク)

### 新機能

#### アイコンライブラリ導入
- **Lucide React** アイコンライブラリを導入（MIT license, tree-shakeable）
- 全コンポーネントにシンプルなアイコンを適用

#### 適用されたアイコン一覧
| コンポーネント | アイコン |
|---------------|---------|
| TaskRecorder | Play, Square, RotateCcw, Check, Pencil, Save, X, Clock |
| TodayAchievement | Clock, BookOpen, Music, Sparkles |
| Sidebar | LayoutDashboard, Calendar, BarChart2, TrendingUp, LogOut, Clock |
| BottomNav | LayoutDashboard, Calendar, BarChart2, TrendingUp |
| ChildSwitcher | ChevronDown, UserPlus, Check |
| AddChildModal | UserPlus, X, AlertCircle |
| TaskItem | Check |
| Header | Clock（じかんバンクロゴ） |

### UI改善

#### ロゴアイコン
- 「じかんバンク」ロゴに時計アイコン（Clock）を追加
- Header.tsx と Sidebar.tsx の両方に適用

#### 週末の色分け表示
- **土曜日**: 青文字（`text-blue-500` = #3B82F6）
- **日曜日**: 赤文字（`text-[#DC4C3E]`）

適用箇所:
- スケジュール一覧（schedule/page.tsx）
- スケジュール編集（schedule/edit/page.tsx）
- 週間レポート（weekly/page.tsx）
- 月間レポート（monthly/page.tsx）- カレンダーの曜日ヘッダー
- ヘッダーの日付表示（土日はカッコ部分も含めて色変更）

#### 「その他」カスタムテキスト入力
- 勉強・お手伝いカテゴリで「その他」を選択した際にカスタムテキスト入力フィールドを表示
- 30文字まで入力可能
- 保存時は「その他: {入力テキスト}」形式で保存

#### ボタンラベル改善
- TaskRecorder の編集関連ボタンにテキストラベルを追加
  - 「修正」ボタン: 鉛筆アイコン + "修正"
  - 「保存」ボタン: フロッピーアイコン + "保存"
  - 「取消」ボタン: Xアイコン + "取消"

### ファイル変更一覧

| ファイル | 変更内容 |
|---------|---------|
| package.json | lucide-react 追加 |
| src/lib/weekendColors.ts | 新規作成 - 週末色判定ユーティリティ |
| src/components/Header.tsx | ロゴアイコン、日付の土日色分け |
| src/components/Sidebar.tsx | ロゴアイコン、ナビゲーションアイコン |
| src/components/BottomNav.tsx | ナビゲーションアイコン |
| src/components/TaskRecorder.tsx | 各種アイコン、ボタンラベル |
| src/components/TodayAchievement.tsx | カテゴリアイコン |
| src/components/ChildSwitcher.tsx | ドロップダウンアイコン |
| src/components/AddChildModal.tsx | モーダルアイコン |
| src/components/TaskItem.tsx | チェックアイコン |
| src/components/TaskForm.tsx | 「その他」カスタムテキスト入力 |
| src/app/(authenticated)/schedule/page.tsx | 週末色分け |
| src/app/(authenticated)/schedule/edit/page.tsx | 週末色分け |
| src/app/(authenticated)/weekly/page.tsx | 週末色分け |
| src/app/(authenticated)/monthly/page.tsx | 週末色分け（曜日ヘッダー） |

### 技術的な変更

- `src/lib/weekendColors.ts` に3つのヘルパー関数を追加:
  - `getWeekdayColorClass(mondayIndex)` - 月曜始まりインデックスから色クラス取得
  - `getWeekdayColorClassFromDate(date)` - Date オブジェクトから色クラス取得
  - `getWeekdayColorClassFromLabel(label)` - 曜日ラベル（月、火...）から色クラス取得

---

## [2024-12-14] アプリ名変更

**コミット**: d4e8269

### 変更内容
- アプリ名を「じかんバンク」に変更

---

## [過去の更新]

詳細は Git ログを参照してください:
```bash
git log --oneline
```

# Skills ディレクトリ

このディレクトリには、Claude Code で使用する **Skills** が格納されています。

## Skills とは？

**Skills** は、特定のタスクに必要な専門知識を、必要な時だけ動的に読み込む仕組みです。

### メリット

- ✅ **コンテキスト節約**: 無駄なトークンを使わず、必要な知識だけを読み込む
- ✅ **タスク別最適化**: フロントエンド開発時はデザインガイド、API開発時はセキュリティガイドなど
- ✅ **再利用可能**: 一度作成すれば、複数のプロジェクトで使い回せる
- ✅ **カスタマイズ可能**: プロジェクトや組織のルールに合わせて調整できる

### Skills の仕組み

```
タスク発生
    ↓
Claude Code が関連する Skill を自動検索
    ↓
必要な Skill を読み込み
    ↓
専門知識を活用してタスク実行
```

例：
- **フロントエンド開発**時 → `frontend-design.md` を自動読み込み
- **API 開発**時 → `api-design.md` を自動読み込み（もし存在すれば）

---

## 現在利用可能な Skills

### 1. Frontend Design Skill

**ファイル**: `frontend-design.md`

**目的**: AI が生成するフロントエンドのデザイン品質を向上させる

**改善される要素**:
- **Typography（フォント）**: Inter → より特徴的なフォント
- **Color & Theme（色とテーマ）**: 単色 → 統一感のある配色
- **Motion（動き）**: 静的 → アニメーション付き
- **Backgrounds（背景）**: ベタ塗り → グラデーションやパターン

**使用タイミング**:
- ランディングページ作成
- React コンポーネント実装
- UI デザイン改善
- フロントエンド全般

---

## Skills の使い方

### 自動適用（推奨）

`.claude/skills/` ディレクトリに Skill ファイルがあれば、Claude Code が自動的に適切なタイミングで読み込みます。

**何もしなくてOK！**

### 手動での指定

特定の Skill を明示的に使いたい場合：

```
「Frontend Design Skill を使って、モダンなランディングページを作ってください」
```

---

## 新しい Skill の追加方法

### 1. Skill ファイルを作成

このディレクトリに `.md` ファイルを作成します。

```bash
touch .claude/skills/my-custom-skill.md
```

### 2. Skill の内容を記述

```markdown
# My Custom Skill

## 概要
この Skill の目的と使用場面

## ガイドライン
具体的な指示やルール

## 実装例
コード例やベストプラクティス
```

### 3. Claude Code で使用

次回から、関連するタスクで自動的に参照されます。

---

## Skill のカスタマイズ

既存の Skill をカスタマイズすることも可能です。

### 例：Frontend Design Skill に会社のブランドカラーを追加

`frontend-design.md` を編集：

```markdown
## ブランドカラー（カスタマイズ）
- Primary: #FF6B6B
- Secondary: #4ECDC4
- Accent: #FFE66D

これらのカラーを優先的に使用してください。
```

---

## Skills の管理

### バージョン管理

Skills は Git で管理できます：

```bash
git add .claude/skills/
git commit -m "feat: Add custom skill for API design"
```

### チームでの共有

1. Skills をリポジトリに含める
2. チームメンバーが clone すると自動的に利用可能
3. 組織全体で統一されたガイドラインを適用できる

---

## よくある質問

### Q1: Skill はいつ読み込まれますか？

A: Claude Code がタスクの内容を解析し、関連する Skill を自動的に検索・読み込みます。例えば、「ランディングページを作って」という指示があれば、`frontend-design.md` が読み込まれる可能性が高いです。

### Q2: 複数の Skill を同時に使えますか？

A: はい。関連するすべての Skill が同時に適用されます。例えば、`frontend-design.md` と `accessibility.md` の両方が存在する場合、どちらも参照されます。

### Q3: Skill を無効化するには？

A: ファイル名を変更（例: `frontend-design.md.disabled`）するか、ファイルを削除してください。

### Q4: 他のプロジェクトでも使えますか？

A: はい！`.claude/skills/` ディレクトリごとコピーすれば、他のプロジェクトでも使えます。また、グローバルに設定することも可能です（詳細は Claude Code ドキュメントを参照）。

---

## 参考リソース

- [Anthropic Blog: Skills](https://www.anthropic.com/news/skills)
- [Claude Code Documentation](https://docs.claude.com/)
- [Improving Frontend Design through Skills](https://claude.com/blog/improving-frontend-design-through-skills)

---

**作成日**: 2025-11-13
**更新日**: 2025-11-13

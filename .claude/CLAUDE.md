# プロジェクト概要

## プロジェクト名
[プロジェクト名を記入]

## 目的
[このプロジェクトの目的を記入]

## 対象ユーザー
[誰が使うアプリか記入]

---

# 技術スタック

## フロントエンド
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS

## データ管理
- [使用する場合は記入: localStorage / Supabase / Firebase 等]

## デプロイ
- Vercel

---

# 主要機能

## 必須機能
1. [機能1を記入]
2. [機能2を記入]
3. [機能3を記入]

## 発展機能（時間があれば）
- [発展機能1]
- [発展機能2]

---

# 開発方針

## Spec駆動開発
このプロジェクトは **Spec駆動開発** で進めます。

### フロー
```
1. SPEC.md を作成・更新
2. Claude Code に実装を依頼
3. ローカルで動作確認
4. Git commit
5. 必要に応じて 1 に戻る
```

### カスタムコマンド
以下のコマンドを活用してください:
- `/spec` - Spec生成・更新支援
- `/commit` - コミット支援（適切なメッセージ生成）
- `/deploy` - デプロイ前のチェック

---

# セキュリティ

## 環境変数管理

### ローカル開発
`.env.local` ファイルに秘密情報を記載:
```bash
# .env.local
NEXT_PUBLIC_API_URL=https://api.example.com
API_SECRET_KEY=your-secret-key
```

### 本番環境
Vercel Dashboard → Settings → Environment Variables で設定

## .gitignore 必須項目
```
.env
.env.local
node_modules/
.next/
.vercel/
```

**⚠️ 重要**: APIキーやパスワードは絶対にコードに直接書かない！

---

# Git運用

## commit のタイミング
- 1つの機能が完成したとき
- 動作確認が取れたとき

## commit メッセージ
```
prefix: 何をしたか簡潔に

prefix:
- feat: 新機能追加
- fix: バグ修正
- style: デザイン変更
- refactor: コード整理
```

## push のタイミング
- デプロイしたいとき
- 1日の作業終了時

---

# デプロイフロー

```
ローカル開発
  ↓ git add / commit
Git管理
  ↓ git push
GitHub
  ↓ 自動連携
Vercel（自動デプロイ）
  ↓
公開URL
```

---

# 開発ログ

## 2025-XX-XX
- プロジェクト開始
- 基本的なディレクトリ構成を作成

## 2025-XX-XX
- [機能1]を実装
- [機能2]を実装

---

# つまずきポイントメモ

## 問題
[遭遇した問題を記入]

## 解決方法
[どうやって解決したかを記入]

---

# 参考資料

## 外部ファイル
- @SPEC.md - 詳細仕様書
- @README.md - プロジェクト概要

## 参考URL
- [必要に応じて追加]

---

# Claude Code への指示

このプロジェクトで開発を進める際は、以下を意識してください:

1. **Spec駆動開発**: 必ず @SPEC.md を参照して実装
2. **セキュリティ**: 環境変数は `.env.local` を使用
3. **Git管理**: 適切なタイミングでcommit
4. **コード品質**: TypeScript の型定義を活用
5. **レスポンシブ**: PC・タブレット・スマホ対応

疑問点があれば、いつでも質問してください。

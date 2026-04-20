# Vercelインシデント対応記録（2026-04-20）

## 背景

### Vercelセキュリティインシデント

- 2026年4月、VercelのCEO Guillermo Rauchが発表したセキュリティインシデント
- Context.aiの侵害を起点にVercel従業員のGoogle Workspaceが乗っ取られ、Vercel環境内にアクセスされた
- **攻撃の核心**: Sensitiveフラグが付いていないenvironment variableが列挙された
- 影響範囲は限定的とVercelは発表したが、影響顧客リストは非公開

### 本アプリ (kids-schedule) の状況

- VercelにデプロイされたNext.js + Supabaseアプリ
- 利用者3名（家族）、実データあり
- Vercel Hobbyプラン（Audit Logエクスポート不可）
- 2025-12-07作成以降、env varは全て**非Sensitive**の状態で4ヶ月間Vercelに保管されていた
- **つまり今回のインシデントで漏洩している可能性あり**

## 実施した対応

### 1. Vercelアカウント設定のハードニング

- [x] Team Settings → Security & Privacy
  - **Enforce Sensitive Environment Variables** を Enable
  - 今後追加するenv varは自動でSensitive扱い
- [x] Team Settings → Data Sharing
  - **AIトレーニングへのデータ共有を Opt-out**
- [x] Team Activity Log の目視監査
  - 2025-12-16以降の操作履歴に不審な痕跡なし（全て自分のデプロイ）

### 2. env varの棚卸し

対象プロジェクト:
- `kids-schedule` → Supabase/Postgres系 16個
- `hello-world-template` → env varなし

アプリが実際に使用しているキーをコード調査で特定:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`（レガシー、最優先でローテ対象）
- `SUPABASE_SERVICE_ROLE_KEY`（レガシー、最危険）

### 3. Supabaseキーのローテ戦略決定

初期案: Legacy JWT Secret をrotate（全ユーザー強制ログアウト）
↓ Supabase自身が非推奨
採用案: **新API key体系（publishable/secret）への移行**

理由:
- Zero-downtime, reversible change（Supabase公式推奨）
- Users remain signed in（家族3人ログアウト回避）
- Multiple revocable keys + audit log対応
- 新キーのenv var (`SUPABASE_SECRET_KEY`, `SUPABASE_PUBLISHABLE_KEY`) は既にVercelに存在

### 4. コード修正（5ファイル）

レガシーキー参照を新キーに置換:

| ファイル | 変更内容 |
|---|---|
| `src/lib/supabase/client.ts` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` |
| `src/lib/supabase/server.ts` | 同上 |
| `src/lib/supabase/middleware.ts` | 同上 |
| `src/app/api/children/route.ts` | `SUPABASE_SERVICE_ROLE_KEY` → `SUPABASE_SECRET_KEY` |
| `src/app/api/scheduled-tasks/route.ts` | 同上（2箇所） |

コミット: `5c99995 security: SupabaseキーをレガシーからNew API keysに移行`

### 5. Supabaseで新キー発行

- Publishable key `rotated_2026_04_20` を新規作成
- Secret key `rotated_2026_04_20` を新規作成
- 両方とも `sb_publishable_*` / `sb_secret_*` 形式

### 6. Vercel env var更新（自動sync確認）

- Supabase-Vercel Integrationが**自動で新キーを同期**
- Vercel env varは `sb_publishable_a*` / `sb_secret_7fqZOg*` を参照する状態に更新済み
- 「10分前」のタイムスタンプで全Supabase系env varが更新されていることを確認

### 7. 本番デプロイ

- `main`ブランチにpush → Vercel自動デプロイ
- ビルド32秒 + デプロイ合計42秒で完了
- URL: https://kids-schedule-seven.vercel.app
- 動作確認: ログイン・タスク追加ともにOK

### 8. 本番動作確認（新キー体系）

- ✅ ログイン（`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` 経由）
- ✅ タスク追加（`SUPABASE_SECRET_KEY` 経由のAPIルート）

### 9. レガシーキーの無効化（核心対応）

- **Supabase → API Keys → Legacy anon, service_role API keys タブ**
- 「**Disable JWT-based API keys**」を実行
- ダイアログの確認文言: "This disables API keys when used in the apikey header. They remain valid as a JWT."
  - → **APIキーとしては無効化**
  - → **JWTとしては有効** = 家族3人のログインセッションは維持（再ログイン不要）
- 実行後の本番動作確認もOK

### 10. 旧 default publishable/secret を Delete

- 両方とも「過去24時間未使用」とダイアログに表示 = 統合は既に新キー参照
- `default` と入力して確認 → 削除実行
- 削除後、Vercel統合が再sync（29秒前更新を確認）
- `rotated_2026_04_20` のみが有効な状態に

## 最終状態

### Supabase
- ✅ 新API keys（publishable/secret）`rotated_2026_04_20` のみ存在
- ✅ 旧default publishable/secret 削除済み
- ✅ Legacy anon/service_role keys 無効化済み（API keyとして）
- ℹ️ Legacy JWT Secret はそのまま（auth JWT生成に使用中、rotate非推奨）

### Vercel
- ✅ すべてのSupabase系env var が新形式の有効な値を参照
- ✅ `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: `sb_publishable_a*`
- ✅ `SUPABASE_SECRET_KEY`: `sb_secret_7fqZOg*`
- ℹ️ 旧名env var（`NEXT_PUBLIC_SUPABASE_ANON_KEY` 等）は**値が死んだJWTのまま残存**（統合管理下のため手動削除不可、実害なし）

### コード
- ✅ すべてのSupabaseキー参照が新形式に統一
- ✅ コミット: `5c99995 security: SupabaseキーをレガシーからNew API keysに移行`

## 残タスク（優先度低、任意）

- [ ] `.env.example` と `.env.local` の env var 名更新（ローカル開発時のみ必要）
- [ ] 未使用env varのクリーンアップ（統合管理のため現状では困難）:
  - `SUPABASE_ANON_KEY`（重複）
  - `SUPABASE_URL`（重複、`NEXT_PUBLIC_` 版のみ使用）
  - `POSTGRES_*` 7個（Prisma等未使用）
  - `SUPABASE_JWT_SECRET`（コード未参照）
  - → これらは統合Disconnect＋再設定しないと削除不可。実害がないので見送り判断

## 既知の限界

### Sensitive化できなかった理由

- env varは Supabase-Vercel Storage Integration で自動管理されている
- 統合管理下のenv varは**Sensitiveフラグを立てられない仕様**
- 統合をDisconnectすれば可能だが、再設定の手間が大きいため見送り
- 結果: **次回Vercelが同様の侵害を受けた場合、同じ形で漏洩する可能性は残る**

### 採用しなかった選択肢

- **統合Disconnect + 手動管理 + Sensitive化**: 作業量過大、家族3人利用には過剰
- **Legacy JWT Secret Rotate**: Supabase非推奨、ダウンタイム発生
- **何もしない**: 漏洩キーが生き続けるため却下

## 学び

### システム観点

1. **Vercel Hobbyの監査ログ限界**: Audit Logエクスポート不可のため、侵害の有無を事後に確認できない
2. **Supabase-Vercel Integrationのトレードオフ**: 自動管理は便利だが、Sensitiveフラグが立てられない
3. **非エンジニアでもローテは可能**: Supabase側の新API key体系なら、Zero-downtimeでキー入れ替えできる

### 運用観点

1. **事前バックアップ習慣**: 重要アプリはDB/env varの事前スナップショット
2. **キーの命名規則**: `default`のような名前だと何用か不明。`rotated_YYYY_MM_DD`のように命名すると履歴が追いやすい
3. **コード側でのenv var名選択**: `NEXT_PUBLIC_SUPABASE_ANON_KEY` のようなレガシー名より、新しい `PUBLISHABLE_KEY` を最初から採用するとrotate時の負担減

## 参考リンク

- [Vercel April 2026 Security Bulletin](https://vercel.com/kb/bulletin/vercel-april-2026-security-incident)
- [Supabase New API Keys Documentation](https://supabase.com/docs/guides/api/api-keys)

---

**記録日**: 2026-04-20
**対応者**: rintarogd (Sakai)

# Task Manager Frontend

このリポジトリは `Next.js 16 + React 19 + App Router + Tailwind CSS 4` で構築したタスク管理フロントエンドです。

バックエンドは別実装を想定しており、この README では、現在のフロントエンドがどのような API とデータを前提にしているかを、バックエンド実装用の仕様書としてまとめます。

## 概要

- UI は Notion 風の 2 列カンバンです
- 列は `未着手` と `完了` の 2 つです
- 列の振り分けは `isComplete` で行います
- 画面上で以下の CRUD 操作に対応しています
- 一覧取得
- 新規作成
- 更新
- 削除
- 完了・未完了の切り替え

現在の実装では、フロントエンド側で複雑な状態管理や DnD は入れていません。バックエンドと接続して基本 CRUD が成立することを優先しています。

## 画面仕様

トップページ `/` に単一画面のタスクボードを表示します。

### 列構成

- `未着手`: `isComplete === false` のタスクを表示
- `完了`: `isComplete === true` のタスクを表示

### カード表示項目

- タイトル
- 説明
- 期限
- 期限状態バッジ
- 編集ボタン
- 完了切り替えボタン

### ソート順

- 列内では `dueDate` 昇順で並びます
- `dueDate` がないタスクは後ろに並びます
- `dueDate` が両方ない場合は `id` 昇順です

このため、バックエンドから返す `dueDate` は比較しやすい一貫した文字列形式で返すのが安全です。

## データモデル

フロントエンドで使用している型は以下です。

```ts
export interface Task {
  id: number;
  title: string;
  description?: string;
  dueDate?: string;
  isComplete: boolean;
}
```

### 各項目の意味

- `id`: 数値 ID
- `title`: 必須
- `description`: 任意
- `dueDate`: 任意
- `isComplete`: 必須。`true` で完了列、`false` で未着手列に表示

### `dueDate` の取り扱い

フロントエンドでは `input[type="date"]` を使っているため、送信時は基本的に `YYYY-MM-DD` の文字列になります。

受信側は次のどちらでも扱えます。

- `YYYY-MM-DD`
- ISO 8601 形式の日時文字列

ただし、編集時には先頭 10 文字を日付として再利用するため、バックエンドから返す値は以下のいずれかを推奨します。

- `2026-04-24`
- `2026-04-24T00:00:00`
- `2026-04-24T00:00:00Z`

タイムゾーン変換による日付ズレを避けたい場合は、日付のみ文字列で返す運用が最も安全です。

## API ベース URL

フロントエンドは以下の環境変数を見ます。

```bash
NEXT_PUBLIC_API_BASE=http://localhost:5000
```

未設定時は `http://localhost:5000` を使用します。

## API 仕様

フロントエンドで利用する API は以下です。

### 1. タスク一覧取得

- Method: `GET`
- Path: `/tasks`

期待レスポンス:

```json
[
  {
    "id": 1,
    "title": "来週のデモ資料を仕上げる",
    "description": "営業向けに3ページ追加する",
    "dueDate": "2026-04-30",
    "isComplete": false
  }
]
```

要件:

- `200 OK` で配列を返すこと
- 空の場合も `[]` を返すこと

### 2. タスク詳細取得

- Method: `GET`
- Path: `/tasks/{id}`

期待レスポンス:

```json
{
  "id": 1,
  "title": "来週のデモ資料を仕上げる",
  "description": "営業向けに3ページ追加する",
  "dueDate": "2026-04-30",
  "isComplete": false
}
```

補足:

- 現在の UI では直接は使っていません
- ただし `lib/api.ts` には実装済みなので、将来拡張を考えると用意しておくのが自然です

### 3. タスク作成

- Method: `POST`
- Path: `/tasks`

期待リクエストボディ:

```json
{
  "title": "来週のデモ資料を仕上げる",
  "description": "営業向けに3ページ追加する",
  "dueDate": "2026-04-30",
  "isComplete": false
}
```

期待レスポンス:

```json
{
  "id": 1,
  "title": "来週のデモ資料を仕上げる",
  "description": "営業向けに3ページ追加する",
  "dueDate": "2026-04-30",
  "isComplete": false
}
```

要件:

- `201 Created` 推奨
- 作成済みタスク JSON を返すこと
- `title` は必須として扱うこと

### 4. タスク更新

- Method: `PUT`
- Path: `/tasks/{id}`

期待リクエストボディ:

```json
{
  "title": "来週のデモ資料を仕上げる",
  "description": "営業向けに3ページ追加する",
  "dueDate": "2026-04-30",
  "isComplete": true
}
```

許容レスポンス:

- `200 OK` + 更新後タスク JSON
- または `204 No Content`

補足:

- フロント側はどちらにも対応しています
- 完了切り替えもこの API を使います
- 部分更新ではなく全項目送信です

### 5. タスク削除

- Method: `DELETE`
- Path: `/tasks/{id}`

許容レスポンス:

- `200 OK`
- または `204 No Content`

補足:

- レスポンスボディは不要です

## エラー応答

フロントエンドは `2xx` 以外をエラーとして扱います。

エラー時はレスポンス本文からメッセージを抽出しようとします。以下のような JSON を返すと、そのまま UI に表示されます。

```json
{
  "message": "title は必須です。"
}
```

以下のキーを優先順で参照します。

- `message`
- `title`
- `error`

JSON でない場合は、レスポンスのプレーンテキスト本文をそのまま表示します。

## UI からの操作と API 呼び出し対応

### 初回表示

- `GET /tasks`
- 取得した配列を `isComplete` で 2 列に分割して表示

### 新規タスク追加

- サイドパネルで入力
- `POST /tasks`
- 成功後に `GET /tasks` で再取得

### 既存タスク編集

- カードの `編集` ボタンからサイドパネルを開く
- `PUT /tasks/{id}`
- 成功後に `GET /tasks` で再取得

### 完了切り替え

- カード左上の丸ボタンで切り替え
- `PUT /tasks/{id}`
- `isComplete` を反転した全データを送信
- 成功後に `GET /tasks` で再取得

### 削除

- 編集パネル内の `削除する`
- `DELETE /tasks/{id}`
- 成功後に `GET /tasks` で再取得

## バックエンド実装時の推奨事項

### CORS

開発時はフロントエンドが通常 `http://localhost:3000` で動作するため、バックエンドはこのオリジンからのアクセスを許可してください。

想定:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:5000`

### Content-Type

- `POST` と `PUT` は `Content-Type: application/json` で送信します
- JSON ボディを受け取れるようにしてください

### バリデーション

最低限、以下のバリデーションがあると UI と整合します。

- `title` は必須
- `title` は空白のみ不可
- `description` は任意
- `dueDate` は任意
- `isComplete` は必須

### 日付形式

フロント側は日付入力との相性上、`dueDate` を文字列としてそのまま扱っています。バックエンド内部で `DateTime` を使っても問題ありませんが、レスポンスは毎回同じ形式で返してください。

## 実装ファイル

バックエンド実装時に参照すべき主なファイルは以下です。

- `lib/api.ts`: フロントエンドが期待している API 仕様
- `components/task-board.tsx`: UI の挙動と CRUD 呼び出し箇所
- `app/page.tsx`: 画面エントリポイント

## 動作確認

開発サーバー起動:

```bash
npm run dev
```

Lint:

```bash
npm run lint
```

Production build:

```bash
npm run build
```

## 現時点で未対応のもの

- 認証
- ユーザー別タスク管理
- ステータスの多段化
- ドラッグ&ドロップ
- 検索・フィルタ
- ページネーション

そのため、バックエンドもまずは単純な単一ユーザー前提 CRUD として実装すれば十分です。

# Task Manager Frontend

このリポジトリは `Next.js 16 + React 19 + App Router + Tailwind CSS 4` で構築したタスク管理フロントエンドです。

バックエンドは別実装を想定しており、この README では現在のフロントエンドが前提としている API 契約を、ASP.NET Core バックエンド実装用の仕様書としてまとめます。

## 概要

- UI は 2 列カンバンです
- 列は `未着手` と `完了` の 2 つです
- 列の振り分けは `isComplete` で行います
- 画面上で以下の操作に対応しています
- 一覧取得
- 新規作成
- 全項目更新
- 部分更新
- 削除
- 完了・未完了の切り替え

現在の実装では、フロントエンド側で DnD や複雑な検索条件は持たず、バックエンドと接続した基本 CRUD を優先しています。

## 実装上の前提

- API 通信は `lib/api.ts` に集約しています
- 画面状態と再取得は TanStack Query で管理しています
- 成功レスポンスは zod で runtime validation しています
- 入力フォームは zod で submit 時に検証しています
- `PUT` は全項目更新、`PATCH` は部分更新として扱います

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

このため、バックエンドから返す `dueDate` は毎回同じ文字列形式で返してください。

## データモデル

フロントエンドで前提としているタスク型は以下です。

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

### optional 項目の扱い

- `description` と `dueDate` は未設定なら省略してください
- `description: null` と `dueDate: null` はフロントエンドの schema では受け付けません
- 空文字を返すより、省略する方が安全です

ASP.NET Core 側で DTO に nullable プロパティを使う場合は、JSON レスポンスで `null` を出さないように注意してください。

## `dueDate` の方針

`dueDate` は API 契約として `YYYY-MM-DD` 形式の文字列に固定します。

- 送信値: `YYYY-MM-DD`
- レスポンス値: `YYYY-MM-DD`
- 例: `2026-04-30`

日時文字列は使わないでください。

- `2026-04-30T00:00:00`
- `2026-04-30T00:00:00Z`

ASP.NET Core 側では `DateOnly?` で受ける実装を推奨します。

## フロントエンド入力バリデーション

作成・更新フォームでは submit 時に以下を検証します。

- `title` は必須
- `title` は空白のみ不可
- `dueDate` は未設定可
- `dueDate` を送る場合は `YYYY-MM-DD` 形式かつ実在する日付であること
- `isComplete` は必須

バックエンド側も同等のバリデーションを行う前提で実装してください。

## API ベース URL

フロントエンドは以下の環境変数を参照します。

```bash
NEXT_PUBLIC_API_BASE=http://localhost:5000
```

未設定時は `http://localhost:5000` を使用します。

`.env.example` に同じ設定を置いています。

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
- 各要素は `Task` 形式であること
- `description` と `dueDate` は未設定なら省略すること

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

- 現在の UI では直接使っていません
- ただし `lib/api.ts` には実装済みです

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

- `201 Created` を推奨
- ただしフロントエンドは任意の `2xx` を受け付けます
- レスポンス本文は必須です
- レスポンス本文は `Task` 形式であること
- `title` は必須
- `dueDate` を受ける場合は `YYYY-MM-DD`

### 4. タスク更新

- Method: `PUT`
- Path: `/tasks/{id}`
- 役割: 全項目更新

期待リクエストボディ:

```json
{
  "title": "来週のデモ資料を仕上げる",
  "description": "営業向けに3ページ追加する",
  "dueDate": "2026-04-30",
  "isComplete": true
}
```

要件:

- `title` と `isComplete` は常に含まれます
- `description` と `dueDate` は未設定なら省略されます
- 部分更新には使いません

許容レスポンス:

- `204 No Content`
- `200 OK` + 空ボディ
- `200 OK` + JSON ボディ

補足:

- フロントエンドはレスポンス本文を利用しません
- ただし `200 OK` で本文を返す場合、本文は JSON にしてください
- `200 OK` + プレーンテキスト本文はフロントエンド側で不正レスポンス扱いになります

### 5. タスク部分更新

- Method: `PATCH`
- Path: `/tasks/{id}`
- 役割: 部分更新

期待リクエストボディ例:

```json
{
  "isComplete": true
}
```

送信可能な項目:

- `title`
- `description`
- `dueDate`
- `isComplete`

要件:

- ボディは部分項目のみでよいです
- 現在の UI では主に完了切り替えに使います
- `dueDate` を送る場合は `YYYY-MM-DD`

許容レスポンス:

- `204 No Content`
- `200 OK` + 空ボディ
- `200 OK` + JSON ボディ

補足:

- フロントエンドはレスポンス本文を利用しません
- `200 OK` で本文を返す場合は JSON にしてください

### 6. タスク削除

- Method: `DELETE`
- Path: `/tasks/{id}`

許容レスポンス:

- `204 No Content`
- `200 OK` + 空ボディ
- `200 OK` + JSON ボディ

補足:

- フロントエンドはレスポンス本文を利用しません
- `200 OK` で本文を返す場合は JSON にしてください

## 成功レスポンスの runtime validation

フロントエンドは成功レスポンスを zod で検証します。

- `GET /tasks`: `Task[]`
- `GET /tasks/{id}`: `Task`
- `POST /tasks`: `Task`

この形式に合わない場合、フロントエンドでは不正レスポンスとして扱います。

特に注意点は以下です。

- `id` は数値
- `isComplete` は真偽値
- `description` と `dueDate` は文字列または省略
- `description: null` や `dueDate: null` は不可

## エラー応答

フロントエンドは `2xx` 以外をエラーとして扱います。

現在の実装では、バックエンドの任意メッセージをそのまま表示するのではなく、HTTP ステータスとエラー種別に応じてフロントエンド側のメッセージへ正規化します。

ただし、バックエンドのエラー JSON としては ASP.NET Core の Problem Details / ValidationProblemDetails 形式を推奨します。

### 推奨するバリデーションエラー形式

`400` または `422` で以下のような JSON を返してください。

```json
{
  "title": "One or more validation errors occurred.",
  "status": 400,
  "errors": {
    "title": ["タイトルは必須です。"]
  }
}
```

補足:

- フロントエンドは `errors` オブジェクトがある `400` / `422` をバリデーションエラーとして扱います
- UI 上の表示文言は主に `入力内容を確認してください。` になります

### 推奨する通常エラー形式

```json
{
  "title": "Task was not found.",
  "detail": "Task 999 does not exist."
}
```

補足:

- `404` は操作によって専用メッセージに置き換える場合があります
- `409` は競合エラーとして扱えます
- `5xx` はサーバーエラーとして扱います

## UI からの操作と API 呼び出し対応

### 初回表示

- `GET /tasks`
- 取得した配列を `isComplete` で 2 列に分割して表示

### 新規タスク追加

- サイドパネルで入力
- フロントエンドで zod バリデーション
- `POST /tasks`
- 成功後に tasks query を invalidate して再取得

### 既存タスク編集

- カードの `編集` ボタンからサイドパネルを開く
- フロントエンドで zod バリデーション
- `PUT /tasks/{id}`
- 成功後に tasks query を invalidate して再取得

### 完了切り替え

- カード左上の丸ボタンで切り替え
- `PATCH /tasks/{id}`
- `isComplete` のみ送信
- 成功後に tasks query を invalidate して再取得

### 削除

- 編集パネル内の `削除する`
- `DELETE /tasks/{id}`
- 成功後に tasks query を invalidate して再取得

## バックエンド実装時の推奨事項

### CORS

開発時はフロントエンドが通常 `http://localhost:3000` で動作するため、バックエンドはこのオリジンからのアクセスを許可してください。

想定:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:5000`

### Content-Type

- `POST` と `PUT` と `PATCH` は `Content-Type: application/json` で送信します
- JSON ボディを受け取れるようにしてください

### JSON シリアライズ

- optional 項目が未設定のときは `null` ではなく省略を推奨します
- 少なくとも `description` と `dueDate` は `null` を返さないでください
- `200 OK` で本文を返す場合は JSON にしてください

### バリデーション

最低限、以下のバリデーションがあると UI と整合します。

- `title` は必須
- `title` は空白のみ不可
- `description` は任意
- `dueDate` は任意
- `dueDate` を受ける場合は `YYYY-MM-DD` の正しい日付
- `isComplete` は必須

### 日付型

バックエンド内部で `DateOnly` または `DateOnly?` を使う実装を推奨します。

レスポンスは毎回 `YYYY-MM-DD` の文字列に揃えてください。

## 実装ファイル

バックエンド実装時に参照しやすい主なファイルは以下です。

- `lib/api.ts`: フロントエンドが期待している API 通信仕様
- `lib/task.ts`: zod schema とタスク入出力型
- `lib/task-form.ts`: フォーム送信時の入力変換とバリデーション
- `lib/task-date.ts`: `dueDate` の表示と並び順の扱い
- `hooks/use-tasks.ts`: 一覧取得と mutation の集約
- `components/task-board.tsx`: 画面全体の操作
- `components/task-sheet.tsx`: 作成・更新フォーム UI

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

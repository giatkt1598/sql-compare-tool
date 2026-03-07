# SQL Comparer

[English](../../README.md) | [Tiếng Việt](../vi/README.md) | 日本語

SQL Comparer は、複数のテストケースを使って、新しい SQL が古い SQL と同じ結果を返すかどうかを検証するための Web ツールです。

## 利用目的

このツールは次のような用途に向いています。

- SQL のリファクタリング
- クエリ移行時の検証
- 旧クエリと新クエリの結果比較
- データ回帰チェック
- 実行時間の比較

## 主な機能

- データベース接続用 `Profile` の管理
- 1つの Profile に対して 2つの SQL ファイルを設定
  - `old.sql`
  - `new.sql`
- `SQL Parameters` の定義
- `Test Case` の作成
- 単体実行と一括実行
- 差分結果の生成
- 実行状態の追跡
  - success
  - failed
  - running
  - error

## 主な概念

### Profile

Profile には以下を保存します。

- データベースプロバイダー
- 接続情報
- 古い SQL ファイルのパス
- 新しい SQL ファイルのパス

### SQL Parameter

SQL Parameter は、テストケースで使う入力スキーマです。例:

- `id`
- `email`
- `enabled`

### Test Case

Test Case には以下を保存します。

- テストケース名
- JSON 形式のパラメータ
- 実行オプション
  - compare in order
  - parallel execution
  - auto run when SQL changes

## クイックスタート

1. Profile を作成する
2. Provider と接続情報を設定する
3. `old.sql` と `new.sql` を指定する
4. SQL Parameters を定義する
5. Test Case を作成する
6. 実行する
7. `Latest Test Case Result` 画面で結果を確認する

## 結果ファイル

各実行の結果は `server/data/results/...` に保存されます。通常は次のファイルが含まれます。

- `old-result.json`
- `new-result.json`
- `diff-result.json`
- `data/parameter.json`
- `data/test-case.json`
- `data/old.sql`
- `data/new.sql`

## 実行方法

### 開発モード

```bash
npm run dev
```

既定の URL:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`
- Swagger: `http://localhost:5000/api-docs`

### build 後に dist から実行

```bash
npm run build
npm run serve
```

## 対応プロバイダー

- SQL Server
- PostgreSQL
- MySQL

## 関連ドキュメント

- [English overview](../../README.md)
- [Hướng dẫn tiếng Việt](../vi/README.md)
- [Documentation index](../README.md)


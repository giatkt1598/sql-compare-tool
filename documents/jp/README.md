# SQL Comparer

[English](../../README.md) | [Tiếng Việt](../vi/README.md) | 日本語

SQL Comparer は、旧 SQL と新 SQL の実行結果を複数のテストケースで比較し、クエリ変更によるデータ差異を検証するための Web ツールです。

本ツールの目的は、SQL を改修した後でも、既存ロジックと同等の結果が維持されているかを効率的に確認できるようにすることです。

## 想定される利用シーン

SQL Comparer は、次のようなケースで有効です。

- SQL のリファクタリング後の結果確認
- クエリロジック変更時の回帰検証
- 本番反映前の旧 SQL / 新 SQL の比較
- 複数の入力パターンによる検証
- SQL の実行時間比較

## 主な機能

- データベース接続用 `Profile` の管理
- 1 つの Profile に対する 2 つの SQL ファイルの管理
  - `old.sql`
  - `new.sql`
- `SQL Parameters` の定義
- `Test Case` の作成と管理
- 単体実行および複数テストケースの一括実行
- 差分結果の生成
- 実行履歴、実行時間、ステータス、エラー内容の記録
- SQL ファイル変更時の自動再実行

## 主要な概念

### 1. Profile

Profile は、1 つの SQL 比較シナリオに必要な設定をまとめた単位です。

通常、以下の情報を保持します。

- データベースプロバイダー
- 接続設定
- 旧 SQL ファイルのパス
- 新 SQL ファイルのパス

言い換えると、Profile は「どの database に対して、どの 2 つの SQL を比較するか」を定義する設定セットです。

### 2. SQL Parameter

SQL Parameter は、Test Case で使用する入力パラメータの定義です。

例:

- `id`
- `email`
- `enabled`

この定義により、テストで使用する入力項目名とデータ型を統一できます。

### 3. Test Case

Test Case は、実際に SQL を実行するための具体的な入力データです。

主に次の情報を持ちます。

- テストケース名
- JSON 形式のパラメータ値
- 実行オプション
  - 行順を考慮して比較するか
  - 旧 SQL と新 SQL を並列実行するか
  - SQL ファイル変更時に自動再実行するか

## 基本的な利用手順

初めて利用する場合は、次の順序で進めるのが分かりやすいです。

1. `Profile` を作成する
2. Provider と接続情報を設定する
3. `old.sql` と `new.sql` を指定する
4. `SQL Parameters` を定義する
5. `Test Case` を作成する
6. テストケースを実行する
7. `Latest Test Case Result` 画面で差分を確認する

## 実行結果の保存先

各実行の結果は、次の配下に保存されます。

`server/data/results/...`

通常は以下のファイルが生成されます。

- `old-result.json`: 旧 SQL の実行結果
- `new-result.json`: 新 SQL の実行結果
- `diff-result.json`: 差分情報
- `data/parameter.json`: 実行時に使用したパラメータ
- `data/test-case.json`: 実行時点の Test Case スナップショット
- `data/old.sql`: 実行時点の旧 SQL
- `data/new.sql`: 実行時点の新 SQL

これにより、過去の実行結果を後から再確認したり、比較根拠を追跡したりできます。

## 実行方法

### 依存関係のインストール

```bash
cd server && npm install
cd ../client && npm install
```

### 開発モードで起動

リポジトリのルートで実行します。

```bash
npm run dev
```

既定の URL:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`
- Swagger: `http://localhost:5000/api-docs`

### build 後に dist から起動

```bash
npm run build
npm run serve
```

このモードでは、`dev` よりも実運用に近い形で動作確認ができます。

## 対応プロバイダー

- SQL Server
- PostgreSQL
- MySQL

## 関連ドキュメント

- [English README](../../README.md)
- [Tài liệu tiếng Việt](../vi/README.md)
- [Documentation index](../README.md)

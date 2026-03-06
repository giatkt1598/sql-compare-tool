# SQL Comparer

Tool full-stack để so sánh kết quả của 2 câu SQL (old vs new) theo nhiều test case đầu vào.

## Bối cảnh nghiệp vụ

Project đang hướng tới luồng sử dụng sau:

1. Tạo và quản lý `profile`.
2. Chọn SQL provider, nhập connection string.
3. Khai báo đường dẫn 2 file SQL (`old` và `new`).
4. Định nghĩa danh sách test case (mỗi test case là một bộ parameters).
5. Chạy so sánh theo từng test case hoặc chạy toàn bộ.
6. Nhận report khác biệt dữ liệu và thời gian chạy của từng câu SQL.

## Chức năng chính

### 1. CRUD Profile

Mỗi profile lưu các thông tin:

- `name`
- `sqlProvider` (ví dụ: `sqlserver`, `postgres`)
- `connectionString`
- `oldSqlFilePath`
- `newSqlFilePath`
- `testCases` (danh sách bộ parameter)

Lưu ý:

- Connection string được nhập theo provider mà người dùng chọn (SQL Server, PostgreSQL, ...).
- Test case thuộc về profile và có thể thêm/sửa/xóa.

### 2. Run Profile

Hỗ trợ 2 cách chạy:

- Chạy một test case cụ thể.
- Chạy toàn bộ test case của profile.

Kết quả sau khi chạy:

- Danh sách dữ liệu khác nhau giữa `old SQL` và `new SQL`.
- Thời gian thực thi của từng câu SQL.
- Tổng hợp kết quả theo test case.

### 3. Lưu trữ dữ liệu

- Dữ liệu profile và test case được lưu vào file JSON trên server.
- Không sử dụng database cho phần metadata của tool (profile/test data).

## Cấu trúc project

```text
sql-comparer/
├── server/   # Express API
└── client/   # React + Vite + TypeScript
```

## Cách chạy local

### Server

```bash
cd server
npm install
npm run start
```

Mặc định chạy tại `http://localhost:5000`.

### Client

```bash
cd client
npm install
npm run dev
```

Mặc định chạy tại `http://localhost:5173`.

## JSON model tham khảo

### `profiles.json`

```json
[
  {
    "id": "profile-1",
    "name": "Sales Compare",
    "sqlProvider": "sqlserver",
    "connectionString": "Server=...;Database=...;User Id=...;Password=...;",
    "oldSqlFilePath": "./sql/old.sql",
    "newSqlFilePath": "./sql/new.sql",
    "testCases": ["tc-1", "tc-2"],
    "createdAt": "2026-03-06T00:00:00.000Z",
    "updatedAt": "2026-03-06T00:00:00.000Z"
  }
]
```

### `test-cases.json`

```json
[
  {
    "id": "tc-1",
    "profileId": "profile-1",
    "name": "Filter by date range",
    "parameters": {
      "fromDate": "2026-01-01",
      "toDate": "2026-01-31",
      "branchId": 10
    },
    "createdAt": "2026-03-06T00:00:00.000Z",
    "updatedAt": "2026-03-06T00:00:00.000Z"
  }
]
```

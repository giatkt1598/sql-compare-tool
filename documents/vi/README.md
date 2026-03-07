# SQL Comparer

[English](../../README.md) | Tiếng Việt | [日本語](../jp/README.md)

SQL Comparer là công cụ web dùng để xác nhận một câu SQL mới có trả ra cùng dữ liệu với câu SQL cũ hay không, dựa trên nhiều test case đầu vào.

## Mục đích sử dụng

Tool này phù hợp cho các tình huống:

- refactor câu SQL
- migrate logic truy vấn
- đối chiếu kết quả giữa query cũ và query mới
- kiểm tra regression dữ liệu
- theo dõi thời gian thực thi

## Chức năng chính

- Quản lý `Profile` kết nối database
- Gắn hai file SQL cho mỗi profile:
  - `old.sql`
  - `new.sql`
- Khai báo danh sách `SQL Parameters`
- Tạo nhiều `Test Case`
- Chạy một test case hoặc chạy nhiều test case
- So sánh kết quả và sinh file diff
- Theo dõi trạng thái chạy:
  - success
  - failed
  - running
  - error

## Khái niệm chính

### Profile

Profile lưu:

- loại database provider
- thông tin connection
- đường dẫn file SQL cũ
- đường dẫn file SQL mới

### SQL Parameter

SQL Parameter mô tả schema input cho test case, ví dụ:

- `id`
- `email`
- `enabled`

### Test Case

Test Case lưu:

- tên test case
- dữ liệu parameter dạng JSON
- các option chạy như:
  - compare in order
  - parallel execution
  - auto run when SQL changes

## Cách dùng nhanh

1. Tạo profile
2. Chọn provider và nhập connection
3. Chọn file `old.sql` và `new.sql`
4. Khai báo SQL parameters
5. Tạo test case
6. Bấm run
7. Xem màn `Latest Test Case Result`

## File kết quả

Mỗi lần chạy sẽ sinh artifact trong `server/data/results/...`, thường gồm:

- `old-result.json`
- `new-result.json`
- `diff-result.json`
- `data/parameter.json`
- `data/test-case.json`
- `data/old.sql`
- `data/new.sql`

## Cách chạy

### Chạy development

```bash
npm run dev
```

Mặc định:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`
- Swagger: `http://localhost:5000/api-docs`

### Build và chạy bản dist

```bash
npm run build
npm run serve
```

## Provider đang hỗ trợ

- SQL Server
- PostgreSQL
- MySQL

## Tài liệu liên quan

- [Tổng quan tiếng Anh](../../README.md)
- [Bản tiếng Nhật](../jp/README.md)
- [Mục lục tài liệu](../README.md)


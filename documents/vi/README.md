# SQL Comparer

[English](../../README.md) | Tiếng Việt | [日本語](../jp/README.md)

SQL Comparer là công cụ giúp bạn so sánh kết quả giữa hai câu SQL:

- câu SQL cũ: `old.sql`
- câu SQL mới: `new.sql`

Mục tiêu của tool là trả lời câu hỏi: sau khi sửa hoặc tối ưu SQL, kết quả trả về có còn giống với logic cũ hay không.

## Tool này dùng để làm gì

SQL Comparer phù hợp trong các trường hợp sau:

- refactor câu SQL nhưng vẫn phải giữ nguyên kết quả
- thay đổi logic truy vấn và cần kiểm tra lại dữ liệu
- so sánh query cũ và query mới trước khi đưa lên production
- kiểm tra chênh lệch dữ liệu theo nhiều bộ input khác nhau
- theo dõi thời gian chạy giữa hai phiên bản SQL

## Chức năng chính

- Quản lý `Profile` kết nối đến database
- Mỗi profile gắn với 2 file SQL:
  - `old.sql`
  - `new.sql`
- Khai báo danh sách `SQL Parameters`
- Tạo nhiều `Test Case` để truyền input khác nhau
- Chạy riêng từng test case hoặc chạy nhiều test case cùng lúc
- So sánh dữ liệu trả về giữa SQL cũ và SQL mới
- Lưu lịch sử chạy và file kết quả để xem lại
- Hỗ trợ tự động chạy lại khi file SQL thay đổi

## Các khái niệm cần biết

### 1. Profile

Profile là nơi chứa toàn bộ cấu hình của một bài toán so sánh SQL.

Một profile thường gồm:

- loại database đang dùng
- thông tin kết nối database
- đường dẫn đến file SQL cũ
- đường dẫn đến file SQL mới

Hiểu đơn giản: mỗi profile là một cấu hình so sánh hoàn chỉnh.

### 2. SQL Parameter

SQL Parameter là danh sách tham số đầu vào mà test case sẽ sử dụng.

Ví dụ:

- `id`
- `email`
- `enabled`

Phần này giúp bạn định nghĩa trước kiểu dữ liệu và tên biến để truyền vào câu SQL.

### 3. Test Case

Test Case là một bộ dữ liệu đầu vào cụ thể để chạy thử SQL.

Mỗi test case thường có:

- tên test case
- dữ liệu parameter ở dạng JSON
- các tùy chọn chạy như:
  - so sánh có quan tâm thứ tự record hay không
  - có chạy song song 2 câu SQL hay không
  - có tự động chạy lại khi file SQL thay đổi hay không

## Luồng sử dụng cơ bản

Nếu dùng lần đầu, bạn nên đi theo thứ tự này:

1. Tạo `Profile`
2. Chọn provider và nhập thông tin kết nối database
3. Chọn file `old.sql` và `new.sql`
4. Tạo danh sách `SQL Parameters`
5. Tạo `Test Case`
6. Chạy test case
7. Xem màn hình `Latest Test Case Result` để kiểm tra chênh lệch

## Kết quả sau khi chạy được lưu ở đâu

Mỗi lần chạy, server sẽ tạo file kết quả trong thư mục:

`server/data/results/...`

Thông thường sẽ có các file sau:

- `old-result.json`: dữ liệu trả về từ SQL cũ
- `new-result.json`: dữ liệu trả về từ SQL mới
- `diff-result.json`: phần chênh lệch giữa hai kết quả
- `data/parameter.json`: bộ parameter đã dùng khi chạy
- `data/test-case.json`: snapshot của test case tại thời điểm chạy
- `data/old.sql`: nội dung SQL cũ tại thời điểm chạy
- `data/new.sql`: nội dung SQL mới tại thời điểm chạy

Nhờ đó bạn có thể mở lại kết quả cũ để kiểm tra hoặc đối chiếu về sau.

## Cách chạy project

### Cài dependency

```bash
cd server && npm install
cd ../client && npm install
```

### Chạy ở chế độ development

Từ thư mục gốc của project:

```bash
npm run dev
```

Mặc định:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`
- Swagger: `http://localhost:5000/api-docs`

### Build và chạy bản đã build

```bash
npm run build
npm run serve
```

Chế độ này sẽ chạy code từ thư mục `dist`, gần với môi trường thực tế hơn so với `dev`.

## Các database provider hiện đang hỗ trợ

- SQL Server
- PostgreSQL
- MySQL

## Tài liệu liên quan

- [README tiếng Anh](../../README.md)
- [README tiếng Nhật](../jp/README.md)
- [Mục lục tài liệu](../README.md)

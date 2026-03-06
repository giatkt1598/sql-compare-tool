# SQL Comparer - Server Backend

Một backend API được xây dựng bằng Express.js với cấu trúc kiến trúc tương tự ASP.NET (Repository, Service, Controller pattern).

## 📁 Cấu trúc Project

```
server/
├── src/
│   ├── models/              # Models (Entities)
│   │   └── Profile.js       # Profile model với validation
│   │
│   ├── repositories/        # Repository Layer
│   │   └── ProfileRepository.js  # Xử lý dữ liệu từ file JSON
│   │
│   ├── services/            # Business Logic Layer
│   │   └── ProfileService.js    # Services cho Profile
│   │
│   ├── controllers/         # Controllers
│   │   └── ProfileController.js  # HTTP handlers
│   │
│   ├── routes/              # Routes
│   │   └── profileRoutes.js # Profile route definitions
│   │
│   ├── middleware/          # Middleware
│   │   └── errorHandler.js  # Error handling middleware
│   │
│   ├── config/              # Configuration
│   │   └── fileConstants.js # File path constants
│   │
│   └── index.js             # Main server file
│
├── data/                    # JSON Data Storage
│   └── profiles.json        # Profiles storage
│
├── .env                     # Environment variables
├── .gitignore              # Git ignore
├── package.json            # Dependencies
└── README.md              # Documentation
```

## 🏗️ Architecture Pattern

### Layer Structure (Similar to ASP.NET)

```
HTTP Request
    ↓
Routes (profileRoutes.js)
    ↓
Controller (ProfileController) → Business Logic
    ↓
Service (ProfileService) → Validation, Logic
    ↓
Repository (ProfileRepository) → Data Access
    ↓
Data Store (JSON files)
```

## 📦 API Endpoints

### Profile CRUD

| Method | Endpoint                            | Description                   |
| ------ | ----------------------------------- | ----------------------------- |
| GET    | `/api/profiles`                     | Lấy danh sách tất cả profiles |
| GET    | `/api/profiles/:id`                 | Lấy profile theo ID           |
| POST   | `/api/profiles`                     | Tạo profile mới               |
| PUT    | `/api/profiles/:id`                 | Cập nhật profile              |
| DELETE | `/api/profiles/:id`                 | Xóa profile                   |
| POST   | `/api/profiles/:id/test-connection` | Kiểm tra kết nối database     |

## 🚀 Cách chạy

### Development (với hot reload)

```bash
npm run dev
```

Server sẽ chạy tại `http://localhost:5000`

### Production

```bash
npm start
```

## 📝 Profile Data Structure

```javascript
{
  "id": "profile-1709782400000-abc12345",
  "name": "My Profile",
  "description": "Profile description",
  "oldSqlFilePath": "/path/to/old-query.sql",
  "newSqlFilePath": "/path/to/new-query.sql",
  "sqlProvider": "SqlServer",  // 'SqlServer' | 'Postgres'
  "sqlConnection": {
    "host": "localhost",
    "port": 1433,
    "database": "mydb",
    "username": "sa",
    "password": "password"
  },
  "testCases": [],           // Danh sách test case IDs
  "createdAt": "2026-03-06T10:30:00.000Z",
  "updatedAt": "2026-03-06T10:30:00.000Z"
}
```

## 📌 Example API Calls

### 1. Create Profile

```bash
curl -X POST http://localhost:5000/api/profiles \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My First Profile",
    "description": "Comparing queries",
    "oldSqlFilePath": "/sql/old_query.sql",
    "newSqlFilePath": "/sql/new_query.sql",
    "sqlProvider": "SqlServer",
    "sqlConnection": {
      "host": "localhost",
      "port": 1433,
      "database": "TestDB",
      "username": "sa",
      "password": "YourPassword"
    }
  }'
```

### 2. Get All Profiles

```bash
curl http://localhost:5000/api/profiles
```

### 3. Get Profile by ID

```bash
curl http://localhost:5000/api/profiles/profile-1709782400000-abc12345
```

### 4. Update Profile

```bash
curl -X PUT http://localhost:5000/api/profiles/profile-1709782400000-abc12345 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Profile Name"
  }'
```

### 5. Delete Profile

```bash
curl -X DELETE http://localhost:5000/api/profiles/profile-1709782400000-abc12345
```

## 🔄 Response Format

### Success Response

```json
{
  "success": true,
  "data": {
    /* data object */
  },
  "message": "Action completed successfully"
}
```

### Error Response

```json
{
  "success": false,
  "message": "Error description"
}
```

## 🛠️ Technologies

- **Framework**: Express.js
- **Runtime**: Node.js
- **Storage**: JSON files (no database)
- **CORS**: Enabled for frontend communication
- **Hot Reload**: Nodemon (development)

## 📚 Key Features

✅ RESTful API Design  
✅ Clean Architecture (Repository, Service, Controller)  
✅ Input Validation  
✅ Error Handling  
✅ JSON File Storage  
✅ CORS Support  
✅ Environment Variables Support

## 🔄 Next Steps

- [ ] Implement test connection functionality
- [ ] Add SQL query execution
- [ ] Implement test case management
- [ ] Add result comparison engine
- [ ] Add file upload for SQL files
- [ ] Add authentication/authorization
- [ ] Add logging system
- [ ] Add unit tests

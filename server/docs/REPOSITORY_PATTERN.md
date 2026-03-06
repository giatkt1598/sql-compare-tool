# BaseRepository Pattern - Documentation

## 📚 Giới thiệu

`BaseRepository` là một generic class được xây dựng để cung cấp tất cả các CRUD operations giống LINQ trong C#/.NET. Nó giúp bạn:

- ✅ Không phải viết lại các method CRUD cho mỗi repository
- ✅ Có interface thống nhất cho tất cả repositories
- ✅ Hỗ trợ filtering, sorting, pagination
- ✅ Dễ dàng extend với custom query methods

---

## 🏗️ Cấu trúc

```
repositories/
├── BaseRepository.js          # Generic base class (core CRUD + LINQ-like methods)
├── ProfileRepository.js       # Extends BaseRepository (Profile-specific methods)
└── ... (other repositories extend BaseRepository)
```

---

## 📖 Cách sử dụng

### 1. Tạo một Repository mới

```javascript
// repositories/TestCaseRepository.js
const BaseRepository = require("./BaseRepository");
const { FILE_PATHS } = require("../config/fileConstants");
const TestCase = require("../models/TestCase");

class TestCaseRepository extends BaseRepository {
  constructor() {
    super(FILE_PATHS.TEST_CASES, TestCase);
  }

  // Custom methods (optional)
  getByProfileId(profileId) {
    return this.where((tc) => tc.profileId === profileId);
  }
}

module.exports = new TestCaseRepository();
```

---

## 🔧 Các Method Có Sẵn

### CRUD Operations

```javascript
// Create
const newProfile = profileRepository.add(profileData);

// Read
const profile = profileRepository.getById(id);
const allProfiles = profileRepository.getAll();

// Update
const updated = profileRepository.update(id, updatedData);

// Delete
profileRepository.delete(id);
profileRepository.deleteWhere(predicate); // Delete multiple
```

### Filtering (giống LINQ Where)

```javascript
// Single condition
const result = profileRepository.getByName("My Profile");

// Multiple conditions (using where)
const result = profileRepository.where(
  (p) => p.sqlProvider === "SqlServer" && p.description.includes("test"),
);

// Check if exists
const exists = profileRepository.any((p) => p.name === "My Profile");

// Count
const total = profileRepository.count();
const serverCount = profileRepository.count(
  (p) => p.sqlProvider === "SqlServer",
);
```

### Sorting (giống LINQ OrderBy)

```javascript
// Ascending
const profiles = profileRepository.orderBy((p) => p.name);
const profiles = profileRepository.orderBy((p) => new Date(p.createdAt));

// Descending
const profiles = profileRepository.orderBy((p) => p.name, true);
```

### Pagination

```javascript
const result = profileRepository.paginate(1, 10);
// Returns:
// {
//   items: [...],
//   totalCount: 50,
//   pageNumber: 1,
//   pageSize: 10,
//   totalPages: 5
// }
```

### Advanced Operations

```javascript
// Get unique values
const providers = profileRepository.distinct((p) => p.sqlProvider);
// Returns: ['SqlServer', 'Postgres']

// Min/Max
const minCreated = profileRepository.aggregate((p) => p.createdAt, "min");
const maxCreated = profileRepository.aggregate((p) => p.createdAt, "max");

// Find one
const profile = profileRepository.single((p) => p.name === "test");
```

### Query Builder (Method Chaining)

```javascript
// Build complex queries
const results = profileRepository
  .query()
  .where((p) => p.sqlProvider === "SqlServer")
  .where((p) => p.description.includes("test"))
  .orderBy((p) => p.name)
  .toList();

// With pagination
const paginatedResults = profileRepository
  .query()
  .where((p) => p.sqlProvider === "SqlServer")
  .orderBy((p) => new Date(p.createdAt), true)
  .paginate(1, 10);

// Get first result
const first = profileRepository
  .query()
  .where((p) => p.name.includes("My"))
  .first();

// Count results
const count = profileRepository
  .query()
  .where((p) => p.sqlProvider === "Postgres")
  .count();
```

---

## 📝 ProfileRepository - Custom Methods

Ngoài các generic methods từ BaseRepository, ProfileRepository có thêm các custom methods:

```javascript
// Tìm profile theo name
const profile = profileRepository.getByName("My Profile");

// Tìm profiles theo provider
const sqlServerProfiles = profileRepository.getByProvider("SqlServer");

// Kiểm tra name đã tồn tại chưa
const exists = profileRepository.isNameExists("My Profile");

// Tìm kiếm theo description
const results = profileRepository.searchByDescription("test");

// Tìm profiles được tạo trong khoảng thời gian
const startDate = new Date("2026-01-01");
const endDate = new Date("2026-03-06");
const results = profileRepository.getCreatedBetween(startDate, endDate);

// Lấy profiles gần đây (10 mới nhất theo mặc định)
const recent = profileRepository.getRecentProfiles(5);

// Đếm profiles theo provider
const count = profileRepository.countByProvider("SqlServer");

// Lấy danh sách các provider đã được sử dụng
const providers = profileRepository.getUsedProviders();
```

---

## 🎯 Comparison: LINQ (C#) vs BaseRepository (Node.js)

| LINQ (C#)                            | BaseRepository (Node.js)                       |
| ------------------------------------ | ---------------------------------------------- |
| `db.Profiles.Where(...)`             | `repo.where(...)` or `repo.query().where(...)` |
| `db.Profiles.FirstOrDefault(...)`    | `repo.single(...)`                             |
| `db.Profiles.Any(...)`               | `repo.any(...)`                                |
| `db.Profiles.Count()`                | `repo.count()`                                 |
| `db.Profiles.OrderBy(...)`           | `repo.orderBy(...)`                            |
| `db.Profiles.Skip(...).Take(...)`    | `repo.paginate(page, size)`                    |
| `db.Profiles.Select(...).Distinct()` | `repo.distinct(...)`                           |
| `db.Profiles.Add(...)`               | `repo.add(...)`                                |
| `db.SaveChanges()`                   | Automatically saved in JSON                    |

---

## 💡 Ví dụ Thực Tế

### Service Layer (ProfileService)

```javascript
// Lấy profile mới nhất
getRecentProfiles(limit = 10) {
  return profileRepository
    .query()
    .orderBy(p => new Date(p.createdAt), true)
    .paginate(1, limit).items;
}

// Tìm kiếm profiles
searchProfiles(keyword) {
  return profileRepository.searchByDescription(keyword);
}

// Lấy thống kê
getStatistics() {
  return {
    total: profileRepository.count(),
    sqlServerCount: profileRepository.countByProvider('SqlServer'),
    postgresCount: profileRepository.countByProvider('Postgres'),
    providers: profileRepository.getUsedProviders()
  };
}
```

### Controller Layer (ProfileController)

```javascript
// Lấy profiles của một provider
getByProvider(req, res) {
  const { provider } = req.params;
  const profiles = profileRepository.getByProvider(provider);
  res.json({ success: true, data: profiles });
}

// Tìm kiếm
searchProfiles(req, res) {
  const { keyword } = req.params;
  const profiles = profileRepository.searchByDescription(keyword);
  res.json({ success: true, data: profiles });
}
```

---

## ✨ Lợi Ích

1. **DRY (Don't Repeat Yourself)** - Không viết lại CRUD cho mỗi entity
2. **Consistency** - Tất cả repositories có interface thống nhất
3. **Maintainability** - Fix bug ở BaseRepository áp dụng cho tất cả
4. **Extensibility** - Dễ add custom methods cho từng repository
5. **Type Safety** - Có thể extend với TypeScript khi cần
6. **Testing** - Dễ mock BaseRepository cho unit tests

---

## 🚀 Tiếp Theo

Khi cần tạo repository mới (e.g., TestCaseRepository, ResultRepository):

1. Extend từ BaseRepository
2. Pass file path và model class vào constructor
3. Thêm custom methods nếu cần

Đó là tất cả! Bạn sẽ có tất cả CRUD + LINQ-like operations sẵn.

# BaseRepository<T> - Generic Type Documentation

## 🎯 Giới thiệu

`BaseRepository<T>` là một generic repository class (tương tự như C# .NET) sử dụng JSDoc type annotations để cung cấp type safety tại IDE level mà không cần TypeScript.

```javascript
// C# (ASP.NET)
public class GenericRepository<T> where T : class { }

// JavaScript (Our Implementation)
/**
 * @template T - The entity type
 */
class BaseRepository { }
```

---

## 📝 JSDoc Generics Syntax

### Class Definition

```javascript
/**
 * @template T - The entity type
 */
class BaseRepository {
  // ...
}
```

### Method Return Types

```javascript
/**
 * @returns {T[]} - Mảng của entity type
 */
getAll() { }

/**
 * @returns {T|null} - Một entity hoặc null
 */
getById(id) { }

/**
 * @returns {T} - Một entity
 */
add(data) { }
```

### Method Parameters

```javascript
/**
 * @param {Function} predicate - (item: T) => boolean
 * @returns {T[]}
 */
where(predicate) { }

/**
 * @param {Function} selector - (item: T) => any
 * @returns {T[]}
 */
orderBy(selector, descending = false) { }
```

### Extending Generic Classes

```javascript
/**
 * @extends {BaseRepository<Profile>}
 */
class ProfileRepository extends BaseRepository {
  constructor() {
    super(FILE_PATHS.PROFILES, Profile);
  }
}
```

---

## 🎨 ProfileRepository - Generic Type Example

```javascript
/**
 * Profile Repository
 * Extends BaseRepository<Profile> để xử lý Profile-specific operations
 *
 * @extends {BaseRepository<Profile>}
 */
class ProfileRepository extends BaseRepository {
  constructor() {
    super(FILE_PATHS.PROFILES, Profile);
  }

  /**
   * @param {string} name
   * @returns {Profile|null}
   */
  getByName(name) {
    return this.single((p) => p.name === name);
  }

  /**
   * @param {string} provider
   * @returns {Profile[]}
   */
  getByProvider(provider) {
    return this.where((p) => p.sqlProvider === provider);
  }

  // ... more methods
}
```

---

## 💡 IDE IntelliSense Support

### With Generic Types

```javascript
const profiles = profileRepository.getAll();
// IDE nhận biết: profiles: Profile[]
//                profiles.forEach(p => console.log(p.name)) ✓

const profile = profileRepository.getById("123");
// IDE nhận biết: profile: Profile|null
//                profile?.name ✓
```

### Without Generic Types

```javascript
const profiles = profileRepository.getAll();
// IDE không biết type
// profiles.forEach(p => p.???) ✗ (no intellisense)
```

---

## 🔗 Generic Type Relationships

```
BaseRepository<T>
    ↑
    | extends
    |
ProfileRepository : BaseRepository<Profile>
    ↑
    | uses
    |
Profile (Model class)
```

### When You Create ProfileRepository:

1. **Pass Profile class** to BaseRepository

   ```javascript
   super(FILE_PATHS.PROFILES, Profile);
   ```

2. **All methods inherit Profile type**

   ```javascript
   getAll()      → Profile[]
   getById(id)   → Profile|null
   add(data)     → Profile
   update(id)    → Profile
   ```

3. **IDE provides intellisense**
   ```javascript
   const profile = profileRepository.getById("123");
   profile.name; // ✓ IDE recognizes 'name' property
   profile.sqlProvider; // ✓ IDE recognizes 'sqlProvider' property
   ```

---

## 📚 All Methods with Generic Types

### Read Operations

```javascript
/**
 * @returns {T[]}
 */
getAll();

/**
 * @returns {T|null}
 */
getById(id);

/**
 * @param {Function} predicate - (item: T) => boolean
 * @returns {T[]}
 */
where(predicate);

/**
 * @param {Function} predicate - (item: T) => boolean
 * @returns {T|null}
 */
single(predicate);

/**
 * @param {Function} predicate - (item: T) => boolean
 * @returns {boolean}
 */
any(predicate);

/**
 * @param {Function} predicate - (item: T) => boolean
 * @returns {number}
 */
count(predicate);
```

### Write Operations

```javascript
/**
 * @returns {T}
 */
add(data);

/**
 * @returns {T}
 */
update(id, data);

/**
 * @returns {boolean}
 */
delete id;

/**
 * @param {Function} predicate - (item: T) => boolean
 * @returns {number}
 */
deleteWhere(predicate);
```

### Sorting & Pagination

```javascript
/**
 * @param {Function} selector - (item: T) => any
 * @returns {T[]}
 */
orderBy(selector, (descending = false));

/**
 * @returns {Object}
 */
paginate(pageNumber, pageSize);
// Returns: { items: T[], totalCount, pageNumber, pageSize, totalPages }
```

### Advanced Operations

```javascript
/**
 * @param {Function} selector - (item: T) => any
 * @returns {any[]}
 */
distinct(selector);

/**
 * @param {Function} selector - (item: T) => any
 * @returns {any}
 */
aggregate(selector, type);
```

---

## 🚀 Query Builder Generics

```javascript
/**
 * @template T
 */
class QueryBuilder {
  /**
   * @param {Function} predicate - (item: T) => boolean
   * @returns {QueryBuilder<T>}
   */
  where(predicate) {}

  /**
   * @returns {QueryBuilder<T>}
   */
  orderBy(selector, descending) {}

  /**
   * @returns {T[]}
   */
  toList() {}

  /**
   * @returns {Object} { items: T[], totalCount, ... }
   */
  paginate(pageNumber, pageSize) {}

  /**
   * @returns {T|null}
   */
  first() {}

  /**
   * @returns {number}
   */
  count() {}
}
```

### Usage with Method Chaining

```javascript
const results = profileRepository
  .query() // QueryBuilder<Profile>
  .where((p) => p.sqlProvider === "SqlServer") // QueryBuilder<Profile>
  .orderBy((p) => p.name) // QueryBuilder<Profile>
  .paginate(1, 10); // { items: Profile[], ... }

const first = profileRepository
  .query() // QueryBuilder<Profile>
  .where((p) => p.name.includes("test"))
  .first(); // Profile|null
```

---

## 🎯 Benefits of Generic Types

1. **IDE AutoComplete** - TypeScript-like intellisense without TypeScript
2. **Type Safety** - Prevent accessing non-existent properties
3. **Documentation** - Clear contract of what each method returns
4. **Maintainability** - Easier to understand data flow
5. **Refactoring** - IDE can detect type mismatches
6. **No Build Step** - Works in pure JavaScript

---

## ✨ Comparison: Before vs After

### Before (No Typing)

```javascript
const profiles = profileRepository.getAll();
// profiles.???
// IDE: "I don't know what type this is"
```

### After (With Generic Types)

```javascript
/**
 * @extends {BaseRepository<Profile>}
 */
class ProfileRepository extends BaseRepository {}

const profiles = profileRepository.getAll();
// profiles: Profile[]
// IDE: "I know this is an array of Profile objects"
```

---

## 📦 Creating a New Generic Repository

```javascript
/**
 * Test Case Repository
 * @extends {BaseRepository<TestCase>}
 */
class TestCaseRepository extends BaseRepository {
  constructor() {
    super(FILE_PATHS.TEST_CASES, TestCase);
  }

  /**
   * @param {string} profileId
   * @returns {TestCase[]}
   */
  getByProfileId(profileId) {
    return this.where((tc) => tc.profileId === profileId);
  }

  /**
   * @param {string} profileId
   * @returns {number}
   */
  countByProfileId(profileId) {
    return this.count((tc) => tc.profileId === profileId);
  }
}

module.exports = new TestCaseRepository();
```

---

## 🔗 Related Files

- 📄 [BaseRepository.js](../src/repositories/BaseRepository.js) - Generic base class with JSDoc types
- 📄 [ProfileRepository.js](../src/repositories/ProfileRepository.js) - Example implementation
- 📄 [Profile.js](../src/models/Profile.js) - Entity model
- 📄 [REPOSITORY_PATTERN.md](./REPOSITORY_PATTERN.md) - Pattern documentation

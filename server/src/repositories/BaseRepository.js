/**
 * Base Repository
 * Generic repository class với các CRUD operations giống LINQ
 * Tất cả các repository khác đều extend class này
 * 
 * @template T - The entity type
 */

const fs = require('fs');
const path = require('path');

class BaseRepository {
    /**
     * Constructor
     * @param {string} filePath - Đường dẫn tới file JSON
     * @param {Function} EntityClass - Class model để tạo instances
     */
    constructor(filePath, EntityClass) {
        this.filePath = filePath;
        this.EntityClass = EntityClass;
        this.ensureFileExists();
    }

    /**
     * Đảm bảo file JSON tồn tại
     */
    ensureFileExists() {
        if (!fs.existsSync(this.filePath)) {
            fs.writeFileSync(this.filePath, JSON.stringify([], null, 2));
        }
    }

    /**
     * Đọc tất cả dữ liệu từ file
     * @returns {T[]} Mảng của entities
     */
    getAll() {
        try {
            const data = fs.readFileSync(this.filePath, 'utf8');
            const items = JSON.parse(data || '[]');
            return items.map(item => new this.EntityClass(item));
        } catch (error) {
            console.error('Error reading file:', error);
            return [];
        }
    }

    /**
     * Tìm một entity theo ID
     * @param {string} id - ID của entity
     * @returns {T|null} Entity hoặc null nếu không tìm thấy
     */
    getById(id) {
        try {
            const items = this.getAll();
            const item = items.find(i => i.id === id);
            return item || null;
        } catch (error) {
            console.error('Error finding by ID:', error);
            return null;
        }
    }

    /**
     * Tìm nhiều entities theo điều kiện (giống WHERE trong SQL)
     * @param {Function} predicate - Hàm kiểm tra điều kiện: (item: T) => boolean
     * @returns {T[]} Mảng các entity thỏa mãn điều kiện
     */
    where(predicate) {
        try {
            const items = this.getAll();
            return items.filter(predicate);
        } catch (error) {
            console.error('Error in where clause:', error);
            return [];
        }
    }

    /**
     * Tìm một entity duy nhất theo điều kiện
     * @param {Function} predicate - Hàm kiểm tra điều kiện: (item: T) => boolean
     * @returns {T|null} Entity hoặc null
     */
    single(predicate) {
        try {
            const items = this.where(predicate);
            return items.length > 0 ? items[0] : null;
        } catch (error) {
            console.error('Error in single:', error);
            return null;
        }
    }

    /**
     * Kiểm tra xem entity có tồn tại không
     * @param {Function} predicate - Hàm kiểm tra điều kiện
     * @returns {boolean}
     */
    any(predicate) {
        try {
            const items = this.where(predicate);
            return items.length > 0;
        } catch (error) {
            console.error('Error in any:', error);
            return false;
        }
    }

    /**
     * Đếm số lượng entities thỏa mãn điều kiện
     * @param {Function} predicate - Hàm kiểm tra điều kiện (optional)
     * @returns {number}
     */
    count(predicate) {
        try {
            const items = this.getAll();
            if (!predicate) return items.length;
            return items.filter(predicate).length;
        } catch (error) {
            console.error('Error in count:', error);
            return 0;
        }
    }

    /**
     * Sắp xếp entities (giống OrderBy)
     * @param {Function} selector - Hàm lấy property để sắp xếp: (item: T) => any
     * @param {boolean} descending - Sắp xếp giảm dần? default: false
     * @returns {T[]}
     */
    orderBy(selector, descending = false) {
        try {
            const items = this.getAll();
            const sorted = [...items].sort((a, b) => {
                const aVal = selector(a);
                const bVal = selector(b);
                if (aVal < bVal) return descending ? 1 : -1;
                if (aVal > bVal) return descending ? -1 : 1;
                return 0;
            });
            return sorted;
        } catch (error) {
            console.error('Error in orderBy:', error);
            return [];
        }
    }

    /**
     * Lấy trang dữ liệu (Pagination)
     * @param {number} pageNumber - Số trang (bắt đầu từ 1)
     * @param {number} pageSize - Số item mỗi trang
     * @returns {Object} { items: [], totalCount: number, pageNumber: number, pageSize: number }
     */
    paginate(pageNumber, pageSize) {
        try {
            const allItems = this.getAll();
            const totalCount = allItems.length;
            const startIndex = (pageNumber - 1) * pageSize;
            const items = allItems.slice(startIndex, startIndex + pageSize);

            return {
                items,
                totalCount,
                pageNumber,
                pageSize,
                totalPages: Math.ceil(totalCount / pageSize)
            };
        } catch (error) {
            console.error('Error in paginate:', error);
            return {
                items: [],
                totalCount: 0,
                pageNumber,
                pageSize,
                totalPages: 0
            };
        }
    }

    /**
     * Thêm một entity mới
     * @param {Object} data - Dữ liệu của entity
     * @returns {T} Entity vừa được tạo
     */
    add(data) {
        try {
            const entity = new this.EntityClass(data);

            // Validate nếu entity có hàm validate
            if (entity.validate) {
                const validation = entity.validate();
                if (!validation.isValid) {
                    throw new Error(validation.errors.join(', '));
                }
            }

            const items = this.getAll();
            items.push(entity.toJSON());
            fs.writeFileSync(this.filePath, JSON.stringify(items, null, 2));

            return entity;
        } catch (error) {
            console.error('Error adding entity:', error);
            throw error;
        }
    }

    /**
     * Cập nhật một entity
     * @param {string} id - ID của entity
     * @param {Object} data - Dữ liệu cập nhật
     * @returns {T} Entity sau khi cập nhật
     */
    update(id, data) {
        try {
            const items = this.getAll();
            const index = items.findIndex(item => item.id === id);

            if (index === -1) {
                throw new Error(`Entity with ID ${id} not found`);
            }

            const existingItem = items[index];
            const updatedEntity = new this.EntityClass({
                ...existingItem,
                ...data,
                id,
                createdAt: existingItem.createdAt
            });

            // Validate nếu có
            if (updatedEntity.validate) {
                const validation = updatedEntity.validate();
                if (!validation.isValid) {
                    throw new Error(validation.errors.join(', '));
                }
            }

            items[index] = updatedEntity.toJSON();
            fs.writeFileSync(this.filePath, JSON.stringify(items, null, 2));

            return updatedEntity;
        } catch (error) {
            console.error('Error updating entity:', error);
            throw error;
        }
    }

    /**
     * Xóa một entity
     * @param {string} id - ID của entity
     * @returns {boolean} true nếu xóa thành công
     */
    delete(id) {
        try {
            const items = this.getAll();
            const index = items.findIndex(item => item.id === id);

            if (index === -1) {
                throw new Error(`Entity with ID ${id} not found`);
            }

            items.splice(index, 1);
            fs.writeFileSync(this.filePath, JSON.stringify(items, null, 2));

            return true;
        } catch (error) {
            console.error('Error deleting entity:', error);
            throw error;
        }
    }

    /**
     * Xóa nhiều entities theo điều kiện
     * @param {Function} predicate - Hàm kiểm tra điều kiện
     * @returns {number} Số entity bị xóa
     */
    deleteWhere(predicate) {
        try {
            const items = this.getAll();
            const initialCount = items.length;
            const filteredItems = items.filter(item => !predicate(item));

            fs.writeFileSync(this.filePath, JSON.stringify(filteredItems, null, 2));

            return initialCount - filteredItems.length;
        } catch (error) {
            console.error('Error in deleteWhere:', error);
            throw error;
        }
    }

    /**
     * Lấy giá trị min/max của một property
     * @param {Function} selector - Hàm lấy property
     * @param {string} type - 'min' hoặc 'max'
     * @returns {*} Giá trị min/max hoặc null
     */
    aggregate(selector, type = 'min') {
        try {
            const items = this.getAll();
            if (items.length === 0) return null;

            const values = items.map(selector);

            if (type === 'min') {
                return Math.min(...values.map(v => typeof v === 'number' ? v : 0));
            } else if (type === 'max') {
                return Math.max(...values.map(v => typeof v === 'number' ? v : 0));
            }
            return null;
        } catch (error) {
            console.error('Error in aggregate:', error);
            return null;
        }
    }

    /**
     * Lấy danh sách các giá trị unique của một property
     * @param {Function} selector - Hàm lấy property
     * @returns {Array} Mảng các giá trị unique
     */
    distinct(selector) {
        try {
            const items = this.getAll();
            const values = items.map(selector);
            return [...new Set(values)];
        } catch (error) {
            console.error('Error in distinct:', error);
            return [];
        }
    }

    /**
     * Chaining query - thay thế với where -> orderBy -> paginate
     * Ví dụ: repo.query().where(...).orderBy(...).paginate(1, 10)
     * @returns {QueryBuilder<T>}
     */
    query() {
        return new QueryBuilder(this);
    }
}

/**
 * Query Builder - giúp xây dựng query linh động
 * @template T - The entity type
 */
class QueryBuilder {
    constructor(repository) {
        this.repository = repository;
        this.items = repository.getAll();
        this.predicates = [];
        this.sortFunc = null;
        this.descending = false;
    }

    /**
     * Thêm điều kiện WHERE
     * @param {Function} predicate - Hàm kiểm tra: (item: T) => boolean
     * @returns {QueryBuilder<T>}
     */
    where(predicate) {
        this.predicates.push(predicate);
        return this;
    }

    /**
     * Sắp xếp
     * @param {Function} selector - Hàm lấy property: (item: T) => any
     * @param {boolean} descending - Sắp xếp giảm dần
     * @returns {QueryBuilder<T>}
     */
    orderBy(selector, descending = false) {
        this.sortFunc = selector;
        this.descending = descending;
        return this;
    }

    /**
     * Thực thi query và lấy kết quả
     * @returns {T[]}
     */
    toList() {
        let results = [...this.items];

        // Áp dụng các điều kiện WHERE
        for (const predicate of this.predicates) {
            results = results.filter(predicate);
        }

        // Áp dụng sắp xếp
        if (this.sortFunc) {
            results.sort((a, b) => {
                const aVal = this.sortFunc(a);
                const bVal = this.sortFunc(b);
                if (aVal < bVal) return this.descending ? 1 : -1;
                if (aVal > bVal) return this.descending ? -1 : 1;
                return 0;
            });
        }

        return results;
    }

    /**
     * Lấy kết quả có phân trang
     * @returns {Object} { items: T[], totalCount: number, pageNumber: number, pageSize: number, totalPages: number }
     */
    paginate(pageNumber, pageSize) {
        const results = this.toList();
        const totalCount = results.length;
        const startIndex = (pageNumber - 1) * pageSize;
        const items = results.slice(startIndex, startIndex + pageSize);

        return {
            items,
            totalCount,
            pageNumber,
            pageSize,
            totalPages: Math.ceil(totalCount / pageSize)
        };
    }

    /**
     * Lấy phần tử đầu tiên
     * @returns {T|null}
     */
    first() {
        const results = this.toList();
        return results.length > 0 ? results[0] : null;
    }

    /**
     * Đếm kết quả
     * @returns {number}
     */
    count() {
        return this.toList().length;
    }
}

module.exports = BaseRepository;

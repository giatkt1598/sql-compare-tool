/**
 * Profile Repository
 * Extends BaseRepository<Profile> để xử lý Profile-specific operations
 * 
 * @extends {BaseRepository<Profile>}
 */

const BaseRepository = require('./BaseRepository');
const { FILE_PATHS } = require('../config/fileConstants');
const Profile = require('../models/Profile');

/**
 * @typedef {BaseRepository<Profile>} ProfileRepository
 */
class ProfileRepository extends BaseRepository {
    constructor() {
        super(FILE_PATHS.PROFILES, Profile);
    }

    /**
     * Tìm profile theo name
     * @param {string} name - Tên profile
     * @returns {Profile|null}
     */
    getByName(name) {
        return this.single(p => p.name === name);
    }

    /**
     * Tìm tất cả profiles của một SQL provider
     * @param {string} provider - SQL provider type (SqlServer|Postgres)
     * @returns {Profile[]}
     */
    getByProvider(provider) {
        return this.where(p => p.sqlProvider === provider);
    }

    /**
     * Tìm profiles theo description (search)
     * @param {string} keyword - Từ khóa tìm kiếm
     * @returns {Profile[]}
     */
    searchByDescription(keyword) {
        return this.where(p =>
            p.description &&
            p.description.toLowerCase().includes(keyword.toLowerCase())
        );
    }

    /**
     * Tìm profiles được tạo trong khoảng thời gian
     * @param {Date} startDate - Ngày bắt đầu
     * @param {Date} endDate - Ngày kết thúc
     * @returns {Profile[]}
     */
    getCreatedBetween(startDate, endDate) {
        return this.where(p => {
            const createdAt = new Date(p.createdAt);
            return createdAt >= startDate && createdAt <= endDate;
        });
    }

    /**
     * Lấy profiles được sắp xếp theo ngày tạo (mới nhất trước)
     * @param {number} limit - Số lượng profiles tối đa
     * @returns {Profile[]}
     */
    getRecentProfiles(limit = 10) {
        return this.orderBy(p => new Date(p.createdAt), true).slice(0, limit);
    }

    /**
     * Kiểm tra xem name đã tồn tại chưa
     * @param {string} name - Tên profile
     * @returns {boolean}
     */
    isNameExists(name) {
        return this.any(p => p.name === name);
    }

    /**
     * Đếm profiles theo provider
     * @param {string} provider - SQL provider type (SqlServer|Postgres)
     * @returns {number}
     */
    countByProvider(provider) {
        return this.count(p => p.sqlProvider === provider);
    }

    /**
     * Lấy danh sách các provider đã được sử dụng
     * @returns {string[]}
     */
    getUsedProviders() {
        return this.distinct(p => p.sqlProvider);
    }
}
module.exports = new ProfileRepository();

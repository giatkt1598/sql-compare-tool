/**
 * Profile Model
 * Định nghĩa structure của Profile
 */

class Profile {
    constructor(data = {}) {
        this.id = data.id || this.generateId();
        this.name = data.name;
        this.description = data.description || '';
        this.oldSqlFilePath = data.oldSqlFilePath;
        this.newSqlFilePath = data.newSqlFilePath;
        this.sqlProvider = data.sqlProvider; // 'SqlServer' | 'Postgres'
        this.sqlConnection = {
            host: data.sqlConnection?.host || '',
            port: data.sqlConnection?.port || '',
            database: data.sqlConnection?.database || '',
            username: data.sqlConnection?.username || '',
            password: data.sqlConnection?.password || '',
            ...data.sqlConnection
        };
        this.testCases = data.testCases || [];
        this.createdAt = data.createdAt || new Date().toISOString();
        this.updatedAt = data.updatedAt || new Date().toISOString();
    }

    /**
     * Tạo ID unique cho profile
     */
    generateId() {
        return `profile-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Validate profile data
     */
    validate() {
        const errors = [];

        if (!this.name || this.name.trim() === '') {
            errors.push('Profile name is required');
        }

        if (!this.oldSqlFilePath || this.oldSqlFilePath.trim() === '') {
            errors.push('Old SQL file path is required');
        }

        if (!this.newSqlFilePath || this.newSqlFilePath.trim() === '') {
            errors.push('New SQL file path is required');
        }

        if (!this.sqlProvider || !['SqlServer', 'Postgres'].includes(this.sqlProvider)) {
            errors.push('SQL Provider must be either SqlServer or Postgres');
        }

        if (!this.sqlConnection.host || this.sqlConnection.host.trim() === '') {
            errors.push('Database host is required');
        }

        if (!this.sqlConnection.username || this.sqlConnection.username.trim() === '') {
            errors.push('Database username is required');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Tạo object plain từ Profile instance
     */
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            oldSqlFilePath: this.oldSqlFilePath,
            newSqlFilePath: this.newSqlFilePath,
            sqlProvider: this.sqlProvider,
            sqlConnection: this.sqlConnection,
            testCases: this.testCases,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}

module.exports = Profile;

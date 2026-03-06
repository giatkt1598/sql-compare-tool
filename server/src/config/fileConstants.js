/**
 * File Constants & Configuration
 * Định nghĩa các đường dẫn file JSON cho lưu trữ dữ liệu
 */

const path = require('path');

const DATA_DIR = path.join(__dirname, '../../data');

const FILE_PATHS = {
    PROFILES: path.join(DATA_DIR, 'profiles.json'),
    TEST_CASES: path.join(DATA_DIR, 'test-cases.json'),
    RESULTS: path.join(DATA_DIR, 'results')
};

module.exports = {
    DATA_DIR,
    FILE_PATHS
};

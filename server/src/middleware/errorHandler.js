/**
 * Error Handler Middleware
 * Xử lý tất cả các error từ các route
 */

const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);

    // Xử lý các loại lỗi khác nhau
    if (err.message && err.message.includes('not found')) {
        return res.status(404).json({
            success: false,
            message: err.message
        });
    }

    if (err.message && err.message.includes('already exists')) {
        return res.status(409).json({
            success: false,
            message: err.message
        });
    }

    res.status(500).json({
        success: false,
        message: err.message || 'An unexpected error occurred'
    });
};

module.exports = errorHandler;

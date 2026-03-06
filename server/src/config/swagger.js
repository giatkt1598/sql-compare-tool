/**
 * Swagger Configuration
 * Định nghĩa OpenAPI/Swagger documentation cho API
 */

const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'SQL Comparer API',
            version: '1.0.0',
            description: 'API for comparing SQL queries from two different versions',
            contact: {
                name: 'SQL Comparer Team',
                email: 'support@sqlcomparer.com'
            },
            license: {
                name: 'MIT',
                url: 'https://opensource.org/licenses/MIT'
            }
        },
        servers: [
            {
                url: 'http://localhost:5000',
                description: 'Development server'
            },
            {
                url: 'https://api.sqlcomparer.com',
                description: 'Production server'
            }
        ]
    },
    apis: ['./src/routes/*.js', './src/controllers/*.js'] // Path to the API docs
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;

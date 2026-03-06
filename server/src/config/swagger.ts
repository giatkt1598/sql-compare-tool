import path from 'node:path';
import swaggerJsdoc from 'swagger-jsdoc';
import type { Options } from 'swagger-jsdoc';

const apiDocGlobs = [
  path.resolve(process.cwd(), 'src/routes/*.{ts,js}'),
  path.resolve(process.cwd(), 'src/controllers/*.{ts,js}'),
  path.resolve(__dirname, '../routes/*.{ts,js}'),
  path.resolve(__dirname, '../controllers/*.{ts,js}'),
];

const options: Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SQL Comparer API',
      version: '1.0.0',
      description: 'API for comparing SQL queries from two different versions',
      contact: {
        name: 'SQL Comparer Team',
        email: 'support@sqlcomparer.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server',
      },
      {
        url: 'https://api.sqlcomparer.com',
        description: 'Production server',
      },
    ],
  },
  apis: apiDocGlobs,
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;

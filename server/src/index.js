const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const profileRoutes = require('./routes/profileRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// ============ Middleware ============
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============ Swagger Setup ============
app.use('/api-docs', swaggerUi.serve);
app.get('/api-docs', swaggerUi.setup(swaggerSpec, {
  swaggerOptions: {
    url: '/api-docs/swagger.json'
  }
}));

// Swagger JSON endpoint
app.get('/api-docs/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// ============ Routes ============
// Health check
app.get('/', (req, res) => {
  res.json({
    message: 'SQL Comparer Server is running!',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    documentation: 'http://localhost:5000/api-docs'
  });
});

// API Routes
app.use('/api/profiles', profileRoutes);

// ============ Error Handler ============
app.use(errorHandler);

// ============ 404 Handler ============
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// ============ Start Server ============
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║   SQL Comparer Server                  ║
║   Server running on port ${PORT}              ║
║   http://localhost:${PORT}                   ║
╚════════════════════════════════════════╝
  `);
});

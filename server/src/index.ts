import express, { type Request, type Response } from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger';
import profileRoutes from './routes/profileRoutes';
import sqlRoutes from './routes/sqlRoutes';
import errorHandler from './middleware/errorHandler';

const app = express();
const PORT = Number(process.env.PORT || 5000);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api-docs', swaggerUi.serve);
app.get(
  '/api-docs',
  swaggerUi.setup(swaggerSpec, {
    swaggerOptions: {
      url: '/api-docs/swagger.json',
    },
  })
);

app.get('/api-docs/swagger.json', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

app.get('/', (_req: Request, res: Response) => {
  res.json({
    message: 'SQL Comparer Server is running!',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    documentation: 'http://localhost:5000/api-docs',
  });
});

app.use('/api/profiles', profileRoutes);
app.use('/api/sql', sqlRoutes);

app.use(errorHandler);

app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

app.listen(PORT, () => {
  console.log(`
SQL Comparer Server
Server running on http://localhost:${PORT}
API documentation: http://localhost:${PORT}/api-docs
  `);
});

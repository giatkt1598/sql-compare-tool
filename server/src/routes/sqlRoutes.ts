import express from 'express';
import SqlController from '../controllers/SqlController';

const router = express.Router();

router.post('/test-connection', SqlController.testConnection.bind(SqlController));

export default router;

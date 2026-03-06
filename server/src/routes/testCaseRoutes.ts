import express from 'express';
import TestCaseController from '../controllers/TestCaseController';

const router = express.Router();

router.get('/profile/:profileId', TestCaseController.getByProfileId.bind(TestCaseController));
router.get('/', TestCaseController.getAll.bind(TestCaseController));
router.post('/', TestCaseController.create.bind(TestCaseController));
router.get('/:id', TestCaseController.getById.bind(TestCaseController));
router.put('/:id', TestCaseController.update.bind(TestCaseController));
router.delete('/:id', TestCaseController.delete.bind(TestCaseController));

export default router;

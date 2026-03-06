import express from 'express';
import SqlParameterController from '../controllers/SqlParameterController';

const router = express.Router();

router.put(
  '/profile/:profileId',
  SqlParameterController.replaceByProfileId.bind(SqlParameterController)
);
router.get(
  '/profile/:profileId',
  SqlParameterController.getByProfileId.bind(SqlParameterController)
);
router.get('/', SqlParameterController.getAll.bind(SqlParameterController));
router.post('/', SqlParameterController.create.bind(SqlParameterController));
router.get('/:id', SqlParameterController.getById.bind(SqlParameterController));
router.put('/:id', SqlParameterController.update.bind(SqlParameterController));
router.delete('/:id', SqlParameterController.delete.bind(SqlParameterController));

export default router;

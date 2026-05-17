import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import {
  login,
  createStation,
  updateStation,
  deleteStation,
  reservePlug,
} from '../controllers/adminController';

const router = Router();

router.post('/login', login);

router.post('/stations', authMiddleware, createStation);
router.put('/stations/:id', authMiddleware, updateStation);
router.delete('/stations/:id', authMiddleware, deleteStation);

router.post('/plugs/:plugId/reserve', authMiddleware, reservePlug);

export default router;

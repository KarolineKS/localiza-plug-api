import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { createStation, updateStation, deleteStation } from '../controllers/adminStationsController';

const router = Router();

router.use(authenticate);

router.post('/', createStation);
router.patch('/:id', updateStation);
router.delete('/:id', deleteStation);

export default router;

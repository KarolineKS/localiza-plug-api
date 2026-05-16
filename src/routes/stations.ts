import { Router } from 'express';
import { listStations, getStation } from '../controllers/stationsController';

const router = Router();

router.get('/', listStations);
router.get('/:id', getStation);

export default router;

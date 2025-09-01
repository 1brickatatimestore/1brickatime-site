import express from 'express';
import minifigsRouter from './minifigs';
import healthRouter from './health';

const router = express.Router();

router.use('/minifigs', minifigsRouter);
router.use('/health', healthRouter);

export default router;

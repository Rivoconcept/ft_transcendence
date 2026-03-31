import { Router, type IRouter } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import {
  getUserOnlineTime,
  recordOnlineTime,
  addToOnlineTime,
  getTotalPlaytime,
} from '../controllers/user-online-time.controller.js';

const router: IRouter = Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * GET /user-online-time
 * Fetch all online time records for the authenticated user
 */
router.get('/', getUserOnlineTime);

/**
 * GET /user-online-time/total
 * Get total playtime in minutes
 */
router.get('/total', getTotalPlaytime);

/**
 * POST /user-online-time
 * Record or update daily online time
 */
router.post('/', recordOnlineTime);

/**
 * POST /user-online-time/add
 * Increment online time for a date
 */
router.post('/add', addToOnlineTime);

export default router;

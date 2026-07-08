import { Hono } from 'hono';
import { AppEnv } from '../types';
import { login, changePassword } from '../controllers/auth.controller';

const router = new Hono<AppEnv>();

router.post('/login', login);
router.post('/change-password', changePassword);

export default router;

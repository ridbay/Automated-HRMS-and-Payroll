import { Hono } from 'hono';
import { AppEnv } from '../types';
import { login, changePassword, registerCompany } from '../controllers/auth.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { authRateLimit } from '../middlewares/rateLimit.middleware';

const router = new Hono<AppEnv>();

// Unauthenticated, brute-forceable endpoints get a per-IP rate limit.
router.post('/login', authRateLimit(), login);
router.post('/register', authRateLimit(), registerCompany);
// Credential mutation requires a verified identity — never trust a client-supplied
// employee id. Also rate-limited in case a stolen JWT is used to brute-force the
// current password.
router.post('/change-password', authRateLimit(), authMiddleware, changePassword);

export default router;

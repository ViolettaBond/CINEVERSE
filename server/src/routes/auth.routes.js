import { Router } from 'express';
import { login, me, register } from '../controllers/auth.controller.js';
import { authRequired } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { loginRules, registerRules } from '../validators/auth.validator.js';

const router = Router();

router.post('/register', registerRules, validate, register);
router.post('/login', loginRules, validate, login);
router.get('/me', authRequired, me);

export default router;

import { Router } from 'express';
import { listGenres } from '../controllers/genre.controller.js';
import { adminController } from '../controllers/index.js';
import { adminRequired, authRequired } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { idParam } from '../validators/common.js';
import { genreRules, genreUpdateRules } from '../validators/admin.validator.js';

const router = Router();

router.get('/', listGenres);
router.post('/', authRequired, adminRequired, genreRules, validate, adminController.createGenre);
router.put('/:id', authRequired, adminRequired, genreUpdateRules, validate, adminController.updateGenre);
router.delete('/:id', authRequired, adminRequired, [idParam('id')], validate, adminController.removeGenre);

export default router;

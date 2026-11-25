import { Router } from 'express';
import { createUserListController } from '../controllers/userList.controller.js';
import { authRequired } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  addToListRules,
  listQueryRules,
  removeFromListRules,
} from '../validators/userList.validator.js';

export function createUserListRouter(listName) {
  const controller = createUserListController(listName);
  const router = Router();

  // Все маршруты личных списков требуют входа; user_id всегда берётся из токена
  router.use(authRequired);
  router.get('/', listQueryRules, validate, controller.list);
  router.post('/', addToListRules, validate, controller.add);
  router.delete('/:movieId', removeFromListRules, validate, controller.remove);

  return router;
}

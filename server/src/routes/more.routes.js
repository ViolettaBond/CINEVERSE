import { Router } from 'express';
import {
  adminController, collectionController, notificationController, reviewController, userController,
} from '../controllers/index.js';
import { adminRequired, authRequired } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { idParam } from '../validators/common.js';
import * as c from '../validators/collection.validator.js';
import * as r from '../validators/review.validator.js';
import * as u from '../validators/user.validator.js';
import * as a from '../validators/admin.validator.js';

// ----- /api/collections -----
export const collectionRoutes = Router();
collectionRoutes.use(authRequired);
collectionRoutes.get('/', collectionController.list);
collectionRoutes.post('/', c.collectionBodyRules, validate, collectionController.create);
collectionRoutes.get('/:id', c.collectionIdRules, validate, collectionController.get);
collectionRoutes.put('/:id', [idParam('id'), ...c.collectionBodyRules], validate, collectionController.update);
collectionRoutes.delete('/:id', c.collectionIdRules, validate, collectionController.remove);
collectionRoutes.post('/:id/movies', c.collectionAddMovieRules, validate, collectionController.addMovie);
collectionRoutes.delete('/:id/movies/:movieId', c.collectionRemoveMovieRules, validate, collectionController.removeMovie);

// ----- /api/reviews -----
export const reviewRoutes = Router();
reviewRoutes.use(authRequired);
reviewRoutes.get('/', reviewController.listMine);
reviewRoutes.put('/:id', r.reviewUpdateRules, validate, reviewController.update);
reviewRoutes.delete('/:id', r.reviewIdRules, validate, reviewController.remove);

// ----- /api/notifications -----
export const notificationRoutes = Router();
notificationRoutes.use(authRequired);
notificationRoutes.get('/', notificationController.list);
notificationRoutes.patch('/read-all', notificationController.readAll); // до '/:id/read'
notificationRoutes.patch('/:id/read', [idParam('id')], validate, notificationController.read);
notificationRoutes.delete('/:id', [idParam('id')], validate, notificationController.remove);

// ----- /api/users -----
export const userRoutes = Router();
userRoutes.use(authRequired);
userRoutes.get('/me/stats', userController.stats);
userRoutes.put('/me', u.profileRules, validate, userController.updateProfile);
userRoutes.put('/me/settings', u.settingsRules, validate, userController.updateSettings);
userRoutes.put('/me/password', u.passwordRules, validate, userController.changePassword);
userRoutes.delete('/me', u.deleteAccountRules, validate, userController.deleteAccount);

// ----- /api/admin (только администратор, проверяется на сервере) -----
export const adminRoutes = Router();
adminRoutes.use(authRequired, adminRequired);
adminRoutes.get('/users', adminController.users);
adminRoutes.patch('/users/:id', a.updateUserRules, validate, adminController.updateUser);
adminRoutes.get('/statistics', adminController.statistics);
adminRoutes.get('/reviews', adminController.reviews);
adminRoutes.delete('/reviews/:id', r.reviewIdRules, validate, adminController.removeReview);


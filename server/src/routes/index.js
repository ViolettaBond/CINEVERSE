import { Router } from 'express';
import authRoutes from './auth.routes.js';
import genreRoutes from './genre.routes.js';
import movieRoutes from './movie.routes.js';
import { createUserListRouter } from './userList.routes.js';
import {
  adminRoutes, collectionRoutes, notificationRoutes, reviewRoutes, userRoutes,
} from './more.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/movies', movieRoutes);
router.use('/genres', genreRoutes);
router.use('/favorites', createUserListRouter('favorites'));
router.use('/watchlist', createUserListRouter('watchlist'));
router.use('/watched', createUserListRouter('watched'));
router.use('/collections', collectionRoutes);
router.use('/reviews', reviewRoutes);
router.use('/notifications', notificationRoutes);
router.use('/users', userRoutes);
router.use('/admin', adminRoutes);

export default router;

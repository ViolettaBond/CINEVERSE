import { body } from 'express-validator';
import { idParam } from './common.js';

export const ratingRules = [
  idParam('id'),
  body('rating').isInt({ min: 1, max: 10 }).withMessage('Оценка должна быть целым числом от 1 до 10').toInt(),
];

export const reviewTextRules = [
  body('text').trim().isLength({ min: 1, max: 5000 }).withMessage('Текст отзыва: от 1 до 5000 символов'),
];

export const movieReviewCreateRules = [idParam('id'), ...reviewTextRules];
export const reviewUpdateRules = [idParam('id'), ...reviewTextRules];
export const reviewIdRules = [idParam('id')];

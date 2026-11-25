import { body, param, query } from 'express-validator';

export const listQueryRules = [
  query('q').optional().trim().isLength({ max: 100 }).withMessage('Слишком длинный поисковый запрос'),
  query('sort').optional().isIn(['added', 'title', 'year']).withMessage('Сортировка: added, title или year'),
  query('order').optional().isIn(['asc', 'desc']).withMessage('Порядок: asc или desc'),
];

export const addToListRules = [
  body('movieId').isInt({ min: 1 }).withMessage('Некорректный номер фильма').toInt(),
];

export const removeFromListRules = [
  param('movieId').isInt({ min: 1 }).withMessage('Некорректный номер фильма').toInt(),
];

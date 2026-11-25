import { param, query } from 'express-validator';

export const movieListRules = [
  query('q').optional().trim().isLength({ max: 100 }).withMessage('Слишком длинный поисковый запрос'),
  query('genre')
    .optional()
    .matches(/^\d+(,\d+)*$/)
    .withMessage('Жанры задаются номерами через запятую'),
  query('type').optional().isIn(['movie', 'series']).withMessage('Тип должен быть movie или series'),
  query('yearFrom').optional().isInt({ min: 1888, max: 2100 }).withMessage('Некорректный год «от»').toInt(),
  query('yearTo')
    .optional()
    .isInt({ min: 1888, max: 2100 })
    .withMessage('Некорректный год «до»')
    .toInt()
    .custom((value, { req }) => !req.query.yearFrom || value >= Number(req.query.yearFrom))
    .withMessage('Год «до» не может быть меньше года «от»'),
  query('ratingMin').optional().isFloat({ min: 1, max: 10 }).withMessage('Рейтинг от 1 до 10').toFloat(),
  query('sort').optional().isIn(['title', 'year', 'rating']).withMessage('Сортировка: title, year или rating'),
  query('order').optional().isIn(['asc', 'desc']).withMessage('Порядок: asc или desc'),
  query('page').optional().isInt({ min: 1 }).withMessage('Номер страницы должен быть от 1').toInt(),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Размер страницы от 1 до 50').toInt(),
];

export const movieIdRules = [
  param('id').isInt({ min: 1 }).withMessage('Некорректный номер фильма').toInt(),
];

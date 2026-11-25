import { body } from 'express-validator';
import { idParam, isHttpOrLocalUrl } from './common.js';

export const updateUserRules = [
  idParam('id'),
  body('status').optional().isIn(['active', 'blocked']).withMessage('Статус: active или blocked'),
  body('role').optional().isIn(['user', 'administrator']).withMessage('Роль: user или administrator'),
  body().custom((value) => value.status !== undefined || value.role !== undefined).withMessage('Укажите status или role'),
];

export const genreRules = [
  body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Название жанра: от 2 до 50 символов'),
];
export const genreUpdateRules = [idParam('id'), ...genreRules];

const optionalText = (field, max) =>
  body(field).optional({ values: 'falsy' }).trim().isLength({ max }).withMessage(`${field}: не длиннее ${max} символов`);
const optionalUrl = (field) =>
  body(field)
    .optional({ values: 'falsy' })
    .trim()
    .custom(isHttpOrLocalUrl)
    .withMessage(`${field} должно быть ссылкой http(s) или путём вида /posters/name.svg`);

export const movieBodyRules = [
  body('title').trim().isLength({ min: 1, max: 255 }).withMessage('Название: от 1 до 255 символов'),
  body('type').isIn(['movie', 'series']).withMessage('Тип: movie или series'),
  body('releaseYear').isInt({ min: 1888, max: 2100 }).withMessage('Год выпуска: от 1888 до 2100').toInt(),
  body('duration').optional({ values: 'falsy' }).isInt({ min: 1, max: 1000 }).withMessage('Длительность: от 1 до 1000 минут').toInt(),
  body('genreIds').optional().isArray().withMessage('genreIds должен быть массивом'),
  body('genreIds.*').isInt({ min: 1 }).withMessage('Некорректный номер жанра').toInt(),
  optionalText('originalTitle', 255),
  optionalText('description', 5000),
  optionalText('ageRating', 10),
  optionalText('country', 100),
  optionalText('director', 255),
  optionalText('writers', 1000),
  optionalText('castList', 1000),
  optionalUrl('posterUrl'),
  optionalUrl('backdropUrl'),
];
export const movieUpdateRules = [idParam('id'), ...movieBodyRules];

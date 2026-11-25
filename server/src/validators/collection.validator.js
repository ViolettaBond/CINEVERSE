import { body } from 'express-validator';
import { idParam } from './common.js';

export const collectionBodyRules = [
  body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Название: от 1 до 100 символов'),
  body('description').optional({ values: 'falsy' }).trim().isLength({ max: 1000 }).withMessage('Описание не длиннее 1000 символов'),
  body('coverUrl')
    .optional({ values: 'falsy' })
    .trim()
    .isURL({ protocols: ['http', 'https'], require_protocol: true })
    .withMessage('Обложка должна быть ссылкой http(s)'),
];

export const collectionIdRules = [idParam('id')];
export const collectionAddMovieRules = [
  idParam('id'),
  body('movieId').isInt({ min: 1 }).withMessage('Некорректный номер фильма').toInt(),
];
export const collectionRemoveMovieRules = [idParam('id'), idParam('movieId')];

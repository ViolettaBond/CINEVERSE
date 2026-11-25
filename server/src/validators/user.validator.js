import { body } from 'express-validator';

const avatarRule = body('avatar')
  .optional({ values: 'falsy' })
  .trim()
  .isURL({ protocols: ['http', 'https'], require_protocol: true })
  .withMessage('Аватар должен быть ссылкой http(s)');

export const profileRules = [
  body('username').trim().isLength({ min: 2, max: 50 }).withMessage('Имя пользователя должно содержать от 2 до 50 символов'),
  avatarRule,
];

export const settingsRules = [
  body('notifyReviews').isBoolean().withMessage('Укажите true или false').toBoolean(),
  body('notifyCollections').isBoolean().withMessage('Укажите true или false').toBoolean(),
];

export const passwordRules = [
  body('currentPassword').notEmpty().withMessage('Введите текущий пароль'),
  body('newPassword')
    .isLength({ min: 8, max: 72 })
    .withMessage('Пароль должен содержать от 8 до 72 символов')
    .matches(/[A-Za-zА-Яа-я]/)
    .withMessage('Пароль должен содержать хотя бы одну букву')
    .matches(/\d/)
    .withMessage('Пароль должен содержать хотя бы одну цифру'),
  body('newPasswordConfirm')
    .custom((value, { req }) => value === req.body.newPassword)
    .withMessage('Пароли не совпадают'),
];

export const deleteAccountRules = [body('password').notEmpty().withMessage('Введите пароль для подтверждения')];

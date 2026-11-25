import { body } from 'express-validator';

export const registerRules = [
  body('username')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Имя пользователя должно содержать от 2 до 50 символов'),
  body('email')
    .trim()
    .toLowerCase()
    .isEmail()
    .withMessage('Введите корректный email'),
  body('password')
    .isLength({ min: 8, max: 72 })
    .withMessage('Пароль должен содержать от 8 до 72 символов')
    .matches(/[A-Za-zА-Яа-я]/)
    .withMessage('Пароль должен содержать хотя бы одну букву')
    .matches(/\d/)
    .withMessage('Пароль должен содержать хотя бы одну цифру'),
  body('passwordConfirm')
    .custom((value, { req }) => value === req.body.password)
    .withMessage('Пароли не совпадают'),
];

export const loginRules = [
  body('email').trim().toLowerCase().isEmail().withMessage('Введите корректный email'),
  body('password').notEmpty().withMessage('Введите пароль'),
];

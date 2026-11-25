import 'dotenv/config';

if (!process.env.JWT_SECRET) {
  throw new Error('Не задан JWT_SECRET в server/.env');
}

export const config = {
  port: process.env.PORT || 3000,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
};

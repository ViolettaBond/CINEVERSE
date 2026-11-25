import { param } from 'express-validator';

// Проверка числового параметра пути, например /:id или /:movieId
export const idParam = (name = 'id') =>
  param(name).isInt({ min: 1 }).withMessage('Некорректный идентификатор').toInt();

// Ссылка на изображение: либо http(s)-адрес, либо путь на этом сайте вида /posters/dune.svg
export function isHttpOrLocalUrl(value) {
  if (typeof value !== 'string') return false;
  const text = value.trim();
  if (text.startsWith('/') && !text.startsWith('//') && !/\s/.test(text)) return true;
  try {
    const url = new URL(text);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

import { HttpError } from '../utils/httpError.js';

export function notFound(req, res) {
  res.status(404).json({ message: 'Маршрут не найден' });
}

// Единая обработка ошибок: подробности пишем в консоль, пользователю — безопасный текст
export function errorHandler(error, req, res, next) {
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Некорректный JSON' });
  }
  if (error instanceof HttpError) {
    return res.status(error.status).json({ message: error.message });
  }
  console.error(error);
  res.status(500).json({ message: 'Внутренняя ошибка сервера' });
}

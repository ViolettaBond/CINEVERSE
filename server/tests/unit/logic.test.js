import { describe, expect, it } from 'vitest';
import { formatMovie } from '../../src/services/movie.service.js';
import { shouldNotify } from '../../src/services/notification.service.js';
import { HttpError } from '../../src/utils/httpError.js';
import { errorHandler } from '../../src/middleware/errorHandler.js';
import { adminRequired } from '../../src/middleware/auth.js';

describe('formatMovie', () => {
  it('преобразует рейтинг из строки в число', () => {
    expect(formatMovie({ id: 1, rating: '8.3' }).rating).toBe(8.3);
  });
  it('оставляет null, если оценок нет', () => {
    expect(formatMovie({ id: 1, rating: null }).rating).toBeNull();
  });
});

describe('shouldNotify', () => {
  const user = { notify_reviews: false, notify_collections: true };
  it('учитывает отключённые уведомления об отзывах', () => {
    expect(shouldNotify(user, 'review')).toBe(false);
  });
  it('учитывает включённые уведомления о подборках', () => {
    expect(shouldNotify(user, 'collection')).toBe(true);
  });
  it('системные уведомления приходят всегда', () => {
    expect(shouldNotify({ notify_reviews: false, notify_collections: false }, 'system')).toBe(true);
  });
});

function fakeResponse() {
  return {
    statusCode: null,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(data) { this.body = data; return this; },
  };
}

describe('errorHandler', () => {
  it('HttpError возвращает свой статус и сообщение', () => {
    const res = fakeResponse();
    errorHandler(new HttpError(404, 'Не найдено'), {}, res, () => {});
    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({ message: 'Не найдено' });
  });
  it('неожиданная ошибка не раскрывает подробности', () => {
    const res = fakeResponse();
    const original = console.error;
    console.error = () => {};
    errorHandler(new Error('secret db details'), {}, res, () => {});
    console.error = original;
    expect(res.statusCode).toBe(500);
    expect(JSON.stringify(res.body)).not.toContain('secret');
  });
  it('битый JSON даёт 400', () => {
    const res = fakeResponse();
    errorHandler({ type: 'entity.parse.failed' }, {}, res, () => {});
    expect(res.statusCode).toBe(400);
  });
});

describe('adminRequired', () => {
  it('пропускает администратора', () => {
    let error = 'not called';
    adminRequired({ user: { role: 'administrator' } }, {}, (e) => { error = e; });
    expect(error).toBeUndefined();
  });
  it('отклоняет обычного пользователя с 403', () => {
    let error;
    adminRequired({ user: { role: 'user' } }, {}, (e) => { error = e; });
    expect(error.status).toBe(403);
  });
  it('отклоняет запрос без пользователя', () => {
    let error;
    adminRequired({}, {}, (e) => { error = e; });
    expect(error.status).toBe(403);
  });
});

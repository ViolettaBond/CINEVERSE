import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { api, bearer, closeDatabase, createAdmin, registerUser, resetDatabase } from './helpers.js';

let admin;
let user;
let other;

beforeAll(async () => {
  await resetDatabase();
  admin = await createAdmin();
  user = await registerUser();
  other = await registerUser();
});
afterAll(closeDatabase);

describe('уведомления', () => {
  it('приветствие и события создаются автоматически', async () => {
    await api().post('/api/collections').set(bearer(user.token)).send({ name: 'Моя подборка' });
    const res = await api().get('/api/notifications').set(bearer(user.token));
    expect(res.body.items.map((n) => n.title)).toContain('Подборка создана');
    expect(res.body.unreadCount).toBe(res.body.items.length);
  });

  it('отмечает прочитанным, затем все прочитанными, затем удаляет', async () => {
    await api().post('/api/movies/1/reviews').set(bearer(user.token)).send({ text: 'Текст' });
    const list = (await api().get('/api/notifications').set(bearer(user.token))).body.items;
    expect((await api().patch(`/api/notifications/${list[0].id}/read`).set(bearer(user.token))).status).toBe(204);
    expect((await api().patch('/api/notifications/read-all').set(bearer(user.token))).status).toBe(204);
    const after = (await api().get('/api/notifications').set(bearer(user.token))).body;
    expect(after.unreadCount).toBe(0);
    expect((await api().delete(`/api/notifications/${list[0].id}`).set(bearer(user.token))).status).toBe(204);
  });

  it('нельзя трогать чужие уведомления', async () => {
    const list = (await api().get('/api/notifications').set(bearer(user.token))).body.items;
    expect((await api().patch(`/api/notifications/${list[0].id}/read`).set(bearer(other.token))).status).toBe(404);
    expect((await api().delete(`/api/notifications/${list[0].id}`).set(bearer(other.token))).status).toBe(404);
  });

  it('учитывает отключённые уведомления о подборках', async () => {
    await api().put('/api/users/me/settings').set(bearer(other.token)).send({ notifyReviews: true, notifyCollections: false });
    await api().post('/api/collections').set(bearer(other.token)).send({ name: 'Тихая подборка' });
    const res = await api().get('/api/notifications').set(bearer(other.token));
    expect(res.body.items).toEqual([]);
  });
});

describe('профиль и настройки', () => {
  it('считает статистику', async () => {
    await api().post('/api/watched').set(bearer(user.token)).send({ movieId: 1 });
    await api().post('/api/watched').set(bearer(user.token)).send({ movieId: 19 });
    const res = await api().get('/api/users/me/stats').set(bearer(user.token));
    expect(res.body).toMatchObject({ watchedMovies: 1, watchedSeries: 1, reviewsCount: 1, collectionsCount: 1 });
    expect(res.body.favoriteGenres.length).toBeGreaterThan(0);
    expect(res.body.lastActivity).toBeTruthy();
  });

  it('обновляет имя и аватар', async () => {
    const res = await api().put('/api/users/me').set(bearer(user.token)).send({ username: 'Новое имя', avatar: 'https://example.com/a.png' });
    expect(res.body.user).toMatchObject({ username: 'Новое имя', avatar: 'https://example.com/a.png' });
    expect(res.body.user.password_hash).toBeUndefined();
  });

  it('меняет пароль только при верном текущем', async () => {
    const wrong = await api().put('/api/users/me/password').set(bearer(user.token))
      .send({ currentPassword: 'Wrong123', newPassword: 'NewPass123', newPasswordConfirm: 'NewPass123' });
    expect(wrong.status).toBe(400);
    const ok = await api().put('/api/users/me/password').set(bearer(user.token))
      .send({ currentPassword: user.credentials.password, newPassword: 'NewPass123', newPasswordConfirm: 'NewPass123' });
    expect(ok.status).toBe(204);
    const login = await api().post('/api/auth/login').send({ email: user.credentials.email, password: 'NewPass123' });
    expect(login.status).toBe(200);
  });

  it('удаляет аккаунт после подтверждения паролем', async () => {
    const victim = await registerUser();
    expect((await api().delete('/api/users/me').set(bearer(victim.token)).send({ password: 'bad' })).status).toBe(400);
    expect((await api().delete('/api/users/me').set(bearer(victim.token)).send({ password: victim.credentials.password })).status).toBe(204);
    expect((await api().get('/api/auth/me').set(bearer(victim.token))).status).toBe(401);
  });
});

describe('проверка ролей на сервере', () => {
  const adminEndpoints = [
    ['get', '/api/admin/users'],
    ['get', '/api/admin/statistics'],
    ['get', '/api/admin/reviews'],
    ['patch', '/api/admin/users/1'],
    ['delete', '/api/admin/reviews/1'],
    ['post', '/api/movies'],
    ['put', '/api/movies/1'],
    ['delete', '/api/movies/1'],
    ['post', '/api/genres'],
    ['put', '/api/genres/1'],
    ['delete', '/api/genres/1'],
  ];

  it('все административные маршруты закрыты для обычного пользователя (403)', async () => {
    for (const [method, url] of adminEndpoints) {
      const res = await api()[method](url).set(bearer(other.token)).send({});
      expect(res.status, `${method} ${url}`).toBe(403);
    }
  });

  it('все административные маршруты закрыты без токена (401)', async () => {
    for (const [method, url] of adminEndpoints) {
      const res = await api()[method](url).send({});
      expect(res.status, `${method} ${url}`).toBe(401);
    }
  });
});

describe('администратор', () => {
  it('видит статистику и пользователей', async () => {
    const stats = await api().get('/api/admin/statistics').set(bearer(admin.token));
    expect(stats.body).toMatchObject({ movies: 18, series: 7, genres: 10 });
    const users = await api().get('/api/admin/users').set(bearer(admin.token));
    expect(users.body.every((u) => u.password_hash === undefined)).toBe(true);
  });

  it('блокирует пользователя, и тот сразу теряет доступ', async () => {
    const target = await registerUser();
    const res = await api().patch(`/api/admin/users/${target.user.id}`).set(bearer(admin.token)).send({ status: 'blocked' });
    expect(res.body.status).toBe('blocked');
    expect((await api().get('/api/auth/me').set(bearer(target.token))).status).toBe(403);
    const login = await api().post('/api/auth/login').send({ email: target.credentials.email, password: target.credentials.password });
    expect(login.status).toBe(403);
  });

  it('не может заблокировать сам себя', async () => {
    const res = await api().patch(`/api/admin/users/${admin.user.id}`).set(bearer(admin.token)).send({ status: 'blocked' });
    expect(res.status).toBe(400);
  });

  it('удаляет неподходящий отзыв и уведомляет автора', async () => {
    const author = await registerUser();
    const review = await api().post('/api/movies/3/reviews').set(bearer(author.token)).send({ text: 'Спам' });
    expect((await api().delete(`/api/admin/reviews/${review.body.id}`).set(bearer(admin.token))).status).toBe(204);
    const notes = await api().get('/api/notifications').set(bearer(author.token));
    expect(notes.body.items.map((n) => n.title)).toContain('Отзыв удалён модератором');
  });

  it('управляет жанрами', async () => {
    const created = await api().post('/api/genres').set(bearer(admin.token)).send({ name: 'Мюзикл' });
    expect(created.status).toBe(201);
    expect((await api().post('/api/genres').set(bearer(admin.token)).send({ name: 'Мюзикл' })).status).toBe(409);
    const renamed = await api().put(`/api/genres/${created.body.id}`).set(bearer(admin.token)).send({ name: 'Мюзиклы' });
    expect(renamed.body.name).toBe('Мюзиклы');
    expect((await api().delete(`/api/genres/${created.body.id}`).set(bearer(admin.token))).status).toBe(204);
  });

  it('управляет фильмами: создание, изменение, удаление', async () => {
    const genres = (await api().get('/api/genres')).body;
    const payload = {
      title: 'Тестовый фильм', type: 'movie', releaseYear: 2024, duration: 100,
      posterUrl: '/posters/test.svg', genreIds: [genres[0].id],
    };
    const created = await api().post('/api/movies').set(bearer(admin.token)).send(payload);
    expect(created.status).toBe(201);
    expect(created.body.genres).toHaveLength(1);
    expect(created.body.poster_url).toBe('/posters/test.svg');
    expect((await api().post('/api/movies').set(bearer(admin.token)).send(payload)).status).toBe(409);

    const updated = await api().put(`/api/movies/${created.body.id}`).set(bearer(admin.token)).send({ ...payload, title: 'Изменённый', genreIds: [] });
    expect(updated.body.title).toBe('Изменённый');
    expect(updated.body.genres).toEqual([]);

    expect((await api().delete(`/api/movies/${created.body.id}`).set(bearer(admin.token))).status).toBe(204);
    expect((await api().get(`/api/movies/${created.body.id}`)).status).toBe(404);
  });

  it('отклоняет неверные данные фильма', async () => {
    const res = await api().post('/api/movies').set(bearer(admin.token)).send({ title: '', type: 'x', releaseYear: 1500 });
    expect(res.status).toBe(400);
  });
});

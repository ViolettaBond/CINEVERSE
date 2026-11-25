import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { api, bearer, closeDatabase, registerUser, resetDatabase } from './helpers.js';

let alice;
let bob;
let reviewId;

beforeAll(async () => {
  await resetDatabase();
  alice = await registerUser();
  bob = await registerUser();
});
afterAll(closeDatabase);

describe('оценки', () => {
  it('ставит оценку и пересчитывает среднюю', async () => {
    const a = await api().post('/api/movies/1/ratings').set(bearer(alice.token)).send({ rating: 8 });
    expect(a.status).toBe(201);
    const b = await api().post('/api/movies/1/ratings').set(bearer(bob.token)).send({ rating: 9 });
    expect(b.body).toMatchObject({ average: 8.5, count: 2, userRating: 9 });
  });

  it('не допускает вторую оценку через POST, но разрешает изменить через PUT', async () => {
    expect((await api().post('/api/movies/1/ratings').set(bearer(alice.token)).send({ rating: 5 })).status).toBe(409);
    const res = await api().put('/api/movies/1/ratings').set(bearer(alice.token)).send({ rating: 10 });
    expect(res.body.userRating).toBe(10);
    expect(res.body.average).toBe(9.5);
  });

  it('проверяет диапазон оценки', async () => {
    expect((await api().put('/api/movies/1/ratings').set(bearer(alice.token)).send({ rating: 11 })).status).toBe(400);
  });

  it('PUT без существующей оценки возвращает 404', async () => {
    expect((await api().put('/api/movies/2/ratings').set(bearer(alice.token)).send({ rating: 5 })).status).toBe(404);
  });

  it('GET без токена не содержит личной оценки', async () => {
    const res = await api().get('/api/movies/1/ratings');
    expect(res.body.userRating).toBeNull();
  });

  it('требует авторизацию для оценки', async () => {
    expect((await api().post('/api/movies/1/ratings').send({ rating: 5 })).status).toBe(401);
  });
});

describe('отзывы', () => {
  it('создаёт отзыв', async () => {
    const res = await api().post('/api/movies/1/reviews').set(bearer(alice.token)).send({ text: 'Отличный фильм' });
    expect(res.status).toBe(201);
    reviewId = res.body.id;
  });

  it('не допускает второй отзыв того же пользователя', async () => {
    const res = await api().post('/api/movies/1/reviews').set(bearer(alice.token)).send({ text: 'Ещё один' });
    expect(res.status).toBe(409);
  });

  it('отклоняет пустой текст', async () => {
    expect((await api().post('/api/movies/2/reviews').set(bearer(alice.token)).send({ text: '   ' })).status).toBe(400);
  });

  it('показывает отзывы с именем автора и оценкой', async () => {
    const res = await api().get('/api/movies/1/reviews');
    expect(res.body[0]).toMatchObject({ username: expect.any(String), rating: 10, text: 'Отличный фильм' });
    expect(res.body[0].email).toBeUndefined();
  });

  it('автор редактирует свой отзыв', async () => {
    const res = await api().put(`/api/reviews/${reviewId}`).set(bearer(alice.token)).send({ text: 'Обновлённый отзыв' });
    expect(res.status).toBe(200);
    expect(res.body.text).toBe('Обновлённый отзыв');
  });

  it('другой пользователь не может изменить или удалить чужой отзыв', async () => {
    expect((await api().put(`/api/reviews/${reviewId}`).set(bearer(bob.token)).send({ text: 'Взлом' })).status).toBe(403);
    expect((await api().delete(`/api/reviews/${reviewId}`).set(bearer(bob.token))).status).toBe(403);
  });

  it('«Мои отзывы» содержат только свои', async () => {
    const mine = await api().get('/api/reviews').set(bearer(alice.token));
    expect(mine.body).toHaveLength(1);
    expect(mine.body[0].movie_title).toBe('Начало');
    expect((await api().get('/api/reviews').set(bearer(bob.token))).body).toEqual([]);
  });

  it('автор удаляет отзыв', async () => {
    expect((await api().delete(`/api/reviews/${reviewId}`).set(bearer(alice.token))).status).toBe(204);
    expect((await api().get('/api/movies/1/reviews')).body).toEqual([]);
  });
});

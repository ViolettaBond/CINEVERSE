import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { api, bearer, closeDatabase, registerUser, resetDatabase } from './helpers.js';

let owner;
let stranger;
let collectionId;

beforeAll(async () => {
  await resetDatabase();
  owner = await registerUser();
  stranger = await registerUser();
});
afterAll(closeDatabase);

describe('подборки', () => {
  it('требуют авторизацию', async () => {
    expect((await api().get('/api/collections')).status).toBe(401);
  });

  it('создаёт подборку', async () => {
    const res = await api().post('/api/collections').set(bearer(owner.token))
      .send({ name: 'Любимая фантастика', description: 'Лучшее', coverUrl: '' });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Любимая фантастика');
    expect(res.body.cover_url).toBeNull();
    collectionId = res.body.id;
  });

  it('проверяет название и ссылку на обложку', async () => {
    expect((await api().post('/api/collections').set(bearer(owner.token)).send({ name: '' })).status).toBe(400);
    const badUrl = await api().post('/api/collections').set(bearer(owner.token)).send({ name: 'X', coverUrl: 'javascript:alert(1)' });
    expect(badUrl.status).toBe(400);
  });

  it('добавляет фильмы и не допускает дубликатов', async () => {
    const add = await api().post(`/api/collections/${collectionId}/movies`).set(bearer(owner.token)).send({ movieId: 1 });
    expect(add.status).toBe(201);
    const dup = await api().post(`/api/collections/${collectionId}/movies`).set(bearer(owner.token)).send({ movieId: 1 });
    expect(dup.status).toBe(409);
    const missing = await api().post(`/api/collections/${collectionId}/movies`).set(bearer(owner.token)).send({ movieId: 9999 });
    expect(missing.status).toBe(404);
  });

  it('показывает подборку с фильмами и счётчиком', async () => {
    const one = await api().get(`/api/collections/${collectionId}`).set(bearer(owner.token));
    expect(one.body.movies.map((m) => m.id)).toEqual([1]);
    const list = await api().get('/api/collections').set(bearer(owner.token));
    expect(list.body[0].movies_count).toBe(1);
  });

  it('скрывает подборку от других пользователей', async () => {
    const t = bearer(stranger.token);
    expect((await api().get(`/api/collections/${collectionId}`).set(t)).status).toBe(404);
    expect((await api().put(`/api/collections/${collectionId}`).set(t).send({ name: 'Взлом' })).status).toBe(404);
    expect((await api().delete(`/api/collections/${collectionId}`).set(t)).status).toBe(404);
    expect((await api().post(`/api/collections/${collectionId}/movies`).set(t).send({ movieId: 2 })).status).toBe(404);
    expect((await api().get('/api/collections').set(t)).body).toEqual([]);
  });

  it('редактирует подборку', async () => {
    const res = await api().put(`/api/collections/${collectionId}`).set(bearer(owner.token)).send({ name: 'Фантастика 2' });
    expect(res.body.name).toBe('Фантастика 2');
  });

  it('удаляет фильм из подборки', async () => {
    expect((await api().delete(`/api/collections/${collectionId}/movies/1`).set(bearer(owner.token))).status).toBe(204);
    expect((await api().delete(`/api/collections/${collectionId}/movies/1`).set(bearer(owner.token))).status).toBe(404);
  });

  it('удаляет подборку', async () => {
    expect((await api().delete(`/api/collections/${collectionId}`).set(bearer(owner.token))).status).toBe(204);
    expect((await api().get(`/api/collections/${collectionId}`).set(bearer(owner.token))).status).toBe(404);
  });
});

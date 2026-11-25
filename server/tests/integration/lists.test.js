import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { api, bearer, closeDatabase, registerUser, resetDatabase } from './helpers.js';

// Три личных списка работают одинаково, поэтому каждая проверка выполняется для всех трёх
const LISTS = ['favorites', 'watchlist', 'watched'];
// Для каждого списка свой фильм: «Просмотренное» убирает фильм из «Посмотреть позже»
const MOVIE = { favorites: 2, watchlist: 3, watched: 4 };

let alice;
let bob;

beforeAll(async () => {
  await resetDatabase();
  alice = await registerUser();
  bob = await registerUser();
});
afterAll(closeDatabase);

describe('личные списки: избранное, посмотреть позже, просмотренное', () => {
  it('требуют авторизацию', async () => {
    for (const list of LISTS) {
      expect((await api().get(`/api/${list}`)).status, list).toBe(401);
    }
  });

  it('добавляют фильм, показывают его и не допускают дубликатов', async () => {
    for (const list of LISTS) {
      const add = await api().post(`/api/${list}`).set(bearer(alice.token)).send({ movieId: MOVIE[list] });
      expect(add.status, list).toBe(201);
      const res = await api().get(`/api/${list}`).set(bearer(alice.token));
      expect(res.body.map((m) => m.id), list).toContain(MOVIE[list]);
      const dup = await api().post(`/api/${list}`).set(bearer(alice.token)).send({ movieId: MOVIE[list] });
      expect(dup.status, list).toBe(409);
    }
  });

  it('проверяют номер фильма', async () => {
    for (const list of LISTS) {
      expect((await api().post(`/api/${list}`).set(bearer(alice.token)).send({ movieId: 9999 })).status).toBe(404);
      expect((await api().post(`/api/${list}`).set(bearer(alice.token)).send({ movieId: 'abc' })).status).toBe(400);
    }
  });

  it('не показывают и не удаляют данные другого пользователя', async () => {
    for (const list of LISTS) {
      expect((await api().get(`/api/${list}`).set(bearer(bob.token))).body, list).toEqual([]);
      expect((await api().delete(`/api/${list}/${MOVIE[list]}`).set(bearer(bob.token))).status, list).toBe(404);
      const still = await api().get(`/api/${list}`).set(bearer(alice.token));
      expect(still.body.map((m) => m.id), list).toContain(MOVIE[list]);
    }
  });

  it('удаляют свою запись', async () => {
    for (const list of LISTS) {
      expect((await api().delete(`/api/${list}/${MOVIE[list]}`).set(bearer(alice.token))).status, list).toBe(204);
      expect((await api().delete(`/api/${list}/${MOVIE[list]}`).set(bearer(alice.token))).status, list).toBe(404);
    }
  });

  it('поддерживают поиск и сортировку', async () => {
    for (const id of [1, 3, 5]) await api().post('/api/favorites').set(bearer(alice.token)).send({ movieId: id });
    const search = await api().get('/api/favorites').query({ q: 'побег' }).set(bearer(alice.token));
    expect(search.body.map((m) => m.title)).toEqual(['Побег из Шоушенка']);
    const sorted = await api().get('/api/favorites').query({ sort: 'year', order: 'asc' }).set(bearer(alice.token));
    const years = sorted.body.map((m) => m.release_year);
    expect(years).toEqual([...years].sort((a, b) => a - b));
  });

  it('«Просмотренное» убирает фильм из «Посмотреть позже» (транзакция)', async () => {
    await api().post('/api/watchlist').set(bearer(bob.token)).send({ movieId: 7 });
    await api().post('/api/watched').set(bearer(bob.token)).send({ movieId: 7 });
    const watchlist = await api().get('/api/watchlist').set(bearer(bob.token));
    const watched = await api().get('/api/watched').set(bearer(bob.token));
    expect(watchlist.body.map((m) => m.id)).not.toContain(7);
    expect(watched.body.map((m) => m.id)).toContain(7);
  });
});

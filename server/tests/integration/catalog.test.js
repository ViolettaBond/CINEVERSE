import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { api, bearer, closeDatabase, registerUser, resetDatabase } from './helpers.js';

beforeAll(resetDatabase);
afterAll(closeDatabase);

describe('GET /api/movies', () => {
  it('возвращает первую страницу каталога с пагинацией', async () => {
    const res = await api().get('/api/movies');
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(25);
    expect(res.body.items).toHaveLength(12);
    expect(res.body.totalPages).toBe(3);
  });

  it('ищет по названию без учёта регистра', async () => {
    const res = await api().get('/api/movies').query({ q: 'нАчАл' });
    expect(res.body.items.map((m) => m.title)).toEqual(['Начало']);
  });

  it('ищет по оригинальному названию', async () => {
    const res = await api().get('/api/movies').query({ q: 'dark knight' });
    expect(res.body.items[0].title).toBe('Тёмный рыцарь');
  });

  it('символ % в поиске ищется как обычный текст', async () => {
    const res = await api().get('/api/movies').query({ q: '%' });
    expect(res.body.total).toBe(0);
  });

  it('безопасно обрабатывает попытку SQL-инъекции', async () => {
    const res = await api().get('/api/movies').query({ q: "'; DROP TABLE movies; --" });
    expect(res.status).toBe(200);
    const after = await api().get('/api/movies');
    expect(after.body.total).toBe(25);
  });

  it('фильтрует по типу', async () => {
    const res = await api().get('/api/movies').query({ type: 'series', limit: 50 });
    expect(res.body.total).toBe(7);
    expect(res.body.items.every((m) => m.type === 'series')).toBe(true);
  });

  it('фильтрует по жанру', async () => {
    const genres = (await api().get('/api/genres')).body;
    const animation = genres.find((g) => g.name === 'Анимация');
    const res = await api().get('/api/movies').query({ genre: animation.id, limit: 50 });
    expect(res.body.items.map((m) => m.title).sort()).toEqual(['Аркейн', 'Тайна Коко', 'Унесённые призраками'].sort());
  });

  it('фильтрует по диапазону годов', async () => {
    const res = await api().get('/api/movies').query({ yearFrom: 2010, yearTo: 2014, limit: 50 });
    expect(res.body.items.length).toBeGreaterThan(0);
    expect(res.body.items.every((m) => m.release_year >= 2010 && m.release_year <= 2014)).toBe(true);
  });

  it('сортирует по году по убыванию', async () => {
    const res = await api().get('/api/movies').query({ sort: 'year', order: 'desc', limit: 50 });
    const years = res.body.items.map((m) => m.release_year);
    expect(years).toEqual([...years].sort((a, b) => b - a));
  });

  it('фильтрует и сортирует по среднему рейтингу', async () => {
    const { token } = await registerUser();
    await api().post('/api/movies/1/ratings').set(bearer(token)).send({ rating: 10 });
    const res = await api().get('/api/movies').query({ ratingMin: 9, sort: 'rating', order: 'desc' });
    expect(res.body.items.map((m) => m.id)).toEqual([1]);
    expect(res.body.items[0].rating).toBe(10);
  });

  it('возвращает пустой список, если ничего не найдено', async () => {
    const res = await api().get('/api/movies').query({ q: 'zzzzzz' });
    expect(res.body).toMatchObject({ total: 0, items: [], totalPages: 0 });
  });

  it('отклоняет неверные параметры', async () => {
    expect((await api().get('/api/movies').query({ sort: 'id;drop' })).status).toBe(400);
    expect((await api().get('/api/movies').query({ limit: 1000 })).status).toBe(400);
  });
});

describe('GET /api/movies/:id', () => {
  it('возвращает фильм с жанрами и похожими фильмами', async () => {
    const res = await api().get('/api/movies/1');
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Начало');
    expect(res.body.genres.length).toBeGreaterThan(0);
    expect(res.body.similar.length).toBeGreaterThan(0);
    expect(res.body.similar.some((m) => m.id === 1)).toBe(false);
  });

  it('возвращает 404 для несуществующего фильма', async () => {
    expect((await api().get('/api/movies/9999')).status).toBe(404);
  });

  it('возвращает 400 для некорректного номера', async () => {
    expect((await api().get('/api/movies/abc')).status).toBe(400);
  });
});

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { api, bearer, closeDatabase, registerUser, resetDatabase } from './helpers.js';

beforeAll(resetDatabase);
afterAll(closeDatabase);

describe('POST /api/auth/register', () => {
  it('создаёт пользователя и возвращает токен без password_hash', async () => {
    const res = await api().post('/api/auth/register').send({
      username: 'Иван', email: 'ivan@test.local', password: 'Secret123', passwordConfirm: 'Secret123',
    });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.email).toBe('ivan@test.local');
    expect(res.body.user.role).toBe('user');
    expect(res.body.user.password_hash).toBeUndefined();
  });

  it('не позволяет зарегистрировать email повторно (без учёта регистра)', async () => {
    const res = await api().post('/api/auth/register').send({
      username: 'Иван 2', email: 'IVAN@test.local', password: 'Secret123', passwordConfirm: 'Secret123',
    });
    expect(res.status).toBe(409);
  });

  it('возвращает 400 при неверных данных', async () => {
    const res = await api().post('/api/auth/register').send({ username: 'И', email: 'x', password: '1', passwordConfirm: '2' });
    expect(res.status).toBe(400);
    expect(res.body.errors.length).toBeGreaterThan(1);
  });
});

describe('POST /api/auth/login', () => {
  it('входит с верными данными', async () => {
    const res = await api().post('/api/auth/login').send({ email: 'ivan@test.local', password: 'Secret123' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
  });

  it('одинаково отвечает на неверный пароль и неизвестный email', async () => {
    const wrongPassword = await api().post('/api/auth/login').send({ email: 'ivan@test.local', password: 'Wrong123' });
    const unknownEmail = await api().post('/api/auth/login').send({ email: 'nobody@test.local', password: 'Secret123' });
    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(wrongPassword.body.message).toBe(unknownEmail.body.message);
  });
});

describe('GET /api/auth/me', () => {
  it('возвращает текущего пользователя по токену', async () => {
    const { token } = await registerUser();
    const res = await api().get('/api/auth/me').set(bearer(token));
    expect(res.status).toBe(200);
    expect(res.body.user.password_hash).toBeUndefined();
  });

  it('требует токен', async () => {
    expect((await api().get('/api/auth/me')).status).toBe(401);
  });

  it('отклоняет поддельный токен', async () => {
    expect((await api().get('/api/auth/me').set(bearer('abc.def.ghi'))).status).toBe(401);
  });
});

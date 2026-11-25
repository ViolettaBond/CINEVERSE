import { describe, expect, it } from 'vitest';
import { validationResult } from 'express-validator';
import { registerRules } from '../../src/validators/auth.validator.js';
import { ratingRules } from '../../src/validators/review.validator.js';
import { movieListRules } from '../../src/validators/movie.validator.js';

// Запускает правила на «поддельном» запросе и возвращает список полей с ошибками
async function run(rules, req) {
  for (const rule of rules) await rule.run(req);
  return validationResult(req).array().map((e) => e.path);
}

const validRegistration = {
  username: 'Иван',
  email: 'ivan@test.com',
  password: 'Secret123',
  passwordConfirm: 'Secret123',
};

describe('валидация регистрации', () => {
  it('корректные данные проходят', async () => {
    expect(await run(registerRules, { body: { ...validRegistration } })).toEqual([]);
  });
  it('отклоняет неверный email', async () => {
    expect(await run(registerRules, { body: { ...validRegistration, email: 'abc' } })).toContain('email');
  });
  it('отклоняет короткий пароль', async () => {
    const body = { ...validRegistration, password: 'a1', passwordConfirm: 'a1' };
    expect(await run(registerRules, { body })).toContain('password');
  });
  it('требует цифру в пароле', async () => {
    const body = { ...validRegistration, password: 'OnlyLetters', passwordConfirm: 'OnlyLetters' };
    expect(await run(registerRules, { body })).toContain('password');
  });
  it('требует букву в пароле', async () => {
    const body = { ...validRegistration, password: '12345678', passwordConfirm: '12345678' };
    expect(await run(registerRules, { body })).toContain('password');
  });
  it('отклоняет несовпадающие пароли', async () => {
    const body = { ...validRegistration, passwordConfirm: 'Other123' };
    expect(await run(registerRules, { body })).toContain('passwordConfirm');
  });
  it('отклоняет слишком короткое имя', async () => {
    expect(await run(registerRules, { body: { ...validRegistration, username: 'И' } })).toContain('username');
  });
  it('приводит email к нижнему регистру', async () => {
    const req = { body: { ...validRegistration, email: ' Ivan@Test.COM ' } };
    await run(registerRules, req);
    expect(req.body.email).toBe('ivan@test.com');
  });
});

describe('валидация оценки', () => {
  it.each([1, 5, 10, '7'])('принимает %s', async (rating) => {
    expect(await run(ratingRules, { body: { rating }, params: { id: '1' } })).toEqual([]);
  });
  it.each([0, 11, -1, 2.5, 'abc'])('отклоняет %s', async (rating) => {
    expect(await run(ratingRules, { body: { rating }, params: { id: '1' } })).toContain('rating');
  });
});

describe('валидация параметров каталога', () => {
  it('пустой запрос допустим', async () => {
    expect(await run(movieListRules, { query: {} })).toEqual([]);
  });
  it('отклоняет неизвестную сортировку', async () => {
    expect(await run(movieListRules, { query: { sort: 'id;drop' } })).toContain('sort');
  });
  it('отклоняет слишком большой limit', async () => {
    expect(await run(movieListRules, { query: { limit: '1000' } })).toContain('limit');
  });
  it('отклоняет неверный список жанров', async () => {
    expect(await run(movieListRules, { query: { genre: '1;2' } })).toContain('genre');
  });
  it('отклоняет yearTo меньше yearFrom', async () => {
    expect(await run(movieListRules, { query: { yearFrom: '2020', yearTo: '2010' } })).toContain('yearTo');
  });
});

import { describe, expect, it } from 'vitest';
import { validationResult } from 'express-validator';
import { loginRules } from '../../src/validators/auth.validator.js';
import { collectionBodyRules } from '../../src/validators/collection.validator.js';
import { reviewTextRules } from '../../src/validators/review.validator.js';
import { passwordRules, profileRules, settingsRules } from '../../src/validators/user.validator.js';
import { genreRules, movieBodyRules, updateUserRules } from '../../src/validators/admin.validator.js';

async function run(rules, req) {
  for (const rule of rules) await rule.run(req);
  return validationResult(req).array().map((e) => e.path);
}

describe('валидация входа', () => {
  it('принимает email и пароль', async () => {
    expect(await run(loginRules, { body: { email: 'a@b.co', password: 'x' } })).toEqual([]);
  });
  it('требует пароль', async () => {
    expect(await run(loginRules, { body: { email: 'a@b.co', password: '' } })).toContain('password');
  });
  it('требует корректный email', async () => {
    expect(await run(loginRules, { body: { email: 'abc', password: 'x' } })).toContain('email');
  });
});

describe('валидация подборки', () => {
  it('принимает название и корректную ссылку', async () => {
    const body = { name: 'Фантастика', coverUrl: 'https://example.com/a.jpg' };
    expect(await run(collectionBodyRules, { body })).toEqual([]);
  });
  it('пустая ссылка на обложку допустима', async () => {
    expect(await run(collectionBodyRules, { body: { name: 'A', coverUrl: '' } })).toEqual([]);
  });
  it('отклоняет пустое название', async () => {
    expect(await run(collectionBodyRules, { body: { name: '  ' } })).toContain('name');
  });
  it('отклоняет слишком длинное название', async () => {
    expect(await run(collectionBodyRules, { body: { name: 'x'.repeat(101) } })).toContain('name');
  });
  it('отклоняет небезопасную ссылку', async () => {
    expect(await run(collectionBodyRules, { body: { name: 'A', coverUrl: 'javascript:alert(1)' } })).toContain('coverUrl');
  });
});

describe('валидация отзыва', () => {
  it('принимает обычный текст', async () => {
    expect(await run(reviewTextRules, { body: { text: 'Хороший фильм' } })).toEqual([]);
  });
  it('отклоняет пустой текст и пробелы', async () => {
    expect(await run(reviewTextRules, { body: { text: '   ' } })).toContain('text');
  });
  it('отклоняет слишком длинный текст', async () => {
    expect(await run(reviewTextRules, { body: { text: 'a'.repeat(5001) } })).toContain('text');
  });
});

describe('валидация профиля и настроек', () => {
  it('принимает имя и аватар-ссылку', async () => {
    expect(await run(profileRules, { body: { username: 'Анна', avatar: 'https://x.io/a.png' } })).toEqual([]);
  });
  it('отклоняет аватар не-ссылку', async () => {
    expect(await run(profileRules, { body: { username: 'Анна', avatar: 'file.png' } })).toContain('avatar');
  });
  it('настройки должны быть логическими значениями', async () => {
    expect(await run(settingsRules, { body: { notifyReviews: 'maybe', notifyCollections: true } })).toContain('notifyReviews');
  });
  it('настройки приводятся к boolean', async () => {
    const req = { body: { notifyReviews: 'false', notifyCollections: 'true' } };
    await run(settingsRules, req);
    expect(req.body).toEqual({ notifyReviews: false, notifyCollections: true });
  });
  it('смена пароля: проверяет совпадение и сложность', async () => {
    const bad = { currentPassword: 'x', newPassword: 'short', newPasswordConfirm: 'other' };
    const fields = await run(passwordRules, { body: bad });
    expect(fields).toContain('newPassword');
    expect(fields).toContain('newPasswordConfirm');
  });
});

describe('валидация администратора', () => {
  it('для пользователя нужен status или role', async () => {
    expect(await run(updateUserRules, { params: { id: '1' }, body: {} })).toContain('');
  });
  it('допускает только известные статусы и роли', async () => {
    const fields = await run(updateUserRules, { params: { id: '1' }, body: { status: 'banned', role: 'root' } });
    expect(fields).toEqual(expect.arrayContaining(['status', 'role']));
  });
  it('жанр: от 2 до 50 символов', async () => {
    expect(await run(genreRules, { body: { name: 'Я' } })).toContain('name');
    expect(await run(genreRules, { body: { name: 'Мюзикл' } })).toEqual([]);
  });
  it('фильм: проверяет тип, год и ссылки', async () => {
    const bad = { title: '', type: 'game', releaseYear: 1500, posterUrl: 'not-a-url' };
    const fields = await run(movieBodyRules, { body: bad });
    expect(fields).toEqual(expect.arrayContaining(['title', 'type', 'releaseYear', 'posterUrl']));
  });
  it('фильм: постер может быть http-ссылкой или локальным путём', async () => {
    const base = { title: 'Фильм', type: 'movie', releaseYear: 2020 };
    expect(await run(movieBodyRules, { body: { ...base, posterUrl: '/posters/dune.svg' } })).toEqual([]);
    expect(await run(movieBodyRules, { body: { ...base, posterUrl: 'https://example.com/a.jpg' } })).toEqual([]);
  });
  it('фильм: отклоняет опасные и некорректные ссылки на постер', async () => {
    const base = { title: 'Фильм', type: 'movie', releaseYear: 2020 };
    for (const posterUrl of ['javascript:alert(1)', '//evil.com/a.png', '/pos ter.svg', 'dune.svg']) {
      expect(await run(movieBodyRules, { body: { ...base, posterUrl } }), posterUrl).toContain('posterUrl');
    }
  });
  it('фильм: корректные данные проходят', async () => {
    const ok = { title: 'Фильм', type: 'movie', releaseYear: 2020, duration: 100, genreIds: [1, 2] };
    expect(await run(movieBodyRules, { body: ok })).toEqual([]);
  });
});

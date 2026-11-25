import { describe, expect, it } from 'vitest';
import { emptyToNull, escapeLike, getPagination, parseIdList } from '../../src/utils/query.js';

describe('escapeLike', () => {
  it('экранирует % и _', () => {
    expect(escapeLike('100%')).toBe('100\\%');
    expect(escapeLike('a_b')).toBe('a\\_b');
  });
  it('экранирует обратную косую черту', () => {
    expect(escapeLike('a\\b')).toBe('a\\\\b');
  });
  it('обычный текст не меняет', () => {
    expect(escapeLike('Начало')).toBe('Начало');
  });
});

describe('parseIdList', () => {
  it('разбирает список номеров', () => {
    expect(parseIdList('1,4,7')).toEqual([1, 4, 7]);
  });
  it('пустая строка и undefined дают пустой список', () => {
    expect(parseIdList('')).toEqual([]);
    expect(parseIdList(undefined)).toEqual([]);
  });
  it('отбрасывает некорректные значения', () => {
    expect(parseIdList('1,abc,-3,0,2.5,5')).toEqual([1, 5]);
  });
});

describe('getPagination', () => {
  it('значения по умолчанию', () => {
    expect(getPagination()).toEqual({ page: 1, limit: 12, offset: 0 });
  });
  it('считает смещение', () => {
    expect(getPagination(3, 10)).toEqual({ page: 3, limit: 10, offset: 20 });
  });
  it('ограничивает размер страницы сверху', () => {
    expect(getPagination(1, 1000).limit).toBe(50);
  });
  it('не допускает страницу меньше 1', () => {
    expect(getPagination(-5, 10).page).toBe(1);
    expect(getPagination('abc', 10).page).toBe(1);
  });
});

describe('emptyToNull', () => {
  it('пустые значения превращает в null', () => {
    expect(emptyToNull('')).toBeNull();
    expect(emptyToNull('   ')).toBeNull();
    expect(emptyToNull(undefined)).toBeNull();
    expect(emptyToNull(null)).toBeNull();
  });
  it('обрезает пробелы у текста', () => {
    expect(emptyToNull('  текст ')).toBe('текст');
  });
});

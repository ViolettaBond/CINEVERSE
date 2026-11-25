// Небольшие чистые функции для разбора параметров запроса.
// Они не обращаются к базе данных, поэтому легко проверяются Unit-тестами.

// Экранирует символы %, _ и \ , чтобы поиск ILIKE искал их как обычный текст
export function escapeLike(text) {
  return text.replace(/[\\%_]/g, '\\$&');
}

// '1,4,7' -> [1, 4, 7]
export function parseIdList(text) {
  if (!text) return [];
  return text
    .split(',')
    .map((part) => Number(part))
    .filter((id) => Number.isInteger(id) && id > 0);
}

// Номер страницы и размер -> LIMIT / OFFSET
export function getPagination(page = 1, limit = 12) {
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(50, Math.max(1, Number(limit) || 12));
  return { page: safePage, limit: safeLimit, offset: (safePage - 1) * safeLimit };
}

// Пустую строку из формы превращаем в null, чтобы в БД не попадали пустые значения
export function emptyToNull(value) {
  if (value === undefined || value === null) return null;
  const text = String(value).trim();
  return text === '' ? null : text;
}

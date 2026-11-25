import { ensureTestDatabase } from '../src/database/prepareTestDb.js';

// Выполняется один раз перед всеми тестами: создаёт тестовую БД, если её нет
export default async function setup() {
  await ensureTestDatabase();
}

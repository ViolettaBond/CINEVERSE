import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Интеграционные тесты используют отдельную БД cineverse_test
    env: {
      DB_NAME: 'cineverse_test',
      JWT_SECRET: 'test-secret-only-for-tests',
      SEED_ADMIN_PASSWORD: 'AdminPass123',
      SEED_USER_PASSWORD: 'UserPass123',
    },
    globalSetup: ['./tests/globalSetup.js'],
    // Тесты используют одну БД, поэтому файлы запускаются по очереди
    fileParallelism: false,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.js'],
      exclude: ['src/database/seed.js', 'src/database/migrate.js', 'src/database/prepareTestDb.js'],
    },
  },
});

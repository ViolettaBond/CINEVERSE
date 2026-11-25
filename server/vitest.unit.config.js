import { defineConfig } from 'vitest/config';

// Unit-тесты не обращаются к базе данных и запускаются без Docker
export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.js'],
    env: { JWT_SECRET: 'test-secret-only-for-tests' },
  },
});

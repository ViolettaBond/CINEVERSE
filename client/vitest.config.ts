import { defineConfig } from 'vitest/config'

// Unit-тесты frontend: проверяют чистые функции (форматирование, валидация, фильтры)
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
    coverage: {
      provider: 'v8',
      // Покрытие считаем для логики, которая тестируется Unit-тестами; компоненты проверяются E2E
      include: ['src/utils/**/*.ts', 'src/services/api.ts'],
      exclude: ['src/**/*.test.ts'],
    },
  },
})

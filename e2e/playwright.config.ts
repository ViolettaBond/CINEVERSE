import { defineConfig } from '@playwright/test'

// E2E-тесты используют ОТДЕЛЬНУЮ базу cineverse_test и отдельные порты,
// поэтому рабочие данные в базе cineverse не затрагиваются.
const dbEnv = {
  DB_HOST: process.env.DB_HOST ?? 'localhost',
  DB_PORT: process.env.DB_PORT ?? '5435',
  DB_USER: process.env.DB_USER ?? 'cineverse',
  DB_PASSWORD: process.env.DB_PASSWORD ?? 'cineverse_dev',
  DB_NAME: 'cineverse_test',
  JWT_SECRET: 'e2e-secret-only-for-tests',
  SEED_ADMIN_PASSWORD: 'E2eAdminPass123',
  SEED_USER_PASSWORD: 'E2eUserPass123',
}

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  workers: 1, // сценарии используют одну базу
  retries: 0,
  reporter: [['list']],
  globalSetup: './global-setup.ts',
  use: {
    baseURL: 'http://localhost:5174',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
  webServer: [
    {
      command: 'npm run start',
      cwd: '../server',
      url: 'http://localhost:3001/api/health',
      env: { ...dbEnv, PORT: '3001' },
      reuseExistingServer: false,
      timeout: 60_000,
    },
    {
      command: 'npm run dev',
      cwd: '../client',
      url: 'http://localhost:5174',
      env: { API_URL: 'http://localhost:3001', CLIENT_PORT: '5174' },
      reuseExistingServer: false,
      timeout: 60_000,
    },
  ],
})

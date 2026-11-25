import { execFileSync } from 'node:child_process'
import path from 'node:path'

// Перед E2E: создаём тестовую БД, схему и демо-данные (25 фильмов, пользователи demo и admin)
export default function globalSetup() {
  execFileSync('node', ['src/database/prepareTestDb.js'], {
    cwd: path.resolve(__dirname, '../server'),
    stdio: 'inherit',
    env: {
      ...process.env,
      SEED_ADMIN_PASSWORD: 'E2eAdminPass123',
      SEED_USER_PASSWORD: 'E2eUserPass123',
      JWT_SECRET: 'e2e-secret-only-for-tests',
    },
  })
}

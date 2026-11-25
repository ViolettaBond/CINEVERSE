import { expect, test, type Page } from '@playwright/test'

const DEMO = { email: 'demo@cineverse.local', password: 'E2eUserPass123' }

async function login(page: Page, email = DEMO.email, password = DEMO.password) {
  await page.goto('/login')
  await page.locator('#email').fill(email)
  await page.locator('#password').fill(password)
  await page.getByRole('button', { name: 'Войти' }).click()
  await expect(page.getByRole('searchbox', { name: 'Поиск фильмов' })).toBeVisible()
}

test('1. регистрация нового пользователя', async ({ page }) => {
  const email = `e2e${Date.now()}@test.local`
  await page.goto('/register')
  await page.locator('#username').fill('Тестовый Пользователь')
  await page.locator('#email').fill(email)
  await page.locator('#password').fill('Secret123')
  await page.locator('#passwordConfirm').fill('Secret123')
  await page.getByRole('button', { name: 'Зарегистрироваться' }).click()

  await expect(page).toHaveURL('/')
  await expect(page.getByText('Тестовый Пользователь')).toBeVisible()
})

test('2. форма входа показывает ошибки и пускает с верным паролем', async ({ page }) => {
  await page.goto('/login')
  await page.locator('#email').fill(DEMO.email)
  await page.locator('#password').fill('НеверныйПароль1')
  await page.getByRole('button', { name: 'Войти' }).click()
  await expect(page.getByRole('alert')).toContainText('Неверный email или пароль')

  await page.locator('#password').fill(DEMO.password)
  await page.getByRole('button', { name: 'Войти' }).click()
  await expect(page).toHaveURL('/')
})

test('3. поиск фильма и открытие его страницы', async ({ page }) => {
  await login(page)
  await page.getByRole('searchbox', { name: 'Поиск фильмов' }).fill('Матрица')
  await page.keyboard.press('Enter')

  await expect(page).toHaveURL(/\/catalog\?q=/)
  await page.getByRole('link', { name: 'Матрица' }).first().click()
  await expect(page.getByRole('heading', { level: 1, name: 'Матрица' })).toBeVisible()
})

test('4. добавление фильма в избранное', async ({ page }) => {
  await login(page)
  await page.goto('/catalog?q=Интерстеллар')
  await page.getByRole('link', { name: 'Интерстеллар' }).first().click()

  await page.getByRole('button', { name: '♡ В избранное' }).click()
  await expect(page.getByRole('button', { name: '♥ В избранном' })).toBeVisible()

  await page.goto('/collection')
  await expect(page.getByRole('link', { name: 'Интерстеллар' }).first()).toBeVisible()
})

test('5. создание подборки', async ({ page }) => {
  await login(page)
  await page.goto('/playlists')
  await page.getByRole('button', { name: 'Создать подборку' }).first().click()
  await page.locator('#c-name').fill('Вечерний просмотр')
  await page.getByRole('dialog').getByRole('button', { name: 'Создать' }).click()

  await expect(page.getByRole('link', { name: 'Вечерний просмотр' }).first()).toBeVisible()
})

test('6. добавление оценки фильму', async ({ page }) => {
  await login(page)
  await page.goto('/catalog?q=Начало')
  await page.getByRole('link', { name: 'Начало' }).first().click()

  await page.getByRole('button', { name: 'Оценка 8', exact: true }).click()
  await expect(page.getByText('Вы поставили 8 из 10')).toBeVisible()
})

test('7. выход из аккаунта и защита страниц', async ({ page }) => {
  await login(page)
  await page.getByRole('button', { name: 'Выйти' }).click()
  await expect(page).toHaveURL(/\/login/)

  await page.goto('/catalog')
  await expect(page).toHaveURL(/\/login/)
})

test('8. обычный пользователь не попадает в админ-панель', async ({ page }) => {
  await login(page)
  await page.goto('/admin')
  await expect(page).toHaveURL('/')
  await expect(page.getByRole('heading', { name: 'Административная панель' })).toHaveCount(0)
})

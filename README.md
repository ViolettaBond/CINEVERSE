# Cineverse

Персональная онлайн-кинотека: каталог фильмов и сериалов, личные списки, подборки, оценки и отзывы.
Проект выполнен как курсовая работа «Разработка веб-приложения для каталогизации и учёта фильмов и сериалов».

## Цель разработки

Создать полноценное клиент-серверное веб-приложение: удобный интерфейс, REST API, реляционная база данных
PostgreSQL в Docker, автоматизированные тесты по пирамиде тестирования, CI в GitVerse и правильное ветвление Git.

## Технологии и зачем они нужны

| Часть | Технологии | Назначение |
|---|---|---|
| Frontend | React, TypeScript, Vite, Tailwind CSS, React Router, Axios | интерфейс, маршрутизация, запросы к API |
| Backend | Node.js, Express 5, pg, bcrypt, JWT, express-validator | REST API, безопасность, валидация |
| База данных | PostgreSQL 16, Docker Compose, Docker Volume | хранение данных |
| Тесты | Vitest, Supertest, Playwright | Unit, Integration, E2E |
| Процессы | Git, GitVerse, CI | контроль версий и автоматическая проверка |

Kubernetes не используется: у проекта один сервис БД, масштабировать нечего, а Docker Compose решает задачу проще.

## Возможности

Каталог с поиском, фильтрами (тип, жанр, год, рейтинг), сортировкой и пагинацией; страница фильма с оценкой,
отзывами и похожими фильмами; личные списки (избранное, посмотреть позже, просмотренное); собственные подборки;
профиль со статистикой; мои отзывы; уведомления; настройки (имя, аватар, пароль, уведомления, удаление аккаунта);
административная панель (фильмы, жанры, пользователи, отзывы, статистика). Роли проверяются на сервере.

## Изображения

Постеры и баннеры 25 демонстрационных фильмов — оригинальные стилизованные SVG-картинки, лежат в
`client/public/posters` и `client/public/backdrops`. Это не настоящие постеры (они защищены авторским правом).
Их генерирует скрипт `client/scripts/generate-posters.mjs` (`node scripts/generate-posters.mjs` из папки `client`),
который же создаёт `server/src/database/seeds/003_images.sql`. Ссылки попадают в базу командой `npm run seed`
(она безопасна при повторном запуске и не перезаписывает ссылки, заданные вручную).
Настоящий постер для любого фильма можно указать в админ-панели: ссылка `https://…` или локальный путь `/posters/имя.svg`.
Если картинка не загрузилась, интерфейс показывает градиентную заглушку с названием.

## Структура проекта

```
cineverse/
├─ docker-compose.yml        PostgreSQL в Docker
├─ client/                   frontend (React + TypeScript)
│  └─ src/  components, pages, layouts, services, hooks, types, context, utils
├─ server/                   backend (Express)
│  ├─ index.js               запуск сервера
│  └─ src/  routes, controllers, services, middleware, validators, database, utils
│     └─ database/           migrations/ (схема), seeds/ (демо-данные)
├─ e2e/                      сквозные тесты Playwright
├─ docs/                     API.md, DATABASE.md, DEFENSE.md
└─ .gitverse/workflows/      конфигурация CI
```

## Архитектура

Запрос идёт по цепочке: `route` (URL) → `validator` (проверка данных) → `middleware` (токен, роль) →
`controller` (запрос/ответ) → `service` (логика и SQL) → PostgreSQL. Приложение Express вынесено в `src/app.js`,
а `index.js` только запускает его, поэтому приложение можно тестировать Supertest без открытия порта.
Frontend обращается к API через единый клиент `services/api.ts`, который сам добавляет JWT-токен.
Подробнее: `docs/DEFENSE.md`.

## Установка и запуск

Нужны Node.js 20+, Docker Desktop и Git.

```bash
# 1. База данных (из корня проекта)
docker compose up -d
docker compose ps            # статус db должен быть healthy

# 2. Backend
cd server
cp .env.example .env         # заполните JWT_SECRET, SEED_ADMIN_PASSWORD, SEED_USER_PASSWORD
npm install
npm run migrate              # создать таблицы
npm run seed                 # жанры, 25 фильмов и сериалов, демо-пользователи
npm run dev                  # http://localhost:3000/api/health

# 3. Frontend (другой терминал)
cd client
npm install
npm run dev                  # http://localhost:5173
```

Секрет для `JWT_SECRET`: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.

Демо-аккаунты: `admin@cineverse.local` (администратор), `demo@cineverse.local`, `fan1…fan4@cineverse.local`.
Пароли берутся из `SEED_ADMIN_PASSWORD` и `SEED_USER_PASSWORD`. Оценки от fan1…fan4 — демонстрационные данные.

### Docker

| Действие | Команда |
|---|---|
| Запустить | `docker compose up -d` |
| Остановить (данные целы) | `docker compose stop` |
| Удалить контейнер (данные целы) | `docker compose down` |
| **Удалить контейнер и все данные** | `docker compose down -v` (осторожно!) |

Данные лежат в Docker Volume `cineverse-data`, поэтому переживают остановку и пересоздание контейнера.

## Тесты

| Команда (из корня) | Что запускает |
|---|---|
| `npm run test:unit` | Unit-тесты backend и frontend (база не нужна) |
| `npm run test:integration` | Integration-тесты API на тестовой БД `cineverse_test` (нужен Docker с БД) |
| `npm run test:e2e` | E2E в браузере (Playwright) |
| `npm run test:coverage` | покрытие backend и frontend |
| `npm test` | все по порядку |

Перед первым E2E: `npm run install:all` и `cd e2e && npx playwright install chromium`.
Integration и E2E используют отдельную базу `cineverse_test`, которая создаётся автоматически;
рабочая база `cineverse` не затрагивается. Тесты не изменяют данные в ней.

Пирамида: Unit (чистые функции, валидаторы, middleware) — больше всего; Integration (весь API с настоящей
PostgreSQL) — среднее количество; E2E (основные сценарии в браузере) — меньше всего.

## CI (GitVerse)

Файл `.gitverse/workflows/ci.yaml` запускается при каждом push и Pull Request. Этапы:
1. `build-and-unit`: установка зависимостей, проверка TypeScript и сборка frontend, проверка синтаксиса backend, Unit-тесты;
2. `integration` (после первого): Integration-тесты с контейнером PostgreSQL;
3. `e2e` (после второго): установка Chromium и E2E-тесты.

Если этап падает, весь пайплайн помечается неуспешным и следующие этапы не запускаются.
Результаты смотрите на вкладке CI/Actions вашего репозитория в GitVerse, открыв логи упавшего шага.
Типичные причины ошибок: упавший тест (прочитайте сообщение и исправьте код или тест), ошибка типов TypeScript,
не заданные переменные окружения.

**Проверьте при первом запуске:** синтаксис совместим с GitHub Actions, который поддерживает GitVerse, но блок
`services` для контейнера PostgreSQL я в документации GitVerse не нашёл. Если раннер его не поддерживает,
запустите PostgreSQL шагом `run: docker run -d -p 5435:5432 -e POSTGRES_USER=cineverse -e POSTGRES_PASSWORD=cineverse_ci postgres:16`
(если на раннере есть Docker) или используйте образ с установленной PostgreSQL.

## Git: ветвление

`main` — стабильная версия; `develop` — основная разработка; `feature/*` — отдельные функции
(auth, catalog, collections, reviews, notifications, admin-panel, profile, testing, docker, ci).
Новая функция разрабатывается в своей ветке, затем Pull Request в `develop`, перед слиянием проходят тесты и CI,
из `develop` готовится релиз в `main`. Коммиты в стиле `feat:`, `fix:`, `test:`, `docs:`, `refactor:`.

## Документация

- `docs/API.md` — все эндпоинты API
- `docs/DATABASE.md` — схема БД, ER-диаграмма, связи
- `docs/DEFENSE.md` — обоснование решений и вопросы к защите

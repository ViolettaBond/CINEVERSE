# База данных

PostgreSQL 16. Схема создаётся миграцией `server/src/database/migrations/001_create_tables.sql`,
демо-данные — `server/src/database/seeds/`. Нормализация: каждая сущность в своей таблице, связи через внешние ключи,
«многие-ко-многим» через связующие таблицы.

## ER-диаграмма

```mermaid
erDiagram
    users ||--o{ collections : "создаёт"
    users ||--o{ favorites : "добавляет"
    users ||--o{ watchlist : "добавляет"
    users ||--o{ watched : "отмечает"
    users ||--o{ ratings : "ставит"
    users ||--o{ reviews : "пишет"
    users ||--o{ notifications : "получает"
    movies ||--o{ favorites : ""
    movies ||--o{ watchlist : ""
    movies ||--o{ watched : ""
    movies ||--o{ ratings : ""
    movies ||--o{ reviews : ""
    movies ||--o{ movie_genres : ""
    genres ||--o{ movie_genres : ""
    collections ||--o{ collection_movies : ""
    movies ||--o{ collection_movies : ""

    users { int id PK  string username  string email  string password_hash  string role  string status  string avatar  bool notify_reviews  bool notify_collections  timestamptz created_at }
    movies { int id PK  string title  string original_title  text description  int release_year  int duration  string poster_url  string backdrop_url  string type  string age_rating  string country  string director  text writers  text cast_list  timestamptz created_at }
    genres { int id PK  string name }
    movie_genres { int movie_id PK  int genre_id PK }
    collections { int id PK  int user_id FK  string name  text description  string cover_url  timestamptz created_at }
    collection_movies { int collection_id PK  int movie_id PK  timestamptz added_at }
    favorites { int id PK  int user_id FK  int movie_id FK  timestamptz created_at }
    watchlist { int id PK  int user_id FK  int movie_id FK  timestamptz created_at }
    watched { int id PK  int user_id FK  int movie_id FK  timestamptz watched_at }
    ratings { int id PK  int user_id FK  int movie_id FK  int rating  timestamptz created_at }
    reviews { int id PK  int user_id FK  int movie_id FK  text text  timestamptz created_at  timestamptz updated_at }
    notifications { int id PK  int user_id FK  string type  string title  text message  string link  bool is_read  timestamptz created_at }
```

## Связи

- **Один ко многим:** пользователь → подборки, избранное, список просмотра, просмотренное, оценки, отзывы, уведомления.
- **Многие ко многим:** фильмы ↔ жанры (`movie_genres`), подборки ↔ фильмы (`collection_movies`).
- Таблицы `favorites`, `watchlist`, `watched`, `ratings`, `reviews` связывают пользователя и фильм.

## Ограничения и индексы

- Первичные ключи во всех таблицах; во внешних ключах `ON DELETE CASCADE` (удаление пользователя или фильма убирает связанные записи).
- `UNIQUE (user_id, movie_id)` в favorites, watchlist, watched, ratings, reviews: дубликаты невозможны на уровне БД.
- Уникальный индекс `LOWER(email)`: email уникален без учёта регистра. `UNIQUE (title, release_year)` у фильмов, `UNIQUE(name)` у жанров.
- `CHECK`: оценка 1–10, роль (`user`/`administrator`), статус (`active`/`blocked`), тип фильма (`movie`/`series`), год, длительность, непустой текст отзыва.
- Индексы для частых запросов: название, год и тип фильма, связи жанров, оценки и отзывы по фильму, подборки по пользователю, уведомления по пользователю и статусу.

## Решения

- Режиссёр, сценаристы и актёры хранятся текстовыми полями в `movies`: для курсовой этого достаточно, схема проще.
- Средний рейтинг не хранится, а считается через `AVG` по `ratings`, поэтому он не может рассинхронизироваться.
- Транзакции: добавление в «Просмотренное» (удаление из «Посмотреть позже»), создание и изменение фильма с жанрами, применение каждой миграции.
- Миграции: файлы `NNN_*.sql` применяются по порядку, применённые запоминаются в `schema_migrations`.

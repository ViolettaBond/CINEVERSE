# REST API Cineverse

Базовый адрес: `/api`. Формат: JSON. Авторизация: заголовок `Authorization: Bearer <токен>`.
Ошибки приходят в виде `{ "message": "текст" }`; при ошибках валидации добавляется `errors: [{field, message}]`.

Статусы: 200 успех, 201 создано, 204 успех без тела, 400 неверные данные, 401 нет или неверный токен,
403 нет прав (или аккаунт заблокирован), 404 не найдено, 409 конфликт (дубликат), 500 ошибка сервера.

Обозначения доступа: **Все** — без токена, **Вход** — нужен токен, **Админ** — роль administrator (проверка на сервере).

## Авторизация

| Метод и путь | Доступ | Описание |
|---|---|---|
| `POST /auth/register` | Все | Тело: `username` (2–50), `email`, `password` (8–72, буква и цифра), `passwordConfirm`. Ответ 201: `{user, token}`. Ошибки: 400, 409 (email занят) |
| `POST /auth/login` | Все | Тело: `email`, `password`. Ответ: `{user, token}`. Ошибки: 400, 401 (неверный email или пароль, одно сообщение), 403 (заблокирован) |
| `GET /auth/me` | Вход | Текущий пользователь: `{user}` |

## Каталог

| Метод и путь | Доступ | Описание |
|---|---|---|
| `GET /movies` | Все | Параметры: `q`, `genre` (номера через запятую), `type` (movie/series), `yearFrom`, `yearTo`, `ratingMin` (1–10), `sort` (title/year/rating), `order` (asc/desc), `page`, `limit` (1–50, по умолчанию 12). Ответ: `{items, total, page, limit, totalPages}` |
| `GET /movies/:id` | Все | Фильм с жанрами, средним рейтингом, режиссёром, актёрами и полем `similar` (до 6 похожих). 404, если нет |
| `POST /movies` | Админ | Тело: `title`, `type`, `releaseYear` обязательны; `originalTitle`, `description`, `duration`, `posterUrl`, `backdropUrl`, `ageRating`, `country`, `director`, `writers`, `castList`, `genreIds[]`. 201. Ошибки: 400, 409 (такой фильм уже есть) |
| `PUT /movies/:id` | Админ | Те же поля; жанры заменяются целиком |
| `DELETE /movies/:id` | Админ | 204 |
| `GET /genres` | Все | Список жанров |
| `POST /genres`, `PUT /genres/:id`, `DELETE /genres/:id` | Админ | Тело: `name` (2–50). 409 при дубликате |

## Личные списки

Одинаково для `/favorites`, `/watchlist`, `/watched`. Доступ: Вход. Каждый видит только свои данные.

| Метод и путь | Описание |
|---|---|
| `GET /{список}` | Параметры: `q`, `sort` (added/title/year), `order`. Массив фильмов с `added_at` |
| `POST /{список}` | Тело: `{movieId}`. 201; 404 нет фильма; 409 уже в списке. Добавление в `watched` убирает фильм из `watchlist` (в транзакции) |
| `DELETE /{список}/:movieId` | 204; 404, если фильма нет в вашем списке |

## Подборки (Вход, чужие подборки недоступны — отвечают 404)

| Метод и путь | Описание |
|---|---|
| `GET /collections` | Свои подборки с `movies_count` |
| `POST /collections` | Тело: `name` (1–100), `description`, `coverUrl` (http/https). 201 |
| `GET /collections/:id` | Подборка с массивом `movies` |
| `PUT /collections/:id` | Изменить |
| `DELETE /collections/:id` | 204 |
| `POST /collections/:id/movies` | Тело: `{movieId}`. 201; 404; 409 дубликат |
| `DELETE /collections/:id/movies/:movieId` | 204 |

## Оценки и отзывы

| Метод и путь | Доступ | Описание |
|---|---|---|
| `GET /movies/:id/ratings` | Все | `{average, count, userRating}`; `userRating` заполнен, если передан токен |
| `POST /movies/:id/ratings` | Вход | Тело: `{rating}` 1–10. 201; 409, если уже оценено |
| `PUT /movies/:id/ratings` | Вход | Изменить оценку; 404, если ещё не оценивали |
| `GET /movies/:id/reviews` | Все | Отзывы с `username`, `avatar`, `rating` автора |
| `POST /movies/:id/reviews` | Вход | Тело: `{text}` (1–5000). 201; 409, если отзыв уже есть (его можно редактировать) |
| `GET /reviews` | Вход | Мои отзывы с названием фильма |
| `PUT /reviews/:id` | Вход | Только автор, иначе 403 |
| `DELETE /reviews/:id` | Вход | Только автор, иначе 403 |

## Уведомления (Вход)

| Метод и путь | Описание |
|---|---|
| `GET /notifications` | `{items, unreadCount}` |
| `PATCH /notifications/:id/read` | 204 |
| `PATCH /notifications/read-all` | 204 |
| `DELETE /notifications/:id` | 204 |

## Профиль и настройки (Вход)

| Метод и путь | Описание |
|---|---|
| `GET /users/me/stats` | Просмотрено фильмов/сериалов, отзывы, подборки, любимые жанры, последняя активность |
| `PUT /users/me` | Тело: `username`, `avatar` (ссылка или пусто) |
| `PUT /users/me/settings` | Тело: `notifyReviews`, `notifyCollections` |
| `PUT /users/me/password` | Тело: `currentPassword`, `newPassword`, `newPasswordConfirm`. 400 при неверном текущем |
| `DELETE /users/me` | Тело: `{password}` для подтверждения. 204 |

## Администрирование (Админ)

| Метод и путь | Описание |
|---|---|
| `GET /admin/users` | Пользователи (без хешей паролей) |
| `PATCH /admin/users/:id` | Тело: `status` (active/blocked) и/или `role`. Нельзя изменить себя (400) |
| `GET /admin/statistics` | Счётчики и топ избранного |
| `GET /admin/reviews` | Все отзывы |
| `DELETE /admin/reviews/:id` | Удаляет отзыв и уведомляет автора |

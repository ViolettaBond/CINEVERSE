-- Демонстрационные оценки, чтобы в каталоге были средние рейтинги.
-- Это тестовые данные: оценки выставляются по простому правилу от 6 до 10.
-- Запускается после создания демо-пользователей. Повторный запуск дубликатов не создаёт.

INSERT INTO ratings (user_id, movie_id, rating)
SELECT u.id, m.id, 6 + ((m.id * u.id) % 5)
FROM users u
CROSS JOIN movies m
WHERE u.email LIKE 'fan%@cineverse.local'
ON CONFLICT (user_id, movie_id) DO NOTHING;

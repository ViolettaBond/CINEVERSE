-- Локальные стилизованные постеры и баннеры для демонстрационных фильмов.
-- Файл создаётся скриптом client/scripts/generate-posters.mjs. Это не настоящие постеры.
-- Уже заданные вручную ссылки (например, из админ-панели) не перезаписываются.

UPDATE movies AS m
SET poster_url   = COALESCE(m.poster_url, v.poster),
    backdrop_url = COALESCE(m.backdrop_url, v.backdrop)
FROM (VALUES
  ('Начало', 2010, '/posters/inception.svg', '/backdrops/inception.svg'),
  ('Интерстеллар', 2014, '/posters/interstellar.svg', '/backdrops/interstellar.svg'),
  ('Побег из Шоушенка', 1994, '/posters/shawshank-redemption.svg', '/backdrops/shawshank-redemption.svg'),
  ('Тёмный рыцарь', 2008, '/posters/dark-knight.svg', '/backdrops/dark-knight.svg'),
  ('Криминальное чтиво', 1994, '/posters/pulp-fiction.svg', '/backdrops/pulp-fiction.svg'),
  ('Бойцовский клуб', 1999, '/posters/fight-club.svg', '/backdrops/fight-club.svg'),
  ('Матрица', 1999, '/posters/matrix.svg', '/backdrops/matrix.svg'),
  ('Паразиты', 2019, '/posters/parasite.svg', '/backdrops/parasite.svg'),
  ('Унесённые призраками', 2001, '/posters/spirited-away.svg', '/backdrops/spirited-away.svg'),
  ('Гладиатор', 2000, '/posters/gladiator.svg', '/backdrops/gladiator.svg'),
  ('Крёстный отец', 1972, '/posters/godfather.svg', '/backdrops/godfather.svg'),
  ('Форрест Гамп', 1994, '/posters/forrest-gump.svg', '/backdrops/forrest-gump.svg'),
  ('Бегущий по лезвию 2049', 2017, '/posters/blade-runner-2049.svg', '/backdrops/blade-runner-2049.svg'),
  ('Дюна', 2021, '/posters/dune.svg', '/backdrops/dune.svg'),
  ('Остров проклятых', 2010, '/posters/shutter-island.svg', '/backdrops/shutter-island.svg'),
  ('Одержимость', 2014, '/posters/whiplash.svg', '/backdrops/whiplash.svg'),
  ('Отель «Гранд Будапешт»', 2014, '/posters/grand-budapest-hotel.svg', '/backdrops/grand-budapest-hotel.svg'),
  ('Тайна Коко', 2017, '/posters/coco.svg', '/backdrops/coco.svg'),
  ('Во все тяжкие', 2008, '/posters/breaking-bad.svg', '/backdrops/breaking-bad.svg'),
  ('Игра престолов', 2011, '/posters/game-of-thrones.svg', '/backdrops/game-of-thrones.svg'),
  ('Очень странные дела', 2016, '/posters/stranger-things.svg', '/backdrops/stranger-things.svg'),
  ('Чернобыль', 2019, '/posters/chernobyl.svg', '/backdrops/chernobyl.svg'),
  ('Шерлок', 2010, '/posters/sherlock.svg', '/backdrops/sherlock.svg'),
  ('Одни из нас', 2023, '/posters/the-last-of-us.svg', '/backdrops/the-last-of-us.svg'),
  ('Аркейн', 2021, '/posters/arcane.png', '/backdrops/arcane.png')
) AS v(title, year, poster, backdrop)
WHERE m.title = v.title AND m.release_year = v.year;

-- Cineverse: создание всех таблиц

CREATE TABLE users (
  id                 SERIAL PRIMARY KEY,
  username           VARCHAR(50)  NOT NULL,
  email              VARCHAR(255) NOT NULL,
  password_hash      VARCHAR(255) NOT NULL,
  role               VARCHAR(20)  NOT NULL DEFAULT 'user'
                     CHECK (role IN ('user', 'administrator')),
  status             VARCHAR(20)  NOT NULL DEFAULT 'active'
                     CHECK (status IN ('active', 'blocked')),
  avatar             TEXT,
  notify_reviews     BOOLEAN      NOT NULL DEFAULT TRUE,
  notify_collections BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
-- email уникален без учёта регистра
CREATE UNIQUE INDEX users_email_unique ON users (LOWER(email));

CREATE TABLE movies (
  id             SERIAL PRIMARY KEY,
  title          VARCHAR(255) NOT NULL,
  original_title VARCHAR(255),
  description    TEXT,
  release_year   INTEGER      NOT NULL CHECK (release_year BETWEEN 1888 AND 2100),
  duration       INTEGER      CHECK (duration > 0),
  poster_url     TEXT,
  backdrop_url   TEXT,
  type           VARCHAR(10)  NOT NULL CHECK (type IN ('movie', 'series')),
  age_rating     VARCHAR(10),
  country        VARCHAR(100),
  director       VARCHAR(255),
  writers        TEXT,
  cast_list      TEXT,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (title, release_year)
);
CREATE INDEX movies_title_idx ON movies (title);
CREATE INDEX movies_release_year_idx ON movies (release_year);
CREATE INDEX movies_type_idx ON movies (type);

CREATE TABLE genres (
  id   SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE movie_genres (
  movie_id INTEGER NOT NULL REFERENCES movies (id) ON DELETE CASCADE,
  genre_id INTEGER NOT NULL REFERENCES genres (id) ON DELETE CASCADE,
  PRIMARY KEY (movie_id, genre_id)
);
CREATE INDEX movie_genres_genre_idx ON movie_genres (genre_id);

CREATE TABLE collections (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER      NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  name        VARCHAR(100) NOT NULL,
  description TEXT,
  cover_url   TEXT,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX collections_user_idx ON collections (user_id);

CREATE TABLE collection_movies (
  collection_id INTEGER     NOT NULL REFERENCES collections (id) ON DELETE CASCADE,
  movie_id      INTEGER     NOT NULL REFERENCES movies (id) ON DELETE CASCADE,
  added_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (collection_id, movie_id)
);

CREATE TABLE favorites (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER     NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  movie_id   INTEGER     NOT NULL REFERENCES movies (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, movie_id)
);

CREATE TABLE watchlist (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER     NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  movie_id   INTEGER     NOT NULL REFERENCES movies (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, movie_id)
);

CREATE TABLE watched (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER     NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  movie_id   INTEGER     NOT NULL REFERENCES movies (id) ON DELETE CASCADE,
  watched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, movie_id)
);

CREATE TABLE ratings (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER     NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  movie_id   INTEGER     NOT NULL REFERENCES movies (id) ON DELETE CASCADE,
  rating     INTEGER     NOT NULL CHECK (rating BETWEEN 1 AND 10),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, movie_id)
);
CREATE INDEX ratings_movie_idx ON ratings (movie_id);

CREATE TABLE reviews (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER     NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  movie_id   INTEGER     NOT NULL REFERENCES movies (id) ON DELETE CASCADE,
  text       TEXT        NOT NULL CHECK (LENGTH(TRIM(text)) > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, movie_id)
);
CREATE INDEX reviews_movie_idx ON reviews (movie_id);

CREATE TABLE notifications (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER      NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  type       VARCHAR(20)  NOT NULL DEFAULT 'system'
             CHECK (type IN ('system', 'collection', 'review')),
  title      VARCHAR(150) NOT NULL,
  message    TEXT         NOT NULL,
  link       VARCHAR(255),
  is_read    BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX notifications_user_idx ON notifications (user_id, is_read);

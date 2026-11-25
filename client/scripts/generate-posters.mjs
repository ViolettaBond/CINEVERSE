// Генератор оригинальных постеров и баннеров (SVG) для демонстрационных фильмов.
// Запуск: node scripts/generate-posters.mjs  (из папки client)
// Создаёт client/public/posters, client/public/backdrops и server/src/database/seeds/003_images.sql.
// Это стилизованные заглушки, а не настоящие постеры фильмов. Реальные можно указать в админ-панели.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const publicDir = path.resolve(here, '../public')
const seedFile = path.resolve(here, '../../server/src/database/seeds/003_images.sql')

const MOVIES = [
  ['inception', 'Начало', 2010, 'movie', 'Фантастика'],
  ['interstellar', 'Интерстеллар', 2014, 'movie', 'Фантастика'],
  ['shawshank-redemption', 'Побег из Шоушенка', 1994, 'movie', 'Драма'],
  ['dark-knight', 'Тёмный рыцарь', 2008, 'movie', 'Боевик'],
  ['pulp-fiction', 'Криминальное чтиво', 1994, 'movie', 'Криминал'],
  ['fight-club', 'Бойцовский клуб', 1999, 'movie', 'Драма'],
  ['matrix', 'Матрица', 1999, 'movie', 'Фантастика'],
  ['parasite', 'Паразиты', 2019, 'movie', 'Триллер'],
  ['spirited-away', 'Унесённые призраками', 2001, 'movie', 'Анимация'],
  ['gladiator', 'Гладиатор', 2000, 'movie', 'Боевик'],
  ['godfather', 'Крёстный отец', 1972, 'movie', 'Криминал'],
  ['forrest-gump', 'Форрест Гамп', 1994, 'movie', 'Комедия'],
  ['blade-runner-2049', 'Бегущий по лезвию 2049', 2017, 'movie', 'Фантастика'],
  ['dune', 'Дюна', 2021, 'movie', 'Приключения'],
  ['shutter-island', 'Остров проклятых', 2010, 'movie', 'Триллер'],
  ['whiplash', 'Одержимость', 2014, 'movie', 'Драма'],
  ['grand-budapest-hotel', 'Отель «Гранд Будапешт»', 2014, 'movie', 'Комедия'],
  ['coco', 'Тайна Коко', 2017, 'movie', 'Анимация'],
  ['breaking-bad', 'Во все тяжкие', 2008, 'series', 'Криминал'],
  ['game-of-thrones', 'Игра престолов', 2011, 'series', 'Фэнтези'],
  ['stranger-things', 'Очень странные дела', 2016, 'series', 'Фантастика'],
  ['chernobyl', 'Чернобыль', 2019, 'series', 'Драма'],
  ['sherlock', 'Шерлок', 2010, 'series', 'Детектив'],
  ['the-last-of-us', 'Одни из нас', 2023, 'series', 'Драма'],
  ['arcane', 'Аркейн', 2021, 'series', 'Анимация'],
]

// Диапазон оттенка (hue) для каждого жанра
const HUES = {
  Фантастика: [205, 265], Драма: [18, 38], Боевик: [352, 16], Триллер: [165, 195], Криминал: [38, 50],
  Комедия: [320, 50], Приключения: [135, 160], Анимация: [280, 330], Фэнтези: [255, 290], Детектив: [190, 215],
}

function seeded(text) {
  let h = 2166136261
  for (const ch of text) h = Math.imul(h ^ ch.charCodeAt(0), 16777619)
  return () => {
    h += 0x6d2b79f5
    let t = Math.imul(h ^ (h >>> 15), 1 | h)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const n = (x) => Math.round(x * 10) / 10

function art(genre, rnd, w, h, hue) {
  const bright = `hsl(${hue} 85% 68%)`
  const soft = `hsl(${(hue + 30) % 360} 80% 60%)`
  const parts = []
  const stars = (count, area) => {
    for (let i = 0; i < count; i++) {
      parts.push(`<circle cx="${n(rnd() * w)}" cy="${n(rnd() * area)}" r="${n(0.6 + rnd() * 1.6)}" fill="#fff" opacity="${n(0.3 + rnd() * 0.6)}"/>`)
    }
  }
  const cx = w * (0.4 + rnd() * 0.3)
  const cy = h * 0.34
  const R = Math.min(w, h) * 0.26

  switch (genre) {
    case 'Фантастика':
      stars(50, h)
      parts.push(`<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(R)}" fill="url(#orb)"/>`)
      parts.push(`<ellipse cx="${n(cx)}" cy="${n(cy)}" rx="${n(R * 1.7)}" ry="${n(R * 0.35)}" fill="none" stroke="${bright}" stroke-width="3" opacity="0.7" transform="rotate(-18 ${n(cx)} ${n(cy)})"/>`)
      break
    case 'Драма':
      for (let i = 0; i < 7; i++) {
        const bw = 14 + rnd() * 50
        parts.push(`<rect x="${n(rnd() * w)}" y="0" width="${n(bw)}" height="${h}" fill="${i % 2 ? bright : soft}" opacity="${n(0.08 + rnd() * 0.16)}"/>`)
      }
      parts.push(`<circle cx="${n(cx)}" cy="${n(h * 0.5)}" r="${n(R * 0.8)}" fill="url(#orb)" opacity="0.9"/>`)
      break
    case 'Боевик':
      for (let i = 0; i < 6; i++) {
        const x = rnd() * w
        const bw = 20 + rnd() * 70
        parts.push(`<polygon points="${n(x)},0 ${n(x + bw)},0 ${n(x + bw - w * 0.4)},${h} ${n(x - w * 0.4)},${h}" fill="${i % 2 ? bright : soft}" opacity="${n(0.1 + rnd() * 0.22)}"/>`)
      }
      break
    case 'Триллер':
      for (let i = 0; i < 5; i++) {
        parts.push(`<circle cx="${n(rnd() * w)}" cy="${n(rnd() * h * 0.7)}" r="${n(R * (0.6 + rnd()))}" fill="${bright}" opacity="0.1" filter="url(#blur)"/>`)
      }
      parts.push(`<rect x="${n(cx - 3)}" y="0" width="6" height="${h}" fill="#fff" opacity="0.5" filter="url(#blur)"/>`)
      break
    case 'Криминал':
      for (let y = 0; y < h; y += 26) {
        parts.push(`<rect x="0" y="${y}" width="${w}" height="9" fill="#000" opacity="0.28"/>`)
      }
      parts.push(`<polygon points="${n(w * 0.15)},0 ${n(w * 0.45)},0 ${n(w * 0.85)},${h} ${n(w * 0.4)},${h}" fill="${bright}" opacity="0.2"/>`)
      break
    case 'Комедия':
      for (let i = 0; i < 28; i++) {
        parts.push(`<circle cx="${n(rnd() * w)}" cy="${n(rnd() * h * 0.8)}" r="${n(6 + rnd() * 26)}" fill="hsl(${(hue + rnd() * 90) % 360} 85% 62%)" opacity="${n(0.25 + rnd() * 0.5)}"/>`)
      }
      break
    case 'Приключения':
      parts.push(`<circle cx="${n(cx)}" cy="${n(h * 0.28)}" r="${n(R * 0.55)}" fill="url(#orb)"/>`)
      for (let layer = 0; layer < 3; layer++) {
        const base = h * (0.46 + layer * 0.12)
        let d = `M0,${n(h)} L0,${n(base)}`
        for (let x = 0; x <= w; x += w / 5) d += ` L${n(x)},${n(base - 30 - rnd() * 90)} L${n(x + w / 10)},${n(base + 10)}`
        d += ` L${w},${h} Z`
        parts.push(`<path d="${d}" fill="hsl(${hue} ${60 - layer * 10}% ${34 - layer * 9}%)" opacity="0.92"/>`)
      }
      break
    case 'Анимация':
      for (let i = 0; i < 9; i++) {
        parts.push(`<circle cx="${n(rnd() * w)}" cy="${n(rnd() * h * 0.75)}" r="${n(30 + rnd() * 80)}" fill="hsl(${(hue + rnd() * 70) % 360} 90% 65%)" opacity="${n(0.18 + rnd() * 0.3)}"/>`)
      }
      stars(18, h * 0.7)
      break
    case 'Фэнтези':
      stars(40, h)
      parts.push(`<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(R * 0.9)}" fill="#f5efff"/>`)
      parts.push(`<circle cx="${n(cx + R * 0.35)}" cy="${n(cy - R * 0.15)}" r="${n(R * 0.85)}" fill="hsl(${hue} 55% 14%)"/>`)
      parts.push(`<path d="M0,${h} L0,${n(h * 0.6)} Q${n(w * 0.3)},${n(h * 0.5)} ${n(w * 0.55)},${n(h * 0.62)} T${w},${n(h * 0.58)} L${w},${h} Z" fill="hsl(${hue} 40% 10%)"/>`)
      break
    default: // Детектив
      parts.push(`<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(R)}" fill="none" stroke="${bright}" stroke-width="10" opacity="0.8"/>`)
      parts.push(`<line x1="${n(cx + R * 0.7)}" y1="${n(cy + R * 0.7)}" x2="${n(cx + R * 1.5)}" y2="${n(cy + R * 1.5)}" stroke="${bright}" stroke-width="16" stroke-linecap="round" opacity="0.8"/>`)
      for (let i = 0; i < 8; i++) {
        parts.push(`<line x1="0" y1="${n(rnd() * h)}" x2="${w}" y2="${n(rnd() * h)}" stroke="#fff" opacity="0.06"/>`)
      }
  }
  return parts.join('\n    ')
}

function defs(hue, bgA, bgB) {
  return `<defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${bgA}"/><stop offset="1" stop-color="${bgB}"/></linearGradient>
    <radialGradient id="orb" cx="0.35" cy="0.3" r="0.8"><stop offset="0" stop-color="hsl(${hue} 90% 80%)"/><stop offset="1" stop-color="hsl(${(hue + 40) % 360} 70% 38%)"/></radialGradient>
    <linearGradient id="shade" x1="0" y1="0" x2="0" y2="1"><stop offset="0.35" stop-color="#0F1016" stop-opacity="0"/><stop offset="1" stop-color="#0F1016" stop-opacity="0.95"/></linearGradient>
    <filter id="blur"><feGaussianBlur stdDeviation="22"/></filter>
  </defs>`
}

function colors(genre, rnd) {
  const [a, b] = HUES[genre]
  const span = (b - a + 360) % 360
  const hue = Math.round((a + rnd() * span) % 360)
  return { hue, bgA: `hsl(${hue} 55% 24%)`, bgB: `hsl(${(hue + 55) % 360} 60% 9%)` }
}

function wrap(title) {
  for (const size of [46, 40, 34, 30, 26, 22]) {
    const limit = Math.floor(336 / (size * 0.6))
    const lines = []
    let line = ''
    let ok = true
    for (const word of title.split(' ')) {
      if (word.length > limit) { ok = false; break }
      if ((line + ' ' + word).trim().length > limit) { lines.push(line); line = word } else line = (line + ' ' + word).trim()
    }
    if (ok) {
      lines.push(line)
      if (lines.length <= 4) return { size, lines }
    }
  }
  return { size: 20, lines: [title] }
}

function poster([slug, title, year, type, genre]) {
  const rnd = seeded(slug)
  const { hue, bgA, bgB } = colors(genre, rnd)
  const { size, lines } = wrap(title)
  const lineHeight = size * 1.12
  const firstY = 600 - 118 - (lines.length - 1) * lineHeight
  const text = lines
    .map((l, i) => `<text x="32" y="${n(firstY + i * lineHeight)}" font-size="${size}" font-weight="800" fill="#fff">${esc(l)}</text>`)
    .join('\n    ')
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600" role="img" aria-label="${esc(title)}" font-family="Inter, 'Segoe UI', Roboto, Arial, sans-serif">
  ${defs(hue, bgA, bgB)}
  <rect width="400" height="600" fill="url(#bg)"/>
  <g>
    ${art(genre, rnd, 400, 600, hue)}
  </g>
  <rect width="400" height="600" fill="url(#shade)"/>
  <g>
    ${text}
    <rect x="32" y="${n(600 - 92)}" width="44" height="3" fill="hsl(${hue} 85% 72%)"/>
    <text x="32" y="${n(600 - 62)}" font-size="15" letter-spacing="2" fill="#E8E9F0" opacity="0.85">${year} · ${type === 'series' ? 'СЕРИАЛ' : 'ФИЛЬМ'} · ${genre.toUpperCase()}</text>
  </g>
</svg>
`
}

function backdrop([slug, title, , , genre]) {
  const rnd = seeded(slug)
  const { hue, bgA, bgB } = colors(genre, rnd)
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${esc(title)}">
  ${defs(hue, bgA, bgB)}
  <rect width="1280" height="720" fill="url(#bg)"/>
  <g>
    ${art(genre, rnd, 1280, 720, hue)}
  </g>
</svg>
`
}

const updates = []
for (const movie of MOVIES) {
  const [slug, title, year] = movie
  fs.writeFileSync(path.join(publicDir, 'posters', `${slug}.svg`), poster(movie))
  fs.writeFileSync(path.join(publicDir, 'backdrops', `${slug}.svg`), backdrop(movie))
  updates.push(`  ('${title.replaceAll("'", "''")}', ${year}, '/posters/${slug}.svg', '/backdrops/${slug}.svg')`)
}

fs.writeFileSync(
  seedFile,
  `-- Локальные стилизованные постеры и баннеры для демонстрационных фильмов.
-- Файл создаётся скриптом client/scripts/generate-posters.mjs. Это не настоящие постеры.
-- Уже заданные вручную ссылки (например, из админ-панели) не перезаписываются.

UPDATE movies AS m
SET poster_url   = COALESCE(m.poster_url, v.poster),
    backdrop_url = COALESCE(m.backdrop_url, v.backdrop)
FROM (VALUES
${updates.join(',\n')}
) AS v(title, year, poster, backdrop)
WHERE m.title = v.title AND m.release_year = v.year;
`,
)
console.log(`Создано файлов: ${MOVIES.length * 2}, SQL: ${path.relative(process.cwd(), seedFile)}`)

-- Blimo — Postgres sxemasi (hakaton final, 23.08.2026)
-- Prinsip: pul/ball hech qachon UPDATE bilan emas — coin_ledger append-only, balans = SUM.

CREATE TABLE IF NOT EXISTS schools (
  id          BIGSERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  region      TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  id          BIGSERIAL PRIMARY KEY,
  nickname    TEXT NOT NULL,
  role        TEXT NOT NULL CHECK (role IN ('student','teacher')),
  pin_hash    TEXT NOT NULL,
  class_id    BIGINT,
  grade       SMALLINT,
  streak      INT NOT NULL DEFAULT 0,
  last_active DATE,
  is_deleted  BOOLEAN NOT NULL DEFAULT false,
  deleted_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (nickname)
);


-- ============ MIGRATSIYA (23.08.2026): ism-familiya + email + Google + PIN tiklash ============
-- Idempotent: jonli bazada necha marta ishlasa ham xavfsiz. nickname O'CHMAYDI (ichki ID bo'lib qoladi).
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name  TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email      TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_sub TEXT;
-- Eski qatorlar: ism sifatida nickname ko'rsatiladi
UPDATE users SET first_name = nickname WHERE first_name IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS users_email_uniq      ON users (LOWER(email)) WHERE email IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS users_google_sub_uniq ON users (google_sub)   WHERE google_sub IS NOT NULL;

-- PIN tiklash kodlari (email orqali). Kod OCHIQ saqlanmaydi — faqat hash.
CREATE TABLE IF NOT EXISTS password_resets (
  id          BIGSERIAL PRIMARY KEY,
  user_id     BIGINT NOT NULL REFERENCES users(id),
  code_hash   TEXT NOT NULL,                 -- sha256(salt:kod)
  salt        TEXT NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,          -- 15 daqiqa
  used_at     TIMESTAMPTZ,
  attempts    INT NOT NULL DEFAULT 0,        -- 5 xato = kod kuyadi
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS password_resets_user_idx ON password_resets(user_id, created_at DESC);
-- ============================================================================================

CREATE TABLE IF NOT EXISTS classes (
  id          BIGSERIAL PRIMARY KEY,
  school_id   BIGINT REFERENCES schools(id),
  name        TEXT NOT NULL,
  code        TEXT NOT NULL UNIQUE,          -- o'quvchi shu kod bilan qo'shiladi
  teacher_id  BIGINT REFERENCES users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_class_fk;
ALTER TABLE users ADD CONSTRAINT users_class_fk FOREIGN KEY (class_id) REFERENCES classes(id);

CREATE TABLE IF NOT EXISTS topics (
  id          BIGSERIAL PRIMARY KEY,
  class_id    BIGINT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  subject     TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_by  BIGINT REFERENCES users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS topics_class_idx ON topics(class_id, is_active);

-- AI tushuntirishlari (kesh + hisobot uchun)
CREATE TABLE IF NOT EXISTS explanations (
  id           BIGSERIAL PRIMARY KEY,
  user_id      BIGINT NOT NULL REFERENCES users(id),
  input_text   TEXT NOT NULL,
  output_md    TEXT NOT NULL,
  model        TEXT NOT NULL,
  input_tokens INT,
  out_tokens   INT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS explanations_user_idx ON explanations(user_id, created_at DESC);

-- AI generatsiya qilgan mini-testlar
CREATE TABLE IF NOT EXISTS quizzes (
  id          BIGSERIAL PRIMARY KEY,
  topic_id    BIGINT REFERENCES topics(id) ON DELETE SET NULL,
  source      TEXT NOT NULL CHECK (source IN ('solve','duel','topic')),
  questions   JSONB NOT NULL,                -- [{q, options[4], correct, why}]
  created_by  BIGINT REFERENCES users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS attempts (
  id          BIGSERIAL PRIMARY KEY,
  user_id     BIGINT NOT NULL REFERENCES users(id),
  quiz_id     BIGINT REFERENCES quizzes(id) ON DELETE SET NULL,
  topic_id    BIGINT REFERENCES topics(id) ON DELETE SET NULL,
  correct     INT NOT NULL,
  total       INT NOT NULL,
  duration_ms INT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS attempts_user_idx ON attempts(user_id, created_at DESC);
-- Bitta testni bir o'quvchi FAQAT bir marta topshiradi (tanga fermasi bo'lmasin).
CREATE UNIQUE INDEX IF NOT EXISTS attempts_user_quiz_uniq ON attempts(user_id, quiz_id) WHERE quiz_id IS NOT NULL;

-- Duel: 2 o'quvchi bir xil savollarga javob beradi
CREATE TABLE IF NOT EXISTS duels (
  id           BIGSERIAL PRIMARY KEY,
  code         TEXT NOT NULL UNIQUE,
  class_id     BIGINT REFERENCES classes(id),
  quiz_id      BIGINT NOT NULL REFERENCES quizzes(id),
  player_a     BIGINT NOT NULL REFERENCES users(id),
  player_b     BIGINT REFERENCES users(id),
  score_a      INT,
  score_b      INT,
  status       TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting','playing','done')),
  winner_id    BIGINT REFERENCES users(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS duels_class_idx ON duels(class_id, created_at DESC);

-- Tanga: FAQAT append-only. Balans = SUM(delta).
CREATE TABLE IF NOT EXISTS coin_ledger (
  id          BIGSERIAL PRIMARY KEY,
  user_id     BIGINT NOT NULL REFERENCES users(id),
  delta       INT NOT NULL,
  reason      TEXT NOT NULL,                 -- quiz_correct | duel_win | invite | streak | teacher_bonus
  ref_id      BIGINT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS coin_user_idx ON coin_ledger(user_id);

CREATE TABLE IF NOT EXISTS invites (
  id            BIGSERIAL PRIMARY KEY,
  inviter_id    BIGINT NOT NULL REFERENCES users(id),
  code          TEXT NOT NULL UNIQUE,
  invited_id    BIGINT REFERENCES users(id),
  used_at       TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Analitika (keyin davlatga hisobot uchun) — append-only
CREATE TABLE IF NOT EXISTS events (
  id          BIGSERIAL PRIMARY KEY,
  user_id     BIGINT REFERENCES users(id),
  type        TEXT NOT NULL,
  payload     JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS events_type_idx ON events(type, created_at DESC);


-- ============ MIGRATSIYA-2 (23.08.2026): KO'P SINF (class_members) ============
-- O'quvchi bir nechta sinfda, o'qituvchi bir nechta sinf ochadi. users.class_id = AKTIV sinf.
CREATE TABLE IF NOT EXISTS class_members (
  id         BIGSERIAL PRIMARY KEY,
  user_id    BIGINT NOT NULL REFERENCES users(id),
  class_id   BIGINT NOT NULL REFERENCES classes(id),
  role       TEXT NOT NULL CHECK (role IN ('student','teacher')),
  joined_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, class_id)
);
CREATE INDEX IF NOT EXISTS class_members_class_idx ON class_members(class_id, role);
-- Backfill (idempotent): mavjud users.class_id va classes.teacher_id a'zolikka ko'chadi
INSERT INTO class_members (user_id, class_id, role)
SELECT u.id, u.class_id, u.role FROM users u
WHERE u.class_id IS NOT NULL AND u.is_deleted = false
ON CONFLICT (user_id, class_id) DO NOTHING;
INSERT INTO class_members (user_id, class_id, role)
SELECT c.teacher_id, c.id, 'teacher' FROM classes c
WHERE c.teacher_id IS NOT NULL
ON CONFLICT (user_id, class_id) DO NOTHING;
-- ==============================================================================

-- ============ MIGRATSIYA-3 (23.08.2026): SINF RAQAMI BITTA MANBADAN ============
-- Muammo: o'qituvchi "11-V sinf" ochadi, o'quvchi esa o'zini "7-sinf" deb yozardi.
-- Yechim: sinf raqami classes.grade da saqlanadi va o'quvchiga SHUNDAN beriladi.
ALTER TABLE classes ADD COLUMN IF NOT EXISTS grade INT;
UPDATE classes SET grade = (substring(name from '\d{1,2}'))::INT
 WHERE grade IS NULL AND substring(name from '\d{1,2}') IS NOT NULL;
UPDATE classes SET grade = NULL WHERE grade IS NOT NULL AND (grade < 1 OR grade > 11);
-- Mavjud o'quvchilar sinfiga moslashtiriladi
UPDATE users u SET grade = c.grade FROM classes c
 WHERE u.class_id = c.id AND c.grade IS NOT NULL AND u.role = 'student'
   AND (u.grade IS DISTINCT FROM c.grade);
-- ==============================================================================

-- ============ MIGRATSIYA-4 (23.08.2026): DO'KON (tanga -> sovrin) ============
CREATE TABLE IF NOT EXISTS shop_items (
  id         BIGSERIAL PRIMARY KEY,
  code       TEXT NOT NULL UNIQUE,
  title_uz   TEXT NOT NULL,
  title_ru   TEXT NOT NULL,
  descr_uz   TEXT NOT NULL,
  descr_ru   TEXT NOT NULL,
  price      INT  NOT NULL CHECK (price > 0),
  icon       TEXT NOT NULL DEFAULT 'gift',   -- ikonka kaliti (emoji EMAS)
  stock      INT,                            -- NULL = cheklanmagan
  is_active  BOOLEAN NOT NULL DEFAULT true,
  sort       INT NOT NULL DEFAULT 100
);

CREATE TABLE IF NOT EXISTS purchases (
  id          BIGSERIAL PRIMARY KEY,
  user_id     BIGINT NOT NULL REFERENCES users(id),
  item_id     BIGINT NOT NULL REFERENCES shop_items(id),
  price       INT NOT NULL,
  reward_code TEXT NOT NULL,                 -- o'quvchiga beriladigan kod
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS purchases_user_idx ON purchases(user_id, created_at DESC);

-- Boshlang'ich sovrinlar (idempotent)
INSERT INTO shop_items (code, title_uz, title_ru, descr_uz, descr_ru, price, icon, sort) VALUES
 ('claude_pro',  'Claude Pro — 1 oy',        'Claude Pro — 1 месяц',
  'Claude Pro obunasiga 1 oylik promokod. Sovrin o''qituvchi orqali beriladi.',
  'Промокод на 1 месяц подписки Claude Pro. Приз выдаёт учитель.', 3000, 'sparkles', 10),
 ('chatgpt_plus','ChatGPT Plus — 1 oy',      'ChatGPT Plus — 1 месяц',
  'ChatGPT Plus obunasiga 1 oylik promokod.',
  'Промокод на 1 месяц подписки ChatGPT Plus.', 3000, 'sparkles', 20),
 ('blimo_pro',   'Blimo PRO — 1 oy',         'Blimo PRO — 1 месяц',
  'Cheksiz savol, tezroq javob va maxsus duel rejimlari.',
  'Безлимитные вопросы, быстрый ответ и особые режимы дуэли.', 1500, 'bolt', 30),
 ('course_50',   'Onlayn kursga 50% chegirma','Скидка 50% на онлайн-курс',
  'Hamkor IT-maktab kurslariga 50% chegirma kuponi.',
  'Купон на скидку 50% в партнёрской IT-школе.', 1200, 'target', 40),
 ('avatar_gold', 'Oltin ramka (avatar)',      'Золотая рамка (аватар)',
  'Reytingda ismingiz oltin ramkada ko''rinadi.',
  'В рейтинге твоё имя будет в золотой рамке.', 400, 'medal', 50),
 ('streak_save', 'Kunni saqlash',             'Спасение серии',
  'Bir kun o''tkazib yuborsang, ketma-ket kunlaring kuyib ketmaydi.',
  'Пропустил день — серия не сгорит.', 120, 'flame', 60)
ON CONFLICT (code) DO NOTHING;
-- ==============================================================================

CREATE OR REPLACE VIEW v_leaderboard AS
SELECT u.id, u.nickname, u.class_id, COALESCE(SUM(c.delta),0)::INT AS coins, u.streak,
       COALESCE(NULLIF(TRIM(COALESCE(u.first_name,'') || ' ' || COALESCE(u.last_name,'')), ''), u.nickname) AS full_name
FROM users u LEFT JOIN coin_ledger c ON c.user_id = u.id
WHERE u.is_deleted = false AND u.role = 'student'
GROUP BY u.id;

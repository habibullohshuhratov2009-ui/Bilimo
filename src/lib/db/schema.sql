-- Bilimo — Postgres sxemasi (hakaton final, 23.08.2026)
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

CREATE OR REPLACE VIEW v_leaderboard AS
SELECT u.id, u.nickname, u.class_id, COALESCE(SUM(c.delta),0)::INT AS coins, u.streak
FROM users u LEFT JOIN coin_ledger c ON c.user_id = u.id
WHERE u.is_deleted = false AND u.role = 'student'
GROUP BY u.id;

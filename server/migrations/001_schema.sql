-- ============================================================
-- Collège Sully — Schéma PostgreSQL
-- ============================================================

-- ─── Roles ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS roles (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL UNIQUE,
  label       TEXT NOT NULL,
  permissions JSONB NOT NULL DEFAULT '[]',
  is_system   BOOLEAN NOT NULL DEFAULT FALSE
);

-- ─── Users ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  username      TEXT NOT NULL UNIQUE,
  full_name     TEXT NOT NULL,
  email         TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role_id       TEXT NOT NULL REFERENCES roles(id),
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  is_super_admin BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

-- ─── Students ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS students (
  id              TEXT PRIMARY KEY,
  student_number  TEXT,
  matricule       TEXT,
  first_name      TEXT NOT NULL,
  last_name       TEXT NOT NULL,
  common_name     TEXT,
  date_of_birth   TEXT,
  gender          TEXT,
  grade           TEXT,
  cycle           TEXT,
  photo_url       TEXT,
  iss_number      TEXT,
  family_id       TEXT,
  parent_info     JSONB NOT NULL DEFAULT '{}',
  enrollment_date TEXT,
  school_year     TEXT
);

-- ─── Grades ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS grades (
  id            TEXT PRIMARY KEY,
  student_id    TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject_id    TEXT NOT NULL,
  subject_name  TEXT NOT NULL,
  teacher_name  TEXT,
  term          SMALLINT NOT NULL CHECK (term IN (1, 2, 3)),
  score         NUMERIC,
  coefficient   NUMERIC NOT NULL DEFAULT 1,
  class_average NUMERIC,
  min_score     NUMERIC,
  max_score     NUMERIC,
  comments      TEXT,
  UNIQUE (student_id, subject_id, term)
);

-- ─── Archive ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS archive (
  student_id  TEXT PRIMARY KEY,
  student     JSONB NOT NULL,
  archived_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reason      TEXT
);

-- ─── Settings ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- ─── Subjects ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subjects (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  coefficient   INTEGER NOT NULL DEFAULT 1,
  teacher_name  TEXT,
  school        TEXT NOT NULL DEFAULT 'sully',
  grade         TEXT,
  display_order INTEGER DEFAULT 9999
);

-- ─── Document Templates ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS document_templates (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT,
  code        TEXT NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

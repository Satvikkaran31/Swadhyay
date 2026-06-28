-- Run this once against your PostgreSQL database to set up the Coursera-style schema.
-- The session table is auto-created by connect-pg-simple; this covers everything else.

-- Persistent user profiles (synced from Google OAuth on each login)
CREATE TABLE IF NOT EXISTS users (
  id           SERIAL PRIMARY KEY,
  google_id    VARCHAR(255) UNIQUE NOT NULL,
  name         VARCHAR(255) NOT NULL,
  email        VARCHAR(255) UNIQUE NOT NULL,
  picture      TEXT,
  role         VARCHAR(50) NOT NULL DEFAULT 'student', -- 'student' | 'admin'
  created_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Courses
CREATE TABLE IF NOT EXISTS courses (
  id            SERIAL PRIMARY KEY,
  slug          VARCHAR(255) UNIQUE NOT NULL,
  title         VARCHAR(500) NOT NULL,
  description   TEXT,
  thumbnail_url TEXT,
  price         INTEGER NOT NULL DEFAULT 0,  -- in paise; 0 = free
  is_published  BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Modules (chapters inside a course)
CREATE TABLE IF NOT EXISTS modules (
  id         SERIAL PRIMARY KEY,
  course_id  INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title      VARCHAR(500) NOT NULL,
  position   INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Lessons (individual videos/content inside a module)
CREATE TABLE IF NOT EXISTS lessons (
  id          SERIAL PRIMARY KEY,
  module_id   INTEGER NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  title       VARCHAR(500) NOT NULL,
  video_url   TEXT,           -- YouTube/Vimeo URL; we convert to embed on the frontend
  duration    INTEGER,        -- seconds
  position    INTEGER NOT NULL DEFAULT 0,
  is_preview  BOOLEAN NOT NULL DEFAULT false,  -- visible without enrollment
  created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Resources attached to a lesson (PDFs, links, etc.)
CREATE TABLE IF NOT EXISTS resources (
  id         SERIAL PRIMARY KEY,
  lesson_id  INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  title      VARCHAR(500) NOT NULL,
  url        TEXT NOT NULL,
  type       VARCHAR(50) NOT NULL DEFAULT 'link',  -- 'pdf' | 'link' | 'other'
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Enrollments
CREATE TABLE IF NOT EXISTS enrollments (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id   INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  payment_id  VARCHAR(255),   -- Razorpay payment_id; null for free courses
  enrolled_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

-- Lesson completion progress
CREATE TABLE IF NOT EXISTS progress (
  id           SERIAL PRIMARY KEY,
  user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id    INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  completed_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, lesson_id)
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_modules_course_id   ON modules(course_id);
CREATE INDEX IF NOT EXISTS idx_lessons_module_id   ON lessons(module_id);
CREATE INDEX IF NOT EXISTS idx_resources_lesson_id ON resources(lesson_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_user_id ON enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_progress_user_id    ON progress(user_id);

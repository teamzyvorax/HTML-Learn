import "dotenv/config";
import { db } from "./db";

async function migrate() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      display_name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS course_progress (
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      course_slug TEXT NOT NULL,
      current_level INTEGER NOT NULL DEFAULT 1 CHECK (current_level BETWEEN 1 AND 10000),
      unlocked_level INTEGER NOT NULL DEFAULT 1 CHECK (unlocked_level BETWEEN 1 AND 10000),
      completed_levels INTEGER[] NOT NULL DEFAULT '{}',
      quiz_passed_levels INTEGER[] NOT NULL DEFAULT '{}',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (user_id, course_slug)
    );

    CREATE TABLE IF NOT EXISTS lesson_attempts (
      id BIGSERIAL PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      course_slug TEXT NOT NULL,
      level INTEGER NOT NULL CHECK (level BETWEEN 1 AND 10000),
      task_passed BOOLEAN NOT NULL DEFAULT FALSE,
      quiz_passed BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS lesson_attempts_user_created_idx
      ON lesson_attempts(user_id, created_at DESC);
  `);
  console.log("Database migrations completed.");
}

migrate().catch((error) => {
  console.error("Database migration failed", error);
  process.exitCode = 1;
}).finally(async () => {
  await db.end();
});

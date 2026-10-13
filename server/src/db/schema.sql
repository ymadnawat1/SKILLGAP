-- SkillGap schema. Idempotent: safe to run repeatedly.
-- Anonymous users are identified by a browser-generated key (user_key); no passwords stored.

CREATE TABLE IF NOT EXISTS skills (
  id          SERIAL PRIMARY KEY,
  slug        TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  category    TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS questions (
  id            SERIAL PRIMARY KEY,
  slug          TEXT NOT NULL UNIQUE,
  title         TEXT NOT NULL,
  topic         TEXT NOT NULL,
  difficulty    TEXT NOT NULL CHECK (difficulty IN ('easy','medium','hard')),
  question_type TEXT NOT NULL CHECK (question_type IN ('coding','sql','concept')),
  source_name   TEXT NOT NULL,
  source_url    TEXT NOT NULL
);

-- Which skills a question practices (tags).
CREATE TABLE IF NOT EXISTS question_skills (
  question_id INT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  skill_id    INT NOT NULL REFERENCES skills(id)    ON DELETE CASCADE,
  PRIMARY KEY (question_id, skill_id)
);
CREATE INDEX IF NOT EXISTS idx_question_skills_skill ON question_skills(skill_id);

CREATE TABLE IF NOT EXISTS jobs (
  id               SERIAL PRIMARY KEY,
  user_key         TEXT NOT NULL,
  company          TEXT,
  role_title       TEXT,
  experience_level TEXT,
  source_url       TEXT,
  description_text TEXT NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_jobs_user ON jobs(user_key, created_at DESC);

CREATE TABLE IF NOT EXISTS job_skills (
  job_id             INT NOT NULL REFERENCES jobs(id)   ON DELETE CASCADE,
  skill_id           INT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  importance         TEXT NOT NULL CHECK (importance IN ('required','preferred','inferred')),
  evidence_or_reason TEXT NOT NULL DEFAULT '',
  source             TEXT NOT NULL DEFAULT 'detected' CHECK (source IN ('detected','user')),
  PRIMARY KEY (job_id, skill_id)
);

CREATE TABLE IF NOT EXISTS job_questions (
  job_id           INT NOT NULL REFERENCES jobs(id)      ON DELETE CASCADE,
  question_id      INT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  relevance_reason TEXT NOT NULL DEFAULT '',
  PRIMARY KEY (job_id, question_id)
);

CREATE TABLE IF NOT EXISTS user_skill_assessments (
  user_key          TEXT NOT NULL,
  skill_id          INT  NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  proficiency_level TEXT NOT NULL CHECK (proficiency_level IN ('confident','somewhat_familiar','need_to_learn')),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_key, skill_id)
);

CREATE TABLE IF NOT EXISTS user_question_progress (
  user_key    TEXT NOT NULL,
  question_id INT  NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  status      TEXT NOT NULL CHECK (status IN ('solved_independently','needed_hints','not_solved')),
  notes       TEXT NOT NULL DEFAULT '',
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_key, question_id)
);

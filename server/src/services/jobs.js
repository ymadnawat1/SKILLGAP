import { pool, query } from '../db/pool.js';
import { analyzeJobText } from './analyzer.js';
import { selectQuestions } from './recommender.js';
import { computePlan } from './plan.js';

export async function loadQuestionBank(db = pool) {
  const { rows } = await db.query(`
    SELECT q.id, q.slug, q.title, q.topic, q.difficulty, q.question_type AS type,
           q.source_name, q.source_url, array_agg(s.slug) AS skills
      FROM questions q
      JOIN question_skills qs ON qs.question_id = q.id
      JOIN skills s ON s.id = qs.skill_id
     GROUP BY q.id`);
  return rows;
}

async function rebuildJobQuestions(client, jobId) {
  const { rows: jobSkills } = await client.query(
    `SELECT s.slug, s.name, js.importance FROM job_skills js JOIN skills s ON s.id = js.skill_id WHERE js.job_id = $1`, [jobId]);
  const bank = await loadQuestionBank(client);
  const picks = selectQuestions(jobSkills, bank);
  await client.query('DELETE FROM job_questions WHERE job_id = $1', [jobId]);
  for (const p of picks) {
    await client.query('INSERT INTO job_questions (job_id, question_id, relevance_reason) VALUES ($1,$2,$3)',
      [jobId, p.question_id, p.reason]);
  }
}

async function withTx(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const out = await fn(client);
    await client.query('COMMIT');
    return out;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

export async function createJob(userKey, { text, company, role_title, source_url }) {
  const analysis = analyzeJobText(text);
  const jobId = await withTx(async (client) => {
    const { rows } = await client.query(
      `INSERT INTO jobs (user_key, company, role_title, experience_level, source_url, description_text)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
      [userKey, company || analysis.company, role_title || analysis.role_title, analysis.experience_level, source_url || null, text]);
    const id = rows[0].id;
    const { rows: skillRows } = await client.query('SELECT id, slug FROM skills');
    const idBySlug = Object.fromEntries(skillRows.map((r) => [r.slug, r.id]));
    for (const s of analysis.skills) {
      await client.query(
        `INSERT INTO job_skills (job_id, skill_id, importance, evidence_or_reason, source) VALUES ($1,$2,$3,$4,'detected')`,
        [id, idBySlug[s.slug], s.importance, s.evidence]);
    }
    await rebuildJobQuestions(client, id);
    return id;
  });
  return getJob(userKey, jobId);
}

export async function listJobs(userKey) {
  const { rows } = await query(
    `SELECT j.id, j.company, j.role_title, j.experience_level, j.created_at,
            (SELECT count(*) FROM job_skills WHERE job_id = j.id)::int AS skill_count
       FROM jobs j WHERE j.user_key = $1 ORDER BY j.created_at DESC LIMIT 50`, [userKey]);
  return rows;
}

export async function getJob(userKey, jobId) {
  const { rows } = await query(
    `SELECT id, company, role_title, experience_level, source_url, description_text, created_at
       FROM jobs WHERE id = $1 AND user_key = $2`, [jobId, userKey]);
  if (!rows[0]) return null;
  const job = rows[0];

  const { rows: skills } = await query(
    `SELECT s.id AS skill_id, s.slug, s.name, s.category, js.importance, js.evidence_or_reason AS evidence, js.source,
            COALESCE(a.proficiency_level, NULL) AS proficiency
       FROM job_skills js
       JOIN skills s ON s.id = js.skill_id
       LEFT JOIN user_skill_assessments a ON a.skill_id = s.id AND a.user_key = $2
      WHERE js.job_id = $1
      ORDER BY CASE js.importance WHEN 'required' THEN 0 WHEN 'preferred' THEN 1 ELSE 2 END, s.category, s.name`,
    [jobId, userKey]);

  const { rows: questions } = await query(
    `SELECT q.id, q.slug, q.title, q.topic, q.difficulty, q.question_type AS type, q.source_name, q.source_url,
            jq.relevance_reason, p.status, p.notes,
            (SELECT array_agg(s.slug) FROM question_skills qs JOIN skills s ON s.id = qs.skill_id WHERE qs.question_id = q.id) AS skills
       FROM job_questions jq
       JOIN questions q ON q.id = jq.question_id
       LEFT JOIN user_question_progress p ON p.question_id = q.id AND p.user_key = $2
      WHERE jq.job_id = $1
      ORDER BY CASE q.difficulty WHEN 'easy' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END, q.id`,
    [jobId, userKey]);

  return { ...job, skills, questions };
}

export async function deleteJob(userKey, jobId) {
  const { rowCount } = await query('DELETE FROM jobs WHERE id = $1 AND user_key = $2', [jobId, userKey]);
  return rowCount > 0;
}

/** User corrections: add / change / remove a skill on a job. Returns updated job or null if not owned. */
export async function addJobSkill(userKey, jobId, skillSlug, importance) {
  return withTx(async (client) => {
    const own = await client.query('SELECT 1 FROM jobs WHERE id=$1 AND user_key=$2', [jobId, userKey]);
    if (!own.rowCount) return null;
    const sk = await client.query('SELECT id FROM skills WHERE slug=$1', [skillSlug]);
    if (!sk.rowCount) return { error: 'unknown_skill' };
    await client.query(
      `INSERT INTO job_skills (job_id, skill_id, importance, evidence_or_reason, source) VALUES ($1,$2,$3,'Added by you','user')
       ON CONFLICT (job_id, skill_id) DO UPDATE SET importance = EXCLUDED.importance, source = 'user'`,
      [jobId, sk.rows[0].id, importance]);
    await rebuildJobQuestions(client, jobId);
    return { ok: true };
  });
}

export async function updateJobSkill(userKey, jobId, skillId, importance) {
  return withTx(async (client) => {
    const r = await client.query(
      `UPDATE job_skills SET importance=$3, source='user'
        WHERE job_id=$1 AND skill_id=$2 AND EXISTS (SELECT 1 FROM jobs WHERE id=$1 AND user_key=$4)`,
      [jobId, skillId, importance, userKey]);
    if (!r.rowCount) return null;
    await rebuildJobQuestions(client, jobId);
    return { ok: true };
  });
}

export async function removeJobSkill(userKey, jobId, skillId) {
  return withTx(async (client) => {
    const r = await client.query(
      `DELETE FROM job_skills WHERE job_id=$1 AND skill_id=$2 AND EXISTS (SELECT 1 FROM jobs WHERE id=$1 AND user_key=$3)`,
      [jobId, skillId, userKey]);
    if (!r.rowCount) return null;
    await rebuildJobQuestions(client, jobId);
    return { ok: true };
  });
}

export async function saveAssessment(userKey, skillId, level) {
  const { rowCount } = await query(
    `INSERT INTO user_skill_assessments (user_key, skill_id, proficiency_level) VALUES ($1,$2,$3)
     ON CONFLICT (user_key, skill_id) DO UPDATE SET proficiency_level=EXCLUDED.proficiency_level, updated_at=now()`,
    [userKey, skillId, level]);
  return rowCount > 0;
}

export async function saveProgress(userKey, questionId, status, notes) {
  const { rows } = await query(
    `INSERT INTO user_question_progress (user_key, question_id, status, notes) VALUES ($1,$2,$3,$4)
     ON CONFLICT (user_key, question_id) DO UPDATE SET status=EXCLUDED.status, notes=EXCLUDED.notes, updated_at=now()
     RETURNING question_id, status, notes`,
    [userKey, questionId, status, notes ?? '']);
  return rows[0];
}

export async function clearProgress(userKey, questionId) {
  await query('DELETE FROM user_question_progress WHERE user_key=$1 AND question_id=$2', [userKey, questionId]);
}

export async function buildPlan(userKey, jobId) {
  const job = await getJob(userKey, jobId);
  if (!job) return null;
  const assessments = new Map(job.skills.filter((s) => s.proficiency).map((s) => [s.skill_id, s.proficiency]));
  const progress = new Map(job.questions.filter((q) => q.status).map((q) => [q.id, q.status]));
  const plan = computePlan({ jobSkills: job.skills, assessments, jobQuestions: job.questions, progress });
  return { job: { id: job.id, company: job.company, role_title: job.role_title }, ...plan };
}

export async function searchQuestions({ skill, difficulty, type, limit = 50 }) {
  const params = [];
  const where = [];
  if (skill) {
    params.push(String(skill).toLowerCase());
    where.push(`EXISTS (SELECT 1 FROM question_skills qs JOIN skills s ON s.id = qs.skill_id
                         WHERE qs.question_id = q.id AND (lower(s.slug) = $${params.length} OR lower(s.name) = $${params.length}))`);
  }
  if (difficulty) { params.push(difficulty); where.push(`q.difficulty = $${params.length}`); }
  if (type) { params.push(type); where.push(`q.question_type = $${params.length}`); }
  params.push(limit);
  const { rows } = await query(
    `SELECT q.id, q.slug, q.title, q.topic, q.difficulty, q.question_type AS type, q.source_name, q.source_url
       FROM questions q ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
      ORDER BY CASE q.difficulty WHEN 'easy' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END, q.id
      LIMIT $${params.length}`, params);
  return rows;
}

export async function listSkills() {
  const { rows } = await query('SELECT id, slug, name, category, description FROM skills ORDER BY category, name');
  return rows;
}

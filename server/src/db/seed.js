import { fileURLToPath } from 'node:url';
import { pool } from './pool.js';
import { migrate } from './migrate.js';
import { SKILLS } from '../data/skills.js';
import { QUESTIONS } from '../data/questions.js';

export function validateData() {
  const slugs = new Set(SKILLS.map((s) => s.slug));
  const qslugs = new Set();
  const errors = [];
  for (const s of SKILLS) for (const i of s.implies ?? []) if (!slugs.has(i)) errors.push(`skill ${s.slug} implies unknown ${i}`);
  for (const q of QUESTIONS) {
    if (qslugs.has(q.slug)) errors.push(`duplicate question slug ${q.slug}`);
    qslugs.add(q.slug);
    for (const t of q.skills) if (!slugs.has(t)) errors.push(`question ${q.slug} has unknown skill tag ${t}`);
    if (!/^https:\/\//.test(q.url)) errors.push(`question ${q.slug} has non-https url`);
  }
  if (errors.length) throw new Error('Seed data invalid:\n' + errors.join('\n'));
}

export async function seed() {
  validateData();
  await migrate();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const s of SKILLS) {
      await client.query(
        `INSERT INTO skills (slug, name, category, description) VALUES ($1,$2,$3,$4)
         ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name, category=EXCLUDED.category, description=EXCLUDED.description`,
        [s.slug, s.name, s.category, s.description]);
    }
    const { rows: skillRows } = await client.query('SELECT id, slug FROM skills');
    const skillId = Object.fromEntries(skillRows.map((r) => [r.slug, r.id]));
    for (const q of QUESTIONS) {
      const { rows } = await client.query(
        `INSERT INTO questions (slug, title, topic, difficulty, question_type, source_name, source_url)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         ON CONFLICT (slug) DO UPDATE SET title=EXCLUDED.title, topic=EXCLUDED.topic, difficulty=EXCLUDED.difficulty,
           question_type=EXCLUDED.question_type, source_name=EXCLUDED.source_name, source_url=EXCLUDED.source_url
         RETURNING id`,
        [q.slug, q.title, q.topic, q.difficulty, q.type, q.source, q.url]);
      const qid = rows[0].id;
      await client.query('DELETE FROM question_skills WHERE question_id = $1', [qid]);
      for (const tag of new Set(q.skills)) {
        await client.query('INSERT INTO question_skills (question_id, skill_id) VALUES ($1,$2)', [qid, skillId[tag]]);
      }
    }
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
  return { skills: SKILLS.length, questions: QUESTIONS.length };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  seed().then((r) => { console.log('Seeded', r); return pool.end(); })
    .catch((e) => { console.error(e.message); process.exit(1); });
}

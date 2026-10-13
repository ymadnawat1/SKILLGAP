// Integration tests: need Postgres (DATABASE_URL) with the seed loaded:  npm run seed && npm test
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { createApp } from '../src/app.js';
import { pool } from '../src/db/pool.js';
import { seed } from '../src/db/seed.js';

let server, base;
const user = `t-${randomUUID()}`;
const text = readFileSync(new URL('./fixtures/sde-intern.txt', import.meta.url), 'utf8');

before(async () => {
  await seed();
  server = createApp({ clientOrigin: '' }).listen(0);
  base = `http://127.0.0.1:${server.address().port}/api`;
});
after(async () => {
  await pool.query('DELETE FROM jobs WHERE user_key = $1', [user]);
  await pool.query('DELETE FROM user_skill_assessments WHERE user_key = $1', [user]);
  await pool.query('DELETE FROM user_question_progress WHERE user_key = $1', [user]);
  server.close(); await pool.end();
});

const call = (path, { method = 'GET', body, key = user, raw } = {}) =>
  fetch(base + path, { method, headers: { 'content-type': 'application/json', ...(key ? { 'x-user-key': key } : {}) }, body: raw ?? (body ? JSON.stringify(body) : undefined) })
    .then(async (r) => ({ status: r.status, body: r.status === 204 ? null : await r.json() }));

test('full flow: analyze -> persist -> assess -> progress -> plan, and data survives re-fetch', async () => {
  const a = await call('/jobs/analyze', { method: 'POST', body: { text } });
  assert.equal(a.status, 201);
  const job = a.body.job;
  assert.ok(job.skills.length > 10 && job.questions.length > 10);

  const dsa = job.skills.find((s) => s.slug === 'dsa');
  assert.equal((await call('/assessments/skills', { method: 'POST', body: { skill_id: dsa.skill_id, proficiency_level: 'need_to_learn' } })).status, 200);
  const q = job.questions.find((x) => x.skills.includes('dsa'));
  assert.equal((await call('/progress/questions', { method: 'POST', body: { question_id: q.id, status: 'needed_hints', notes: 'two-pass' } })).status, 200);

  const again = (await call(`/jobs/${job.id}`)).body.job; // "refresh"
  assert.equal(again.skills.find((s) => s.slug === 'dsa').proficiency, 'need_to_learn');
  assert.equal(again.questions.find((x) => x.id === q.id).status, 'needed_hints');
  assert.equal(again.questions.find((x) => x.id === q.id).notes, 'two-pass');

  const plan = (await call(`/jobs/${job.id}/plan`)).body.plan;
  assert.equal(plan.topics[0].slug, 'dsa');
  assert.ok(plan.estimated_preparation_score >= 0 && plan.estimated_preparation_score <= 100);

  const list = (await call('/jobs')).body.jobs;
  assert.ok(list.some((j) => j.id === job.id));
});

test('user can correct detected skills; questions follow', async () => {
  const job = (await call('/jobs/analyze', { method: 'POST', body: { text } })).body.job;
  const docker = job.skills.find((s) => s.slug === 'docker');
  const del = await call(`/jobs/${job.id}/skills/${docker.skill_id}`, { method: 'DELETE' });
  assert.equal(del.status, 200);
  assert.ok(!del.body.job.skills.some((s) => s.slug === 'docker'));
  assert.ok(!del.body.job.questions.some((q) => q.skills.includes('docker') && q.relevance_reason.includes('Docker')));
  const add = await call(`/jobs/${job.id}/skills`, { method: 'POST', body: { skill_slug: 'graphs', importance: 'preferred' } });
  assert.equal(add.status, 201);
  assert.equal(add.body.job.skills.find((s) => s.slug === 'graphs').source, 'user');
  assert.ok(add.body.job.questions.some((q) => q.skills.includes('graphs')));
  assert.equal((await call(`/jobs/${job.id}/skills`, { method: 'POST', body: { skill_slug: 'nope' } })).status, 400);
  const patch = await call(`/jobs/${job.id}/skills/${add.body.job.skills.find((s) => s.slug === 'graphs').skill_id}`, { method: 'PATCH', body: { importance: 'required' } });
  assert.equal(patch.body.job.skills.find((s) => s.slug === 'graphs').importance, 'required');
});

test('users cannot see or modify each other\'s jobs', async () => {
  const job = (await call('/jobs/analyze', { method: 'POST', body: { text } })).body.job;
  const other = `o-${randomUUID()}`;
  assert.equal((await call(`/jobs/${job.id}`, { key: other })).status, 404);
  assert.equal((await call(`/jobs/${job.id}/plan`, { key: other })).status, 404);
  assert.equal((await call(`/jobs/${job.id}`, { method: 'DELETE', key: other })).status, 404);
  assert.equal((await call(`/jobs/${job.id}/skills/1`, { method: 'DELETE', key: other })).status, 404);
  assert.equal((await call(`/jobs/${job.id}`, { method: 'DELETE' })).status, 204);
});

test('input validation', async () => {
  assert.equal((await call('/jobs/analyze', { method: 'POST', body: { text } , key: null })).status, 401);
  assert.equal((await call('/jobs/analyze', { method: 'POST', body: { text } , key: 'bad key!' })).status, 400);
  assert.equal((await call('/jobs/analyze', { method: 'POST', body: {} })).status, 400);
  assert.equal((await call('/jobs/analyze', { method: 'POST', body: { text: 'short' } })).body.error.code, 'text_too_short');
  assert.equal((await call('/jobs/analyze', { method: 'POST', body: { text: 'x'.repeat(20001) } })).body.error.code, 'text_too_long');
  assert.equal((await call('/jobs/analyze', { method: 'POST', body: { text, source_url: 'javascript:alert(1)' } })).status, 400);
  assert.equal((await call('/jobs/analyze', { method: 'POST', raw: '{bad' })).body.error.code, 'bad_json');
  assert.equal((await call('/jobs/abc')).status, 400);
  assert.equal((await call('/jobs/999999999')).status, 404);
  assert.equal((await call('/progress/questions', { method: 'POST', body: { question_id: 1, status: 'nope' } })).status, 400);
  assert.equal((await call('/progress/questions', { method: 'POST', body: { question_id: 99999999, status: 'not_solved' } })).status, 400);
  assert.equal((await call('/assessments/skills', { method: 'POST', body: { skill_id: 1, proficiency_level: 'expert' } })).status, 400);
  assert.equal((await call('/questions?difficulty=impossible')).status, 400);
  assert.equal((await call('/nothing-here')).status, 404);
});

test('questions filter by skill name or slug; SQL injection attempt is inert', async () => {
  const r = await call('/questions?skill=React&difficulty=easy');
  assert.ok(r.body.questions.length > 0 && r.body.questions.every((q) => q.difficulty === 'easy'));
  assert.equal((await call('/questions?skill=react')).body.questions.length, (await call('/questions?skill=React')).body.questions.length);
  const inj = await call(`/questions?skill=${encodeURIComponent("x'; DROP TABLE skills;--")}`);
  assert.equal(inj.status, 200); assert.deepEqual(inj.body.questions, []);
  assert.ok((await call('/skills')).body.skills.length > 40);
});

test('seed data is consistent: every concept/coding question has an https link and tags', async () => {
  const { rows } = await pool.query(`SELECT count(*)::int n FROM questions q WHERE source_url !~ '^https://' OR NOT EXISTS (SELECT 1 FROM question_skills WHERE question_id = q.id)`);
  assert.equal(rows[0].n, 0);
});

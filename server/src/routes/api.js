import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { query } from '../db/pool.js';
import * as jobs from '../services/jobs.js';
import { HttpError, bad, jobInput, intParam, oneOf, optString, LEVELS, STATUSES, IMPORTANCES } from './validate.js';

export const api = Router();
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res)).catch(next);
const needUser = (req) => { if (!req.userKey) throw new HttpError(401, 'X-User-Key header is required', 'user_key_required'); return req.userKey; };
const notFound = () => new HttpError(404, 'Not found', 'not_found');

const analyzeLimiter = rateLimit({ windowMs: 60_000, limit: 15, standardHeaders: true, legacyHeaders: false,
  message: { error: { code: 'rate_limited', message: 'Too many analyses, please wait a minute.' } } });

api.get('/health', wrap(async (_req, res) => {
  await query('SELECT 1');
  res.json({ status: 'ok' });
}));

api.get('/skills', wrap(async (_req, res) => res.json({ skills: await jobs.listSkills() })));

api.get('/questions', wrap(async (req, res) => {
  const { skill, difficulty, type } = req.query;
  if (difficulty) oneOf(difficulty, ['easy', 'medium', 'hard'], 'difficulty');
  if (type) oneOf(type, ['coding', 'sql', 'concept'], 'type');
  if (skill !== undefined && (typeof skill !== 'string' || skill.length > 60)) throw bad('skill must be a short string');
  res.json({ questions: await jobs.searchQuestions({ skill, difficulty, type }) });
}));

api.post('/jobs/analyze', analyzeLimiter, wrap(async (req, res) => {
  const userKey = needUser(req);
  const job = await jobs.createJob(userKey, jobInput(req.body));
  res.status(201).json({ job });
}));

api.get('/jobs', wrap(async (req, res) => res.json({ jobs: await jobs.listJobs(needUser(req)) })));

api.get('/jobs/:id', wrap(async (req, res) => {
  const job = await jobs.getJob(needUser(req), intParam(req.params.id, 'id'));
  if (!job) throw notFound();
  res.json({ job });
}));

api.delete('/jobs/:id', wrap(async (req, res) => {
  if (!(await jobs.deleteJob(needUser(req), intParam(req.params.id, 'id')))) throw notFound();
  res.status(204).end();
}));

// --- user corrections to detected skills ---
api.post('/jobs/:id/skills', wrap(async (req, res) => {
  const userKey = needUser(req);
  const id = intParam(req.params.id, 'id');
  const slug = req.body?.skill_slug;
  if (typeof slug !== 'string') throw bad('skill_slug is required');
  const importance = oneOf(req.body?.importance ?? 'required', IMPORTANCES, 'importance');
  const r = await jobs.addJobSkill(userKey, id, slug, importance);
  if (!r) throw notFound();
  if (r.error) throw bad('Unknown skill', 'unknown_skill');
  res.status(201).json({ job: await jobs.getJob(userKey, id) });
}));

api.patch('/jobs/:id/skills/:skillId', wrap(async (req, res) => {
  const userKey = needUser(req);
  const id = intParam(req.params.id, 'id');
  const importance = oneOf(req.body?.importance, IMPORTANCES, 'importance');
  if (!(await jobs.updateJobSkill(userKey, id, intParam(req.params.skillId, 'skillId'), importance))) throw notFound();
  res.json({ job: await jobs.getJob(userKey, id) });
}));

api.delete('/jobs/:id/skills/:skillId', wrap(async (req, res) => {
  const userKey = needUser(req);
  const id = intParam(req.params.id, 'id');
  if (!(await jobs.removeJobSkill(userKey, id, intParam(req.params.skillId, 'skillId')))) throw notFound();
  res.json({ job: await jobs.getJob(userKey, id) });
}));

// --- self-assessment & progress ---
api.post('/assessments/skills', wrap(async (req, res) => {
  const userKey = needUser(req);
  const skillId = intParam(req.body?.skill_id, 'skill_id');
  const level = oneOf(req.body?.proficiency_level, LEVELS, 'proficiency_level');
  try { await jobs.saveAssessment(userKey, skillId, level); }
  catch (e) { if (e.code === '23503') throw bad('Unknown skill', 'unknown_skill'); throw e; }
  res.json({ skill_id: skillId, proficiency_level: level });
}));

api.post('/progress/questions', wrap(async (req, res) => {
  const userKey = needUser(req);
  const qid = intParam(req.body?.question_id, 'question_id');
  if (req.body?.status === null) { await jobs.clearProgress(userKey, qid); return res.json({ question_id: qid, status: null }); }
  const status = oneOf(req.body?.status, STATUSES, 'status');
  const notes = optString(req.body?.notes, 'notes', 1000) ?? '';
  try { res.json(await jobs.saveProgress(userKey, qid, status, notes)); }
  catch (e) { if (e.code === '23503') throw bad('Unknown question', 'unknown_question'); throw e; }
}));

api.get('/jobs/:id/plan', wrap(async (req, res) => {
  const plan = await jobs.buildPlan(needUser(req), intParam(req.params.id, 'id'));
  if (!plan) throw notFound();
  res.json({ plan });
}));

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computePlan } from '../src/services/plan.js';
import { selectQuestions } from '../src/services/recommender.js';

const skills = [
  { skill_id: 1, slug: 'dsa', name: 'DSA', category: 'DSA', importance: 'required', evidence: '' },
  { skill_id: 2, slug: 'docker', name: 'Docker', category: 'Tools', importance: 'preferred', evidence: '' },
  { skill_id: 3, slug: 'sql', name: 'SQL', category: 'SQL', importance: 'required', evidence: '' },
];
const mkq = (id, difficulty, tags, type = 'coding') => ({ id, title: `Q${id}`, difficulty, type, source_name: 's', source_url: 'https://x', skills: tags });
const qs = [mkq(1, 'easy', ['dsa']), mkq(2, 'medium', ['dsa']), mkq(3, 'hard', ['dsa']), mkq(4, 'easy', ['docker'], 'concept'), mkq(5, 'easy', ['sql'])];

test('required + need_to_learn outranks preferred + need_to_learn and strong required', () => {
  const plan = computePlan({
    jobSkills: skills,
    assessments: new Map([[1, 'need_to_learn'], [2, 'need_to_learn'], [3, 'confident']]),
    jobQuestions: qs, progress: new Map(),
  });
  assert.deepEqual(plan.topics.map((t) => t.slug), ['dsa', 'docker', 'sql']);
  assert.equal(plan.topics[0].status, 'focus');
  assert.equal(plan.topics[2].status, 'on_track');
});

test('explicit "need to learn" outranks an unrated skill of equal importance', () => {
  const plan = computePlan({ jobSkills: skills.filter((s) => s.slug !== 'docker'), assessments: new Map([[1, 'need_to_learn']]), jobQuestions: qs, progress: new Map() });
  assert.equal(plan.topics[0].slug, 'dsa');
});

test('solving questions independently lowers priority; failing raises it', () => {
  const base = { jobSkills: [skills[0]], assessments: new Map([[1, 'somewhat_familiar']]), jobQuestions: qs };
  const none = computePlan({ ...base, progress: new Map() }).topics[0].priority;
  const solved = computePlan({ ...base, progress: new Map([[1, 'solved_independently'], [2, 'solved_independently'], [3, 'solved_independently']]) }).topics[0].priority;
  const failed = computePlan({ ...base, progress: new Map([[1, 'not_solved'], [2, 'not_solved'], [3, 'not_solved']]) }).topics[0].priority;
  assert.ok(solved < none && none < failed, `${solved} < ${none} < ${failed}`);
});

test('next practice skips solved questions and starts easy for weak skills', () => {
  const plan = computePlan({ jobSkills: [skills[0]], assessments: new Map([[1, 'need_to_learn']]), jobQuestions: qs, progress: new Map([[1, 'solved_independently']]) });
  const t = plan.topics[0];
  assert.deepEqual(t.next_practice.map((q) => q.id), [2, 3]);
  const strong = computePlan({ jobSkills: [skills[0]], assessments: new Map([[1, 'confident']]), jobQuestions: qs, progress: new Map() }).topics[0];
  assert.equal(strong.next_practice[0].difficulty, 'hard');
});

test('concept questions are returned as resources, not practice', () => {
  const t = computePlan({ jobSkills: [skills[1]], assessments: new Map(), jobQuestions: qs, progress: new Map() }).topics[0];
  assert.equal(t.next_practice.length, 0);
  assert.equal(t.resources[0].id, 4);
});

test('score is 0-100, bounded, and rises with confidence', () => {
  const lo = computePlan({ jobSkills: skills, assessments: new Map(skills.map((s) => [s.skill_id, 'need_to_learn'])), jobQuestions: qs, progress: new Map() });
  const hi = computePlan({ jobSkills: skills, assessments: new Map(skills.map((s) => [s.skill_id, 'confident'])), jobQuestions: qs, progress: new Map() });
  assert.ok(lo.estimated_preparation_score >= 0 && hi.estimated_preparation_score <= 100);
  assert.ok(hi.estimated_preparation_score > lo.estimated_preparation_score);
  assert.match(lo.score_note, /not a prediction/i);
});

test('unrated skills are neutral: ranked below "need to learn", labelled unrated, excluded from the score', () => {
  const plan = computePlan({ jobSkills: skills, assessments: new Map([[1, 'need_to_learn']]), jobQuestions: qs, progress: new Map() });
  assert.equal(plan.topics[0].slug, 'dsa');
  assert.equal(plan.topics.find((t) => t.slug === 'sql').status, 'unrated');
  assert.equal(plan.skills_rated, 1);
  assert.equal(plan.estimated_preparation_score, 10); // only DSA (need_to_learn = 0.1) is known
  const none = computePlan({ jobSkills: skills, assessments: new Map(), jobQuestions: qs, progress: new Map() });
  assert.equal(none.estimated_preparation_score, null);
  assert.ok(none.topics.every((t) => t.status === 'unrated'));
  assert.deepEqual(none.topics.map((t) => t.slug), ['dsa', 'sql', 'docker']); // still ordered by importance
});

test('practising a skill counts as known even if never self-rated', () => {
  const plan = computePlan({ jobSkills: [skills[0]], assessments: new Map(), jobQuestions: qs, progress: new Map([[1, 'solved_independently']]) });
  assert.notEqual(plan.topics[0].status, 'unrated');
});

test('empty job has a sane plan', () => {
  const p = computePlan({ jobSkills: [], assessments: new Map(), jobQuestions: [], progress: new Map() });
  assert.equal(p.topics.length, 0);
});

test('selectQuestions respects budgets, tags and a mixed difficulty spread', () => {
  const bank = Array.from({ length: 12 }, (_, i) => ({ id: i + 1, slug: `q${i}`, topic: 'arrays', difficulty: ['easy', 'medium', 'hard'][i % 3], type: 'coding', skills: ['arrays'] }))
    .concat([{ id: 99, slug: 'other', topic: 'sql', difficulty: 'easy', type: 'sql', skills: ['sql'] }]);
  const picks = selectQuestions([{ slug: 'arrays', name: 'Arrays', importance: 'required' }], bank);
  assert.equal(picks.length, 5);
  assert.ok(picks.every((p) => p.question_id !== 99));
  const diffs = new Set(picks.map((p) => bank.find((q) => q.id === p.question_id).difficulty));
  assert.ok(diffs.size >= 2);
  assert.equal(selectQuestions([{ slug: 'arrays', name: 'Arrays', importance: 'inferred' }], bank).length, 2);
  assert.deepEqual(selectQuestions([{ slug: 'nothing', name: 'N', importance: 'required' }], bank), []);
});

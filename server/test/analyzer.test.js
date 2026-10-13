import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { analyzeJobText, detectLevel } from '../src/services/analyzer.js';

const fixture = readFileSync(new URL('./fixtures/sde-intern.txt', import.meta.url), 'utf8');
const bySlug = (r) => Object.fromEntries(r.skills.map((s) => [s.slug, s]));

test('extracts company, role and level', () => {
  const r = analyzeJobText(fixture);
  assert.equal(r.company, 'Acme Labs');
  assert.match(r.role_title, /Software Development Engineer Intern/);
  assert.equal(r.experience_level, 'Intern');
});

test('classifies required vs preferred using sections and cue words', () => {
  const s = bySlug(analyzeJobText(fixture));
  for (const slug of ['react', 'nodejs', 'express', 'sql', 'postgresql', 'git', 'dsa']) assert.equal(s[slug].importance, 'required', slug);
  for (const slug of ['docker', 'cloud', 'nosql', 'os', 'networking']) assert.equal(s[slug].importance, 'preferred', slug);
});

test('every detected skill carries evidence', () => {
  for (const s of analyzeJobText(fixture).skills) assert.ok(s.evidence.length > 0, s.slug);
});

test('java is not confused with javascript and node.js does not trigger "js" twice', () => {
  const only = bySlug(analyzeJobText('Experience with JavaScript and React is required for this frontend position at Foo.'));
  assert.ok(only.javascript); assert.equal(only.java, undefined);
  const j = bySlug(analyzeJobText('Must know Java and Spring Boot for backend services at Foo Corp.'));
  assert.ok(j.java); assert.equal(j.javascript, undefined);
});

test('ambiguous words are ignored in ordinary prose', () => {
  const s = bySlug(analyzeJobText('Express interest early. Go to market with our team. We are a full stack team that values the rest of you.'));
  assert.equal(s.express, undefined); assert.equal(s.go, undefined); assert.equal(s['rest-api'], undefined);
});

test('c++ / c# / ci/cd tokens', () => {
  const s = bySlug(analyzeJobText('We use C++ and CI/CD pipelines with Node.js.'));
  assert.ok(s.cpp); assert.ok(s.cicd); assert.ok(s.nodejs);
});

test('implied skills are marked inferred and never override explicit ones', () => {
  const s = bySlug(analyzeJobText('Requirements:\n- React\n- JavaScript'));
  assert.equal(s.javascript.importance, 'required');
  assert.equal(s['html-css'].importance, 'inferred');
  assert.match(s['html-css'].evidence, /Implied by React/);
});

test('level detection', () => {
  assert.equal(detectLevel('We are hiring freshers'), 'Entry level');
  assert.equal(detectLevel('5+ years of experience'), 'Senior');
  assert.equal(detectLevel('2-4 years of experience'), 'Mid level');
  assert.equal(detectLevel('Build things'), null);
});

test('empty / junk input does not throw', () => {
  for (const t of ['', '   ', '!!!', 'a'.repeat(5000)]) assert.doesNotThrow(() => analyzeJobText(t));
});

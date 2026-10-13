# SkillGap

Turn a real job posting into a practical, personalised interview-prep plan.

Paste a job description → SkillGap detects the skills it asks for (with the phrase that triggered each) →
suggests practice questions from a curated bank → you rate your skills and mark questions →
you get a ranked plan with a short reason for every recommendation.

> **Honest by design.** Detection is rule-based and fully transparent. Questions are *practice suggestions* from a
> curated bank, not predictions of any employer's interview. The "estimated preparation score" is a study guide, not
> a hiring prediction, and the UI says so.

## Status

| Phase | Scope | State |
|---|---|---|
| 0–6 | Frontend, API, PostgreSQL, rule-based extraction, question bank, self-assessment, plan | **Built and tested** |
| 7 | LLM-assisted parsing (backend only, validated JSON, rules as fallback) | Not started |
| 8 | Bookmarklet / job-board APIs instead of scraping, deployment | Not started |

## Stack
React + Vite + React Router (plain CSS) · Node.js + Express · PostgreSQL (`pg`, parameterised queries only).

## Run locally
Requires Node 20+ and PostgreSQL 14+.

```bash
# 1. database
createdb skillgap            # or use any Postgres; then set DATABASE_URL

# 2. backend
cd server
cp .env.example .env         # edit DATABASE_URL if needed
npm install
npm run seed                 # creates tables + loads skills and the question bank
npm start                    # http://localhost:4000

# 3. frontend (new terminal)
cd client
npm install
npm run dev                  # http://localhost:5173  (proxies /api to :4000)
```

Tests: `cd server && npm test` (unit tests need nothing; API tests need the seeded database).
Verify question links (run on your machine, they need open internet): `npm run check-links`.

## Architecture
```
React (client/)  --JSON/REST-->  Express (server/src/routes)
                                   ├─ services/analyzer.js     rule-based skill + meta extraction (pure)
                                   ├─ services/recommender.js  curated question selection (pure)
                                   ├─ services/plan.js         explainable priority formula (pure)
                                   └─ PostgreSQL               jobs, skills, questions, assessments, progress
```
Identity: the browser generates a random key (`X-User-Key`). There are no accounts or passwords in the MVP; data is
scoped to that key, and users cannot read each other's jobs. Real auth is a later step.

## API
| Method & path | Purpose |
|---|---|
| `POST /api/jobs/analyze` | Analyse pasted text, save the job, return skills + suggested questions |
| `GET /api/jobs`, `GET /api/jobs/:id`, `DELETE /api/jobs/:id` | List / load / delete saved jobs |
| `POST /api/jobs/:id/skills`, `PATCH`/`DELETE /api/jobs/:id/skills/:skillId` | Correct detected skills (questions are re-selected) |
| `GET /api/questions?skill=React&difficulty=easy&type=concept` | Browse the curated bank |
| `GET /api/skills` | Skill taxonomy |
| `POST /api/assessments/skills` | Save `confident` / `somewhat_familiar` / `need_to_learn` |
| `POST /api/progress/questions` | Save `solved_independently` / `needed_hints` / `not_solved` (`status: null` clears) |
| `GET /api/jobs/:id/plan` | Ranked preparation plan |

## How the plan is computed
Per skill: `readiness = (1 − w)·self_rating + w·practice`, where self-rating is confident 0.9 / somewhat familiar 0.5 /
need to learn 0.1 / unrated 0.5 (unknown), practice is the mean credit of attempted questions (solved 1, hints 0.5, not
solved 0), and `w = min(attempts, 3)/3 · 0.5`. `priority = importance_weight × (1 − readiness)` with required 3,
preferred 2, inferred 1. The score is the importance-weighted mean readiness of skills you have rated or practised.
Constants live at the top of `server/src/services/plan.js`.

## Database schema
`skills`, `questions`, `question_skills` (tags), `jobs`, `job_skills` (importance + evidence), `job_questions`
(relevance reason), `user_skill_assessments`, `user_question_progress`. See `server/src/db/schema.sql`.

## Limitations
- Keyword rules miss implicit or unusual wording ("build things that scale"). That is why users can edit skills.
- The question bank is small (about 160 items) and tuned for software roles; DSA links point to LeetCode/Codeforces
  and learning links to official docs. Verify links with `npm run check-links` before publishing.
- No accounts yet; clearing browser storage loses access to your saved data.
- Job URLs are stored but never fetched (job sites restrict scraping).

## Security notes
Parameterised SQL only · input length limits and validation on every route · JSON body limit · rate limiting ·
secrets only in `.env` (see `.env.example`) · no API keys in the frontend.

## Roadmap
Phase 7 LLM parsing · Phase 8 "Send to SkillGap" bookmarklet, Greenhouse/Lever API import, deployment ·
accounts · multi-job comparison.

// Phase 5: choose curated questions for a job's skills. Pure function, deterministic.
// The app (not an LLM) owns question selection: only questions from the curated bank are ever returned.

const BUDGET = { required: 5, preferred: 3, inferred: 2 };
const IMPORTANCE_ORDER = { required: 0, preferred: 1, inferred: 2 };
const DIFF_RANK = { easy: 0, medium: 1, hard: 2 };
// Preferred difficulty mix per slot: start easy, build up, include one stretch problem.
const DIFF_PLAN = ['easy', 'medium', 'medium', 'easy', 'hard'];

/**
 * @param jobSkills  [{ slug, name, importance }]
 * @param questions  [{ id, slug, topic, difficulty, type, skills: [slug] }]
 * @returns [{ question_id, skill_slug, reason }]  (one row per distinct question)
 */
export function selectQuestions(jobSkills, questions) {
  const ordered = [...jobSkills].sort((a, b) => IMPORTANCE_ORDER[a.importance] - IMPORTANCE_ORDER[b.importance]);
  const chosen = new Map(); // question_id -> { skill_slug, reason }

  for (const skill of ordered) {
    const budget = BUDGET[skill.importance] ?? 2;
    const candidates = questions
      .filter((q) => q.skills.includes(skill.slug))
      .sort((a, b) =>
        // Prefer questions whose primary topic is this skill, then ones not already chosen for another skill.
        (b.topic === skill.slug) - (a.topic === skill.slug) ||
        (chosen.has(a.id) - chosen.has(b.id)) ||
        DIFF_RANK[a.difficulty] - DIFF_RANK[b.difficulty] ||
        a.id - b.id);

    const picked = [];
    const take = (q) => { picked.push(q); candidates.splice(candidates.indexOf(q), 1); };

    // Always include one concept/learning resource when the skill has one (useful for non-DSA skills).
    const concept = candidates.find((q) => q.type === 'concept' && q.topic === skill.slug);
    if (concept && skill.importance !== 'inferred') take(concept);

    for (const wanted of DIFF_PLAN) {
      if (picked.length >= budget) break;
      const exact = candidates.find((q) => q.difficulty === wanted);
      const next = exact ?? [...candidates].sort((a, b) =>
        Math.abs(DIFF_RANK[a.difficulty] - DIFF_RANK[wanted]) - Math.abs(DIFF_RANK[b.difficulty] - DIFF_RANK[wanted]))[0];
      if (!next) break;
      take(next);
    }

    for (const q of picked) {
      if (!chosen.has(q.id)) {
        chosen.set(q.id, {
          skill_slug: skill.slug,
          reason: `Practice for ${skill.name} (${skill.importance} in this job)`,
        });
      }
    }
  }
  return [...chosen.entries()].map(([question_id, v]) => ({ question_id, ...v }));
}

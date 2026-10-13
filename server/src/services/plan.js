// Phase 6: explainable prioritisation. Pure function; no DB access.
//
// For every job skill:
//   self_ready      = confident 0.9 | somewhat_familiar 0.5 | need_to_learn 0.1 | unrated 0.5 (unknown: neutral, ranked below anything you marked weak)
//   practice_ready  = mean over ATTEMPTED questions of (solved_independently 1 | needed_hints 0.5 | not_solved 0)
//   practice weight = min(attempts, 3) / 3 * 0.5          (so up to half of readiness comes from real practice)
//   readiness       = (1 - w) * self_ready + w * practice_ready
//   gap             = 1 - readiness
//   priority        = importance_weight * gap              (required 3 | preferred 2 | inferred 1)
// Estimated preparation score = 100 * sum(w * readiness) / sum(w), over skills you rated or practised only
// (null until you have rated at least one skill). Unrated skills never inflate or deflate it.
// This is a study guide, NOT a prediction of hiring outcomes.

export const IMPORTANCE_WEIGHT = { required: 3, preferred: 2, inferred: 1 };
export const SELF_READY = { confident: 0.9, somewhat_familiar: 0.5, need_to_learn: 0.1, unrated: 0.5 };
export const PRACTICE_SCORE = { solved_independently: 1, needed_hints: 0.5, not_solved: 0 };
const DIFF_ORDERS = {
  low: ['easy', 'medium', 'hard'],
  mid: ['medium', 'easy', 'hard'],
  high: ['hard', 'medium', 'easy'],
};
const STATUS_ORDER = { needed_hints: 0, not_solved: 1, none: 2 }; // revisit started-but-shaky items first

const LEVEL_TEXT = {
  confident: "you rated yourself confident",
  somewhat_familiar: "you rated yourself somewhat familiar",
  need_to_learn: "you marked it as needing to be learned",
  unrated: "you haven't rated it yet",
};

function skillReadiness(level, attemptStatuses) {
  const self = SELF_READY[level];
  const attempts = attemptStatuses.length;
  if (!attempts) return { readiness: self, practice: null, attempts: 0 };
  const practice = attemptStatuses.reduce((s, st) => s + PRACTICE_SCORE[st], 0) / attempts;
  const w = (Math.min(attempts, 3) / 3) * 0.5;
  return { readiness: (1 - w) * self + w * practice, practice, attempts };
}

/**
 * @param jobSkills     [{ skill_id, slug, name, category, importance, evidence }]
 * @param assessments   Map<skill_id, level>
 * @param jobQuestions  [{ id, title, difficulty, type, source_name, source_url, skills: [slug] }]
 * @param progress      Map<question_id, status>
 */
export function computePlan({ jobSkills, assessments, jobQuestions, progress }) {
  const topics = jobSkills.map((js) => {
    const level = assessments.get(js.skill_id) ?? 'unrated';
    const qs = jobQuestions.filter((q) => q.skills.includes(js.slug));
    const attempted = qs.filter((q) => progress.has(q.id)).map((q) => progress.get(q.id));
    const { readiness, practice, attempts } = skillReadiness(level, attempted);
    const gap = 1 - readiness;
    const priority = IMPORTANCE_WEIGHT[js.importance] * gap;

    const band = readiness < 0.4 ? 'low' : readiness < 0.7 ? 'mid' : 'high';
    const order = DIFF_ORDERS[band];
    const open = qs.filter((q) => progress.get(q.id) !== 'solved_independently');
    const sortQ = (a, b) =>
      order.indexOf(a.difficulty) - order.indexOf(b.difficulty) ||
      STATUS_ORDER[progress.get(a.id) ?? 'none'] - STATUS_ORDER[progress.get(b.id) ?? 'none'] || a.id - b.id;
    const slim = (q) => ({
      id: q.id, title: q.title, difficulty: q.difficulty, type: q.type, source_name: q.source_name,
      source_url: q.source_url, status: progress.get(q.id) ?? null,
    });
    const nextPractice = open.filter((q) => q.type !== 'concept').sort(sortQ).slice(0, 3).map(slim);
    const resources = open.filter((q) => q.type === 'concept').sort(sortQ).slice(0, 2).map(slim);

    // Human-readable "why"
    const parts = [`${cap(js.importance)} for this job`, LEVEL_TEXT[level]];
    if (attempts) parts.push(`${attempts} practice question${attempts > 1 ? 's' : ''} attempted (avg ${Math.round(practice * 100)}% credit)`);
    else if (qs.length) parts.push('no practice attempted yet');
    const status = level === 'unrated' && !attempts ? 'unrated' : gap >= 0.6 ? 'focus' : gap >= 0.3 ? 'review' : 'on_track';

    return {
      skill_id: js.skill_id, slug: js.slug, name: js.name, category: js.category, importance: js.importance,
      evidence: js.evidence, proficiency: level, readiness: round(readiness), gap: round(gap), priority: round(priority),
      status, reason: parts.join('; ') + '.', next_practice: nextPractice, resources,
      questions_total: qs.length, questions_solved: qs.filter((q) => progress.get(q.id) === 'solved_independently').length,
    };
  }).sort((a, b) => b.priority - a.priority || a.name.localeCompare(b.name));

  const known = topics.filter((t) => t.status !== 'unrated');
  const totalW = known.reduce((s, t) => s + IMPORTANCE_WEIGHT[t.importance], 0);
  const score = totalW ? Math.round(100 * known.reduce((s, t) => s + IMPORTANCE_WEIGHT[t.importance] * t.readiness, 0) / totalW) : null;
  const rated = known.length;
  const focus = topics.filter((t) => t.status === 'focus').slice(0, 3).map((t) => t.name);

  return {
    estimated_preparation_score: score,
    score_note: 'Estimated preparation score: a study guide based on the skills you have rated or practised, weighted by how important each skill is in this job. It is not a prediction of interview or hiring outcomes.',
    skills_rated: rated,
    skills_total: topics.length,
    focus_summary: focus.length ? `Start with: ${focus.join(', ')}.` : rated === 0 ? 'Rate your skills on the Skills tab to get a personalised order.' : rated < topics.length ? 'Nothing urgent among the skills you rated. Rate the rest to complete the picture.' : 'You look on track. Keep practising and review weak spots.',
    topics,
  };
}

const cap = (s) => s[0].toUpperCase() + s.slice(1);
const round = (n) => Math.round(n * 100) / 100;

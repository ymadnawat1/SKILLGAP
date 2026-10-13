// Rule-based job description analyzer (Phase 4). Pure functions: no DB, no network.
// Output is transparent: every detected skill carries the phrase/line that triggered it.

import { SKILLS, SKILL_BY_SLUG } from '../data/skills.js';

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');

// Build one regex per skill. Boundaries treat + # . as part of a token so "java" != "javascript"
// and "c++" matches but "c" alone is never an alias.
const BOUNDARY_BEFORE = '(?<![A-Za-z0-9+#_])(?<![A-Za-z0-9]\\.)';
const BOUNDARY_AFTER = '(?![A-Za-z0-9+#_]|\\.[A-Za-z0-9])';

const CASE_SENSITIVE = {
  express: `${BOUNDARY_BEFORE}(Express)(?!\\s+(?:interest|your|yourself|ideas|views|opinions))(?![A-Za-z0-9+#_])`,
  go: `${BOUNDARY_BEFORE}(Go)(?=\\s*(?:,|/|\\)|$)|\\s+(?:or|and)\\s+(?:Python|Java|C\\+\\+|Rust))`,
};

const MATCHERS = SKILLS.map((skill) => {
  const aliases = [...new Set(skill.aliases.filter((a) => a && !/[()]/.test(a)))];
  aliases.sort((a, b) => b.length - a.length);
  const res = [new RegExp(`${BOUNDARY_BEFORE}(${aliases.map(escapeRe).join('|')})${BOUNDARY_AFTER}`, 'gi')];
  // Ambiguous words ("Express", "Go") only match with exact capitalization plus a tech-ish context.
  const cs = CASE_SENSITIVE[skill.slug];
  if (cs) res.push(new RegExp(cs, 'g'));
  return { slug: skill.slug, res };
});

const PREFERRED_HEADING = /\b(preferred|nice[- ]to[- ]have|bonus|good to have|desirable|plus(es)?|additional|extra credit|optional)\b/i;
const REQUIRED_HEADING = /\b(requirements?|required|qualifications?|must[- ]have|what you('|’)?ll need|what you need|what we('|’)?re looking for|you have|skills?|who you are|about you|minimum)\b/i;
const PREFERRED_LINE = /\b(preferred|nice[- ]to[- ]have|bonus|good to have|a plus|is a plus|are a plus|desirable|familiarity|exposure to|awareness of|knowledge of .* is (a )?plus|would be (a )?(plus|advantage|nice)|advantage)\b/i;
const REQUIRED_LINE = /\b(must|required|requirement|proficien(t|cy)|strong|solid|expert(ise)?|hands[- ]on|experience (with|in)|knowledge of|understanding of)\b/i;

const RANK = { required: 3, preferred: 2, inferred: 1 };

export function normalizeText(text) {
  return String(text)
    .replace(/\r\n?/g, '\n')
    .replace(/[•●▪◦‣·▪●•◦‣]/g, '\n- ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function isHeading(line) {
  const t = line.trim().replace(/[:：]$/, '');
  if (!t || t.length > 60) return false;
  if (/^[-*]\s/.test(line.trim())) return false;
  if (/[.;]$/.test(t)) return false;
  // Heading-ish: ends with colon in original, or is short Title Case / uppercase without a verb-y sentence.
  return /[:：]\s*$/.test(line.trim()) || /^[A-Z][A-Za-z&/' ’-]{2,}$/.test(t) && t.split(' ').length <= 6;
}

/** Split into lines tagged with the section they belong to ("required" | "preferred" | "other"). */
export function sectionize(text) {
  const lines = normalizeText(text).split('\n');
  let section = 'other';
  const out = [];
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    if (isHeading(line)) {
      if (PREFERRED_HEADING.test(line)) section = 'preferred';
      else if (REQUIRED_HEADING.test(line)) section = 'required';
      else section = 'other';
      out.push({ text: line, section, heading: true });
      continue;
    }
    out.push({ text: line.replace(/^[-*]\s*/, ''), section, heading: false });
  }
  return out;
}

function classifyLine(line) {
  if (PREFERRED_LINE.test(line.text)) return 'preferred';
  if (line.section === 'preferred') return 'preferred';
  if (REQUIRED_LINE.test(line.text) || line.section === 'required') return 'required';
  return 'required'; // explicit mention elsewhere (e.g. responsibilities) is treated as something you will use
}

const clip = (s, n = 160) => (s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s);

/** Detect skills with importance + evidence. */
export function detectSkills(text) {
  const lines = sectionize(text).filter((l) => !l.heading);
  const found = new Map(); // slug -> { importance, evidence, matched }

  for (const line of lines) {
    for (const m of MATCHERS) {
      let hit = null;
      for (const re of m.res) { re.lastIndex = 0; hit = re.exec(line.text); if (hit) break; }
      if (!hit) continue;
      const importance = classifyLine(line);
      const prev = found.get(m.slug);
      if (!prev || RANK[importance] > RANK[prev.importance]) {
        found.set(m.slug, { importance, evidence: clip(line.text), matched: hit[0] });
      }
    }
  }

  // Implied skills (only added if not explicitly found).
  for (const [slug, info] of [...found.entries()]) {
    for (const implied of SKILL_BY_SLUG[slug].implies ?? []) {
      if (found.has(implied)) continue;
      found.set(implied, {
        importance: 'inferred',
        evidence: `Implied by ${SKILL_BY_SLUG[slug].name} ("${info.matched}")`,
        matched: null,
      });
    }
  }

  return [...found.entries()]
    .map(([slug, v]) => ({ slug, name: SKILL_BY_SLUG[slug].name, category: SKILL_BY_SLUG[slug].category, ...v }))
    .sort((a, b) => RANK[b.importance] - RANK[a.importance] || a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
}

const ROLE_WORDS = /(engineer|developer|intern(ship)?|analyst|programmer|architect|scientist|sde|swe|consultant|trainee|specialist|administrator|devops|full[- ]?stack|front[- ]?end|back[- ]?end)/i;

/** Best-effort company / role / level. All are overridable by the user. */
export function extractMeta(text) {
  const lines = normalizeText(text).split('\n').map((l) => l.trim()).filter(Boolean);
  let role = null;
  let company = null;

  const labelled = (label) => {
    const re = new RegExp(`^(?:${label})\\s*[:\\-–]\\s*(.{2,100})$`, 'i');
    for (const l of lines.slice(0, 25)) { const m = re.exec(l); if (m) return m[1].trim(); }
    return null;
  };
  role = labelled('job title|role|position|title');
  company = labelled('company|organi[sz]ation|employer');

  if (!role) {
    const first = lines.slice(0, 5).find((l) => l.length <= 100 && ROLE_WORDS.test(l) && !/[.!?]$/.test(l));
    if (first) {
      // "Software Engineer at Acme" / "Software Engineer - Acme"
      const at = /^(.*?)\s+(?:at|@|[-–|])\s+(.+)$/.exec(first);
      if (at && ROLE_WORDS.test(at[1])) { role = at[1].trim(); company ??= at[2].trim(); }
      else role = first.replace(/[:：]$/, '');
    }
  }
  if (!company) {
    const joined = lines.slice(0, 30).join('\n');
    const m = /(?:^|\n)(?:about|join)\s+([A-Z][A-Za-z0-9&.' -]{1,40}?)(?:\s*[:\n.]|$)/.exec(joined)
      || /\b([A-Z][A-Za-z0-9&.' -]{1,40}?)\s+is (?:hiring|looking for|seeking)\b/.exec(joined)
      || /\b(?:at|with)\s+([A-Z][A-Za-z0-9&.-]{1,30}(?:\s[A-Z][A-Za-z0-9&.-]{1,30})?)(?=[,.\s])/.exec(joined);
    if (m) company = m[1].trim();
  }
  if (company && /^(us|our|the|you|team|company)$/i.test(company)) company = null;

  return { company: company || null, role_title: role || null, experience_level: detectLevel(text) };
}

export function detectLevel(text) {
  const t = text.toLowerCase();
  if (/\b(intern(ship)?|trainee|apprentice)\b/.test(t)) return 'Intern';
  if (/\b(fresher|freshers|new grad|new graduate|entry[- ]level|graduate (engineer|program)|0\s*[-–]\s*1\s*years?|campus)\b/.test(t)) return 'Entry level';
  if (/\b(senior|sr\.|staff|principal|lead)\b/.test(t)) return 'Senior';
  const yrs = [...t.matchAll(/(\d{1,2})\s*\+?\s*(?:[-–]\s*\d{1,2}\s*)?(?:years?|yrs?)/g)].map((m) => Number(m[1]));
  if (yrs.length) {
    const min = Math.min(...yrs);
    if (min <= 1) return 'Entry level';
    if (min <= 3) return 'Mid level';
    return 'Senior';
  }
  return null;
}

export function analyzeJobText(text) {
  return { ...extractMeta(text), skills: detectSkills(text) };
}

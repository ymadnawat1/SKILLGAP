// Small hand-rolled validators (no extra deps). All user input is validated server-side.
export class HttpError extends Error {
  constructor(status, message, code) { super(message); this.status = status; this.code = code; }
}
export const bad = (msg, code = 'bad_request') => new HttpError(400, msg, code);

export const LEVELS = ['confident', 'somewhat_familiar', 'need_to_learn'];
export const STATUSES = ['solved_independently', 'needed_hints', 'not_solved'];
export const IMPORTANCES = ['required', 'preferred', 'inferred'];
export const MIN_TEXT = 50;
export const MAX_TEXT = 20000;

export function optString(v, name, max) {
  if (v === undefined || v === null || v === '') return null;
  if (typeof v !== 'string') throw bad(`${name} must be a string`);
  const t = v.trim();
  if (t.length > max) throw bad(`${name} must be at most ${max} characters`);
  return t || null;
}

export function jobInput(body) {
  if (!body || typeof body !== 'object') throw bad('JSON body required');
  if (typeof body.text !== 'string') throw bad('text (the job description) is required');
  const text = body.text.trim();
  if (text.length < MIN_TEXT) throw bad(`Job description is too short (min ${MIN_TEXT} characters). Paste the full posting.`, 'text_too_short');
  if (text.length > MAX_TEXT) throw bad(`Job description is too long (max ${MAX_TEXT} characters).`, 'text_too_long');
  const source_url = optString(body.source_url, 'source_url', 500);
  if (source_url) {
    let u;
    try { u = new URL(source_url); } catch { throw bad('source_url must be a valid URL'); }
    if (!['http:', 'https:'].includes(u.protocol)) throw bad('source_url must be http(s)');
  }
  return { text, company: optString(body.company, 'company', 120), role_title: optString(body.role_title, 'role_title', 120), source_url };
}

export function intParam(v, name) {
  const n = Number(v);
  if (!Number.isInteger(n) || n < 1 || n > 2_147_483_647) throw bad(`${name} must be a positive integer`);
  return n;
}

export function oneOf(v, list, name) {
  if (!list.includes(v)) throw bad(`${name} must be one of: ${list.join(', ')}`);
  return v;
}

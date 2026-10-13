// Thin API client. Identity = random key kept in this browser (no accounts in the MVP).
const BASE = import.meta.env.VITE_API_URL ?? '';
const KEY_NAME = 'skillgap_user_key';
let memoryKey = null;

export function userKey() {
  try {
    let k = localStorage.getItem(KEY_NAME);
    if (!k) { k = crypto.randomUUID(); localStorage.setItem(KEY_NAME, k); }
    return k;
  } catch {
    memoryKey ??= crypto.randomUUID(); // storage blocked: works for this tab only
    return memoryKey;
  }
}

async function request(path, { method = 'GET', body } = {}) {
  let res;
  try {
    res = await fetch(`${BASE}/api${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', 'X-User-Key': userKey() },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new Error('Cannot reach the server. Check your connection and try again.');
  }
  if (res.status === 204) return null;
  let data = null;
  try { data = await res.json(); } catch { /* non-JSON error */ }
  if (!res.ok) throw new Error(data?.error?.message ?? `Request failed (${res.status})`);
  return data;
}

export const api = {
  analyze: (payload) => request('/jobs/analyze', { method: 'POST', body: payload }).then((d) => d.job),
  listJobs: () => request('/jobs').then((d) => d.jobs),
  getJob: (id) => request(`/jobs/${id}`).then((d) => d.job),
  deleteJob: (id) => request(`/jobs/${id}`, { method: 'DELETE' }),
  listSkills: () => request('/skills').then((d) => d.skills),
  addSkill: (id, skill_slug, importance) => request(`/jobs/${id}/skills`, { method: 'POST', body: { skill_slug, importance } }).then((d) => d.job),
  setImportance: (id, skillId, importance) => request(`/jobs/${id}/skills/${skillId}`, { method: 'PATCH', body: { importance } }).then((d) => d.job),
  removeSkill: (id, skillId) => request(`/jobs/${id}/skills/${skillId}`, { method: 'DELETE' }).then((d) => d.job),
  assess: (skill_id, proficiency_level) => request('/assessments/skills', { method: 'POST', body: { skill_id, proficiency_level } }),
  progress: (question_id, status, notes) => request('/progress/questions', { method: 'POST', body: { question_id, status, notes } }),
  plan: (id) => request(`/jobs/${id}/plan`).then((d) => d.plan),
};

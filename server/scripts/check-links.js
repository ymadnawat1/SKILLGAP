// Run locally: npm run check-links
// Verifies every question URL responds (2xx/3xx). Some sites block bots (403/429): treat those as "check by hand".
import { QUESTIONS } from '../src/data/questions.js';

const results = { ok: [], blocked: [], broken: [] };
const queue = [...QUESTIONS];
async function worker() {
  while (queue.length) {
    const q = queue.shift();
    try {
      const res = await fetch(q.url, { method: 'GET', redirect: 'follow', headers: { 'user-agent': 'SkillGap-link-check/1.0' }, signal: AbortSignal.timeout(15000) });
      if (res.ok) results.ok.push(q.slug);
      else if ([403, 429, 999].includes(res.status)) results.blocked.push(`${q.slug} (${res.status}) ${q.url}`);
      else results.broken.push(`${q.slug} (${res.status}) ${q.url}`);
    } catch (e) {
      results.broken.push(`${q.slug} (${e.message}) ${q.url}`);
    }
  }
}
await Promise.all(Array.from({ length: 6 }, worker));
console.log(`OK: ${results.ok.length}  Blocked/unknown: ${results.blocked.length}  Broken: ${results.broken.length}`);
if (results.blocked.length) console.log('\nBlocked (verify manually):\n' + results.blocked.join('\n'));
if (results.broken.length) { console.log('\nBroken:\n' + results.broken.join('\n')); process.exitCode = 1; }

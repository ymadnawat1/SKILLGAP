import { useMemo, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { api } from '../api.js';
import { Badge, ErrorBox, NextStep, Segmented, STATUSES } from '../components/ui.jsx';

const TYPE_LABEL = { coding: 'Coding', sql: 'SQL', concept: 'Concept / learn' };

export default function Questions() {
  const { job, setJob } = useOutletContext();
  const [diff, setDiff] = useState('all');
  const [type, setType] = useState('all');
  const [skill, setSkill] = useState('all');
  const [hide, setHide] = useState(false);
  const [error, setError] = useState('');

  const skillOptions = useMemo(() => job.skills.map((s) => ({ slug: s.slug, name: s.name })), [job.skills]);
  const shown = job.questions.filter((q) =>
    (diff === 'all' || q.difficulty === diff) && (type === 'all' || q.type === type) &&
    (skill === 'all' || q.skills.includes(skill)) && !(hide && q.status === 'solved_independently'));
  const solved = job.questions.filter((q) => q.status === 'solved_independently').length;

  async function setStatus(q, status) {
    setError('');
    const prev = q.status;
    const patch = (st) => setJob((j) => ({ ...j, questions: j.questions.map((x) => (x.id === q.id ? { ...x, status: st } : x)) }));
    patch(status);
    try { await api.progress(q.id, status, q.notes ?? ''); } catch (e) { patch(prev); setError(e.message); }
  }

  return (
    <div>
      <div className="note">
        These are <strong>practice suggestions chosen from a curated bank</strong>, matched to the skills above. They are
        not leaked or predicted interview questions. Links open the original site (we do not copy problem text).
      </div>
      <div className="row between wrap">
        <p className="muted">{solved} of {job.questions.length} solved independently.</p>
        <Link to="../plan">See your plan →</Link>
      </div>
      <ErrorBox error={error} />

      <div className="filters">
        <label>Difficulty
          <select value={diff} onChange={(e) => setDiff(e.target.value)}>
            <option value="all">All</option><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
          </select></label>
        <label>Type
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="all">All</option>{Object.entries(TYPE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select></label>
        <label>Skill
          <select value={skill} onChange={(e) => setSkill(e.target.value)}>
            <option value="all">All skills</option>{skillOptions.map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}
          </select></label>
        <label className="check"><input type="checkbox" checked={hide} onChange={(e) => setHide(e.target.checked)} /> Hide solved</label>
      </div>

      {shown.length === 0 && <div className="card"><p>No questions match these filters.</p></div>}
      <ul className="qlist">
        {shown.map((q) => (
          <li key={q.id} className={`q ${q.status === 'solved_independently' ? 'done' : ''}`}>
            <div className="q-main">
              <a href={q.source_url} target="_blank" rel="noopener noreferrer" className="q-title">{q.title} <span aria-hidden>↗</span></a>
              <div className="q-meta">
                <Badge kind={q.difficulty}>{q.difficulty}</Badge>
                <Badge kind="cat">{TYPE_LABEL[q.type]}</Badge>
                <span className="muted small">{q.source_name}</span>
              </div>
              <p className="muted small">{q.relevance_reason}</p>
            </div>
            <Segmented tone="status" label={`Status for ${q.title}`} options={STATUSES} value={q.status}
              onChange={(v) => setStatus(q, v)} />
          </li>
        ))}
      </ul>

      <NextStep
        to="../plan"
        back={{ to: '..', label: '← Back to skills' }}
        label="Next: See your plan →"
        done={job.questions.length > 0 && solved === job.questions.length}
        hint={solved === job.questions.length ? 'Every suggested question is solved.' : `${solved} of ${job.questions.length} solved. Your plan updates with whatever you have marked so far.`}
      />
    </div>
  );
}

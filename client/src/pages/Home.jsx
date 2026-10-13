import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { ErrorBox } from '../components/ui.jsx';

const MIN = 50;
const MAX = 20000;
const SAMPLE = `Software Development Engineer Intern at Acme Labs

About Acme Labs
Acme Labs is hiring students to build our full stack platform.

What you'll do:
- Build REST APIs using Node.js and Express
- Write SQL queries against PostgreSQL and design schemas
- Build UI components with React

Requirements:
- Strong understanding of data structures and algorithms
- Proficiency in JavaScript or Java
- Knowledge of Git and version control

Nice to have:
- Familiarity with Docker
- Experience with AWS or Redis
- Understanding of operating systems and computer networks`;

export default function Home() {
  const nav = useNavigate();
  const [text, setText] = useState('');
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [jobs, setJobs] = useState([]);

  useEffect(() => { api.listJobs().then(setJobs).catch(() => {}); }, []);

  const len = text.trim().length;
  const tooShort = len > 0 && len < MIN;

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (len < MIN) return setError(`Paste the full job description (at least ${MIN} characters).`);
    if (len > MAX) return setError(`That is too long (max ${MAX.toLocaleString()} characters). Trim boilerplate such as benefits.`);
    setBusy(true);
    try {
      const job = await api.analyze({ text, company, role_title: role, source_url: url });
      nav(`/jobs/${job.id}`);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <div className="home">
      <section className="hero">
        <h1>Turn a job posting into a prep plan.</h1>
        <p className="lead">
          Paste a job description. SkillGap detects what the role expects, suggests practice questions, and ranks
          what to study first based on how ready you feel.
        </p>
      </section>

      <form className="card" onSubmit={submit} noValidate>
        <div className="row-between">
          <label htmlFor="jd" className="label">Job description</label>
          <button type="button" className="link" onClick={() => setText(SAMPLE)}>Use a sample</button>
        </div>
        <textarea
          id="jd" rows={12} value={text} onChange={(e) => setText(e.target.value)}
          placeholder="Paste the full text of the job posting here…" aria-invalid={tooShort}
        />
        <div className={`counter ${len > MAX || tooShort ? 'warn' : ''}`}>{len.toLocaleString()} / {MAX.toLocaleString()}</div>

        <details className="optional">
          <summary>Optional details</summary>
          <div className="grid3">
            <div><label htmlFor="co" className="label">Company</label><input id="co" value={company} maxLength={120} onChange={(e) => setCompany(e.target.value)} placeholder="Detected automatically" /></div>
            <div><label htmlFor="ro" className="label">Role title</label><input id="ro" value={role} maxLength={120} onChange={(e) => setRole(e.target.value)} placeholder="Detected automatically" /></div>
            <div><label htmlFor="ur" className="label">Posting link</label><input id="ur" type="url" value={url} maxLength={500} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" /></div>
          </div>
          <p className="muted small">We never fetch this link; it is saved only so you can find the posting again.</p>
        </details>

        <ErrorBox error={error} />
        <button className="btn primary" disabled={busy}>{busy ? 'Analysing…' : 'Analyse job'}</button>
      </form>

      {jobs.length > 0 && (
        <section>
          <h2>Your recent jobs</h2>
          <ul className="joblist">
            {jobs.map((j) => (
              <li key={j.id}>
                <Link to={`/jobs/${j.id}`}>
                  <strong>{j.role_title || 'Untitled role'}</strong>
                  <span className="muted">{[j.company, j.experience_level, `${j.skill_count} skills`].filter(Boolean).join(' · ')}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

import { useCallback, useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { ErrorBox, Loading } from '../components/ui.jsx';

export default function JobLayout() {
  const { id } = useParams();
  const nav = useNavigate();
  const [job, setJob] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setError('');
    return api.getJob(id).then(setJob).catch((e) => setError(e.message));
  }, [id]);

  useEffect(() => { setJob(null); load(); }, [load]);

  async function remove() {
    if (!window.confirm('Delete this job and its analysis? Your question progress is kept.')) return;
    try { await api.deleteJob(id); nav('/'); } catch (e) { setError(e.message); }
  }

  if (error && !job) return <div className="card"><ErrorBox error={error} onRetry={load} /></div>;
  if (!job) return <Loading />;

  return (
    <div>
      <div className="jobhead">
        <div>
          <h1>{job.role_title || 'Untitled role'}</h1>
          <p className="muted">{[job.company, job.experience_level].filter(Boolean).join(' · ') || 'Company not detected'}
            {job.source_url && <> · <a href={job.source_url} target="_blank" rel="noopener noreferrer">posting ↗</a></>}</p>
        </div>
        <button className="btn small ghost" onClick={remove}>Delete job</button>
      </div>
      <nav className="tabs" aria-label="Job sections">
        <NavLink to="." end>1 · Skills</NavLink>
        <NavLink to="questions">2 · Practice</NavLink>
        <NavLink to="plan">3 · Plan</NavLink>
      </nav>
      <ErrorBox error={error} />
      <Outlet context={{ job, setJob, reload: load }} />
    </div>
  );
}

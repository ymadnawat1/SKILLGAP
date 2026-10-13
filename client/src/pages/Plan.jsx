import { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { api } from '../api.js';
import { Badge, ErrorBox, Loading, NextStep, prettyLevel } from '../components/ui.jsx';

const STATUS = { focus: 'Focus now', review: 'Review', on_track: 'On track', unrated: 'Not rated' };

export default function Plan() {
  const { job } = useOutletContext();
  const [plan, setPlan] = useState(null);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(null);

  // Refetch on every visit so edits made on other tabs are reflected.
  useEffect(() => { api.plan(job.id).then(setPlan).catch((e) => setError(e.message)); }, [job.id]);

  if (error) return <ErrorBox error={error} />;
  if (!plan) return <Loading label="Building your plan…" />;
  if (plan.topics.length === 0) return <div className="card"><p>Add at least one skill on the <Link to="..">Skills</Link> tab to get a plan.</p></div>;

  const focus = plan.topics.filter((t) => t.status === 'focus');
  const unrated = plan.topics.filter((t) => t.status === 'unrated');
  const other = plan.topics.filter((t) => t.status === 'review' || t.status === 'on_track');

  return (
    <div>
      <section className="scorecard">
        <div className="score" style={{ '--p': plan.estimated_preparation_score ?? 0 }} aria-label={plan.estimated_preparation_score === null ? 'No score yet: rate some skills' : `Estimated preparation score ${plan.estimated_preparation_score} out of 100`}>
          <span className="num">{plan.estimated_preparation_score ?? '–'}</span><span className="of">{plan.estimated_preparation_score === null ? 'not yet' : '/100'}</span>
        </div>
        <div>
          <h2>Estimated preparation score</h2>
          <p>{plan.focus_summary}</p>
          <p className="muted small">{plan.skills_rated} of {plan.skills_total} skills rated. {plan.score_note}</p>
          <details className="small">
            <summary>How is this calculated?</summary>
            <p className="muted">
              Each skill’s readiness blends your self-rating (confident 90%, somewhat familiar 50%, need to learn 10%,
              not rated 50%, i.e. unknown) with your practice results (solved 100%, with hints 50%, not solved 0%). Practice counts for
              up to half once you have attempted 3+ questions. Priority = importance weight (required 3, preferred 2,
              inferred 1) × (1 − readiness). The score is the importance-weighted average readiness of the skills you have rated or practised.
            </p>
          </details>
        </div>
      </section>

      <h2>Do these first</h2>
      {focus.length === 0 && <p className="muted">Nothing is urgent. Keep practising and review the topics below.</p>}
      <ol className="plan">{focus.map((t, i) => <Topic key={t.slug} t={t} n={i + 1} open={open === t.slug} toggle={() => setOpen(open === t.slug ? null : t.slug)} />)}</ol>

      {other.length > 0 && (
        <>
          <h2>Then review or maintain</h2>
          <ol className="plan">
            {other.map((t, i) => <Topic key={t.slug} t={t} n={focus.length + i + 1} open={open === t.slug} toggle={() => setOpen(open === t.slug ? null : t.slug)} />)}
          </ol>
        </>
      )}

      {unrated.length > 0 && (
        <>
          <h2>Rate these to sharpen your plan <span className="count">{unrated.length}</span></h2>
          <p className="muted small">You haven't said how comfortable you are with these yet, so they aren't ranked as weak or strong.{' '}
            <Link to="..">Rate them on the Skills tab</Link>. Ordered by importance in the job.</p>
          <ol className="plan">
            {unrated.map((t, i) => <Topic key={t.slug} t={t} n={focus.length + other.length + i + 1} open={open === t.slug} toggle={() => setOpen(open === t.slug ? null : t.slug)} />)}
          </ol>
        </>
      )}

      <NextStep
        to="../questions"
        label="Back to practice"
        back={{ to: '..', label: '← Adjust skill ratings' }}
        hint="Rate more skills or solve more questions, then come back. The plan refreshes every time you open it."
      />
      <p className="center"><Link to="/">Analyse another job</Link></p>
    </div>
  );
}

function Topic({ t, n, open, toggle }) {
  return (
    <li className={`topic status-${t.status}`}>
      <button className="topic-head" onClick={toggle} aria-expanded={open}>
        <span className="n">{n}</span>
        <span className="topic-name"><strong>{t.name}</strong>
          <span className="muted small">{t.category} · {t.importance} · {prettyLevel(t.proficiency === 'unrated' ? null : t.proficiency)}</span></span>
        <Badge kind={t.status}>{STATUS[t.status]}</Badge>
        <span className="bar" aria-hidden><span style={{ width: `${Math.round(t.readiness * 100)}%` }} /></span>
        <span className="chev" aria-hidden>{open ? '▾' : '▸'}</span>
      </button>
      {open && (
        <div className="topic-body">
          <p><strong>Why:</strong> {t.reason}</p>
          {t.evidence && <p className="muted small">From the posting: {t.importance === 'inferred' ? t.evidence : `“${t.evidence}”`}</p>}
          {t.next_practice.length > 0 && (<><h4>Practise next</h4>
            <ul>{t.next_practice.map((q) => <li key={q.id}><a href={q.source_url} target="_blank" rel="noopener noreferrer">{q.title} ↗</a> <Badge kind={q.difficulty}>{q.difficulty}</Badge> {q.status && <span className="muted small">({q.status.replace('_', ' ')})</span>}</li>)}</ul></>)}
          {t.resources.length > 0 && (<><h4>Learn / review</h4>
            <ul>{t.resources.map((q) => <li key={q.id}><a href={q.source_url} target="_blank" rel="noopener noreferrer">{q.title} ↗</a> <span className="muted small">{q.source_name}</span></li>)}</ul></>)}
          {t.next_practice.length === 0 && t.resources.length === 0 && <p className="muted">All suggested questions for this skill are solved.</p>}
        </div>
      )}
    </li>
  );
}

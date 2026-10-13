import { Link } from 'react-router-dom';

export const LEVELS = [
  { value: 'need_to_learn', label: 'Need to learn' },
  { value: 'somewhat_familiar', label: 'Somewhat familiar' },
  { value: 'confident', label: 'Confident' },
];
export const STATUSES = [
  { value: 'solved_independently', label: 'Solved alone' },
  { value: 'needed_hints', label: 'Needed hints' },
  { value: 'not_solved', label: 'Not solved' },
];

export function Segmented({ options, value, onChange, label, tone = 'level' }) {
  return (
    <div className={`seg seg-${tone}`} role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          className={value === o.value ? `on on-${o.value}` : ''}
          onClick={() => onChange(value === o.value ? null : o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export const Badge = ({ kind, children }) => <span className={`badge badge-${kind}`}>{children}</span>;

export function ErrorBox({ error, onRetry }) {
  if (!error) return null;
  return (
    <div className="error" role="alert">
      <span>{error}</span>
      {onRetry && <button className="btn small" onClick={onRetry}>Retry</button>}
    </div>
  );
}

export const Loading = ({ label = 'Loading…' }) => <p className="muted" role="status">{label}</p>;

export const prettyLevel = (v) => LEVELS.find((l) => l.value === v)?.label ?? 'Not rated';

/** Bottom-of-page call to action. Never blocks the user; becomes the highlighted button once `done`. */
export function NextStep({ to, label, hint, done = false, back }) {
  return (
    <div className={`nextstep ${done ? 'is-done' : ''}`}>
      <div className="nextstep-text">
        {done && <strong className="nextstep-done">✓ All done on this page.</strong>}
        {hint && <span className="muted">{hint}</span>}
      </div>
      <div className="row wrap">
        {back && <Link to={back.to} className="btn ghost">{back.label}</Link>}
        <Link to={to} className={`btn ${done ? 'primary' : ''}`}>{label}</Link>
      </div>
    </div>
  );
}

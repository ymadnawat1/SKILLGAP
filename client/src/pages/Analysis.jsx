import { useEffect, useMemo, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { api } from '../api.js';
import { Badge, ErrorBox, LEVELS, NextStep, Segmented } from '../components/ui.jsx';

const GROUPS = [
  { key: 'required', title: 'Required', hint: 'Explicitly asked for in the posting.' },
  { key: 'preferred', title: 'Preferred', hint: 'Nice to have, bonus or "familiarity".' },
  { key: 'inferred', title: 'Inferred', hint: 'Not stated, but implied by other skills. Remove if it does not apply.' },
];

export default function Analysis() {
  const { job, setJob } = useOutletContext();
  const [error, setError] = useState('');
  const [catalog, setCatalog] = useState([]);
  const [pick, setPick] = useState('');
  const [pickImp, setPickImp] = useState('required');

  useEffect(() => { api.listSkills().then(setCatalog).catch(() => {}); }, []);
  const have = useMemo(() => new Set(job.skills.map((s) => s.slug)), [job.skills]);
  const addable = catalog.filter((s) => !have.has(s.slug));
  const rated = job.skills.filter((s) => s.proficiency).length;

  const run = async (fn) => { setError(''); try { await fn(); } catch (e) { setError(e.message); } };

  const rate = (skill, level) => run(async () => {
    if (!level) return; // radio toggles are not clearable for skills
    await api.assess(skill.skill_id, level);
    setJob((j) => ({ ...j, skills: j.skills.map((s) => (s.skill_id === skill.skill_id ? { ...s, proficiency: level } : s)) }));
  });
  const importance = (skill, imp) => run(async () => setJob(await api.setImportance(job.id, skill.skill_id, imp)));
  const remove = (skill) => run(async () => setJob(await api.removeSkill(job.id, skill.skill_id)));
  const add = () => run(async () => { if (!pick) return; setJob(await api.addSkill(job.id, pick, pickImp)); setPick(''); });

  return (
    <div>
      <div className="note">
        These skills were found with keyword rules, so check them. Remove wrong ones, add missed ones, and rate where you
        stand. Ratings carry over to any other job that needs the same skill.
      </div>
      <p className="muted">{rated} of {job.skills.length} skills rated.{' '}
        {job.skills.length > 0 && <Link to="questions">Next: practice questions →</Link>}</p>
      <ErrorBox error={error} />

      {job.skills.length === 0 && (
        <div className="card"><p>No known skills were detected in this text. Add the ones that apply below.</p></div>
      )}

      {GROUPS.map((g) => {
        const list = job.skills.filter((s) => s.importance === g.key);
        if (!list.length) return null;
        return (
          <section key={g.key} className="group">
            <h2>{g.title} <span className="count">{list.length}</span></h2>
            <p className="muted small">{g.hint}</p>
            <ul className="skills">
              {list.map((s) => (
                <li key={s.skill_id} className="skill">
                  <div className="skill-main">
                    <div className="skill-title">
                      <strong>{s.name}</strong>
                      <Badge kind="cat">{s.category}</Badge>
                      {s.source === 'user' && <Badge kind="user">edited by you</Badge>}
                    </div>
                    <p className="evidence" title="Where this was found">{s.importance === 'inferred' ? s.evidence : `“${s.evidence}”`}</p>
                  </div>
                  <div className="skill-controls">
                    <Segmented label={`Your level in ${s.name}`} options={LEVELS} value={s.proficiency} onChange={(v) => rate(s, v)} />
                    <div className="row">
                      <select aria-label={`Importance of ${s.name}`} value={s.importance} onChange={(e) => importance(s, e.target.value)}>
                        <option value="required">Required</option>
                        <option value="preferred">Preferred</option>
                        <option value="inferred">Inferred</option>
                      </select>
                      <button className="btn small ghost" onClick={() => remove(s)} aria-label={`Remove ${s.name}`}>Remove</button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      <section className="card addskill">
        <h3>Missing something?</h3>
        <div className="row wrap">
          <select aria-label="Skill to add" value={pick} onChange={(e) => setPick(e.target.value)}>
            <option value="">Choose a skill…</option>
            {[...new Set(addable.map((s) => s.category))].map((cat) => (
              <optgroup key={cat} label={cat}>
                {addable.filter((s) => s.category === cat).map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}
              </optgroup>
            ))}
          </select>
          <select aria-label="Importance" value={pickImp} onChange={(e) => setPickImp(e.target.value)}>
            <option value="required">Required</option>
            <option value="preferred">Preferred</option>
          </select>
          <button className="btn" onClick={add} disabled={!pick}>Add skill</button>
        </div>
      </section>

      <NextStep
        to="questions"
        label="Next: Practice questions →"
        done={job.skills.length > 0 && rated === job.skills.length}
        hint={rated === job.skills.length ? 'Every skill is rated.' : `${rated} of ${job.skills.length} skills rated. You can continue now and rate the rest later.`}
      />
    </div>
  );
}

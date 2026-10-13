import { Link, NavLink, Route, Routes } from 'react-router-dom';
import Home from './pages/Home.jsx';
import JobLayout from './pages/JobLayout.jsx';
import Analysis from './pages/Analysis.jsx';
import Questions from './pages/Questions.jsx';
import Plan from './pages/Plan.jsx';

export default function App() {
  return (
    <>
      <header className="topbar">
        <div className="wrap topbar-inner">
          <Link to="/" className="brand">
            <span className="logo" aria-hidden>↗</span> SkillGap
          </Link>
          <nav><NavLink to="/" end>New job</NavLink></nav>
        </div>
      </header>
      <main className="wrap">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/jobs/:id" element={<JobLayout />}>
            <Route index element={<Analysis />} />
            <Route path="questions" element={<Questions />} />
            <Route path="plan" element={<Plan />} />
          </Route>
          <Route path="*" element={<div className="card"><h2>Page not found</h2><Link to="/">Back home</Link></div>} />
        </Routes>
      </main>
      <footer className="wrap footer">
        Practice suggestions and topic estimates are study aids, not predictions of any employer's real interview.
      </footer>
    </>
  );
}

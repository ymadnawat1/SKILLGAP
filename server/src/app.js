import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { HttpError, bad } from './routes/validate.js';
import { api } from './routes/api.js';

export function createApp({ clientOrigin = process.env.CLIENT_ORIGIN } = {}) {
  const app = express();
  app.disable('x-powered-by');
  // Behind a host's proxy (Render etc.) set TRUST_PROXY=1 so rate limiting sees each visitor's real IP.
  if (process.env.TRUST_PROXY) app.set('trust proxy', Number(process.env.TRUST_PROXY));
  app.use(cors({ origin: clientOrigin ? clientOrigin.split(',') : true }));
  app.use(express.json({ limit: '100kb' }));
  app.use(rateLimit({ windowMs: 60_000, limit: 120, standardHeaders: true, legacyHeaders: false }));

  // Anonymous identity: the browser generates a random key. No passwords, no accounts (see README).
  app.use('/api', (req, _res, next) => {
    const key = req.get('x-user-key');
    if (key !== undefined && !/^[A-Za-z0-9-]{8,64}$/.test(key)) return next(bad('Invalid X-User-Key header', 'bad_user_key'));
    req.userKey = key;
    next();
  });

  app.use('/api', api);
  app.use('/api', (_req, _res, next) => next(new HttpError(404, 'Not found', 'not_found')));

  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    if (err.type === 'entity.parse.failed') return res.status(400).json({ error: { code: 'bad_json', message: 'Malformed JSON body' } });
    if (err.type === 'entity.too.large') return res.status(413).json({ error: { code: 'too_large', message: 'Request body too large' } });
    if (err instanceof HttpError) return res.status(err.status).json({ error: { code: err.code ?? 'error', message: err.message } });
    console.error(err);
    res.status(500).json({ error: { code: 'internal', message: 'Something went wrong on our side. Please try again.' } });
  });
  return app;
}

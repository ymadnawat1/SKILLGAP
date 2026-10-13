import 'dotenv/config';
import { createApp } from './app.js';
import { migrate } from './db/migrate.js';

const port = Number(process.env.PORT ?? 4000);
await migrate();
createApp().listen(port, () => console.log(`SkillGap API listening on :${port}`));

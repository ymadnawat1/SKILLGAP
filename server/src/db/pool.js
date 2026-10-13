import pg from 'pg';
import 'dotenv/config';

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
});

// Always use parameterized queries: query('... WHERE id = $1', [id])
export const query = (text, params) => pool.query(text, params);

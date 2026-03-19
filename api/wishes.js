import { neon } from '@neondatabase/serverless';

function getDb() {
  return neon(process.env.DATABASE_URL);
}

async function ensureTable(sql) {
  await sql`
    CREATE TABLE IF NOT EXISTS wishes (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL DEFAULT 'Anonymous',
      message TEXT NOT NULL,
      pattern_seed INTEGER,
      pattern_mode VARCHAR(20),
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;
  // Add columns if table already exists without them
  await sql`ALTER TABLE wishes ADD COLUMN IF NOT EXISTS pattern_seed INTEGER`;
  await sql`ALTER TABLE wishes ADD COLUMN IF NOT EXISTS pattern_mode VARCHAR(20)`;
}

export default async function handler(req, res) {
  const sql = getDb();

  try {
    await ensureTable(sql);

    if (req.method === 'GET') {
      const rows = await sql`SELECT id, name, message, pattern_seed, pattern_mode, created_at FROM wishes ORDER BY created_at DESC LIMIT 200`;
      // Map snake_case to camelCase for frontend
      return res.json(rows.map(r => ({
        id: r.id,
        name: r.name,
        message: r.message,
        patternSeed: r.pattern_seed,
        patternMode: r.pattern_mode,
        created_at: r.created_at,
      })));
    }

    if (req.method === 'POST') {
      const { name, message, patternSeed, patternMode } = req.body;
      if (!message || !message.trim()) {
        return res.status(400).json({ error: 'Message is required' });
      }
      const safeName = (name || 'Anonymous').trim().slice(0, 100);
      const safeMessage = message.trim().slice(0, 200);
      const seed = patternSeed ? Math.floor(Number(patternSeed)) : null;
      const mode = patternMode && typeof patternMode === 'string' ? patternMode.slice(0, 20) : null;
      const [row] = await sql`
        INSERT INTO wishes (name, message, pattern_seed, pattern_mode)
        VALUES (${safeName}, ${safeMessage}, ${seed}, ${mode})
        RETURNING id, name, message, pattern_seed, pattern_mode, created_at
      `;
      return res.status(201).json({
        id: row.id,
        name: row.name,
        message: row.message,
        patternSeed: row.pattern_seed,
        patternMode: row.pattern_mode,
        created_at: row.created_at,
      });
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Wishes API error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

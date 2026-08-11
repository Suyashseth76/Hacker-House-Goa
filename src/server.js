import 'node:process';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import express from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import multer from 'multer';
import sharp from 'sharp';
import db from './db.js';
import { assignBuilderId, generateBuilderId } from './id.js';
import { renderBuilderCard, CARD_SIZE } from './card.js';

const app = express();
const PORT = Number(process.env.PORT || 3000);
const ROOT = path.resolve('.');
const UPLOAD_DIR = path.resolve('storage/uploads');
const GENERATED_DIR = path.resolve('storage/generated');
const TEMPLATE_PATH = path.resolve('public/master-template.png');

await fs.mkdir(UPLOAD_DIR, { recursive: true });
await fs.mkdir(GENERATED_DIR, { recursive: true });

app.disable('x-powered-by');
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());
app.use(express.static(path.join(ROOT, 'public')));
app.use('/generated', express.static(GENERATED_DIR, { immutable: false, maxAge: '1h' }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = new Set(['image/jpeg', 'image/png', 'image/webp']);
    cb(null, allowed.has(file.mimetype));
  }
});

function sessionTokenFrom(req) {
  return req.cookies.builder_session || null;
}

function setSessionCookie(res, token) {
  res.cookie('builder_session', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 24 * 365 * 2,
    path: '/'
  });
}

function getBuilderBySession(req) {
  const token = sessionTokenFrom(req);
  if (!token) return null;
  return db.prepare('SELECT * FROM builders WHERE session_token = ?').get(token) || null;
}

async function savePhoto(buffer, mime) {
  const extension = mime === 'image/png' ? 'png' : 'jpg';
  const filename = `${crypto.randomUUID()}.${extension}`;
  const filePath = path.join(UPLOAD_DIR, filename);

  await sharp(buffer)
    .rotate()
    .resize(1600, 1600, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 92 })
    .toFile(filePath);

  return filePath;
}

app.post('/api/session/refresh', async (req, res) => {
  try {
    const oldRow = getBuilderBySession(req);
    const token = crypto.randomBytes(32).toString('hex');

    let builderId;
    for (let attempt = 0; attempt < 100; attempt += 1) {
      builderId = generateBuilderId(db);
      try {
        if (oldRow) {
          db.prepare(`
            UPDATE builders
            SET session_token = ?, name = NULL, team_name = NULL, photo_url = NULL, builder_id = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `).run(token, builderId, oldRow.id);
        } else {
          db.prepare(`
            INSERT INTO builders (session_token, builder_id)
            VALUES (?, ?)
          `).run(token, builderId);
        }
        break;
      } catch (error) {
        if (!String(error?.message || '').includes('UNIQUE')) throw error;
        if (attempt === 99) throw new Error('Could not create a unique Builder ID.');
      }
    }

    setSessionCookie(res, token);
    return res.json({ builderId, cardSize: CARD_SIZE });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Could not start a fresh Builder ID session.' });
  }
});

app.get('/api/me', async (req, res) => {
  const row = getBuilderBySession(req);
  if (!row) {
    return res.json({ user: null, cardSize: CARD_SIZE });
  }

  let builderId = row.builder_id;
  if (!builderId) {
    builderId = assignBuilderId(db, row);
  }

  return res.json({
    user: {
      id: row.id,
      name: row.name || '',
      teamName: row.team_name || '',
      photoUrl: row.photo_url || '',
      builderId
    },
    cardUrl: `/generated/${builderId}.png`,
    cardSize: CARD_SIZE
  });
});

function getWebsiteUrl(req) {
  if (process.env.SITE_URL) return process.env.SITE_URL;
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const host = req.get('host') || `localhost:${PORT}`;
  return `${protocol}://${host}`;
}

app.post('/api/profile', upload.single('photo'), async (req, res) => {
  try {
    const name = String(req.body.name || '').trim();
    const teamName = String(req.body.teamName || '').trim();

    if (!name || name.length > 60) {
      return res.status(400).json({ error: 'Please enter a name up to 60 characters.' });
    }
    if (!teamName || teamName.length > 60) {
      return res.status(400).json({ error: 'Please enter a team name up to 60 characters.' });
    }

    let row = getBuilderBySession(req);
    let token = sessionTokenFrom(req);
    if (!row) {
      token = crypto.randomBytes(32).toString('hex');
      setSessionCookie(res, token);
      let created = false;
      for (let attempt = 0; attempt < 100 && !created; attempt += 1) {
        const builderId = generateBuilderId(db);
        try {
          const insert = db.prepare(`
            INSERT INTO builders (session_token, name, team_name, builder_id)
            VALUES (?, ?, ?, ?)
          `);
          const result = insert.run(token, name, teamName, builderId);
          row = db.prepare('SELECT * FROM builders WHERE id = ?').get(result.lastInsertRowid);
          created = true;
        } catch (error) {
          if (!String(error?.message || '').includes('UNIQUE')) throw error;
          // Collision: generate another candidate and retry.
        }
      }
      if (!created) throw new Error('Could not create a unique Builder ID.');
    } else {
      // Keep the Builder ID generated for the current page session; it changes on the next refresh.
      const builderId = assignBuilderId(db, row);
      db.prepare(`
        UPDATE builders
        SET name = ?, team_name = ?, builder_id = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(name, teamName, builderId, row.id);
      row = db.prepare('SELECT * FROM builders WHERE id = ?').get(row.id);
    }

    let photoPath = row.photo_url ? path.resolve(row.photo_url) : null;
    if (req.file) {
      photoPath = await savePhoto(req.file.buffer, req.file.mimetype);
      db.prepare('UPDATE builders SET photo_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run(path.relative(ROOT, photoPath), row.id);
      row.photo_url = path.relative(ROOT, photoPath);
    }

    if (!photoPath) {
      return res.status(400).json({ error: 'Please upload a photo.' });
    }

    const builderId = row.builder_id || assignBuilderId(db, row);
    const websiteUrl = getWebsiteUrl(req);
    const outputPath = await renderBuilderCard({
      photoPath,
      name: row.name,
      builderId,
      teamName: row.team_name,
      websiteUrl
    });

    return res.json({
      user: {
        id: row.id,
        name: row.name,
        teamName: row.team_name,
        photoUrl: row.photo_url,
        builderId
      },
      cardUrl: `/generated/${path.basename(outputPath)}?v=${Date.now()}`,
      cardSize: CARD_SIZE
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Could not generate the Builder ID card.' });
  }
});

app.get('/api/card/download', async (req, res) => {
  const row = getBuilderBySession(req);
  if (!row?.builder_id) return res.status(404).json({ error: 'No Builder ID card exists yet.' });

  const filePath = path.join(GENERATED_DIR, `${row.builder_id}.png`);
  try {
    await fs.access(filePath);
  } catch {
    return res.status(404).json({ error: 'Generate the card first.' });
  }

  res.download(filePath, `${row.builder_id}.png`);
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, cardSize: CARD_SIZE });
});

app.get('/builder-id', (_req, res) => {
  res.sendFile(path.join(ROOT, 'public/builder-id.html'));
});

app.get('/crew-frame', (_req, res) => {
  res.sendFile(path.join(ROOT, 'public/crew-frame.html'));
});

app.get(/.*/, (_req, res) => {
  res.sendFile(path.join(ROOT, 'public/index.html'));
});

app.listen(PORT, () => {
  console.log(`Hacker House Goa Builder ID generator running at http://localhost:${PORT}`);
  console.log(`Master template: ${TEMPLATE_PATH}`);
});

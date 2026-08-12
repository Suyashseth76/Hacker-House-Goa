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
const isVercel = Boolean(process.env.VERCEL);
const UPLOAD_DIR = isVercel ? path.resolve('/tmp/uploads') : path.resolve('storage/uploads');
const GENERATED_DIR = isVercel ? path.resolve('/tmp/generated') : path.resolve('storage/generated');
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

function getOrCreateBuilder(req, res) {
  let row = getBuilderBySession(req);
  if (row) {
    if (!row.builder_id) {
      const assignedId = assignBuilderId(db, row);
      row.builder_id = assignedId;
    }
    return row;
  }

  const token = crypto.randomBytes(32).toString('hex');
  setSessionCookie(res, token);

  for (let attempt = 0; attempt < 100; attempt += 1) {
    const builderId = generateBuilderId(db);
    try {
      const insert = db.prepare(`
        INSERT INTO builders (session_token, builder_id)
        VALUES (?, ?)
      `);
      const result = insert.run(token, builderId);
      return db.prepare('SELECT * FROM builders WHERE id = ?').get(result.lastInsertRowid);
    } catch (error) {
      if (!String(error?.message || '').includes('UNIQUE')) throw error;
      if (attempt === 99) throw new Error('Could not create a unique Builder ID.');
    }
  }
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
    const token = crypto.randomBytes(32).toString('hex');
    const builderId = generateBuilderId(db);

    db.prepare(`
      INSERT INTO builders (session_token, builder_id)
      VALUES (?, ?)
    `).run(token, builderId);

    const row = db.prepare('SELECT * FROM builders WHERE session_token = ?').get(token);
    setSessionCookie(res, token);
    return res.json({ builderId: row.builder_id, cardSize: CARD_SIZE });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Could not start a fresh Builder ID session.' });
  }
});

app.get('/api/me', async (req, res) => {
  try {
    const row = getOrCreateBuilder(req, res);
    const builderId = row.builder_id;
    const cardPath = path.join(GENERATED_DIR, `${builderId}.png`);

    let hasCard = false;
    try {
      await fs.access(cardPath);
      hasCard = true;
    } catch {
      if (row.name && row.team_name && (row.photo_url || row.photo_data)) {
        try {
          const photoPath = row.photo_url ? path.resolve(row.photo_url) : null;
          await renderBuilderCard({
            photoPath,
            photoBuffer: row.photo_data,
            name: row.name,
            builderId,
            teamName: row.team_name
          });
          hasCard = true;
        } catch (err) {
          console.error('Error auto-rendering card on /api/me:', err);
        }
      }
    }

    return res.json({
      user: {
        id: row.id,
        name: row.name || '',
        teamName: row.team_name || '',
        photoUrl: row.photo_url || '',
        builderId
      },
      cardUrl: hasCard ? `/generated/${builderId}.png?v=${Date.now()}` : null,
      cardSize: CARD_SIZE
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Could not fetch builder information.' });
  }
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

    let row = getOrCreateBuilder(req, res);
    let photoPath = row.photo_url ? path.resolve(row.photo_url) : null;
    let photoBuffer = row.photo_data || null;

    if (req.file) {
      photoBuffer = req.file.buffer;
      photoPath = await savePhoto(req.file.buffer, req.file.mimetype);
      const relativePhotoPath = path.relative(ROOT, photoPath);

      db.prepare('UPDATE builders SET photo_url = ?, photo_data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run(relativePhotoPath, photoBuffer, row.id);
      row.photo_url = relativePhotoPath;
      row.photo_data = photoBuffer;
    }

    if (!photoPath && !photoBuffer) {
      return res.status(400).json({ error: 'Please upload a photo.' });
    }

    db.prepare(`
      UPDATE builders
      SET name = ?, team_name = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(name, teamName, row.id);

    row.name = name;
    row.team_name = teamName;

    const builderId = row.builder_id;
    const websiteUrl = getWebsiteUrl(req);
    const outputPath = await renderBuilderCard({
      photoPath,
      photoBuffer,
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
    if (row.name && row.team_name && (row.photo_url || row.photo_data)) {
      try {
        const photoPath = row.photo_url ? path.resolve(row.photo_url) : null;
        await renderBuilderCard({
          photoPath,
          photoBuffer: row.photo_data,
          name: row.name,
          builderId: row.builder_id,
          teamName: row.team_name
        });
      } catch (err) {
        return res.status(404).json({ error: 'Generate the card first.' });
      }
    } else {
      return res.status(404).json({ error: 'Generate the card first.' });
    }
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

export default app;

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Hacker House Goa Builder ID generator running at http://localhost:${PORT}`);
    console.log(`Master template: ${TEMPLATE_PATH}`);
  });
}

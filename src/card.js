import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const WIDTH = 1055;
const HEIGHT = 1491;
const TEMPLATE = path.resolve('public/master-template.png');
const GENERATED_DIR = process.env.VERCEL ? path.resolve('/tmp/generated') : path.resolve('storage/generated');

const COLORS = {
  green: '#0b4939'
};

async function fitText(text, maxWidth, startSize = 28, minSize = 14) {
  const escaped = escapeXml(text);
  for (let size = startSize; size >= minSize; size -= 1) {
    if (escaped.length * size * 0.60 <= maxWidth) return { text: escaped, size };
  }
  let trunc = String(text);
  while (trunc.length > 3 && escapeXml(trunc + '…').length * minSize * 0.60 > maxWidth) {
    trunc = trunc.slice(0, -1);
  }
  return { text: escapeXml(trunc + '…'), size: minSize };
}

function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

async function photoLayer(photoInput) {
  // The editable photo sits inside the template's existing inner circular boundary.
  // Keep the decorative green/gold rings in the master template visible.
  const diameter = 430;
  // Coordinates calibrated to the master template.
  const left = 303;
  const top = 255;
  const input = await sharp(photoInput)
    .rotate()
    .resize(diameter, diameter, { fit: 'cover', position: 'attention' })
    .png()
    .toBuffer();

  const mask = Buffer.from(
    `<svg width="${diameter}" height="${diameter}" xmlns="http://www.w3.org/2000/svg"><circle cx="${diameter / 2}" cy="${diameter / 2}" r="${diameter / 2 - 2}" fill="white"/></svg>`
  );

  const circle = await sharp(input)
    .composite([{ input: mask, blend: 'dest-in' }])
    .png()
    .toBuffer();

  return { input: circle, left, top };
}

export async function renderBuilderCard({ photoPath, photoBuffer, name, builderId, teamName }) {
  await fs.mkdir(GENERATED_DIR, { recursive: true });

  const displayName = String(name || '').trim().toUpperCase();
  const displayTeam = String(teamName || '').trim().toUpperCase();
  const displayId = String(builderId || '').trim().toUpperCase();

  console.log('[CARD RENDERER] Input Data:', {
    name: displayName,
    builderId: displayId,
    teamName: displayTeam,
    hasPhoto: Boolean(photoPath || photoBuffer)
  });

  // Calculate prominent font sizes (starting at 38px/32px/36px) with automatic scaling for unusually long values
  const nameText = await fitText(displayName, 500, 38, 20);
  const idText = await fitText(displayId, 440, 32, 18);
  const teamText = await fitText(displayTeam, 420, 36, 18);

  const overlays = [];

  const photoInput = photoBuffer || photoPath;
  if (photoInput) {
    overlays.push(await photoLayer(photoInput));
  }

  // Values only. Placed with exact 1055 × 1491 source template coordinates and matching viewBox.
  const textSvg = `
    <svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <text x="360" y="1222" fill="${COLORS.green}" font-family="Georgia, 'Times New Roman', serif, sans-serif" font-size="${nameText.size}px" font-weight="900" letter-spacing="0.5px">${nameText.text}</text>
      <text x="425" y="1283" fill="${COLORS.green}" font-family="'Courier New', Console, monospace" font-size="${idText.size}px" font-weight="bold" letter-spacing="1.5px">${idText.text}</text>
      <text x="445" y="1344" fill="${COLORS.green}" font-family="Georgia, 'Times New Roman', serif, sans-serif" font-size="${teamText.size}px" font-weight="900" letter-spacing="0.5px">${teamText.text}</text>
    </svg>
  `;
  overlays.push({ input: Buffer.from(textSvg), left: 0, top: 0 });

  const safeId = displayId.replace(/[^A-Z0-9-]/g, '_');
  const outputPath = path.join(GENERATED_DIR, `${safeId}.png`);

  const buffer = await sharp(TEMPLATE)
    .resize(WIDTH, HEIGHT, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .composite(overlays)
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toBuffer();

  const tempPath = `${outputPath}.${crypto.randomUUID()}.tmp`;
  try {
    await fs.writeFile(tempPath, buffer);
    await fs.rename(tempPath, outputPath);
  } catch {
    await fs.writeFile(outputPath, buffer).catch(() => {});
  } finally {
    await fs.unlink(tempPath).catch(() => {});
  }

  return outputPath;
}

export const CARD_SIZE = { width: WIDTH, height: HEIGHT };


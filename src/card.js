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

async function fitText(text, maxWidth, startSize = 24, minSize = 15) {
  const escaped = escapeXml(text);
  for (let size = startSize; size >= minSize; size -= 1) {
    // Approximate width for the condensed/bold style used by the template.
    if (escaped.length * size * 0.58 <= maxWidth) return { text: escaped, size };
  }
  return { text: escaped, size: minSize };
}

function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

async function photoLayer(photoPath) {
  // The editable photo sits inside the template's existing inner circular boundary.
  // Keep the decorative green/gold rings in the master template visible.
  const diameter = 430;
  // Coordinates calibrated to the new 1055 × 1491 master template.
  // The photo sits inside the existing circular frame; the frame artwork is untouched.
  const left = 303;
  const top = 255;
  const input = await sharp(photoPath)
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

export async function renderBuilderCard({ photoPath, name, builderId, teamName }) {
  await fs.mkdir(GENERATED_DIR, { recursive: true });

  // Baselines are aligned to the three existing dashed lines in the master artwork.
  // The values begin just after the printed labels; the labels themselves remain untouched.
  // Dynamic text coordinates are calibrated against the actual master template.
  // Native 1055x1491 template: dotted baselines are approximately y=1230, 1291, and 1352; text baselines sit ~9px above them.
  // SVG text y-values are baselines, so keep the visible glyphs a few pixels above each line.
  const nameText = await fitText(name, 530, 28, 18);
  const idText = await fitText(builderId, 500, 25, 18);
  const teamText = await fitText(teamName, 500, 28, 18);

  const overlays = [];

  if (photoPath) {
    overlays.push(await photoLayer(photoPath));
  }

  // Values only. The labels, icons, dotted lines, frame, and artwork.
  const textSvg = `
    <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <style>
        .value { fill: ${COLORS.green}; font-family: "Noto Serif Display", "Noto Serif", Georgia, "Times New Roman", serif; font-weight: 700; }
        .code { font-family: "DejaVu Sans Mono", "Courier New", monospace; font-weight: 700; }
      </style>
      <!-- New-template coordinates: values sit above the existing dotted lines. -->
      <text class="value" x="360" y="1221" font-size="${nameText.size}px" letter-spacing="0.35px">${nameText.text}</text>
      <text class="value code" x="423" y="1282" font-size="${idText.size}px" letter-spacing="0.9px">${idText.text}</text>
      <text class="value" x="430" y="1343" font-size="${teamText.size}px" letter-spacing="0.35px">${teamText.text}</text>
    </svg>
  `;
  overlays.push({ input: Buffer.from(textSvg), left: 0, top: 0 });

  const safeId = builderId.replace(/[^A-Z0-9-]/g, '_');
  const outputPath = path.join(GENERATED_DIR, `${safeId}.png`);

  await sharp(TEMPLATE)
    .resize(WIDTH, HEIGHT, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .composite(overlays)
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(outputPath);

  return outputPath;
}

export const CARD_SIZE = { width: WIDTH, height: HEIGHT };


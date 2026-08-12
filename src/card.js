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

  const nameText = await fitText(name, 510, 28, 14);
  const idText = await fitText(builderId, 460, 25, 14);
  const teamText = await fitText(teamName, 440, 28, 14);

  const overlays = [];

  const photoInput = photoBuffer || photoPath;
  if (photoInput) {
    overlays.push(await photoLayer(photoInput));
  }

  // Values only. The labels, icons, dotted lines, frame, and artwork remain unchanged.
  const textSvg = `
    <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <style>
        .value { fill: ${COLORS.green}; font-family: "Noto Serif Display", "Noto Serif", Georgia, "Times New Roman", serif; font-weight: 700; }
        .code { fill: ${COLORS.green}; font-family: "DejaVu Sans Mono", "Courier New", monospace; font-weight: 700; }
      </style>
      <text class="value" x="360" y="1221" font-size="${nameText.size}px" letter-spacing="0.35px">${nameText.text}</text>
      <text class="value code" x="425" y="1282" font-size="${idText.size}px" letter-spacing="0.9px">${idText.text}</text>
      <text class="value" x="435" y="1343" font-size="${teamText.size}px" letter-spacing="0.35px">${teamText.text}</text>
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


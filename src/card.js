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

// Cached Base64 Font Buffers for Self-Contained SVG Text Rendering
let notoSerifBase64 = null;
let robotoMonoBase64 = null;

async function getEmbeddedFonts() {
  if (notoSerifBase64 && robotoMonoBase64) {
    return { notoSerifBase64, robotoMonoBase64 };
  }

  try {
    const notoPath = path.resolve('assets/fonts/NotoSerif-Bold.ttf');
    const robotoPath = path.resolve('assets/fonts/RobotoMono-Bold.ttf');

    const [notoBuf, robotoBuf] = await Promise.all([
      fs.readFile(notoPath),
      fs.readFile(robotoPath)
    ]);

    notoSerifBase64 = notoBuf.toString('base64');
    robotoMonoBase64 = robotoBuf.toString('base64');
  } catch (err) {
    console.error('Warning: Could not load local font files for SVG embedding:', err.message);
  }

  return { notoSerifBase64, robotoMonoBase64 };
}

async function fitText(text, maxWidth, startSize = 28, minSize = 18) {
  const escaped = escapeXml(text);
  for (let size = startSize; size >= minSize; size -= 1) {
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
  const diameter = 430;
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

  const nameText = await fitText(name, 530, 28, 18);
  const idText = await fitText(builderId, 500, 25, 18);
  const teamText = await fitText(teamName, 500, 28, 18);

  const overlays = [];

  if (photoPath) {
    overlays.push(await photoLayer(photoPath));
  }

  const { notoSerifBase64: notoB64, robotoMonoBase64: robotoB64 } = await getEmbeddedFonts();

  // Embedded @font-face style block ensures librsvg/sharp renders exact glyphs without relying on missing OS system fonts
  const fontStyleBlock = (notoB64 && robotoB64) ? `
    @font-face {
      font-family: 'CardNotoSerif';
      src: url(data:font/ttf;charset=utf-8;base64,${notoB64}) format('truetype');
      font-weight: 700;
      font-style: normal;
    }
    @font-face {
      font-family: 'CardRobotoMono';
      src: url(data:font/ttf;charset=utf-8;base64,${robotoB64}) format('truetype');
      font-weight: 700;
      font-style: normal;
    }
    .value { fill: ${COLORS.green}; font-family: 'CardNotoSerif', Georgia, serif; font-weight: 700; }
    .code { fill: ${COLORS.green}; font-family: 'CardRobotoMono', monospace; font-weight: 700; }
  ` : `
    .value { fill: ${COLORS.green}; font-family: Georgia, serif; font-weight: 700; }
    .code { fill: ${COLORS.green}; font-family: monospace; font-weight: 700; }
  `;

  const textSvg = `
    <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <style>
        ${fontStyleBlock}
      </style>
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

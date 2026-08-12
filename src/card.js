import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import opentype from 'opentype.js';
import { ROBOTO_MONO_BOLD_BASE64 } from './fonts.js';

const WIDTH = 1055;
const HEIGHT = 1491;
const TEMPLATE = path.resolve('public/master-template.png');
const GENERATED_DIR = process.env.VERCEL ? path.resolve('/tmp/generated') : path.resolve('storage/generated');

const COLORS = {
  green: '#0b4939'
};

// Cached Opentype parsed font instance in memory
let robotoFont = null;

function loadFont() {
  if (!robotoFont) {
    const robotoBuf = Buffer.from(ROBOTO_MONO_BOLD_BASE64, 'base64');
    const robotoAb = robotoBuf.buffer.slice(robotoBuf.byteOffset, robotoBuf.byteOffset + robotoBuf.byteLength);
    robotoFont = opentype.parse(robotoAb);
  }
  return robotoFont;
}

function fitTextSize(text, maxWidth, startSize = 26, minSize = 16) {
  const str = String(text || '').trim();
  for (let size = startSize; size >= minSize; size -= 1) {
    if (str.length * size * 0.6 <= maxWidth) return { text: str, size };
  }
  return { text: str, size: minSize };
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

  const cleanName = String(name || '').trim();
  const cleanId = String(builderId || '').trim();
  const cleanTeam = String(teamName || '').trim();

  const nameText = fitTextSize(cleanName, 530, 26, 16);
  const idText = fitTextSize(cleanId, 500, 25, 16);
  const teamText = fitTextSize(cleanTeam, 500, 26, 16);

  const overlays = [];

  if (photoPath) {
    overlays.push(await photoLayer(photoPath));
  }

  const font = loadFont();

  // Convert text values directly into SVG vector <path> commands.
  // Vector SVG paths DO NOT require system fonts or fontconfig, rendering 100% clean and reliable on Vercel Serverless.
  const namePath = font.getPath(nameText.text, 360, 1221, nameText.size);
  const idPath = font.getPath(idText.text, 423, 1282, idText.size);
  const teamPath = font.getPath(teamText.text, 430, 1343, teamText.size);

  namePath.fill = COLORS.green;
  idPath.fill = COLORS.green;
  teamPath.fill = COLORS.green;

  const textSvg = `
    <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      ${namePath.toSVG(2)}
      ${idPath.toSVG(2)}
      ${teamPath.toSVG(2)}
    </svg>
  `;
  overlays.push({ input: Buffer.from(textSvg), left: 0, top: 0 });

  const safeId = cleanId.replace(/[^A-Z0-9-]/g, '_');
  const outputPath = path.join(GENERATED_DIR, `${safeId}.png`);

  await sharp(TEMPLATE)
    .resize(WIDTH, HEIGHT, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .composite(overlays)
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(outputPath);

  return outputPath;
}

export const CARD_SIZE = { width: WIDTH, height: HEIGHT };

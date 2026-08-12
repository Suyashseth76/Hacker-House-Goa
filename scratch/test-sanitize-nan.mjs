import opentype from 'opentype.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const TEMPLATE = path.resolve('public/master-template.png');

function sanitizePathSvg(svgStr) {
  // Fix any NaN numbers in SVG path strings by replacing them with valid numbers
  return svgStr.replace(/NaN/g, '0');
}

async function testSanitize() {
  const notoBuf = await fs.readFile(path.resolve('assets/fonts/NotoSerif-Bold.ttf'));
  const robotoBuf = await fs.readFile(path.resolve('assets/fonts/RobotoMono-Bold.ttf'));

  const notoFont = opentype.parse(notoBuf.buffer.slice(notoBuf.byteOffset, notoBuf.byteOffset + notoBuf.byteLength));
  const robotoFont = opentype.parse(robotoBuf.buffer.slice(robotoBuf.byteOffset, robotoBuf.byteOffset + robotoBuf.byteLength));

  const nameText = 'gudvnfj';
  const idText = 'HHGOA26-79M600';
  const teamText = 'vdvdfsvf';

  const namePath = notoFont.getPath(nameText, 360, 1221, 28);
  const idPath = robotoFont.getPath(idText, 423, 1282, 25);
  const teamPath = notoFont.getPath(teamText, 430, 1343, 28);

  namePath.fill = '#0b4939';
  idPath.fill = '#0b4939';
  teamPath.fill = '#0b4939';

  const nameSvg = sanitizePathSvg(namePath.toSVG(2));
  const idSvg = sanitizePathSvg(idPath.toSVG(2));
  const teamSvg = sanitizePathSvg(teamPath.toSVG(2));

  console.log('Sanitized teamSvg contains NaN?', teamSvg.includes('NaN'));

  const textSvg = `
    <svg width="1055" height="1491" xmlns="http://www.w3.org/2000/svg">
      ${nameSvg}
      ${idSvg}
      ${teamSvg}
    </svg>
  `;

  const output = await sharp(TEMPLATE)
    .composite([{ input: Buffer.from(textSvg), left: 0, top: 0 }])
    .png()
    .toBuffer();

  await fs.mkdir('scratch', { recursive: true });
  await sharp(output).toFile('scratch/test-sanitized-card.png');
  console.log('Successfully saved scratch/test-sanitized-card.png');
}

testSanitize().catch(console.error);

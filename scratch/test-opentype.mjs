import sharp from 'sharp';
import path from 'node:path';
import fs from 'node:fs/promises';
import opentype from 'opentype.js';

const TEMPLATE = path.resolve('public/master-template.png');

function toArrayBuffer(buffer) {
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
}

async function testOpentypeRender() {
  const name = 'MANISH DUBEY';
  const builderId = 'HHGOA26-F2V9OT';
  const teamName = 'ALPHA CODERS';

  const notoBuf = await fs.readFile(path.resolve('assets/fonts/NotoSerif-Bold.ttf'));
  const robotoBuf = await fs.readFile(path.resolve('assets/fonts/RobotoMono-Bold.ttf'));

  const notoFont = opentype.parse(toArrayBuffer(notoBuf));
  const robotoFont = opentype.parse(toArrayBuffer(robotoBuf));

  // Convert text strings to vector SVG paths
  const namePath = notoFont.getPath(name, 360, 1221, 28);
  const idPath = robotoFont.getPath(builderId, 423, 1282, 25);
  const teamPath = notoFont.getPath(teamName, 430, 1343, 28);

  // Set fill color
  namePath.fill = '#0b4939';
  idPath.fill = '#0b4939';
  teamPath.fill = '#0b4939';

  const textSvg = `
    <svg width="1055" height="1491" xmlns="http://www.w3.org/2000/svg">
      ${namePath.toSVG(2)}
      ${idPath.toSVG(2)}
      ${teamPath.toSVG(2)}
    </svg>
  `;

  const output = await sharp(TEMPLATE)
    .composite([{ input: Buffer.from(textSvg), left: 0, top: 0 }])
    .png()
    .toBuffer();

  await fs.mkdir('scratch', { recursive: true });
  await sharp(output).toFile('scratch/test-opentype-card.png');
  console.log('Successfully rendered opentype vector card to scratch/test-opentype-card.png');
}

testOpentypeRender().catch(console.error);

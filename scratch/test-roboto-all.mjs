import fs from 'node:fs/promises';
import path from 'node:path';
import opentype from 'opentype.js';
import sharp from 'sharp';

const TEMPLATE = path.resolve('public/master-template.png');

async function testRobotoAll() {
  const robotoBuf = await fs.readFile(path.resolve('assets/fonts/RobotoMono-Bold.ttf'));
  const font = opentype.parse(robotoBuf.buffer.slice(robotoBuf.byteOffset, robotoBuf.byteOffset + robotoBuf.byteLength));

  const nameText = 'jdsivohfv';
  const idText = 'HHGOA26-QXQFNQ';
  const teamText = 'vdvdfsvf';

  const namePath = font.getPath(nameText, 360, 1221, 26);
  const idPath = font.getPath(idText, 423, 1282, 25);
  const teamPath = font.getPath(teamText, 430, 1343, 26);

  namePath.fill = '#0b4939';
  idPath.fill = '#0b4939';
  teamPath.fill = '#0b4939';

  const nameSvg = namePath.toSVG(2);
  const idSvg = idPath.toSVG(2);
  const teamSvg = teamPath.toSVG(2);

  console.log('nameSvg contains NaN?', nameSvg.includes('NaN'));
  console.log('idSvg contains NaN?', idSvg.includes('NaN'));
  console.log('teamSvg contains NaN?', teamSvg.includes('NaN'));

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
  await sharp(output).toFile('scratch/test-roboto-card.png');
  console.log('Saved scratch/test-roboto-card.png');
}

testRobotoAll().catch(console.error);

import sharp from 'sharp';
import path from 'node:path';
import fs from 'node:fs/promises';

const TEMPLATE = path.resolve('public/master-template.png');

async function testFontRender() {
  const name = 'MANISH DUBEY';
  const builderId = 'HHGOA26-NOGMU8';
  const teamName = 'ALPHA CODERS';

  const notoBuf = await fs.readFile(path.resolve('assets/fonts/NotoSerif-Bold.ttf'));
  const robotoBuf = await fs.readFile(path.resolve('assets/fonts/RobotoMono-Bold.ttf'));

  const notoBase64 = notoBuf.toString('base64');
  const robotoBase64 = robotoBuf.toString('base64');

  const textSvg = `
    <svg width="1055" height="1491" xmlns="http://www.w3.org/2000/svg">
      <style>
        @font-face {
          font-family: 'CardNotoSerif';
          src: url(data:font/ttf;charset=utf-8;base64,${notoBase64}) format('truetype');
          font-weight: 700;
        }
        @font-face {
          font-family: 'CardRobotoMono';
          src: url(data:font/ttf;charset=utf-8;base64,${robotoBase64}) format('truetype');
          font-weight: 700;
        }
        .value { fill: #0b4939; font-family: 'CardNotoSerif', serif; font-weight: 700; }
        .code { fill: #0b4939; font-family: 'CardRobotoMono', monospace; font-weight: 700; }
      </style>
      <text class="value" x="360" y="1221" font-size="28px" letter-spacing="0.35px">${name}</text>
      <text class="code" x="423" y="1282" font-size="25px" letter-spacing="0.9px">${builderId}</text>
      <text class="value" x="430" y="1343" font-size="28px" letter-spacing="0.35px">${teamName}</text>
    </svg>
  `;

  const output = await sharp(TEMPLATE)
    .composite([{ input: Buffer.from(textSvg), left: 0, top: 0 }])
    .png()
    .toBuffer();

  await fs.mkdir('scratch', { recursive: true });
  await sharp(output).toFile('scratch/test-font-card.png');
  console.log('Saved test font card to scratch/test-font-card.png');
}

testFontRender().catch(console.error);

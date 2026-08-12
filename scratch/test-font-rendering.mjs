import sharp from 'sharp';
import path from 'node:path';

const TEMPLATE = path.resolve('public/master-template.png');

async function testFontRender() {
  const name = 'ERTYUI';
  const builderId = 'HHGOA26-NEOKXY';
  const teamName = 'dgWR';

  // Cross-platform font stack using universal system fonts (DejaVu Sans / Liberation Sans / sans-serif / monospace)
  const textSvg = `
    <svg width="1055" height="1491" xmlns="http://www.w3.org/2000/svg">
      <style>
        .value { fill: #0b4939; font-family: "Liberation Serif", "DejaVu Serif", Georgia, "Times New Roman", serif, sans-serif; font-weight: 700; }
        .code { font-family: "Liberation Mono", "DejaVu Sans Mono", "Courier New", monospace, sans-serif; font-weight: 700; }
        .fallback { font-family: "Liberation Sans", "DejaVu Sans", Arial, sans-serif; font-weight: 700; }
      </style>
      <text class="fallback" x="360" y="1221" font-size="28px" letter-spacing="0.35px">${name}</text>
      <text class="code" x="423" y="1282" font-size="25px" letter-spacing="0.9px">${builderId}</text>
      <text class="fallback" x="430" y="1343" font-size="28px" letter-spacing="0.35px">${teamName}</text>
    </svg>
  `;

  const output = await sharp(TEMPLATE)
    .composite([{ input: Buffer.from(textSvg), left: 0, top: 0 }])
    .png()
    .toBuffer();

  await sharp(output).toFile('scratch/test-font-card.png');
  console.log('Saved test font card to scratch/test-font-card.png');
}

testFontRender().catch(console.error);

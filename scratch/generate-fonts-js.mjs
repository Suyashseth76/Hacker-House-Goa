import fs from 'node:fs/promises';
import path from 'node:path';

async function generateFontsJs() {
  const notoBuf = await fs.readFile(path.resolve('assets/fonts/NotoSerif-Bold.ttf'));
  const robotoBuf = await fs.readFile(path.resolve('assets/fonts/RobotoMono-Bold.ttf'));

  const notoB64 = notoBuf.toString('base64');
  const robotoB64 = robotoBuf.toString('base64');

  const content = `// Auto-generated inline TTF base64 font data for serverless & cross-platform card rendering
export const NOTO_SERIF_BOLD_BASE64 = ${JSON.stringify(notoB64)};
export const ROBOTO_MONO_BOLD_BASE64 = ${JSON.stringify(robotoB64)};
`;

  await fs.writeFile(path.resolve('src/fonts.js'), content, 'utf8');
  console.log('Successfully generated src/fonts.js with inline font base64 strings.');
}

generateFontsJs().catch(console.error);

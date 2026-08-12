import opentype from 'opentype.js';
import fs from 'node:fs/promises';
import path from 'node:path';

async function debugPath() {
  const notoBuf = await fs.readFile(path.resolve('assets/fonts/NotoSerif-Bold.ttf'));
  const notoFont = opentype.parse(notoBuf.buffer.slice(notoBuf.byteOffset, notoBuf.byteOffset + notoBuf.byteLength));

  const text = 'vdvdfsvf';
  const pathObj = notoFont.getPath(text, 430, 1343, 28);
  console.log('Path SVG output for vdvdfsvf:');
  console.log(pathObj.toSVG(2));
}

debugPath().catch(console.error);

import opentype from 'opentype.js';
import fs from 'node:fs/promises';
import path from 'node:path';

async function testKerning() {
  const notoBuf = await fs.readFile(path.resolve('assets/fonts/NotoSerif-Bold.ttf'));
  const notoFont = opentype.parse(notoBuf.buffer.slice(notoBuf.byteOffset, notoBuf.byteOffset + notoBuf.byteLength));

  const text = 'vdvdfsvf';
  const pathObj = notoFont.getPath(text, 430, 1343, 28, { kerning: false });
  const svgStr = pathObj.toSVG(2);
  console.log('Contains NaN with kerning:false?', svgStr.includes('NaN'));
  console.log('Path length:', svgStr.length);
}

testKerning().catch(console.error);

import fs from 'node:fs/promises';
import path from 'node:path';
import opentype from 'opentype.js';

async function testBidiOff() {
  const notoBuf = await fs.readFile(path.resolve('assets/fonts/NotoSerif-Bold.ttf'));
  const notoFont = opentype.parse(notoBuf.buffer.slice(notoBuf.byteOffset, notoBuf.byteOffset + notoBuf.byteLength));

  const testStr = 'vdvdfsvf jdsivohfv MANISH DUBEY HHGOA26-QXQFNQ';

  console.log('Testing with features: {} ...');
  const path1 = notoFont.getPath(testStr, 0, 0, 24, { features: {} });
  const svg1 = path1.toSVG(2);
  console.log('  -> Contains NaN with features:{} ?', svg1.includes('NaN'));

  console.log('Testing with { kerning: false, features: {} } ...');
  const path2 = notoFont.getPath(testStr, 0, 0, 24, { kerning: false, features: {} });
  const svg2 = path2.toSVG(2);
  console.log('  -> Contains NaN with kerning:false & features:{} ?', svg2.includes('NaN'));
}

testBidiOff().catch(console.error);

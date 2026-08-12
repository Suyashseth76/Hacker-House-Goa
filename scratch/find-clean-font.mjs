import opentype from 'opentype.js';
import fs from 'node:fs/promises';
import path from 'node:path';

async function testCleanFonts() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 -_.,!@#$%^&*()';

  // Test current font
  const notoBuf = await fs.readFile(path.resolve('assets/fonts/NotoSerif-Bold.ttf'));
  const font1 = opentype.parse(notoBuf.buffer.slice(notoBuf.byteOffset, notoBuf.byteOffset + notoBuf.byteLength));
  const svg1 = font1.getPath(chars, 0, 0, 24).toSVG(2);
  console.log('Current NotoSerif-Bold contains NaN?', svg1.includes('NaN'));

  // Test removing GPOS/kerning tables when parsing font
  const robotoBuf = await fs.readFile(path.resolve('assets/fonts/RobotoMono-Bold.ttf'));
  const font2 = opentype.parse(robotoBuf.buffer.slice(robotoBuf.byteOffset, robotoBuf.byteOffset + robotoBuf.byteLength));
  const svg2 = font2.getPath(chars, 0, 0, 24).toSVG(2);
  console.log('Current RobotoMono-Bold contains NaN?', svg2.includes('NaN'));
}

testCleanFonts().catch(console.error);

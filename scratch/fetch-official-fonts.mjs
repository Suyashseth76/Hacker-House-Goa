import fs from 'node:fs/promises';
import path from 'node:path';
import opentype from 'opentype.js';

async function testOfficialFonts() {
  const fontUrls = [
    { name: 'NotoSerif-Bold.ttf', url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/notoserif/NotoSerif%5Bwdth%2Cwght%5D.ttf' },
    { name: 'Roboto-Bold.ttf', url: 'https://raw.githubusercontent.com/google/fonts/main/apache/roboto/static/Roboto-Bold.ttf' },
    { name: 'RobotoMono-Bold.ttf', url: 'https://raw.githubusercontent.com/google/fonts/main/apache/robotomono/static/RobotoMono-Bold.ttf' }
  ];

  const testStr = 'vdvdfsvf MANISH DUBEY HHGOA26-F2V9OT jdsivohfv HHGOA26-QXQFNQ abcdefghijklmnopqrstuvwxyz ABCDEFGHIJKLMNOPQRSTUVWXYZ 0123456789';

  for (const item of fontUrls) {
    console.log('Fetching:', item.name);
    const res = await fetch(item.url);
    if (!res.ok) {
      console.log('  -> Failed HTTP', res.status);
      continue;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    const font = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
    const svg = font.getPath(testStr, 0, 0, 24).toSVG(2);
    console.log(`  -> Contains NaN? ${svg.includes('NaN')} (Buffer size: ${buf.length} bytes)`);
    if (!svg.includes('NaN')) {
      await fs.writeFile(`assets/fonts/${item.name}`, buf);
      console.log(`  -> Saved clean font assets/fonts/${item.name}`);
    }
  }
}

testOfficialFonts().catch(console.error);

import fs from 'node:fs/promises';
import opentype from 'opentype.js';

async function testStaticFonts() {
  const urls = [
    { name: 'Merriweather-Bold', url: 'https://cdn.jsdelivr.net/fontsource/fonts/merriweather@latest/latin-700-normal.ttf' },
    { name: 'Cinzel-Bold', url: 'https://cdn.jsdelivr.net/fontsource/fonts/cinzel@latest/latin-700-normal.ttf' },
    { name: 'Lora-Bold', url: 'https://cdn.jsdelivr.net/fontsource/fonts/lora@latest/latin-700-normal.ttf' },
    { name: 'PT-Serif-Bold', url: 'https://cdn.jsdelivr.net/fontsource/fonts/pt-serif@latest/latin-700-normal.ttf' },
    { name: 'Roboto-Bold', url: 'https://cdn.jsdelivr.net/fontsource/fonts/roboto@latest/latin-700-normal.ttf' }
  ];

  const testStr = 'vdvdfsvf MANISH DUBEY HHGOA26-F2V9OT jdsivohfv HHGOA26-QXQFNQ abcdefghijklmnopqrstuvwxyz ABCDEFGHIJKLMNOPQRSTUVWXYZ 0123456789 -_.,!';

  for (const item of urls) {
    const res = await fetch(item.url);
    if (!res.ok) {
      console.log(`Failed ${item.name}: HTTP ${res.status}`);
      continue;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    const font = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
    const svg = font.getPath(testStr, 0, 0, 24).toSVG(2);
    console.log(`${item.name} -> Contains NaN? ${svg.includes('NaN')} (Size: ${buf.length} bytes)`);
    if (!svg.includes('NaN')) {
      await fs.writeFile(`assets/fonts/${item.name}.ttf`, buf);
      console.log(`  -> SAVED CLEAN FONT assets/fonts/${item.name}.ttf`);
    }
  }
}

testStaticFonts().catch(console.error);

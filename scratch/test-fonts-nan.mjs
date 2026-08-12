import opentype from 'opentype.js';
import fs from 'node:fs/promises';

async function testFontUrls() {
  const urls = [
    { name: 'Google-NotoSerif-Bold', url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/notoserif/NotoSerif-Bold.ttf' },
    { name: 'Google-Roboto-Bold', url: 'https://raw.githubusercontent.com/google/fonts/main/apache/roboto/Roboto-Bold.ttf' },
    { name: 'Google-RobotoMono-Bold', url: 'https://raw.githubusercontent.com/google/fonts/main/apache/robotomono/RobotoMono-Bold.ttf' },
    { name: 'Google-Cinzel-Bold', url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/cinzel/static/Cinzel-Bold.ttf' }
  ];

  const testStr = 'vdvdfsvf MANISH DUBEY HHGOA26-F2V9OT abcdefghijklmnopqrstuvwxyz ABCDEFGHIJKLMNOPQRSTUVWXYZ 0123456789';

  for (const item of urls) {
    console.log('Testing font:', item.name);
    const res = await fetch(item.url);
    if (!res.ok) {
      console.log('Failed to fetch:', res.status);
      continue;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    const font = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
    const svg = font.getPath(testStr, 0, 0, 24).toSVG(2);
    console.log(`  -> Contains NaN? ${svg.includes('NaN')} (SVG length: ${svg.length})`);
  }
}

testFontUrls().catch(console.error);

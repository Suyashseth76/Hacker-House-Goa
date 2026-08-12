import fs from 'node:fs/promises';
import path from 'node:path';

async function fetchFont() {
  const fontUrl = 'https://raw.githubusercontent.com/google/fonts/main/ofl/notoserif/NotoSerif-Bold.ttf';
  console.log('Fetching font from:', fontUrl);

  const res = await fetch(fontUrl);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  await fs.mkdir('assets/fonts', { recursive: true });
  const fontPath = path.resolve('assets/fonts/NotoSerif-Bold.ttf');
  await fs.writeFile(fontPath, buffer);

  console.log(`Saved font (${buffer.length} bytes) to ${fontPath}`);
}

fetchFont().catch(console.error);

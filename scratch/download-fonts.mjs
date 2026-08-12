import fs from 'node:fs/promises';
import path from 'node:path';

async function downloadFonts() {
  const fontUrls = [
    {
      name: 'NotoSerif-Bold.ttf',
      url: 'https://cdn.jsdelivr.net/fontsource/fonts/noto-serif@latest/latin-700-normal.ttf'
    },
    {
      name: 'RobotoMono-Bold.ttf',
      url: 'https://cdn.jsdelivr.net/fontsource/fonts/roboto-mono@latest/latin-700-normal.ttf'
    }
  ];

  await fs.mkdir('assets/fonts', { recursive: true });

  for (const item of fontUrls) {
    console.log('Downloading:', item.name);
    const res = await fetch(item.url);
    if (!res.ok) {
      console.error(`Failed ${item.name}: HTTP ${res.status}`);
      continue;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    await fs.writeFile(`assets/fonts/${item.name}`, buf);
    console.log(`Successfully saved ${item.name} (${buf.length} bytes)`);
  }
}

downloadFonts().catch(console.error);

import fs from 'node:fs/promises';
import path from 'node:path';

async function fetchFonts() {
  const fonts = [
    {
      name: 'NotoSerif-Bold.ttf',
      url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/notoserif/static/NotoSerif-Bold.ttf'
    },
    {
      name: 'RobotoMono-Bold.ttf',
      url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/robotomono/static/RobotoMono-Bold.ttf'
    }
  ];

  await fs.mkdir('assets/fonts', { recursive: true });

  for (const font of fonts) {
    console.log('Fetching:', font.url);
    const res = await fetch(font.url);
    if (!res.ok) {
      console.error(`Failed ${font.name}: HTTP ${res.status}`);
      continue;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    const target = path.resolve(`assets/fonts/${font.name}`);
    await fs.writeFile(target, buf);
    console.log(`Saved ${font.name} (${buf.length} bytes) to ${target}`);
  }
}

fetchFonts().catch(console.error);

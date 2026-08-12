import sharp from 'sharp';
import path from 'node:path';

async function checkTemplate() {
  const meta = await sharp(path.resolve('public/master-template.png')).metadata();
  console.log('Master template metadata:', meta);
}

checkTemplate().catch(console.error);

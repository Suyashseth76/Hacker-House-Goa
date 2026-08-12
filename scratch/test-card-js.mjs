import { renderBuilderCard } from '../src/card.js';
import path from 'node:path';

async function testCardJs() {
  const outputPath = await renderBuilderCard({
    photoPath: path.resolve('public/master-template.png'),
    name: 'AHIRPGPTHOB',
    builderId: 'HHGOA26-F2V9OT',
    teamName: 'IPOTEHIT'
  });
  console.log('Successfully generated card at:', outputPath);
}

testCardJs().catch(console.error);

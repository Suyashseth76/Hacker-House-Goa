import { renderBuilderCard } from '../src/card.js';
import path from 'node:path';

async function testLayout() {
  const outputPath = await renderBuilderCard({
    photoPath: path.resolve('public/master-template.png'),
    name: 'gudvnfj',
    builderId: 'HHGOA26-79M600',
    teamName: 'vdvdfsvf'
  });
  console.log('Generated test card at:', outputPath);
}

testLayout().catch(console.error);

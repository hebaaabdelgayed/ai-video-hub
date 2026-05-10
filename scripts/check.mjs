import { existsSync, readFileSync } from 'node:fs';

const requiredFiles = [
  'AGENTS.md',
  '.gitignore',
  '.env.example',
  'package.json',
  'data/videos.json',
  'src/site.config.json',
  'src/styles.css',
  'scripts/import-youtube.mjs',
  'scripts/build.mjs'
];

for (const file of requiredFiles) {
  if (!existsSync(file)) {
    throw new Error(`Missing required file: ${file}`);
  }
}

const ignored = readFileSync('.gitignore', 'utf8');
if (!ignored.includes('.env.*')) {
  throw new Error('.gitignore must ignore .env.* files');
}

const data = JSON.parse(readFileSync('data/videos.json', 'utf8'));
if (data.sourceChannelId !== 'UCMvdDpKRU_-ZmSz9F1lKOVA') {
  throw new Error('Unexpected channel ID in data/videos.json');
}

console.log('Project check passed.');

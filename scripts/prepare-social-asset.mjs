import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, extname, join } from 'node:path';

const [, , inputPath, slugArg] = process.argv;

if (!inputPath || !slugArg) {
  console.error('Usage: node scripts/prepare-social-asset.mjs <image-path> <slug>');
  process.exit(1);
}

if (!existsSync(inputPath)) {
  console.error(`Image not found: ${inputPath}`);
  process.exit(1);
}

const config = JSON.parse(readFileSync('src/site.config.json', 'utf8'));
const slug = slugArg
  .toLowerCase()
  .replace(/[^a-z0-9-]+/g, '-')
  .replace(/^-+|-+$/g, '');

if (!slug) {
  console.error('Slug must contain at least one letter or number.');
  process.exit(1);
}

const extension = extname(inputPath).toLowerCase() || '.png';
const outputDir = 'src/social-assets';
const outputName = `${slug}${extension}`;
const outputPath = join(outputDir, outputName);
const publicUrl = `${config.baseUrl.replace(/\/$/, '')}/social-assets/${outputName}`;

mkdirSync(outputDir, { recursive: true });
copyFileSync(inputPath, outputPath);

const manifestPath = join(outputDir, `${slug}.json`);
writeFileSync(
  manifestPath,
  JSON.stringify(
    {
      slug,
      sourceFile: basename(inputPath),
      assetFile: outputName,
      publicUrl,
      preparedAt: new Date().toISOString()
    },
    null,
    2
  )
);

console.log(`Prepared social asset: ${outputPath}`);
console.log(`Public URL after deploy: ${publicUrl}`);

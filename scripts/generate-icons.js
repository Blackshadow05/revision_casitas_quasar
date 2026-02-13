import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sizes = [128, 192, 256, 384, 512];
const inputSvg = join(__dirname, '../src-pwa/icons/icon.svg');
const outputDir = join(__dirname, '../src-pwa/icons');

if (!existsSync(outputDir)) {
  mkdirSync(outputDir, { recursive: true });
}

async function generateIcons() {
  for (const size of sizes) {
    const outputFile = join(outputDir, `icon-${size}x${size}.png`);
    await sharp(inputSvg)
      .resize(size, size)
      .png()
      .toFile(outputFile);
    console.log(`Generated: ${outputFile}`);
  }
  console.log('All icons generated successfully!');
}

generateIcons().catch(console.error);

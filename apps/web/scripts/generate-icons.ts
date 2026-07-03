import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import pngToIco from "png-to-ico";

const root = process.cwd();
const source = readFileSync(join(root, "public", "icon.svg"));

const renderPng = (size: number) =>
  sharp(source, { density: 512 }).resize(size, size).png().toBuffer();

const outputs = [
  { buffer: await renderPng(192), path: join(root, "public", "icon-192.png") },
  { buffer: await renderPng(512), path: join(root, "public", "icon-512.png") },
  { buffer: await renderPng(180), path: join(root, "app", "apple-icon.png") },
];

for (const { buffer, path } of outputs) {
  writeFileSync(path, buffer);
}

const icoSources = await Promise.all([renderPng(16), renderPng(32), renderPng(48)]);
const ico = await pngToIco(icoSources);
writeFileSync(join(root, "app", "favicon.ico"), ico);

console.log(`generated ${outputs.length} pngs + favicon.ico`);

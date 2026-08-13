import { build as viteBuild } from 'vite';
import { build as esbuild } from 'esbuild';
import fs from 'fs';
import path from 'path';

async function build() {
  console.log('Cleaning dist directory...');
  if (fs.existsSync('dist')) {
    fs.rmSync('dist', { recursive: true, force: true });
  }

  console.log('Building client with Vite...');
  await viteBuild();

  console.log('Building server with esbuild...');
  await esbuild({
    entryPoints: ['server.ts'],
    bundle: true,
    platform: 'node',
    target: 'node20',
    format: 'cjs',
    outfile: 'dist/server.cjs',
    packages: 'external',
  });

  console.log('Build completed successfully!');
}

build().catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});

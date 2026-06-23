#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');

// Create data directories (idempotent)
const dirs = [
  path.join(root, 'data'),
  path.join(root, 'data', 'uploads'),
  path.join(root, 'data', 'uploads', 'pdfs'),
  path.join(root, 'data', 'uploads', 'covers'),
  path.join(root, 'public'),
];

dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`  Created: ${path.relative(root, dir)}`);
  }
});

// Copy PDF.js worker to public/
const workerNames = [
  'pdf.worker.min.mjs',
  'pdf.worker.mjs',
  'pdf.worker.min.js',
];

let copied = false;
for (const name of workerNames) {
  const src = path.join(root, 'node_modules', 'pdfjs-dist', 'build', name);
  if (fs.existsSync(src)) {
    const dest = path.join(root, 'public', 'pdf.worker.min.mjs');
    fs.copyFileSync(src, dest);
    console.log(`  Copied PDF.js worker → public/pdf.worker.min.mjs`);
    copied = true;
    break;
  }
}

if (!copied) {
  console.warn('  ⚠ PDF.js worker not found — viewer will use CDN fallback');
}

console.log('✓ Setup complete');

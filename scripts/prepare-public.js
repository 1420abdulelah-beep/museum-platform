/**
 * prepare-public.js
 * Copies static frontend files to public/ directory for Vercel Edge CDN delivery
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const publicDir = path.join(rootDir, 'public');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

const copyRecursive = (src, dest) => {
  const stats = fs.statSync(src);
  if (stats.isDirectory()) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    fs.readdirSync(src).forEach(child => {
      copyRecursive(path.join(src, child), path.join(dest, child));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
};

const items = [
  'index.html',
  'pdr.html',
  'museum-plan.html',
  'notes-kanban.html',
  'team-admin.html',
  'style.css',
  'js',
  'assets',
  'uploads'
];

items.forEach(item => {
  const srcPath = path.join(rootDir, item);
  const destPath = path.join(publicDir, item);
  if (fs.existsSync(srcPath)) {
    copyRecursive(srcPath, destPath);
    console.log(`[+] Synced to public/: ${item}`);
  }
});

console.log('✅ Public directory prepared successfully for Vercel!');

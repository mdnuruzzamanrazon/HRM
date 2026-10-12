import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('=== Starting NovaHR Frontend Build ===');

// 1. Install frontend dependencies
console.log('1. Installing frontend dependencies...');
execSync('npm --prefix frontend install', { stdio: 'inherit' });

// 2. Build frontend using Vite
console.log('2. Building frontend...');
execSync('npm --prefix frontend run build', { stdio: 'inherit' });

// 3. Copy frontend/dist to root dist
const srcDir = path.join(process.cwd(), 'frontend', 'dist');
const destDir = path.join(process.cwd(), 'dist');

console.log(`3. Copying ${srcDir} to ${destDir}...`);
if (fs.existsSync(destDir)) {
  fs.rmSync(destDir, { recursive: true, force: true });
}

fs.cpSync(srcDir, destDir, { recursive: true });
console.log('=== Build Complete: Root dist directory is ready for Vercel deployment! ===');

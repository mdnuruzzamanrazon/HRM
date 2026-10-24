import fs from 'fs';
import path from 'path';

const src = path.resolve('src/pages/assets');
const dest = path.resolve('frontend/src/pages/assets');

if (!fs.existsSync(dest)) {
  fs.mkdirSync(dest, { recursive: true });
}

fs.readdirSync(src).forEach((file) => {
  fs.copyFileSync(path.join(src, file), path.join(dest, file));
  console.log(`Copied ${file} to ${dest}`);
});

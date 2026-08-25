/**
 * Adapte l'export statique Expo à GitHub Pages :
 * - duplique chaque `route.html` en `route/index.html` pour que les URL propres
 *   fonctionnent sur n'importe quel hébergeur statique,
 * - ajoute `404.html` (repli client pour les routes dynamiques) et `.nojekyll`.
 */
import { copyFile, mkdir, readdir, stat, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const dist = path.resolve('dist');

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === '_expo' || entry.name === 'assets') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(full);
      continue;
    }
    if (!entry.name.endsWith('.html') || entry.name === 'index.html' || entry.name === '404.html') continue;
    const route = full.slice(0, -'.html'.length);
    const indexFile = path.join(route, 'index.html');
    if (existsSync(indexFile)) continue;
    await mkdir(route, { recursive: true });
    await copyFile(full, indexFile);
  }
}

await stat(dist);
await walk(dist);
await copyFile(path.join(dist, 'index.html'), path.join(dist, '404.html'));
await writeFile(path.join(dist, '.nojekyll'), '');
await mkdir(dist, { recursive: true });
console.log('dist/ adapté pour GitHub Pages');

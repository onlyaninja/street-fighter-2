// Simple bundler to merge all SF2 modules into a single standalone bundle.js
// This eliminates CORS issues when opening via file:// and ensures instant loading.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const files = [
  'src/audio.js',
  'src/input.js',
  'src/entities/particle.js',
  'src/entities/projectile.js',
  'src/stages/suzaku.js',
  'src/engine/camera.js',
  'src/engine/physics.js',
  'src/ui/hud.js',
  'src/entities/fighter.js',
  'src/entities/character_renderer.js',
  'src/entities/ryu.js',
  'src/entities/ken.js',
  'src/entities/chunli.js',
  'src/entities/guile.js',
  'src/entities/bison.js',
  'src/entities/blanka.js',
  'src/entities/ehonda.js',
  'src/entities/zangief.js',
  'src/entities/dhalsim.js',
  'src/main.js'
];

let bundleCode = `// Street Fighter II - Standalone Dual Keyboard Arcade Bundle\n(() => {\n"use strict";\n\n`;

for (const file of files) {
  const fullPath = path.join(__dirname, file);
  let content = fs.readFileSync(fullPath, 'utf8');

  // Strip import statements
  content = content.replace(/^import\s+.*?from\s+['"].*?['"];?\r?\n/gm, '');

  // Strip 'export const' / 'export class' / 'export let' / 'export default' / 'export function'
  content = content.replace(/^export\s+(const|class|let|function|default\s+class|default\s+function)\s+/gm, '$1 ');
  content = content.replace(/^export\s+default\s+/gm, '');
  content = content.replace(/^export\s+\{.*?\};?\r?\n/gm, '');

  bundleCode += `// --- ${file} ---\n` + content + '\n\n';
}

bundleCode += `\n})();\n`;

fs.writeFileSync(path.join(__dirname, 'bundle.js'), bundleCode);
console.log("Successfully built bundle.js!");

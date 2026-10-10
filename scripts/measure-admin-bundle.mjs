// Compare the same cold admin-home dependency graph before/after a build.
// Dynamic screen imports are excluded until the visitor opens that screen.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';
import { gzipSync } from 'node:zlib';

const root = resolve(process.argv[2] ?? 'public/build');
const manifest = JSON.parse(readFileSync(resolve(root, 'manifest.json'), 'utf8'));
const visited = new Set();
const files = new Set();
function visit(key) {
    if (visited.has(key)) return;
    visited.add(key);
    const entry = manifest[key];
    if (!entry) throw new Error(`Missing manifest entry: ${key}`);
    if (entry.file.endsWith('.js')) files.add(entry.file);
    for (const dependency of entry.imports ?? []) visit(dependency);
}
for (const entry of ['resources/js/app.tsx', 'resources/js/pages/Dashboard.tsx', 'resources/js/pages/dashboard/DashboardSections.tsx']) visit(entry);
let bytes = 0;
let gzipBytes = 0;
for (const file of files) {
    const content = readFileSync(resolve(root, file));
    bytes += content.length;
    gzipBytes += gzipSync(content).length;
}
console.log(JSON.stringify({ metric: 'cold-admin-home-static-js', chunks: files.size, bytes, gzipBytes }, null, 2));

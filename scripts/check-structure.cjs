const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const names = new Map();
const failures = [];
const importsToCheck = [];
function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (['.git', 'node_modules', 'dist', '.cache', '.backups'].includes(entry.name)) continue;
    const file = path.join(directory, entry.name);
    const relative = path.relative(root, file).replaceAll('\\', '/');
    const folded = relative.toLowerCase();
    if (names.has(folded)) failures.push(`Case collision: ${names.get(folded)} / ${relative}`);
    names.set(folded, relative);
    if (entry.isDirectory()) walk(file);
    else if (/\.(?:tsx?|jsx?|cjs)$/.test(file)) {
      const source = fs.readFileSync(file, 'utf8');
      if (/^(?:<{7} |={7}$|>{7} )/m.test(source)) failures.push(`Merge marker: ${relative}`);
      const imports = /(?:\bfrom\s*|\bimport\s*|\brequire\s*\(|\bimport\s*\()\s*["'](\.[^"']+)["']/g;
      for (const match of source.matchAll(imports)) {
        if (match[1].endsWith("/")) continue;
        const target = path.resolve(path.dirname(file), match[1]);
        const choices = [target, ...['.ts','.tsx','.js','.cjs','.json'].map(ext=>target+ext), ...['index.ts','index.tsx','index.js'].map(name=>path.join(target,name))];
        const found = choices.find(candidate=>fs.existsSync(candidate)&&fs.statSync(candidate).isFile());
        if (!found) failures.push(`Missing import: ${relative} -> ${match[1]}`);
        else importsToCheck.push({ file: relative, target: path.relative(root, found).replaceAll('\\', '/') });
      }
    }
  }
}
walk(root);
for (const item of importsToCheck) {
  const actual = names.get(item.target.toLowerCase());
  if (actual && actual !== item.target) failures.push(`Import casing mismatch: ${item.file} -> ${item.target}; actual path: ${actual}`);
}
if (fs.existsSync(path.join(root, '.git'))) {
  const { execFileSync } = require('node:child_process');
  const tracked = execFileSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8' }).split('\0').filter(Boolean);
  for (const file of tracked) {
    if (/(^|\/)\.backups\//.test(file) || file.endsWith('.ttbackup')) failures.push('Private database backup tracked in Git: ' + file);
    if (file.includes('node_modules/') || /(^|\/)\.env(?:$|\.(?!example$))/.test(file)) failures.push('Generated or secret file tracked in Git: ' + file);
  }
}
if (failures.length) { console.error(failures.join('\n')); process.exitCode = 1; }
else console.log('Structure check passed: no case collisions, missing local imports, or merge markers.');

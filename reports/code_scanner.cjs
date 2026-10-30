const fs = require('fs');
const path = require('path');

function walk(dir, ext) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(full, ext));
    } else if (file.endsWith(ext)) {
      results.push(full);
    }
  });
  return results;
}

const javaFiles = walk('backend/src/main/java', '.java');
const findings = {
  todos: [],
  fixmes: [],
  mockFallbacks: [],
  emptyCatches: []
};

for (const f of javaFiles) {
  const content = fs.readFileSync(f, 'utf8');
  const rel = path.relative('backend/src/main/java', f).replace(/\\/g, '/');
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    if (line.includes('TODO')) {
      findings.todos.push({ file: rel, line: idx + 1, text: line.trim() });
    }
    if (line.includes('FIXME')) {
      findings.fixmes.push({ file: rel, line: idx + 1, text: line.trim() });
    }
    if (line.includes('orElseGet') && (line.includes('HV') || line.includes('GV') || line.includes('findAll().stream()'))) {
      findings.mockFallbacks.push({ file: rel, line: idx + 1, text: line.trim() });
    }
    if (line.match(/catch\s*\([^)]+\)\s*\{\s*\}/)) {
      findings.emptyCatches.push({ file: rel, line: idx + 1, text: line.trim() });
    }
  });
}

console.log('--- SCAN FINDINGS ---');
console.log('TODO count:', findings.todos.length);
console.log('FIXME count:', findings.fixmes.length);
console.log('Mock/Demo Fallbacks count:', findings.mockFallbacks.length);
console.log('Empty catches count:', findings.emptyCatches.length);

if (findings.mockFallbacks.length > 0) {
  console.log('\nMock/Demo Fallbacks found:');
  console.log(findings.mockFallbacks);
}

fs.writeFileSync('reports/code_quality_scan.json', JSON.stringify(findings, null, 2));


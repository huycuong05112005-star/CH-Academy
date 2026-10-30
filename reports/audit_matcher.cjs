const fs = require('fs');
const path = require('path');

const dump = JSON.parse(fs.readFileSync('reports/endpoints_dump.json', 'utf8'));
const backend = dump.backend;
const frontend = dump.frontend;

function normalize(url) {
  // Remove query params
  let u = url.split('?')[0].trim();
  // Strip ${...} or :id or {id} into {param}
  u = u.replace(/\$\{[^}]+\}/g, '{param}');
  u = u.replace(/\{[^}]+\}/g, '{param}');
  u = u.replace(/\/[0-9]+/g, '/{param}');
  // Ensure starts with /
  if (!u.startsWith('/')) u = '/' + u;
  // If starts with /api/v1, normalize
  if (u.startsWith('/api/v1')) {
    u = u.replace('/api/v1', '');
  }
  return u;
}

const backendMap = new Map();
for (const be of backend) {
  let norm = normalize(be.path);
  const key = `${be.method} ${norm}`;
  backendMap.set(key, be);
}

const matrix = [];
const unmatchedFrontend = [];

for (const fe of frontend) {
  let norm = normalize(fe.rawUrl);
  const key = `${fe.method} ${norm}`;
  const be = backendMap.get(key);

  matrix.push({
    frontendFile: fe.file,
    rawUrl: fe.rawUrl,
    method: fe.method,
    normalized: norm,
    matchedBackend: be ? `${be.controller} -> ${be.methodName} (${be.path})` : 'NOT FOUND',
    status: be ? 'MATCHED' : 'UNMATCHED'
  });

  if (!be) {
    unmatchedFrontend.push({ fe, norm, key });
  }
}

console.log('--- AUDIT SUMMARY ---');
console.log('Total Frontend API Calls:', frontend.length);
console.log('Matched Backend Endpoints:', matrix.filter(m => m.status === 'MATCHED').length);
console.log('Unmatched Frontend Calls:', unmatchedFrontend.length);

if (unmatchedFrontend.length > 0) {
  console.log('\n--- UNMATCHED FRONTEND CALLS ---');
  unmatchedFrontend.forEach(u => {
    console.log(`[${u.fe.method}] ${u.fe.rawUrl} (${u.fe.file}) -> normalized: ${u.norm}`);
  });
}

fs.writeFileSync('reports/api_matrix_analysis.json', JSON.stringify({
  summary: {
    totalFrontend: frontend.length,
    matched: matrix.filter(m => m.status === 'MATCHED').length,
    unmatched: unmatchedFrontend.length
  },
  matrix,
  unmatchedFrontend
}, null, 2));


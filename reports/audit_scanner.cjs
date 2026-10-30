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

const controllers = walk('backend/src/main/java', 'Controller.java');
const endpoints = [];

for (const c of controllers) {
  const content = fs.readFileSync(c, 'utf8');
  
  // Find class level @RequestMapping
  const classMatch = content.match(/@RequestMapping\((?:value\s*=\s*)?(\{[^}]+\}|"[^"]+")\)/);
  let basePaths = [''];
  if (classMatch) {
    if (classMatch[1].startsWith('{')) {
      basePaths = classMatch[1].replace(/[{}\"\s]/g, '').split(',');
    } else {
      basePaths = [classMatch[1].replace(/\"/g, '')];
    }
  }

  // Split content by methods or search method by method
  const lines = content.split('\n');
  let currentAnnotation = null;
  let currentMethod = null;
  let currentSubPaths = [''];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const mapMatch = line.match(/@(GetMapping|PostMapping|PutMapping|DeleteMapping|PatchMapping)(?:\((.*)\))?/);
    if (mapMatch) {
      currentAnnotation = mapMatch[1];
      currentMethod = currentAnnotation.replace('Mapping', '').toUpperCase();
      let pathArg = mapMatch[2] ? mapMatch[2].trim() : '';
      if (!pathArg || pathArg.length === 0) {
        currentSubPaths = [''];
      } else {
        const valMatch = pathArg.match(/(?:value\s*=\s*)?(\{[^}]+\}|"[^"]*")/);
        if (valMatch) {
          if (valMatch[1].startsWith('{')) {
            currentSubPaths = valMatch[1].replace(/[{}\"\s]/g, '').split(',');
          } else {
            currentSubPaths = [valMatch[1].replace(/\"/g, '')];
          }
        } else {
          currentSubPaths = [''];
        }
      }
    }

    if (currentAnnotation && line.includes('public ') && line.includes('(')) {
      // Found the method
      const nameMatch = line.match(/public\s+[^\s(]+\s+([a-zA-Z0-9_]+)\s*\(/) || line.match(/public\s+<[^>]+>\s+[^\s(]+\s+([a-zA-Z0-9_]+)\s*\(/);
      const methodName = nameMatch ? nameMatch[1] : 'unknown';
      
      for (const b of basePaths) {
        for (const s of currentSubPaths) {
          let full = (b + (s.startsWith('/') || !s ? s : '/' + s)).replace(/\/+/g, '/');
          if (full.endsWith('/') && full.length > 1) full = full.slice(0, -1);
          endpoints.push({
            controller: path.basename(c),
            method: currentMethod,
            path: full,
            methodName
          });
        }
      }
      currentAnnotation = null;
      currentMethod = null;
      currentSubPaths = [''];
    }
  }
}

console.log('Total extracted backend endpoints:', endpoints.length);

const feFiles = walk('frontend/src', '.ts').concat(walk('frontend/src', '.tsx'));
const feEndpoints = [];
const apiCallRegex = /(?:apiClient|client|apiFetch)\.(get|post|put|delete|patch)\s*(?:<[^>]+>)?\s*\(\s*([`'\"].*?[`'\"])/g;

for (const f of feFiles) {
  const content = fs.readFileSync(f, 'utf8');
  let match;
  while ((match = apiCallRegex.exec(content)) !== null) {
    feEndpoints.push({
      file: path.relative('frontend/src', f).replace(/\\/g, '/'),
      method: match[1].toUpperCase(),
      rawUrl: match[2].replace(/[`'\"]/g, '')
    });
  }
}
console.log('Total extracted frontend API calls:', feEndpoints.length);

fs.writeFileSync('reports/endpoints_dump.json', JSON.stringify({ backend: endpoints, frontend: feEndpoints }, null, 2));
console.log('Dump written to reports/endpoints_dump.json');

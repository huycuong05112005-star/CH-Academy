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
const report = [];

for (const c of controllers) {
  const content = fs.readFileSync(c, 'utf8');
  const classHasTransactional = content.includes('@Transactional\n') || content.includes('@Transactional(') || content.includes('@Transactional ');
  
  // Find mutating methods (Post, Put, Delete, Patch)
  const lines = content.split('\n');
  let currentMapping = null;
  let currentMethodStart = -1;
  let currentMethodName = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.match(/@(PostMapping|PutMapping|DeleteMapping|PatchMapping)/)) {
      currentMapping = line.trim();
      currentMethodStart = i;
    }
    if (currentMapping && line.includes('public ') && line.includes('(')) {
      const nameMatch = line.match(/public\s+[^\s(]+\s+([a-zA-Z0-9_]+)\s*\(/);
      currentMethodName = nameMatch ? nameMatch[1] : 'unknown';

      // Check if there is @Transactional between mapping and method, or right before mapping
      let hasTx = classHasTransactional;
      for (let j = Math.max(0, currentMethodStart - 3); j <= i; j++) {
        if (lines[j].includes('@Transactional')) {
          hasTx = true;
          break;
        }
      }

      // Check if method body calls repository.save or repository.delete or updates entities directly
      let methodBody = '';
      let braceCount = 0;
      let started = false;
      for (let k = i; k < lines.length; k++) {
        methodBody += lines[k] + '\n';
        if (lines[k].includes('{')) {
          braceCount += (lines[k].match(/\{/g) || []).length;
          started = true;
        }
        if (lines[k].includes('}')) {
          braceCount -= (lines[k].match(/\}/g) || []).length;
        }
        if (started && braceCount <= 0) break;
      }

      const hasRepoWrite = methodBody.includes('Repository.save') || methodBody.includes('Repository.delete') || methodBody.includes('.save(');
      const hasLazyAccess = methodBody.includes('.get') && (methodBody.includes('Repository.find') || methodBody.includes('repository.find'));

      if (!hasTx && (hasRepoWrite || hasLazyAccess)) {
        report.push({
          controller: path.basename(c),
          methodName: currentMethodName,
          mapping: currentMapping,
          hasRepoWrite,
          hasLazyAccess,
          line: i + 1
        });
      }

      currentMapping = null;
      currentMethodName = '';
    }
  }
}

console.log('Controllers with mutating methods missing @Transactional:');
console.log(JSON.stringify(report, null, 2));
fs.writeFileSync('reports/controllers_missing_tx.json', JSON.stringify(report, null, 2));


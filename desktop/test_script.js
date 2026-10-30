const fs = require('fs');
const path = require('path');
const electron = require('electron');

const outFile = path.join(__dirname, 'electron_info.json');
fs.writeFileSync(outFile, JSON.stringify({
  isElectron: Boolean(process.versions.electron),
  electronVersion: process.versions.electron,
  nodeVersion: process.versions.node,
  typeofElectron: typeof electron,
  keys: Object.keys(electron)
}, null, 2), 'utf8');

if (electron.app) {
  electron.app.quit();
} else {
  process.exit(0);
}


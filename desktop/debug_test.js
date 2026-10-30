const fs = require('fs');
const path = require('path');

const logPath = path.join(__dirname, 'electron_debug.log');

let electronModule = null;
try {
  electronModule = require('electron');
} catch (e) {
  electronModule = { error: e.message };
}

fs.writeFileSync(logPath, JSON.stringify({
  versions: process.versions,
  type: typeof electronModule,
  isString: typeof electronModule === 'string' ? electronModule : false,
  keys: electronModule ? Object.keys(electronModule) : [],
  builtinModules: require('module').builtinModules ? require('module').builtinModules.slice(0, 10) : []
}, null, 2), 'utf8');

if (electronModule && electronModule.app) {
  electronModule.app.quit();
} else {
  process.exit(0);
}


const fs = require('fs');
const path = require('path');
const Module = require('module');

const logFile = path.join(__dirname, 'crash.log');

try {
  // Check if Module._load('electron') works when ignoring node_modules
  const origLoad = Module._load;
  // What does electron.exe load for 'electron' internally?
  let internalModule = null;
  try {
    internalModule = process._linkedBinding('electron_browser_app');
  } catch(e) {}
  
  // What about process._linkedBinding('electron_common_features')?
  fs.writeFileSync(logFile, JSON.stringify({
    internalApp: internalModule ? Object.keys(internalModule) : null,
    processType: process.type
  }, null, 2), 'utf8');
} catch (err) {
  fs.writeFileSync(logFile, 'Error: ' + err.stack + '\n', { flag: 'a' });
}

process.exit(0);

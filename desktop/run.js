const { spawn } = require('child_process');
const path = require('path');

const electronExe = path.join(__dirname, 'node_modules', 'electron', 'dist', 'electron.exe');
const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;

const child = spawn(electronExe, ['.', ...process.argv.slice(2)], {
  cwd: __dirname,
  env,
  stdio: 'inherit',
  windowsHide: false
});

child.on('exit', (code) => {
  process.exit(code || 0);
});


const fs = require('fs');
const path = require('path');
const electron = require('electron');

fs.writeFileSync(path.join(__dirname, 'electron_props.txt'), [
  'typeof electron: ' + typeof electron,
  'electron is: ' + (typeof electron === 'string' ? electron : JSON.stringify(Object.keys(electron))),
].join('\n'));

process.exit(0);


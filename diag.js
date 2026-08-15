const os = require('os');
const v8 = require('v8');
const { execSync } = require('child_process');

console.log('--- Environment Diagnosis ---');
console.log('Platform:', os.platform(), os.release());
console.log('Total RAM:', (os.totalmem() / 1024 / 1024 / 1024).toFixed(2), 'GB');
console.log('Free RAM:', (os.freemem() / 1024 / 1024 / 1024).toFixed(2), 'GB');
console.log('Node Version:', process.version);
try {
  console.log('NPM Version:', execSync('npm -v').toString().trim());
} catch(e) {}
console.log('V8 Heap Statistics:', v8.getHeapStatistics());

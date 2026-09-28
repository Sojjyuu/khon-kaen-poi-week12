const { fork, spawn } = require('node:child_process');
const path = require('node:path');
const root = path.join(__dirname, '..');
const [major, minor] = process.versions.node.split('.').map(Number);
if (major < 22 || (major === 22 && minor < 13)) {
  console.error('Use Node.js 22.13+ (SQLite is required).'); process.exit(1);
}
let metro;
let stopping = false;
const api = fork(path.join(__dirname, 'mock-campus-api.cjs'), [], {
  cwd: root, env: { ...process.env, PORT: '4100' }, stdio: ['ignore', 'inherit', 'inherit', 'ipc'],
});
const timer = setTimeout(() => { console.error('API did not become ready.'); stop(1); }, 15000);
function stop(code = 0) {
  if (stopping) return;
  stopping = true; clearTimeout(timer);
  api.kill(); metro?.kill();
  process.exitCode = code;
}
api.once('message', message => {
  if (stopping || !message.port) return;
  clearTimeout(timer);
  console.log('API ready. Starting Expo Go over LAN; press Ctrl+C to stop both.');
  metro = spawn(process.execPath, [require.resolve('expo/bin/cli'), 'start', '--go', '--lan', ...process.argv.slice(2)], {
    cwd: root, env: process.env, stdio: 'inherit',
  });
  metro.once('error', () => { console.error('Expo could not start.'); stop(1); });
  metro.once('exit', code => stop(code ?? 0));
});
api.once('error', () => { console.error('API could not start.'); stop(1); });
api.once('exit', code => stop(code ?? 0));
process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());

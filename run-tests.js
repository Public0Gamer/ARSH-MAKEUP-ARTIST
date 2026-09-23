const { fork } = require('child_process');
const path = require('path');

console.log('Starting server for verification...');
const server = fork(path.join(__dirname, 'server.js'), {
  env: { ...process.env, PORT: 3000 }
});

server.on('message', (msg) => {
  console.log('Server message:', msg);
});

// Run test script after 2 seconds
setTimeout(() => {
  const tests = fork(path.join(__dirname, 'test-server.js'));

  tests.on('exit', (code) => {
    console.log('Verification test finished with code:', code);
    server.kill();
    process.exit(code);
  });
}, 2000);

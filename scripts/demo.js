const { spawn, exec } = require('child_process');

const PORT = process.env.PORT || '3000';
const url = `http://localhost:${PORT}`;

function openBrowser(targetUrl) {
  const platform = process.platform;
  const command =
    platform === 'win32'
      ? `start "" "${targetUrl}"`
      : platform === 'darwin'
        ? `open "${targetUrl}"`
        : `xdg-open "${targetUrl}"`;

  exec(command, (error) => {
    if (error) {
      console.log(`Impossible d'ouvrir automatiquement le navigateur. Ouvre manuellement: ${targetUrl}`);
    }
  });
}

function run() {
  const server = spawn(process.execPath, ['server.js'], {
    stdio: 'inherit',
    env: { ...process.env, PORT }
  });

  console.log(`\n[demo] Démarrage du serveur sur ${url}`);

  setTimeout(() => {
    console.log(`[demo] Ouverture du navigateur sur ${url}`);
    openBrowser(url);
  }, 700);

  const shutdown = () => {
    console.log('\n[demo] Arrêt du serveur...');
    server.kill('SIGTERM');
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  server.on('exit', (code) => {
    process.exit(code ?? 0);
  });
}

run();

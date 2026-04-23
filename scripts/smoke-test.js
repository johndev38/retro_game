const { spawn } = require('child_process');

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  const server = spawn(process.execPath, ['server.js'], {
    stdio: ['ignore', 'pipe', 'pipe']
  });

  let started = false;
  server.stdout.on('data', (chunk) => {
    const line = chunk.toString();
    if (line.includes('Retro Agile Quest en ligne')) started = true;
  });

  server.stderr.on('data', (chunk) => {
    process.stderr.write(chunk);
  });

  for (let i = 0; i < 30 && !started; i += 1) {
    await wait(100);
  }

  try {
    const response = await fetch('http://localhost:3000/api/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Smoke', room: 'TEST' })
    });


    const cssResponse = await fetch('http://localhost:3000/styles.css');
    if (!cssResponse.ok) {
      throw new Error(`Styles indisponibles (HTTP ${cssResponse.status})`);
    }

    const svgResponse = await fetch('http://localhost:3000/assets/chars/mage.svg');
    if (!svgResponse.ok) {
      throw new Error(`Sprite SVG indisponible (HTTP ${svgResponse.status})`);
    }
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    if (!data.playerId || data.room !== 'TEST') {
      throw new Error('Réponse join invalide');
    }

    const chatResponse = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId: data.playerId, text: 'hello retro' })
    });

    if (!chatResponse.ok) {
      throw new Error(`Chat indisponible (HTTP ${chatResponse.status})`);
    }

    const chatData = await chatResponse.json();
    const plusResponse = await fetch('http://localhost:3000/api/note-plusone', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId: data.playerId, noteId: chatData.note.id })
    });

    if (!plusResponse.ok) {
      throw new Error(`+1 indisponible (HTTP ${plusResponse.status})`);
    }

    console.log('Smoke test OK:', { playerId: data.playerId, room: data.room });
  } finally {
    server.kill('SIGTERM');
  }
}

run().catch((error) => {
  console.error('Smoke test FAILED:', error.message);
  process.exitCode = 1;
});

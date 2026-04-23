const http = require('http');
const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const MAP_WIDTH = 24;
const MAP_HEIGHT = 16;

const roles = {
  mage: {
    name: 'Mage Architecte',
    power: 'Résolution des problèmes complexes et des blocages de conception.',
    color: '#7c5cff'
  },
  nain: {
    name: 'Nain Débuggeur',
    power: 'Résolution des bugs critiques et stabilisation du sprint.',
    color: '#cc7a33'
  },
  rôdeur: {
    name: 'Rôdeur Risques',
    power: 'Détection des risques cachés et sécurisation des dépendances.',
    color: '#3bb273'
  },
  barde: {
    name: 'Barde Communication',
    power: 'Fluidification de la communication d’équipe et médiation.',
    color: '#e05ea1'
  },
  qa: {
    name: 'Alchimiste QA',
    power: 'Transforme les hypothèses en critères de test clairs et fiables.',
    color: '#4fa3d9'
  },
  scrum_master: {
    name: 'Gardien Scrum',
    power: 'Élimine les impediments et protège le flux de travail de l’équipe.',
    color: '#ffd166'
  },
  devops: {
    name: 'Forgeron DevOps',
    power: 'Automatise la livraison et surveille la stabilité en continu.',
    color: '#8ec07c'
  },
  ux: {
    name: 'Oracle UX',
    power: 'Donne la voix de l’utilisateur via feedbacks et prototypes rapides.',
    color: '#f78c6b'
  }
};


const zoneIdeas = {
  plains: {
    title: 'Plaine du Sprint Calme',
    text: 'Idée: réduire la dette légère et préparer les stories du sprint suivant.'
  },
  volcano: {
    title: 'Zone Volcanique des Incidents',
    text: 'Idée: lancer un swarm de 30 min puis rédiger un mini post-mortem sans blâme.'
  },
  forest: {
    title: 'Forêt des Explorations',
    text: 'Idée: planifier un spike timeboxé pour tester un choix technique risqué.'
  },
  lake: {
    title: 'Lac des Feedbacks',
    text: 'Idée: organiser une rétro flash orientée voix du client et apprentissages.'
  }
};

const map = Array.from({ length: MAP_HEIGHT }, (_, y) =>
  Array.from({ length: MAP_WIDTH }, (_, x) => {
    if (x > 14 && y < 6) return 'volcano';
    if (x < 7 && y > 8) return 'forest';
    if (x > 15 && y > 10) return 'lake';
    return 'plains';
  })
);

const rooms = new Map();
const players = new Map();
const subscribers = new Map();

function getOrCreateRoom(roomCode) {
  if (!rooms.has(roomCode)) {
    rooms.set(roomCode, { code: roomCode, players: new Set() });
  }
  return rooms.get(roomCode);
}

function randomSpawn() {
  return {
    x: Math.floor(Math.random() * MAP_WIDTH),
    y: Math.floor(Math.random() * MAP_HEIGHT)
  };
}

function playersOfRoom(roomCode) {
  const room = rooms.get(roomCode);
  if (!room) return [];
  return [...room.players].map((playerId) => ({ id: playerId, ...players.get(playerId) }));
}

function sendEvent(res, event, payload) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

function broadcastRoom(roomCode) {
  const state = { type: 'state', players: playersOfRoom(roomCode) };
  for (const [playerId, res] of subscribers.entries()) {
    const player = players.get(playerId);
    if (player?.room === roomCode) {
      sendEvent(res, 'state', state);
    }
  }
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1e6) {
        reject(new Error('Payload trop grand'));
        req.destroy();
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error('JSON invalide'));
      }
    });
  });
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

function serveStatic(req, res) {
  const pathname = new URL(req.url, `http://${req.headers.host}`).pathname;
  const requestedPath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  const normalized = path.normalize(requestedPath);

  if (normalized.startsWith('..') || path.isAbsolute(normalized)) {
    sendJson(res, 403, { error: 'Accès refusé' });
    return;
  }

  const fullPath = path.join(PUBLIC_DIR, normalized);

  fs.readFile(fullPath, (err, content) => {
    if (err) {
      sendJson(res, 404, { error: 'Fichier introuvable' });
      return;
    }

    const ext = path.extname(fullPath);
    const mimeTypes = {
      '.html': 'text/html; charset=utf-8',
      '.js': 'application/javascript; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.svg': 'image/svg+xml; charset=utf-8'
    };

    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
    res.end(content);
  });
}

const server = http.createServer(async (req, res) => {
  if (req.url.startsWith('/api/join') && req.method === 'POST') {
    try {
      const body = await parseJsonBody(req);
      const roomCode = (body.room || 'RETRO').toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 12) || 'RETRO';
      const name = (body.name || 'Joueur').trim().slice(0, 20) || 'Joueur';

      const id = randomUUID();
      const spawn = randomSpawn();
      const room = getOrCreateRoom(roomCode);
      room.players.add(id);

      players.set(id, {
        room: roomCode,
        name,
        role: null,
        color: '#ffffff',
        x: spawn.x,
        y: spawn.y
      });

      sendJson(res, 200, {
        playerId: id,
        room: roomCode,
        roles,
        map,
        zoneIdeas,
        players: playersOfRoom(roomCode)
      });

      broadcastRoom(roomCode);
    } catch (error) {
      sendJson(res, 400, { error: error.message });
    }
    return;
  }

  if (req.url.startsWith('/api/events') && req.method === 'GET') {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const playerId = url.searchParams.get('playerId');

    if (!playerId || !players.has(playerId)) {
      sendJson(res, 404, { error: 'Joueur inconnu' });
      return;
    }

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive'
    });

    subscribers.set(playerId, res);
    sendEvent(res, 'connected', { ok: true });

    req.on('close', () => {
      subscribers.delete(playerId);
    });
    return;
  }

  if (req.url.startsWith('/api/select-role') && req.method === 'POST') {
    try {
      const body = await parseJsonBody(req);
      const player = players.get(body.playerId);
      const role = roles[body.role];
      if (!player || !role) {
        sendJson(res, 404, { error: 'Joueur ou rôle invalide' });
        return;
      }

      player.role = body.role;
      player.name = (body.name || player.name).trim().slice(0, 20) || player.name;
      player.color = role.color;

      sendJson(res, 200, { ok: true });
      broadcastRoom(player.room);
    } catch (error) {
      sendJson(res, 400, { error: error.message });
    }
    return;
  }

  if (req.url.startsWith('/api/move') && req.method === 'POST') {
    try {
      const body = await parseJsonBody(req);
      const player = players.get(body.playerId);
      if (!player || !player.role) {
        sendJson(res, 403, { error: 'Action non autorisée' });
        return;
      }

      player.x = clamp(player.x + (body.dx || 0), 0, MAP_WIDTH - 1);
      player.y = clamp(player.y + (body.dy || 0), 0, MAP_HEIGHT - 1);
      sendJson(res, 200, { ok: true });
      broadcastRoom(player.room);
    } catch (error) {
      sendJson(res, 400, { error: error.message });
    }
    return;
  }

  if (req.url.startsWith('/api/leave') && req.method === 'POST') {
    try {
      const body = await parseJsonBody(req);
      const player = players.get(body.playerId);
      if (!player) {
        sendJson(res, 200, { ok: true });
        return;
      }

      const room = rooms.get(player.room);
      room?.players.delete(body.playerId);
      players.delete(body.playerId);
      subscribers.get(body.playerId)?.end();
      subscribers.delete(body.playerId);
      sendJson(res, 200, { ok: true });

      if (room && room.players.size === 0) rooms.delete(player.room);
      else broadcastRoom(player.room);
    } catch (error) {
      sendJson(res, 400, { error: error.message });
    }
    return;
  }

  serveStatic(req, res);
});

server.listen(PORT, () => {
  console.log(`Retro Agile Quest en ligne: http://localhost:${PORT}`);
});

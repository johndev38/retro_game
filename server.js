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
    power: 'Ce sprint, il a clarifié les choix techniques, dessiné les solutions et aidé l’équipe à ne pas se perdre dans la complexité.',
    color: '#7c5cff'
  },
  nain: {
    name: 'Nain Débuggeur',
    power: 'Ce sprint, il a creusé dans les bugs, fouillé les logs, trouvé les causes racines et consolidé ce qui menaçait de s’effondrer.',
    color: '#cc7a33'
  },
  rodeur: {
    name: 'Rôdeur des Risques',
    power: 'Ce sprint, il a repéré les pièges cachés : dépendances fragiles, zones floues, retards possibles et décisions dangereuses.',
    color: '#3bb273'
  },
  barde: {
    name: 'Barde Communication',
    power: 'Ce sprint, il a fait circuler l’information, reformulé les malentendus et aidé l’équipe à mieux se comprendre.',
    color: '#e05ea1'
  },
  qa: {
    name: 'Alchimiste QA',
    power: 'Ce sprint, il a transformé les doutes en tests, les hypothèses en critères clairs et les régressions en apprentissages.',
    color: '#4fa3d9'
  },
  scrum_master: {
    name: 'Gardien du Flux',
    power: 'Ce sprint, il a protégé l’équipe des interruptions, levé les blocages et aidé chacun à avancer sans se disperser.',
    color: '#ffd166'
  },
  devops: {
    name: 'Forgeron DevOps',
    power: 'Ce sprint, il a renforcé les pipelines, surveillé les environnements, automatisé les livraisons et réparé les chaînes cassées.',
    color: '#8ec07c'
  },
  ux: {
    name: 'Oracle UX',
    power: 'Ce sprint, il a ramené la voix de l’utilisateur, questionné l’expérience réelle et aidé à rendre le produit plus utile.',
    color: '#f78c6b'
  },
  po: {
    name: 'Cartographe Produit',
    power: 'Ce sprint, il a aidé à retrouver la bonne direction : priorités, valeur métier, stories utiles et décisions produit.',
    color: '#5cc8ff'
  },
  techlead: {
    name: 'Chevalier Tech Lead',
    power: 'Ce sprint, il a défendu la cohérence du code, accompagné les décisions techniques et aidé l’équipe à progresser.',
    color: '#b392f0'
  },
  dette: {
    name: 'Spectre de la Dette Technique',
    power: 'Ce sprint, il a hanté le code oublié, révélé les raccourcis coûteux et rappelé ce qui ralentit l’équipe.',
    color: '#6c757d'
  },
  livreur: {
    name: 'Messager de Livraison',
    power: 'Ce sprint, il a porté les features jusqu’aux utilisateurs, suivi les mises en production et observé les retours du terrain.',
    color: '#ff9f1c'
  },
  explorateur: {
    name: 'Explorateur de Spike',
    power: 'Ce sprint, il a testé des pistes incertaines, prototypé rapidement et rapporté des réponses avant d’engager toute l’équipe.',
    color: '#00b4d8'
  },
  nettoyeur: {
    name: 'Moine Refacto',
    power: 'Ce sprint, il a simplifié le code, supprimé les doublons, clarifié les noms et rendu le système plus lisible.',
    color: '#90be6d'
  },
  pompier: {
    name: 'Pompier de Production',
    power: 'Ce sprint, il a éteint les incidents, analysé les alertes urgentes et aidé l’équipe à retrouver un état stable.',
    color: '#ef476f'
  },
  mouche: {
    name: 'Mouche des Signaux Faibles',
    power: 'Ce sprint, elle a capté les petits détails, les irritants, les non-dits et les alertes discrètes que personne ne voyait vraiment.',
    color: '#9aa1b2'
  }
};




const items = {
  epee_focus: {
    name: 'Épée du Focus',
    power: 'Permet de se concentrer sur la tâche actuelle sans se disperser.',
    icon: '🗡️'
  },
  potion_energie: {
    name: 'Potion d\'Énergie',
    power: 'Donne un boost pour terminer un ticket complexe avant la fin du sprint.',
    icon: '🧪'
  },
  bouclier_qualite: {
    name: 'Bouclier Qualité',
    power: 'Réduit les régressions grâce à plus de tests et de revues.',
    icon: '🛡️'
  },
  grimoire_refacto: {
    name: 'Grimoire de Refacto',
    power: 'Aide à transformer la dette technique en code plus simple.',
    icon: '📘'
  },
  boussole_priorite: {
    name: 'Boussole de Priorité',
    power: 'Guide l\'équipe vers la story la plus utile au client.',
    icon: '🧭'
  },
  totem_collab: {
    name: 'Totem de Collaboration',
    power: 'Accélère l\'entraide et les sessions de pair/mob programming.',
    icon: '🤝'
  }
};

const zoneIdeas = {
  plains: {
    title: 'Prairie du Sprint Stable',
    text: 'Zone calme: on avance au rythme prévu, peu d\'interruptions, bonne visibilité sur les priorités.'
  },
  volcano: {
    title: 'Volcan de la Pression',
    text: 'Ici, la pression a monté: urgences, délais courts et décisions rapides. Idée rétro: identifier ce qui a créé la surchauffe.'
  },
  forest: {
    title: 'Forêt des Explorations',
    text: 'Zone d\'expérimentation: spikes, pistes techniques, incertitudes à clarifier avant de s\'engager.'
  },
  lake: {
    title: 'Lac des Feedbacks',
    text: 'Moment de recul: retours utilisateurs, qualité perçue, ajustements utiles pour le prochain sprint.'
  },
  island: {
    title: 'Île du Calme',
    text: 'Petit havre: focus, concentration et entraide. Idée rétro: ce qui nous a aidés à préserver ce calme.'
  },
  ruins: {
    title: 'Ruines de la Dette',
    text: 'Anciennes décisions qui pèsent encore. Idée rétro: choisir 1 dette à traiter en priorité et son bénéfice attendu.'
  },
  city: {
    title: 'Ville des Livraisons',
    text: 'Zone de livraison continue: release, monitoring, retours terrain. Idée rétro: fluidifier le passage vers la prod.'
  }
};


const map = Array.from({ length: MAP_HEIGHT }, (_, y) =>
  Array.from({ length: MAP_WIDTH }, (_, x) => {
    const coast = Math.min(x, y, MAP_WIDTH - 1 - x, MAP_HEIGHT - 1 - y);
    if (coast < 1) return 'lake';

    const dVolcano = Math.hypot(x - 19, y - 3);
    if (dVolcano < 3.8) return 'volcano';

    const dIsland = Math.hypot(x - 11, y - 8);
    if (dIsland < 2.3) return 'island';

    const dRuins = Math.hypot(x - 4, y - 5);
    if (dRuins < 2.7) return 'ruins';

    if (x >= 13 && x <= 20 && y >= 8 && y <= 12) return 'city';

    if (x < 8 && y > 8) return 'forest';

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
        y: spawn.y,
        notes: [],
        items: []
      });

      sendJson(res, 200, {
        playerId: id,
        room: roomCode,
        roles,
        map,
        zoneIdeas,
        items,
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


  if (req.url.startsWith('/api/select-items') && req.method === 'POST') {
    try {
      const body = await parseJsonBody(req);
      const player = players.get(body.playerId);
      if (!player) {
        sendJson(res, 404, { error: 'Joueur inconnu' });
        return;
      }

      const selected = Array.isArray(body.items) ? body.items : [];
      const unique = [...new Set(selected)].filter((id) => id in items);
      if (unique.length > 3) {
        sendJson(res, 400, { error: 'Tu peux choisir au maximum 3 objets.' });
        return;
      }

      player.items = unique;
      sendJson(res, 200, { ok: true, items: unique });
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


  if (req.url.startsWith('/api/chat') && req.method === 'POST') {
    try {
      const body = await parseJsonBody(req);
      const player = players.get(body.playerId);
      if (!player) {
        sendJson(res, 404, { error: 'Joueur inconnu' });
        return;
      }

      const text = (body.text || '').toString().trim().slice(0, 160);
      if (!text) {
        sendJson(res, 400, { error: 'Message vide' });
        return;
      }

      const note = {
        id: randomUUID(),
        text,
        at: Date.now(),
        plusOne: 0,
        likedBy: []
      };
      player.notes = Array.isArray(player.notes) ? player.notes : [];
      player.notes.push(note);

      sendJson(res, 200, { ok: true, note });
      broadcastRoom(player.room);
    } catch (error) {
      sendJson(res, 400, { error: error.message });
    }
    return;
  }


  if (req.url.startsWith('/api/note-plusone') && req.method === 'POST') {
    try {
      const body = await parseJsonBody(req);
      const player = players.get(body.playerId);
      if (!player) {
        sendJson(res, 404, { error: 'Joueur inconnu' });
        return;
      }

      const roomPlayers = playersOfRoom(player.room);
      let targetNote = null;
      let ownerId = null;
      for (const p of roomPlayers) {
        const note = (p.notes || []).find((n) => n.id === body.noteId);
        if (note) {
          targetNote = note;
          ownerId = p.id;
          break;
        }
      }

      if (!targetNote || !ownerId) {
        sendJson(res, 404, { error: 'Post-it introuvable' });
        return;
      }

      const owner = players.get(ownerId);
      const ownerNote = owner?.notes?.find((n) => n.id === body.noteId);
      if (!ownerNote) {
        sendJson(res, 404, { error: 'Post-it introuvable' });
        return;
      }

      ownerNote.likedBy = Array.isArray(ownerNote.likedBy) ? ownerNote.likedBy : [];
      if (ownerNote.likedBy.includes(player.room + ':' + body.playerId)) {
        sendJson(res, 200, { ok: true, plusOne: ownerNote.plusOne || 0, alreadyLiked: true });
        return;
      }

      ownerNote.likedBy.push(player.room + ':' + body.playerId);
      ownerNote.plusOne = (ownerNote.plusOne || 0) + 1;

      sendJson(res, 200, { ok: true, plusOne: ownerNote.plusOne });
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

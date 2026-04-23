const game = document.getElementById('game');
const rolesContainer = document.getElementById('roles');
const roleDescription = document.getElementById('roleDescription');
const zoneName = document.getElementById('zoneName');
const zoneIdea = document.getElementById('zoneIdea');
const roomInfo = document.getElementById('roomInfo');

const playerNameInput = document.getElementById('playerName');
const roomCodeInput = document.getElementById('roomCode');
const joinBtn = document.getElementById('joinBtn');

let map = [];
let roles = {};
let zoneIdeas = {};
let players = [];
let me = null;
let room = null;
let selectedRole = null;
let events = null;

async function api(path, payload) {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Erreur réseau' }));
    throw new Error(error.error || 'Erreur API');
  }

  return response.json();
}

function drawMap() {
  game.innerHTML = '';
  map.flat().forEach((tileType) => {
    const tile = document.createElement('div');
    tile.className = `tile ${tileType}`;
    game.appendChild(tile);
  });
}

function drawRoles() {
  rolesContainer.innerHTML = '';
  Object.entries(roles).forEach(([id, role]) => {
    const btn = document.createElement('button');
    btn.className = `role-btn ${selectedRole === id ? 'selected' : ''}`;
    btn.innerHTML = `<strong>${role.name}</strong><small>${role.power}</small>`;

    btn.addEventListener('click', async () => {
      if (!me) return;
      await api('/api/select-role', {
        playerId: me,
        role: id,
        name: playerNameInput.value
      });
      selectedRole = id;
      roleDescription.textContent = role.power;
      drawRoles();
    });

    rolesContainer.appendChild(btn);
  });
}

function drawPlayers() {
  document.querySelectorAll('.player').forEach((node) => node.remove());

  players.forEach((p) => {
    const index = p.y * map[0].length + p.x;
    const tile = game.children[index];
    if (!tile) return;

    const avatar = document.createElement('div');
    avatar.className = 'player';
    avatar.style.background = p.color;
    avatar.dataset.name = p.name;

    tile.appendChild(avatar);

    if (p.id === me) {
      const currentZone = map[p.y][p.x];
      zoneName.textContent = zoneIdeas[currentZone].title;
      zoneIdea.textContent = zoneIdeas[currentZone].text;
    }
  });
}

function syncState(nextPlayers) {
  players = nextPlayers;
  const myState = players.find((p) => p.id === me);
  selectedRole = myState?.role || null;

  if (selectedRole) {
    roleDescription.textContent = roles[selectedRole].power;
  }

  drawRoles();
  drawPlayers();
}

function connectEvents() {
  if (events) events.close();
  events = new EventSource(`/api/events?playerId=${encodeURIComponent(me)}`);

  events.addEventListener('state', (event) => {
    const data = JSON.parse(event.data);
    syncState(data.players);
  });
}

joinBtn.addEventListener('click', async () => {
  try {
    const data = await api('/api/join', {
      name: playerNameInput.value,
      room: roomCodeInput.value
    });

    me = data.playerId;
    room = data.room;
    map = data.map;
    roles = data.roles;
    zoneIdeas = data.zoneIdeas;
    syncState(data.players);
    drawMap();
    drawRoles();
    drawPlayers();
    connectEvents();

    roomInfo.textContent = `Connecté à la salle: ${room}`;
  } catch (error) {
    roomInfo.textContent = `Erreur: ${error.message}`;
  }
});

window.addEventListener('keydown', async (event) => {
  if (!selectedRole || !me) return;

  const moves = {
    ArrowUp: [0, -1],
    ArrowDown: [0, 1],
    ArrowLeft: [-1, 0],
    ArrowRight: [1, 0]
  };

  if (!(event.key in moves)) return;
  event.preventDefault();

  const [dx, dy] = moves[event.key];
  try {
    await api('/api/move', { playerId: me, dx, dy });
  } catch {
    // ignore mouvement rejeté
  }
});

window.addEventListener('beforeunload', () => {
  if (!me) return;
  navigator.sendBeacon('/api/leave', JSON.stringify({ playerId: me }));
});

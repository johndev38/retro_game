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

const normalizeRole = (role) => (role || 'none').normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const svgDataUri = (svg) => `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

const tileSpriteByType = {
  plains: svgDataUri(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' fill='#69b34c'/><rect y='24' width='32' height='8' fill='#5aa040'/><circle cx='7' cy='8' r='2' fill='#88c866'/><circle cx='18' cy='12' r='1.8' fill='#82c45f'/><circle cx='25' cy='7' r='1.6' fill='#92d06f'/></svg>`),
  volcano: svgDataUri(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' fill='#5f2b2b'/><path d='M0 26h32v6H0z' fill='#2c1a1a'/><path d='M3 24l6-8 5 7 4-10 6 9 5-6 3 8z' fill='#8a3d2f'/><path d='M13 5h6l-1 5h-4z' fill='#ff8f3f'/></svg>`),
  forest: svgDataUri(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' fill='#2f7a55'/><rect y='24' width='32' height='8' fill='#256445'/><circle cx='8' cy='11' r='5' fill='#3f9a6e'/><rect x='7' y='14' width='2' height='8' fill='#5b3a2e'/><circle cx='22' cy='12' r='6' fill='#49a979'/><rect x='21' y='16' width='2' height='7' fill='#5b3a2e'/></svg>`),
  lake: svgDataUri(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' fill='#2f79bf'/><path d='M0 10c4 2 8 2 12 0s8-2 12 0 8 2 8 0v4c-4 2-8 2-12 0s-8-2-12 0-8 2-8 0z' fill='#65b8ff' opacity='.5'/><path d='M0 20c4 2 8 2 12 0s8-2 12 0 8 2 8 0v4c-4 2-8 2-12 0s-8-2-12 0-8 2-8 0z' fill='#8ad1ff' opacity='.35'/></svg>`)
};

const charSpriteByRole = {
  mage: svgDataUri(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><rect width='24' height='24' fill='none'/><rect x='9' y='3' width='6' height='3' fill='#5c3fd4'/><path d='M6 9h12l-2 10H8z' fill='#7d5fff'/><rect x='10' y='10' width='4' height='4' fill='#ffe1c4'/><rect x='7' y='19' width='4' height='3' fill='#3b2a89'/><rect x='13' y='19' width='4' height='3' fill='#3b2a89'/></svg>`),
  nain: svgDataUri(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><rect width='24' height='24' fill='none'/><rect x='8' y='4' width='8' height='4' fill='#a35b27'/><rect x='9' y='9' width='6' height='4' fill='#ffd7b0'/><rect x='6' y='13' width='12' height='7' fill='#c97833'/><rect x='8' y='20' width='3' height='3' fill='#6a3a16'/><rect x='13' y='20' width='3' height='3' fill='#6a3a16'/></svg>`),
  rodeur: svgDataUri(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><rect width='24' height='24' fill='none'/><path d='M4 9l8-6 8 6-2 11H6z' fill='#3aaa72'/><rect x='9' y='10' width='6' height='4' fill='#f7d6b6'/><rect x='8' y='19' width='3' height='3' fill='#236e49'/><rect x='13' y='19' width='3' height='3' fill='#236e49'/></svg>`),
  barde: svgDataUri(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><rect width='24' height='24' fill='none'/><rect x='7' y='3' width='10' height='4' fill='#d24f9f'/><rect x='9' y='8' width='6' height='4' fill='#ffd8b7'/><rect x='6' y='12' width='12' height='8' fill='#e56eb0'/><rect x='8' y='20' width='3' height='3' fill='#8f2b61'/><rect x='13' y='20' width='3' height='3' fill='#8f2b61'/></svg>`)
};

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

    const img = document.createElement('img');
    img.className = 'tile-sprite';
    img.alt = tileType;
    img.src = tileSpriteByType[tileType] || tileSpriteByType.plains;
    tile.appendChild(img);

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
  if (!map.length || !map[0]?.length) return;
  document.querySelectorAll('.player').forEach((node) => node.remove());

  players.forEach((p) => {
    const index = p.y * map[0].length + p.x;
    const tile = game.children[index];
    if (!tile) return;

    const avatar = document.createElement('div');
    avatar.className = 'player';
    avatar.dataset.name = p.name;

    const roleId = normalizeRole(p.role);
    const sprite = document.createElement('img');
    sprite.className = 'player-sprite';
    sprite.alt = p.role || 'unknown';
    sprite.src = charSpriteByRole[roleId] || charSpriteByRole.mage;
    avatar.appendChild(sprite);

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
    drawMap();
    syncState(data.players);
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

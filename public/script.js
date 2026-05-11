const game = document.getElementById('game');
const roleSelect = document.getElementById('roleSelect');
const roleDescription = document.getElementById('roleDescription');
const rolePreview = document.getElementById('rolePreview');
const zoneName = document.getElementById('zoneName');
const zoneIdea = document.getElementById('zoneIdea');
const roomInfo = document.getElementById('roomInfo');

const playerNameInput = document.getElementById('playerName');
const roomCodeInput = document.getElementById('roomCode');
const joinBtn = document.getElementById('joinBtn');
const chatInput = document.getElementById('chatInput');
const chatBtn = document.getElementById('chatBtn');
const notesBoard = document.getElementById('notesBoard');
const itemsList = document.getElementById('itemsList');
const itemsSummary = document.getElementById('itemsSummary');

let map = [];
let roles = {};
let itemsCatalog = {};
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
  mage: svgDataUri(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><defs><linearGradient id='m1' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#9b7dff'/><stop offset='1' stop-color='#5f43d6'/></linearGradient></defs><rect width='32' height='32' fill='none'/><path d='M9 6h14l-2 3H11z' fill='#2e216c'/><path d='M6 14h20l-3 14H9z' fill='url(#m1)'/><rect x='12' y='11' width='8' height='7' rx='2' fill='#ffdcbc'/><circle cx='15' cy='14' r='1' fill='#2d1f5a'/><circle cx='17' cy='14' r='1' fill='#2d1f5a'/><path d='M12 22h8l-1 6h-6z' fill='#2e216c'/></svg>`),
  nain: svgDataUri(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><defs><linearGradient id='n1' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#e7a15d'/><stop offset='1' stop-color='#b7672d'/></linearGradient></defs><rect width='32' height='32' fill='none'/><rect x='10' y='5' width='12' height='5' rx='1' fill='#7a421a'/><rect x='11' y='11' width='10' height='7' rx='2' fill='#ffd8b1'/><path d='M8 16h16v11H8z' fill='url(#n1)'/><path d='M9 18h14v3H9z' fill='#8d4e23'/><rect x='10' y='27' width='4' height='4' fill='#5f3315'/><rect x='18' y='27' width='4' height='4' fill='#5f3315'/></svg>`),
  rodeur: svgDataUri(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><defs><linearGradient id='r1' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#61c78d'/><stop offset='1' stop-color='#2f8a5b'/></linearGradient></defs><rect width='32' height='32' fill='none'/><path d='M5 13L16 4l11 9-2 15H7z' fill='url(#r1)'/><rect x='12' y='11' width='8' height='6' rx='2' fill='#f4d6b5'/><circle cx='14' cy='14' r='1' fill='#214f3a'/><circle cx='18' cy='14' r='1' fill='#214f3a'/><path d='M12 24h8v6h-8z' fill='#1f5f40'/></svg>`),
  barde: svgDataUri(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><defs><linearGradient id='b1' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#f58ac6'/><stop offset='1' stop-color='#c6488f'/></linearGradient></defs><rect width='32' height='32' fill='none'/><rect x='9' y='5' width='14' height='5' rx='1' fill='#a33370'/><rect x='12' y='11' width='8' height='6' rx='2' fill='#ffd8b7'/><path d='M8 16h16v12H8z' fill='url(#b1)'/><path d='M10 19h12v2H10z' fill='#8b285d'/><rect x='11' y='28' width='4' height='3' fill='#6b1f45'/><rect x='17' y='28' width='4' height='3' fill='#6b1f45'/></svg>`),
  qa: svgDataUri(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><defs><linearGradient id='q1' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#73bce6'/><stop offset='1' stop-color='#3d88bc'/></linearGradient></defs><rect width='32' height='32' fill='none'/><path d='M8 7h16l-1 4H9z' fill='#2d5f86'/><rect x='12' y='11' width='8' height='6' rx='2' fill='#ffdcbf'/><path d='M8 16h16v12H8z' fill='url(#q1)'/><rect x='13' y='19' width='6' height='5' fill='#eaf7ff'/><path d='M14 21l1 1 2-2' stroke='#2d5f86' stroke-width='1.5' fill='none'/></svg>`),
  scrum_master: svgDataUri(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><defs><linearGradient id='s1' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#ffe18a'/><stop offset='1' stop-color='#d8b65a'/></linearGradient></defs><rect width='32' height='32' fill='none'/><circle cx='16' cy='7' r='3' fill='#e3bd59'/><rect x='11' y='10' width='10' height='7' rx='2' fill='#ffdcbc'/><path d='M8 16h16v12H8z' fill='url(#s1)'/><path d='M10 20h12v2H10z' fill='#9a7a2d'/><path d='M14 24h4v6h-4z' fill='#836723'/></svg>`),
  devops: svgDataUri(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><defs><linearGradient id='d1' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#9fcf88'/><stop offset='1' stop-color='#5a8f47'/></linearGradient></defs><rect width='32' height='32' fill='none'/><rect x='9' y='5' width='14' height='4' fill='#456f38'/><rect x='12' y='10' width='8' height='6' rx='2' fill='#ffdaba'/><path d='M8 16h16v12H8z' fill='url(#d1)'/><rect x='11' y='19' width='10' height='5' rx='1' fill='#334d2b'/><circle cx='13' cy='21.5' r='1' fill='#9fcf88'/><circle cx='19' cy='21.5' r='1' fill='#9fcf88'/></svg>`),
  ux: svgDataUri(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><defs><linearGradient id='u1' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#ffb18f'/><stop offset='1' stop-color='#db7b52'/></linearGradient></defs><rect width='32' height='32' fill='none'/><path d='M8 8h16l-2 3H10z' fill='#a85635'/><rect x='12' y='11' width='8' height='6' rx='2' fill='#ffd8b9'/><path d='M8 16h16v12H8z' fill='url(#u1)'/><path d='M10 20c2-2 4-2 6 0 2-2 4-2 6 0' stroke='#8a4328' stroke-width='1.5' fill='none'/><rect x='14' y='25' width='4' height='5' fill='#7a3b24'/></svg>`),
  mouche: svgDataUri(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><defs><linearGradient id='mo1' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#c7cedf'/><stop offset='1' stop-color='#7c8599'/></linearGradient></defs><ellipse cx='16' cy='18' rx='8' ry='10' fill='url(#mo1)'/><circle cx='16' cy='9' r='4' fill='#8b94a8'/><ellipse cx='11' cy='16' rx='4' ry='7' fill='#e8f4ff' opacity='.7'/><ellipse cx='21' cy='16' rx='4' ry='7' fill='#e8f4ff' opacity='.7'/><circle cx='14.5' cy='9' r='1' fill='#111'/><circle cx='17.5' cy='9' r='1' fill='#111'/><path d='M14 11h4' stroke='#111' stroke-width='1'/></svg>`)
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
  roleSelect.innerHTML = '<option value="">Sélectionne un rôle...</option>';
  Object.entries(roles).forEach(([id, role]) => {
    const option = document.createElement('option');
    option.value = id;
    option.textContent = role.name;
    if (selectedRole === id) option.selected = true;
    roleSelect.appendChild(option);
  });

  previewRoleDescription(selectedRole || roleSelect.value);
  drawRolePreview();
}


function drawRolePreview() {
  rolePreview.innerHTML = '';

  Object.entries(roles).forEach(([id, role]) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'role-card';
    if (selectedRole === id) card.classList.add('selected');

    const sprite = document.createElement('img');
    sprite.alt = role.name;
    sprite.src = charSpriteByRole[normalizeRole(id)] || charSpriteByRole.mage;

    const name = document.createElement('span');
    name.className = 'role-card-name';
    name.textContent = role.name;

    const preview = () => previewRoleDescription(id);
    const resetPreview = () => previewRoleDescription(selectedRole || roleSelect.value);
    card.addEventListener('mouseenter', preview);
    card.addEventListener('focus', preview);
    card.addEventListener('mouseleave', resetPreview);
    card.addEventListener('blur', resetPreview);
    card.addEventListener('click', () => {
      roleSelect.value = id;
      roleSelect.dispatchEvent(new Event('change'));
    });

    card.appendChild(sprite);
    card.appendChild(name);
    rolePreview.appendChild(card);
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



function renderItems() {
  itemsList.innerHTML = '';

  const myState = players.find((p) => p.id === me);
  const selectedItems = new Set(myState?.items || []);

  Object.entries(itemsCatalog).forEach(([id, item]) => {
    const label = document.createElement('label');
    label.className = 'item-card';

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = selectedItems.has(id);
    input.addEventListener('change', async () => {
      const next = new Set(selectedItems);
      if (input.checked) next.add(id);
      else next.delete(id);

      if (next.size > 3) {
        input.checked = false;
        roomInfo.textContent = 'Tu peux choisir 3 objets maximum.';
        return;
      }

      try {
        await api('/api/select-items', { playerId: me, items: [...next] });
      } catch (error) {
        roomInfo.textContent = `Erreur objets: ${error.message}`;
      }
    });

    const text = document.createElement('div');
    text.innerHTML = `<strong>${item.icon} ${item.name}</strong><small>${item.power}</small>`;

    label.appendChild(input);
    label.appendChild(text);
    itemsList.appendChild(label);
  });

  const selectedPowers = [...selectedItems].map((id) => itemsCatalog[id]?.name).filter(Boolean);
  itemsSummary.textContent = selectedPowers.length
    ? `Objets actifs: ${selectedPowers.join(', ')}`
    : 'Aucun objet sélectionné.';
}

function renderNotes() {
  const allNotes = players.flatMap((p) => {
    const notes = Array.isArray(p.notes) ? p.notes : [];
    return notes.map((note) => ({ ...note, author: p.name, playerId: p.id }));
  }).sort((a, b) => b.at - a.at);

  notesBoard.innerHTML = '';
  allNotes.forEach((note) => {
    const item = document.createElement('article');
    item.className = 'postit';

    const author = document.createElement('strong');
    author.className = 'postit-author';
    author.textContent = note.author;

    const text = document.createElement('p');
    text.className = 'postit-text';
    text.textContent = note.text;

    const plus = document.createElement('button');
    plus.className = 'plus-one';
    plus.textContent = `+1 (${note.plusOne || 0})`;
    plus.addEventListener('click', async () => {
      try {
        await api('/api/note-plusone', { playerId: me, noteId: note.id });
      } catch (error) {
        roomInfo.textContent = `Erreur +1: ${error.message}`;
      }
    });

    item.appendChild(author);
    item.appendChild(text);
    item.appendChild(plus);
    notesBoard.appendChild(item);
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
  renderItems();
  renderNotes();
}

function connectEvents() {
  if (events) events.close();
  events = new EventSource(`/api/events?playerId=${encodeURIComponent(me)}`);

  events.addEventListener('state', (event) => {
    const data = JSON.parse(event.data);
    syncState(data.players);
  });
}


async function sendChat() {
  if (!me) return;
  const text = chatInput.value.trim();
  if (!text) return;

  try {
    await api('/api/chat', { playerId: me, text });
    chatInput.value = '';
  } catch (error) {
    roomInfo.textContent = `Erreur chat: ${error.message}`;
  }
}


function previewRoleDescription(roleId) {
  if (!roleId || !roles[roleId]) {
    roleDescription.textContent = 'Choisis un rôle pour découvrir son pouvoir.';
    return;
  }

  roleDescription.textContent = roles[roleId].power;
}

roleSelect.addEventListener('input', () => {
  previewRoleDescription(roleSelect.value);
});

roleSelect.addEventListener('change', async () => {
  const role = roleSelect.value;
  previewRoleDescription(role);
  if (!me || !role) return;

  try {
    await api('/api/select-role', {
      playerId: me,
      role,
      name: playerNameInput.value
    });
    selectedRole = role;
  } catch (error) {
    roomInfo.textContent = `Erreur rôle: ${error.message}`;
  }
});

chatBtn.addEventListener('click', sendChat);
chatInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    sendChat();
  }
});

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
    itemsCatalog = data.items || {};
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

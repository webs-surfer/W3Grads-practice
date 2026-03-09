const TYPE_COLORS = {
  normal:   '#A8A878',
  fire:     '#F08030',
  water:    '#6890F0',
  electric: '#F8D030',
  grass:    '#78C850',
  ice:      '#98D8D8',
  fighting: '#C03028',
  poison:   '#A040A0',
  ground:   '#E0C068',
  flying:   '#A890F0',
  psychic:  '#F85888',
  bug:      '#A8B820',
  rock:     '#B8A038',
  ghost:    '#705898',
  dragon:   '#7038F8',
  dark:     '#705848',
  steel:    '#B8B8D0',
  fairy:    '#EE99AC'
};

const STAT_COLORS = {
  hp:               '#FF5959',
  attack:           '#F5AC78',
  defense:          '#FAE078',
  'special-attack': '#9DB7F5',
  'special-defense':'#A7DB8D',
  speed:            '#FA92B2'
};

const STAT_LABELS = {
  hp:               'HP',
  attack:           'Attack',
  defense:          'Defense',
  'special-attack': 'Sp. Atk',
  'special-defense':'Sp. Def',
  speed:            'Speed'
};

const TYPES = Object.keys(TYPE_COLORS);
const BASE_URL = 'https://pokeapi.co/api/v2';


let allPokemon = [];
let currentFilter = 'all';
let activeSearchResults = [];
let isSearchMode = false;

const loader        = document.getElementById('loader');
const modalOverlay  = document.getElementById('modalOverlay');
const modalClose    = document.getElementById('modalClose');
const searchInput   = document.getElementById('searchInput');
const searchBtn     = document.getElementById('searchBtn');
const randomBtn     = document.getElementById('randomBtn');
const typeFilters   = document.getElementById('typeFilters');
const pokemonGrid   = document.getElementById('pokemonGrid');
const statusEl      = document.getElementById('status');

function showLoader(show) {
  loader.classList.toggle('active', show);
}

function buildTypeFilters() {
  // "All" chip
  const allChip = document.createElement('div');
  allChip.className = 'type-chip all-chip active';
  allChip.textContent = 'All';
  allChip.dataset.type = 'all';
  allChip.addEventListener('click', () => setTypeFilter('all'));
  typeFilters.appendChild(allChip);

 TYPES.forEach(type => {
    const chip = document.createElement('div');
    chip.className = 'type-chip';
    chip.textContent = type.charAt(0).toUpperCase() + type.slice(1);
    chip.dataset.type = type;
    chip.style.background = TYPE_COLORS[type];
    chip.addEventListener('click', () => setTypeFilter(type));
    typeFilters.appendChild(chip);
  });
}

function setTypeFilter(type) {
  currentFilter = type;

  document.querySelectorAll('.type-chip').forEach(chip => {
    chip.classList.toggle('active', chip.dataset.type === type);
  });

  const source = isSearchMode ? activeSearchResults : allPokemon;
  renderCards(filterByType(source));
}

function filterByType(list) {
  if (currentFilter === 'all') return list;
  return list.filter(p => p.types && p.types.includes(currentFilter));
}
function parsePokemon(p) {
  return {
    id:        p.id,
    name:      p.name,
    image:     p.sprites.other['official-artwork'].front_default || p.sprites.front_default,
    types:     p.types.map(t => t.type.name),
    abilities: p.abilities.map(a => ({ name: a.ability.name, hidden: a.is_hidden })),
    stats:     p.stats.map(s => ({ name: s.stat.name, value: s.base_stat }))
  };
}

async function loadPokemonList() {
  showLoader(true);
  try {
    const res  = await fetch(`${BASE_URL}/pokemon?limit=151`);
    const data = await res.json();

    const details = await Promise.all(
      data.results.map(p => fetch(p.url).then(r => r.json()))
    );

    allPokemon = details.map(parsePokemon);
    renderCards(filterByType(allPokemon));
    isSearchMode = false;
  } catch (err) {
    showStatus('<span class="big">⚠️</span>Failed to load Pokémon. Check your internet connection.');
    console.error(err);
  }
  showLoader(false);
}

async function handleSearch() {
  const query = searchInput.value.trim().toLowerCase();

  if (!query) {
    isSearchMode = false;
    renderCards(filterByType(allPokemon));
    return;
  }

  const local = allPokemon.filter(p =>
    p.name.includes(query) || String(p.id) === query
  );

  if (local.length > 0) {
    isSearchMode = true;
    activeSearchResults = local;
    renderCards(filterByType(local));
    return;
  }

  showLoader(true);
  try {
    const res = await fetch(`${BASE_URL}/pokemon/${query}`);
    if (!res.ok) throw new Error('Not found');
    const data = await res.json();
    const poke = parsePokemon(data);

    isSearchMode = true;
    activeSearchResults = [poke];
    renderCards([poke]);
  } catch {
    showStatus(`<span class="big">🔍</span>No Pokémon found for "<strong>${query}</strong>"`);
  }
  showLoader(false);
}


async function loadRandom() {
  const id = Math.floor(Math.random() * 898) + 1;
  showLoader(true);
  try {
    const res  = await fetch(`${BASE_URL}/pokemon/${id}`);
    const data = await res.json();
    openModal(parsePokemon(data));
  } catch {
    showStatus('<span class="big">⚠️</span>Could not load a random Pokémon.');
  }
  showLoader(false);
}

function renderCards(list) {
  pokemonGrid.innerHTML = '';

  if (list.length === 0) {
    showStatus('<span class="big">😕</span>No Pokémon match this filter.');
    return;
  }

  statusEl.style.display = 'none';

  list.forEach((p, i) => {
    const mainType = p.types[0];
    const color    = TYPE_COLORS[mainType] || '#888';

    const card = document.createElement('div');
    card.className = 'pokemon-card';
    card.style.animationDelay  = `${Math.min(i * 0.04, 1)}s`;
    card.style.borderColor     = color + '33';
    card.style.background      = `linear-gradient(135deg, ${color}18 0%, var(--card) 50%)`;

    card.innerHTML = `
      <div class="card-number">#${String(p.id).padStart(3, '0')}</div>
      <div class="card-img-wrap">
        <img class="card-img" src="${p.image}" alt="${p.name}" loading="lazy">
      </div>
      <div class="card-name">${p.name}</div>
      <div class="card-types">
        ${p.types.map(t =>
          `<span class="type-badge" style="background:${TYPE_COLORS[t] || '#888'}">${t}</span>`
        ).join('')}
      </div>
    `;

    card.addEventListener('click', () => openModal(p));
    pokemonGrid.appendChild(card);
  });
}
function showStatus(html) {
  pokemonGrid.innerHTML = '';
  statusEl.style.display = 'block';
  statusEl.innerHTML = html;
}

function openModal(p) {
  const mainType = p.types[0];
  const color    = TYPE_COLORS[mainType] || '#888';

  document.getElementById('modalBgCircle').style.background = color;
  document.getElementById('modalNumber').textContent = `#${String(p.id).padStart(3, '0')}`;
  document.getElementById('modalImg').src = p.image;
  document.getElementById('modalImg').alt = p.name;
  document.getElementById('modalName').textContent = p.name;

  document.getElementById('modalTypes').innerHTML = p.types.map(t =>
    `<span class="type-badge" style="background:${TYPE_COLORS[t] || '#888'};font-size:12px;padding:5px 14px">${t}</span>`
  ).join('');

  document.getElementById('modalStats').innerHTML = p.stats.map(s => {
    const pct   = Math.min((s.value / 255) * 100, 100);
    const color = STAT_COLORS[s.name] || '#aaa';
    const label = STAT_LABELS[s.name] || s.name;
    return `
      <div class="stat-row">
        <span class="stat-name">${label}</span>
        <span class="stat-value" style="color:${color}">${s.value}</span>
        <div class="stat-bar-bg">
          <div class="stat-bar" style="background:${color}" data-target="${pct}"></div>
        </div>
      </div>
    `;
  }).join('');

  document.getElementById('modalAbilities').innerHTML = p.abilities.map(a =>
    `<span class="ability-tag ${a.hidden ? 'hidden-ability' : ''}">${a.name.replace('-', ' ')}${a.hidden ? ' ★' : ''}</span>`
  ).join('');

  modalOverlay.classList.add('open');
  document.body.style.overflow = 'hidden';

  requestAnimationFrame(() => {
    setTimeout(() => {
      document.querySelectorAll('.stat-bar').forEach(bar => {
        bar.style.width = bar.dataset.target + '%';
      });
    }, 100);
  });
}

function closeModal() {
  modalOverlay.classList.remove('open');
  document.body.style.overflow = '';
}
searchBtn.addEventListener('click', handleSearch);
randomBtn.addEventListener('click', loadRandom);
modalClose.addEventListener('click', closeModal);

searchInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') handleSearch();
});

modalOverlay.addEventListener('click', e => {
  if (e.target === modalOverlay) closeModal();
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});
buildTypeFilters();
loadPokemonList();
let games = [],
  currentPage = 1,
  currentCategory = '',
  currentGameId = null;
const gamesPerPage = 50;
function getCustomGames() {
  const e = localStorage.getItem('customGames');
  return e ? JSON.parse(e) : [];
}
function saveCustomGames(e) {
  localStorage.setItem('customGames', JSON.stringify(e));
}
function getFavorites() {
  const e = localStorage.getItem('favoriteGames');
  return e ? JSON.parse(e) : [];
}
function saveFavorites(e) {
  localStorage.setItem('favoriteGames', JSON.stringify(e));
}
function generateGameId(e) {
  return `${e.label}-${e.url}`.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
}
async function loadGames() {
  try {
    const e = await fetch('/storage/data/collection.json'),
      t = await e.json();
    games = t.games.map((e) => ({ ...e, id: generateGameId(e), isCustom: !1 }));
    const a = getCustomGames();
    games = [...a, ...games];
    const n = getHiddenGames();
    ((games = games.filter((e) => !n.includes(e.id))), displayGames(games.slice(0, 50)), updateLoadMoreButton());
  } catch (e) {
    console.error('Error loading games:', e);
    const t = getCustomGames(),
      a = getHiddenGames();
    ((games = t.filter((e) => !a.includes(e.id))), displayGames(games.slice(0, 50)), updateLoadMoreButton());
  }
}
function displayGames(e, t = !1) {
  const a = document.getElementById('imageContainer');
  t || (a.innerHTML = '');
  const n = document.createDocumentFragment(),
    o = getFavorites();
  (e.forEach((e) => {
    const t = document.createElement('div');
    ((t.className = 'image-item'),
      t.setAttribute('data-label', e.label),
      t.setAttribute('data-id', e.id),
      e.categories.length > 0 && t.setAttribute('data-category', e.categories[0]));
    (o.includes(e.id) && t.classList.add('favorited'),
      (t.innerHTML = `\n      <a href="${e.url}" class="game-link" data-url="${e.url}">\n        <img src="${e.imageUrl}" alt="${e.label}" loading="lazy" decoding="async">\n        <div class="label">${e.label}</div>\n      </a>\n      <div class="game-options" onclick="openGameOptions('${e.id}', event)">\n        <i class="fas fa-ellipsis-v"></i>\n      </div>\n      <div class="favorite-badge">\n        <i class="fas fa-star"></i> Favorite\n      </div>\n    `),
      n.appendChild(t));
  }),
    a.appendChild(n));
}
function updateLoadMoreButton() {
  let e = document.getElementById('loadMoreBtn');
  e ||
    ((e = document.createElement('button')),
    (e.id = 'loadMoreBtn'),
    (e.textContent = 'Load More'),
    e.addEventListener('click', () => {
      const t = 50 * currentPage,
        a = t + 50,
        n = getFilteredGames();
      (displayGames(n.slice(t, a), !0), currentPage++, a >= n.length && (e.style.display = 'none'));
    }),
    document.getElementById('imageContainer').after(e));
  const t = getFilteredGames();
  e.style.display = 50 * currentPage < t.length ? 'block' : 'none';
}
function debounce(e, t) {
  let a;
  return function (...n) {
    (clearTimeout(a),
      (a = setTimeout(() => {
        (clearTimeout(a), e(...n));
      }, t)));
  };
}
function getFilteredGames() {
  const e = document.getElementById('search-games').value.toLowerCase(),
    t = getFavorites();
  let a = games;
  return (
    e && (a = a.filter((t) => t.label.toLowerCase().includes(e))),
    currentCategory && (a = a.filter((e) => e.categories.some((e) => e.toLowerCase().includes(currentCategory.toLowerCase())))),
    a.sort((e, a) => {
      const n = t.includes(e.id),
        o = t.includes(a.id);
      return n && !o ? -1 : !n && o ? 1 : 0;
    }),
    a
  );
}
function filterItems() {
  ((currentPage = 1), displayGames(getFilteredGames().slice(0, 50)), updateLoadMoreButton());
}
function randomGameOpen() {
  if (games.length > 0) {
    const e = Math.floor(Math.random() * games.length);
    window.location.href = games[e].url;
  }
}
function setActiveCategory(e) {
  ((currentCategory = e),
    document.querySelectorAll('.category-btn').forEach((e) => {
      e.classList.remove('active');
    }));
  const t = document.querySelector(`[data-category="${e}"]`);
  (t && t.classList.add('active'), filterItems());
}
function openAddGamePopup() {
  document.getElementById('addGamePopup').classList.add('active');
}
function closeAddGamePopup() {
  (document.getElementById('addGamePopup').classList.remove('active'), document.getElementById('addGameForm').reset());
}
function addCustomGame(e) {
  e.preventDefault();
  const t = document.getElementById('gameTitle').value;
  let a = document.getElementById('gameUrl').value;
  const n = document.getElementById('gameImage').files[0],
    o = document.getElementById('gameCategory').value;
  if (!n) return void alert('Please select an image');
  a.startsWith('http://') || a.startsWith('https://') || (a = 'https://' + a);
  const s = new FileReader();
  ((s.onload = function (e) {
    const n = e.target.result,
      s = `/iframe.html?url=/embed.html#${a}`,
      i = { label: t, url: s, imageUrl: n, categories: [o], isCustom: !0, id: generateGameId({ label: t, url: s }) },
      r = getCustomGames();
    (r.unshift(i), saveCustomGames(r), games.unshift(i), closeAddGamePopup(), filterItems());
  }),
    s.readAsDataURL(n));
}
function openGameOptions(e, t) {
  (t.preventDefault(), t.stopPropagation(), (currentGameId = e));
  games.find((t) => t.id === e);
  const a = getFavorites().includes(e);
  ((document.getElementById('favoriteText').textContent = a ? 'Unfavorite' : 'Favorite'),
    (document.querySelector('#gameOptionsPopup .option-btn i').className = a ? 'fas fa-star' : 'far fa-star'),
    document.getElementById('gameOptionsPopup').classList.add('active'));
}
function closeGameOptionsPopup() {
  (document.getElementById('gameOptionsPopup').classList.remove('active'), (currentGameId = null));
}
function toggleFavorite() {
  if (!currentGameId) return;
  const e = getFavorites(),
    t = e.indexOf(currentGameId);
  (t > -1 ? e.splice(t, 1) : e.push(currentGameId), saveFavorites(e), closeGameOptionsPopup(), filterItems());
}
function removeGame() {
  if (!currentGameId) return;
  const e = games.find((e) => e.id === currentGameId);
  if (!e) return;
  if (e.isCustom) {
    saveCustomGames(getCustomGames().filter((e) => e.id !== currentGameId));
  }
  const t = getHiddenGames();
  (t.push(currentGameId), saveHiddenGames(t), (games = games.filter((e) => e.id !== currentGameId)));
  const a = getFavorites(),
    n = a.indexOf(currentGameId);
  (n > -1 && (a.splice(n, 1), saveFavorites(a)), closeGameOptionsPopup(), filterItems());
}
function getHiddenGames() {
  const e = localStorage.getItem('hiddenGames');
  return e ? JSON.parse(e) : [];
}
function saveHiddenGames(e) {
  localStorage.setItem('hiddenGames', JSON.stringify(e));
}
function shareGame() {
  if (!currentGameId) return;
  const e = games.find((e) => e.id === currentGameId);
  if (!e) return;
  let t = e.url;
  (t.startsWith('http://') || t.startsWith('https://') || (t = window.location.origin + t),
    (document.getElementById('shareLink').value = t),
    closeGameOptionsPopup(),
    document.getElementById('sharePopup').classList.add('active'));
}
function closeSharePopup() {
  document.getElementById('sharePopup').classList.remove('active');
}
function copyShareLink() {
  const e = document.getElementById('shareLink');
  (e.select(),
    e.setSelectionRange(0, 99999),
    navigator.clipboard
      .writeText(e.value)
      .then(() => {
        const e = document.querySelector('.copy-btn'),
          t = e.innerHTML;
        ((e.innerHTML = '<i class="fas fa-check"></i> Copied!'),
          setTimeout(() => {
            e.innerHTML = t;
          }, 2e3));
      })
      .catch((e) => {
        alert('Failed to copy link');
      }));
}
(document.getElementById('imageContainer').addEventListener('click', (e) => {
  if (e.target.closest('.game-options')) return;
  const t = e.target.closest('.image-item');
  if (t) {
    const a = t.querySelector('.game-link');
    a && (e.preventDefault(), (window.location.href = a.getAttribute('data-url')));
  }
}),
  window.addEventListener(
    'scroll',
    debounce(() => {
      const e = document.getElementById('loadMoreBtn');
      if (e && 'none' !== e.style.display && null !== e.offsetParent) {
        const t = Math.max(
          document.body.scrollHeight,
          document.documentElement.scrollHeight,
          document.body.offsetHeight,
          document.documentElement.offsetHeight,
          document.body.clientHeight,
          document.documentElement.clientHeight
        );
        window.scrollY + window.innerHeight >= t - 200 && e.click();
      }
    }, 100)
  ),
  document.addEventListener('DOMContentLoaded', () => {
    (loadGames(),
      document.getElementById('search-games').addEventListener('input', debounce(filterItems, 300)),
      document.querySelectorAll('.category-btn').forEach((e) => {
        e.addEventListener('click', () => {
          setActiveCategory(e.getAttribute('data-category'));
        });
      }),
      document.getElementById('addGamePopup').addEventListener('click', (e) => {
        'addGamePopup' === e.target.id && closeAddGamePopup();
      }),
      document.getElementById('gameOptionsPopup').addEventListener('click', (e) => {
        'gameOptionsPopup' === e.target.id && closeGameOptionsPopup();
      }),
      document.getElementById('sharePopup').addEventListener('click', (e) => {
        'sharePopup' === e.target.id && closeSharePopup();
      }),
      document.getElementById('gameImage').addEventListener('change', (e) => {
        const t = e.target.files[0];
        if (t) {
          const e = new FileReader();
          ((e.onload = function (e) {
            const t = document.getElementById('imagePreview');
            ((t.innerHTML = `<img src="${e.target.result}" alt="Preview">`), t.classList.add('active'));
          }),
            e.readAsDataURL(t));
        }
      }));
  }));

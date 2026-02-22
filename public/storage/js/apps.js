let apps = [],
  currentAppId = null;
function getCustomApps() {
  const e = localStorage.getItem('customApps');
  return e ? JSON.parse(e) : [];
}
function saveCustomApps(e) {
  localStorage.setItem('customApps', JSON.stringify(e));
}
function getFavorites() {
  const e = localStorage.getItem('favoriteApps');
  return e ? JSON.parse(e) : [];
}
function saveFavorites(e) {
  localStorage.setItem('favoriteApps', JSON.stringify(e));
}
function generateAppId(e) {
  return `${e.label}-${e.url}`.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
}
function getHiddenApps() {
  const e = localStorage.getItem('hiddenApps');
  return e ? JSON.parse(e) : [];
}
function saveHiddenApps(e) {
  localStorage.setItem('hiddenApps', JSON.stringify(e));
}
function loadApps() {
  const e = document.getElementById('imageContainer').querySelectorAll('.image-item');
  apps = Array.from(e).map((e) => {
    const t = e.getElementsByClassName('label')[0],
      n = t ? t.textContent.trim() : '',
      p = e.querySelector('a'),
      s = e.querySelector('img'),
      a = p ? p.getAttribute('href') : '';
    return { label: n, url: a, imageUrl: s ? s.getAttribute('src') : '', isCustom: !1, id: generateAppId({ label: n, url: a }) };
  });
  const t = getCustomApps();
  apps = [...t, ...apps];
  const n = getHiddenApps();
  ((apps = apps.filter((e) => !n.includes(e.id))), displayApps(apps));
}
function displayApps(e) {
  const t = document.getElementById('imageContainer');
  t.innerHTML = '';
  const n = document.createDocumentFragment(),
    p = getFavorites();
  (e.sort((e, t) => {
    const n = p.includes(e.id),
      s = p.includes(t.id);
    return n && !s ? -1 : !n && s ? 1 : 0;
  }),
    e.forEach((e) => {
      const t = document.createElement('div');
      ((t.className = 'image-item'),
        t.setAttribute('data-label', e.label),
        t.setAttribute('data-id', e.id),
        p.includes(e.id) && t.classList.add('favorited'),
        (t.innerHTML = `\n      <a href="${e.url}" class="app-link" data-url="${e.url}">\n        <img src="${e.imageUrl}" alt="${e.label}" loading="lazy" decoding="async">\n        <div class="label">${e.label}</div>\n      </a>\n      <div class="app-options" onclick="openAppOptions('${e.id}', event)">\n        <i class="fas fa-ellipsis-v"></i>\n      </div>\n      <div class="favorite-badge">\n        <i class="fas fa-star"></i> Favorite\n      </div>\n    `),
        n.appendChild(t));
    }),
    t.appendChild(n));
}
function filterItems() {
  const e = document.getElementById('search-games').value.toLowerCase();
  let t = apps;
  (e && (t = t.filter((t) => t.label.toLowerCase().includes(e))), displayApps(t));
}
function openAddAppPopup() {
  document.getElementById('addAppPopup').classList.add('active');
}
function closeAddAppPopup() {
  (document.getElementById('addAppPopup').classList.remove('active'), document.getElementById('addAppForm').reset());
  const e = document.getElementById('imagePreview');
  ((e.innerHTML = ''), e.classList.remove('active'));
}
function addCustomApp(e) {
  e.preventDefault();
  const t = document.getElementById('appTitle').value;
  let n = document.getElementById('appUrl').value;
  const p = document.getElementById('appImage').files[0];
  if (!p) return alert('Please select an image');
  n.startsWith('http://') || n.startsWith('https://') || (n = 'https://' + n);
  const s = new FileReader();
  ((s.onload = function (e) {
    const p = e.target.result,
      s = `/iframe.html?url=/embed.html#${n}`,
      a = { label: t, url: s, imageUrl: p, isCustom: !0, id: generateAppId({ label: t, url: s }) },
      i = getCustomApps();
    (i.unshift(a), saveCustomApps(i), apps.unshift(a), closeAddAppPopup(), filterItems());
  }),
    s.readAsDataURL(p));
}
function openAppOptions(e, t) {
  (t.preventDefault(), t.stopPropagation(), (currentAppId = e));
  apps.find((t) => t.id === e);
  const n = getFavorites().includes(e);
  ((document.getElementById('favoriteText').textContent = n ? 'Unfavorite' : 'Favorite'),
    (document.querySelector('#appOptionsPopup .option-btn i').className = n ? 'fas fa-star' : 'far fa-star'),
    document.getElementById('appOptionsPopup').classList.add('active'));
}
function closeAppOptionsPopup() {
  (document.getElementById('appOptionsPopup').classList.remove('active'), (currentAppId = null));
}
function toggleFavorite() {
  if (!currentAppId) return;
  const e = getFavorites(),
    t = e.indexOf(currentAppId);
  (t > -1 ? e.splice(t, 1) : e.push(currentAppId), saveFavorites(e), closeAppOptionsPopup(), filterItems());
}
function removeApp() {
  if (!currentAppId) return;
  const e = apps.find((e) => e.id === currentAppId);
  if (!e) return;
  e.isCustom && saveCustomApps(getCustomApps().filter((e) => e.id !== currentAppId));
  const t = getHiddenApps();
  (t.push(currentAppId), saveHiddenApps(t), (apps = apps.filter((e) => e.id !== currentAppId)));
  const n = getFavorites(),
    p = n.indexOf(currentAppId);
  (p > -1 && (n.splice(p, 1), saveFavorites(n)), closeAppOptionsPopup(), filterItems());
}
function shareApp() {
  if (!currentAppId) return;
  const e = apps.find((e) => e.id === currentAppId);
  if (!e) return;
  let t = e.url;
  (t.startsWith('http://') || t.startsWith('https://') || (t = window.location.origin + t),
    (document.getElementById('shareLink').value = t),
    closeAppOptionsPopup(),
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
      .catch(() => alert('Failed to copy link')));
}
(document.getElementById('imageContainer').addEventListener('click', (e) => {
  if (e.target.closest('.app-options')) return;
  const t = e.target.closest('.image-item');
  if (t) {
    const n = t.querySelector('.app-link');
    n && (e.preventDefault(), (window.location.href = n.getAttribute('data-url')));
  }
}),
  document.addEventListener('DOMContentLoaded', () => {
    (loadApps(),
      document.getElementById('search-games').addEventListener('input', filterItems),
      document.getElementById('addAppPopup').addEventListener('click', (e) => {
        'addAppPopup' === e.target.id && closeAddAppPopup();
      }),
      document.getElementById('appOptionsPopup').addEventListener('click', (e) => {
        'appOptionsPopup' === e.target.id && closeAppOptionsPopup();
      }),
      document.getElementById('sharePopup').addEventListener('click', (e) => {
        'sharePopup' === e.target.id && closeSharePopup();
      }),
      document.getElementById('appImage').addEventListener('change', (e) => {
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

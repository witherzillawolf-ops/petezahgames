const { ScramjetController: ScramjetController } = $scramjetLoadController(),
  scramjet = new ScramjetController({
    prefix: '/scramjet/',
    files: { wasm: '/scram/scramjet.wasm.wasm', all: '/scram/scramjet.all.js', sync: '/scram/scramjet.sync.js' }
  });
(scramjet.init(), navigator.serviceWorker.register('./sw.js'));
const connection = new BareMux.BareMuxConnection('/baremux/worker.js'),
  regionConfig = {
    default: { wisp: '/wisp/', config: 'config.js' },
    1: { wisp: '/api/alt-wisp-1/', config: '/static/alt-config-1.js' },
    2: { wisp: '/api/alt-wisp-2/', config: '/static/alt-config-2.js' },
    3: { wisp: '/api/alt-wisp-3/', config: '/static/alt-config-3.js' }
  },
  savedRegion = localStorage.getItem('selectedVpnRegion') || 'default',
  currentConfig = regionConfig[savedRegion],
  store = {
    url: 'https://',
    wispurl: _CONFIG?.wispurl || ('https:' === location.protocol ? 'wss' : 'ws') + '://' + location.host + currentConfig.wisp,
    bareurl: _CONFIG?.bareurl || ('https:' === location.protocol ? 'https' : 'http') + '://' + location.host + '/bare/',
    proxy: '',
    transport: '/epoxy/index.mjs',
    theme: 'dark',
    homepage: 'petezah://newtab',
    history: JSON.parse(localStorage.getItem('browserHistory') || '[]'),
    zoomLevel: 1,
    favorites: JSON.parse(localStorage.getItem('browserFavorites') || '[]')
  };
async function waitForTransport() {
  let e = 0;
  for (; e < 10; )
    try {
      return void (await connection.setTransport('/epoxy/index.mjs', [{ wisp: store.wispurl }]));
    } catch (t) {
      try {
        return void (await connection.setTransport('/baremux/index.mjs', [store.bareurl]));
      } catch (t) {
        try {
          return void (await connection.setTransport('/libcurl/index.mjs', [{ wisp: store.wispurl }]));
        } catch (t) {
          if ((e++, e >= 10)) throw (console.error('Failed to set any transport after', 10, 'attempts'), new Error('No bare clients available'));
          await new Promise((e) => setTimeout(e, 100));
        }
      }
    }
}
let debounceTimer;
function debounce(e, t = 300) {
  return (...n) => {
    (clearTimeout(debounceTimer),
      (debounceTimer = setTimeout(() => {
        e.apply(this, n);
      }, t)));
  };
}
(waitForTransport(),
  window.addEventListener('storage', (e) => {
    if ('selectedVpnRegion' === e.key && e.newValue) {
      const t = regionConfig[e.newValue];
      t &&
        ((store.wispurl = ('https:' === location.protocol ? 'wss' : 'ws') + '://' + location.host + t.wisp),
        connection.setTransport('/epoxy/index.mjs', [{ wisp: store.wispurl }]));
    }
  }));
let tabs = [],
  activeTabId = 1,
  nextTabId = 2,
  sortableInstance = null;
function getFaviconUrl(e) {
  try {
    const t = new URL(e).origin;
    return `https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${encodeURIComponent(t)}`;
  } catch {
    return `https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${encodeURIComponent(e)}`;
  }
}
function setupFrameInterception(e) {
  if (!e || !e.frame) return;
  const t = e.frame;
  try {
    const e = t.contentWindow,
      n = t.contentDocument;
    if (!n || !e) return;
    if (
      (n.addEventListener('mousedown', function () {
        const e = document.getElementById('menu-dropdown');
        e && e.classList.remove('show');
        const t = document.getElementById('suggestion-list');
        t && (t.style.display = 'none');
        const n = document.getElementById('tab-context-menu');
        n && n.remove();
        const o = document.getElementById('secure-popup');
        o && o.remove();
      }),
      e.__interceptionSetup)
    )
      return;
    e.__interceptionSetup = !0;
    const o = e.open;
    ((e.open = function (t, n, s) {
      if (t)
        try {
          var a = new URL(t, e.location.href).href;
          return (window.postMessage({ action: 'openInNewTab', url: a }, '*'), null);
        } catch (e) {}
      return o.call(e, t, n, s);
    }),
      n.addEventListener(
        'click',
        function (e) {
          var t = e.target.closest('a');
          if (t && t.href) {
            var n = t.target;
            if ('_blank' === n || '_top' === n || '_parent' === n)
              return (
                e.preventDefault(),
                e.stopPropagation(),
                e.stopImmediatePropagation(),
                window.postMessage({ action: 'openInNewTab', url: t.href }, '*'),
                !1
              );
          }
        },
        !0
      ),
      n.addEventListener(
        'auxclick',
        function (e) {
          if (1 === e.button) {
            var t = e.target.closest('a');
            if (t && t.href) return (e.preventDefault(), e.stopPropagation(), window.postMessage({ action: 'openInNewTab', url: t.href }, '*'), !1);
          }
        },
        !0
      ),
      n.addEventListener(
        'submit',
        function (t) {
          var n = t.target;
          !n ||
            ('_top' !== n.target && '_parent' !== n.target && '_blank' !== n.target) ||
            (t.preventDefault(), window.postMessage({ action: 'openInNewTab', url: n.action || e.location.href }, '*'));
        },
        !0
      ),
      new MutationObserver(function (e) {
        n.querySelectorAll('iframe').forEach(function (e) {
          try {
            setupFrameInterception({ frame: e });
          } catch (e) {}
        });
      }).observe(n.body || n.documentElement, { childList: !0, subtree: !0 }));
  } catch (e) {}
}
function createTab(e = store.homepage) {
  const t = scramjet.createFrame(),
    n = { id: nextTabId++, title: 'New Tab', url: e, frame: t, favicon: getFaviconUrl(e), zoomLevel: store.zoomLevel, muted: !1, pinned: !1 };
  return (
    (t.frame.style.opacity = '0'),
    (t.frame.style.transition = 'opacity 0.27s ease'),
    (t.frame.src = 'petezah://newtab' === e ? '/newpage.html' : e),
    (t.frame.onload = function () {
      t.frame.style.opacity = '1';
      try {
        const e = t.frame.contentDocument;
        e && (e.title.includes('Just a moment') || e.title.includes('Checking your browser')) && (t.frame.src = '/static/google-embed.html#' + n.url);
      } catch (e) {}
      setupFrameInterception(t);
    }),
    (t.frame.style.transform = `scale(${n.zoomLevel})`),
    (t.frame.style.transformOrigin = '0 0'),
    (t.frame.style.width = 100 / n.zoomLevel + '%'),
    (t.frame.style.height = 100 / n.zoomLevel + '%'),
    t.addEventListener('urlchange', (e) => {
      if (e.url) {
        ((n.url = e.url), (n.favicon = getFaviconUrl(e.url)));
        try {
          const o = t.frame.contentWindow?.document?.title || new URL(e.url).hostname;
          n.title = o || '...';
        } catch (t) {
          n.title = new URL(e.url).hostname || '...';
        }
        ('petezah://newtab' !== e.url &&
          (store.history.push({ url: e.url, title: n.title, timestamp: new Date() }),
          localStorage.setItem('browserHistory', JSON.stringify(store.history))),
          updateTabsUI(),
          updateAddressBar(),
          setTimeout(() => setupFrameInterception(t), 500));
      }
    }),
    tabs.push(n),
    n
  );
}
function getActiveTab() {
  return tabs.find((e) => e.id === activeTabId);
}
function switchTab(e) {
  (tabs.forEach((e) => {
    e.frame && e.frame.frame && e.frame.frame.classList.add('hidden');
  }),
    (activeTabId = e));
  const t = getActiveTab();
  (t && t.frame && t.frame.frame && t.frame.frame.classList.remove('hidden'), updateTabsUI(), updateAddressBar());
}
function closeTab(e) {
  const t = tabs.findIndex((t) => t.id === e);
  if (-1 === t) return;
  const n = tabs[t];
  if (
    (n.frame && n.frame.frame && n.frame.frame.parentNode && n.frame.frame.parentNode.removeChild(n.frame.frame),
    n.frame && 'function' == typeof n.frame.destroy)
  )
    try {
      n.frame.destroy();
    } catch (e) {
      console.error('Error destroying frame:', e);
    }
  if ((tabs.splice(t, 1), 0 === tabs.length)) {
    const e = createTab(),
      t = document.getElementById('iframe-container');
    (t && t.appendChild(e.frame.frame), (activeTabId = e.id));
  } else if (activeTabId === e) {
    const e = Math.min(t, tabs.length - 1);
    ((activeTabId = tabs[e]?.id), activeTabId && switchTab(activeTabId));
  }
  updateTabsUI();
}
function muteTab(e) {
  const t = tabs.find((t) => t.id === e);
  t && t.frame && t.frame.frame && ((t.muted = !t.muted), (t.frame.frame.muted = t.muted), updateTabsUI());
}
function pinTab(e) {
  const t = tabs.find((t) => t.id === e);
  t && ((t.pinned = !t.pinned), tabs.sort((e, t) => (t.pinned ? 1 : e.pinned ? -1 : 0)), updateTabsUI());
}
function updateTabsUI() {
  const e = document.getElementById('tabs-container');
  if (!e) return;
  ((e.innerHTML = ''),
    tabs.forEach((t, n) => {
      if (!t || !t.frame) return;
      const o = document.createElement('div');
      ((o.className = `tab ${t.id === activeTabId ? 'active' : ''} ${t.pinned ? 'pinned' : ''}`),
        o.setAttribute('data-tab-id', t.id),
        (o.onclick = () => switchTab(t.id)),
        (o.style.animationDelay = 0.1 * n + 's'));
      const s = document.createElement('img');
      ((s.className = 'tab-favicon'),
        (s.src = t.favicon),
        (s.alt = ''),
        (s.onerror = () => {
          s.style.display = 'none';
        }));
      const a = document.createElement('span');
      ((a.className = 'tab-title'), (a.textContent = t.title));
      const i = document.createElement('button');
      ((i.className = 'tab-close'),
        (i.innerHTML = '<i class="fas fa-times"></i>'),
        (i.onclick = (e) => {
          (e.stopPropagation(), closeTab(t.id));
        }));
      const r = document.createElement('span');
      if (((r.className = 'tab-status-icons'), t.muted)) {
        const e = document.createElement('i');
        ((e.className = 'fas fa-volume-mute'), r.appendChild(e));
      }
      if (t.pinned) {
        const e = document.createElement('i');
        ((e.className = 'fas fa-thumbtack'), r.appendChild(e));
      }
      const c = document.createElement('div');
      ((c.className = 'tab-info-box'),
        (c.innerHTML = `\n      <img src="${t.favicon}" class="info-favicon" alt="">\n      <div>\n        <div class="info-title">${t.title}</div>\n        <div class="info-url">${t.url}</div>\n      </div>\n    `),
        o.appendChild(s),
        o.appendChild(a),
        o.appendChild(r),
        o.appendChild(i),
        o.appendChild(c),
        e.appendChild(o));
    }));
  const t = document.createElement('button');
  ((t.className = 'new-tab'),
    (t.textContent = '+'),
    (t.onclick = () => {
      const e = createTab(),
        t = document.getElementById('iframe-container');
      (t && t.appendChild(e.frame.frame), switchTab(e.id));
    }),
    e.appendChild(t),
    sortableInstance && sortableInstance.destroy(),
    (sortableInstance = new Sortable(e, {
      animation: 300,
      direction: 'horizontal',
      ghostClass: 'sortable-ghost',
      dragClass: 'sortable-drag',
      filter: '.new-tab',
      onStart: () => {
        e.querySelectorAll('.tab:not(.sortable-ghost)').forEach((e) => {
          e.style.opacity = '0.5';
        });
      },
      onEnd: (t) => {
        if (
          (e.querySelectorAll('.tab').forEach((e) => {
            e.style.opacity = '1';
          }),
          t.oldIndex !== t.newIndex)
        ) {
          const e = tabs.splice(t.oldIndex, 1)[0];
          tabs.splice(t.newIndex, 0, e);
        }
      }
    })),
    e.querySelectorAll('.tab').forEach((e) => {
      e.addEventListener('contextmenu', (t) => {
        (t.preventDefault(), showTabContextMenu(t, parseInt(e.getAttribute('data-tab-id'))));
      });
    }));
}
function showTabContextMenu(e, t) {
  const n = document.getElementById('tab-context-menu');
  n && n.remove();
  const o = document.createElement('div');
  ((o.id = 'tab-context-menu'), (o.className = 'tab-context-menu'));
  const s = tabs.find((e) => e.id === t);
  ([
    {
      label: 'New Tab',
      icon: 'fa-plus',
      action: () => {
        const e = createTab(),
          t = document.getElementById('iframe-container');
        (t && t.appendChild(e.frame.frame), switchTab(e.id));
      }
    },
    { label: 'Close Tab', icon: 'fa-times', action: () => closeTab(t) },
    { label: s.muted ? 'Unmute Tab' : 'Mute Tab', icon: s.muted ? 'fa-volume-up' : 'fa-volume-mute', action: () => muteTab(t) },
    { label: s.pinned ? 'Unpin Tab' : 'Pin Tab', icon: 'fa-thumbtack', action: () => pinTab(t) }
  ].forEach(({ label: e, icon: t, action: n }) => {
    const s = document.createElement('div');
    ((s.className = 'context-menu-item'),
      (s.innerHTML = `<i class="fas ${t}"></i><span>${e}</span>`),
      (s.onclick = (e) => {
        (e.stopPropagation(), n(), o.remove());
      }),
      o.appendChild(s));
  }),
    (o.style.top = `${e.clientY}px`),
    (o.style.left = `${e.clientX}px`),
    document.body.appendChild(o));
  const a = (e) => {
    o.contains(e.target) || (o.remove(), document.removeEventListener('click', a));
  };
  document.addEventListener('click', a);
}
function updateAddressBar() {
  const e = document.getElementById('address-bar'),
    t = document.getElementById('favorite-button'),
    n = getActiveTab();
  if (e && n) {
    e.value = n.url;
    const o = n.url;
    (o.startsWith('petezah://newtab') && (n.frame.frame.src = '/newpage.html'),
      (o.startsWith('https://www.youtube.com') || o.startsWith('youtube.com') || 'www.youtube.com' === o) &&
        (n.frame.frame.src = '/static/google-embed.html#' + o),
      (o.startsWith('https://vortexos.net') ||
        o.startsWith('vortexos.net') ||
        'https://vtx.chat' === o ||
        o.startsWith('vtx.chat') ||
        o.startsWith('https://vtx.chat.cdn.cloudflare.net') ||
        'vtx.chat.cdn.cloudflare.net' === o) &&
        (n.frame.frame.src = 'https://vtx.chat'),
      (o.startsWith('https://www.google.com') ||
        o.startsWith('www.google.com') ||
        'www.google.com' === o ||
        o.startsWith('https://www.google.ca') ||
        o.startsWith('www.google.ca') ||
        'www.google.ca' === o) &&
        (n.frame.frame.src = '/static/google-embed.html'));
    const s = store.favorites.includes(o);
    t.innerHTML = `<i class="fas fa-star ${s ? 'favorited' : ''}"></i>`;
  }
}
function toggleFavorite() {
  const e = getActiveTab();
  if (!e) return;
  const t = e.url,
    n = store.favorites.indexOf(t);
  (-1 === n ? store.favorites.push(t) : store.favorites.splice(n, 1),
    localStorage.setItem('browserFavorites', JSON.stringify(store.favorites)),
    updateAddressBar());
}
function handleSubmit() {
  const e = getActiveTab(),
    t = document.getElementById('address-bar');
  if (!e || !t) return;
  let n = t.value.trim();
  return (
    n.startsWith('http') || n.includes('.')
      ? n.startsWith('http') || n.startsWith('petezah://') || (n = 'https://' + n)
      : (n = 'https://duckduckgo.com/?q=' + encodeURIComponent(n)),
    n.startsWith('https://www.youtube.com') || 'www.youtube.com' === n
      ? ((e.frame.frame.src = '/static/youtube-embed.html#https://youtube.com'),
        (e.url = n),
        (e.favicon = getFaviconUrl(n)),
        updateTabsUI(),
        void updateAddressBar())
      : ((e.url = n), (e.favicon = getFaviconUrl(n)), e.frame.go(n))
  );
}
function showConfig() {
  document.getElementById('config-modal').showModal();
}
function closeConfig() {
  const e = document.getElementById('config-modal');
  ((e.style.opacity = 0),
    setTimeout(() => {
      (e.close(), (e.style.opacity = 1));
    }, 250));
}
function toggleMenu() {
  document.getElementById('menu-dropdown').classList.toggle('show');
}
function closeAllTabs() {
  (tabs.forEach((e) => {
    (e.frame && e.frame.frame && e.frame.frame.parentNode && e.frame.frame.parentNode.removeChild(e.frame.frame),
      e.frame && 'function' == typeof e.frame.destroy && e.frame.destroy());
  }),
    (tabs = []));
  const e = createTab(),
    t = document.getElementById('iframe-container');
  (t && t.appendChild(e.frame.frame), switchTab(e.id), toggleMenu());
}
function zoomIn() {
  const e = getActiveTab();
  (e &&
    ((e.zoomLevel = Math.min(e.zoomLevel + 0.1, 2)),
    (e.frame.frame.style.transform = `scale(${e.zoomLevel})`),
    (e.frame.frame.style.width = 100 / e.zoomLevel + '%'),
    (e.frame.frame.style.height = 100 / e.zoomLevel + '%'),
    (document.getElementById('zoom-level').textContent = `${Math.round(100 * e.zoomLevel)}%`)),
    toggleMenu());
}
function zoomOut() {
  const e = getActiveTab();
  (e &&
    ((e.zoomLevel = Math.max(e.zoomLevel - 0.1, 0.5)),
    (e.frame.frame.style.transform = `scale(${e.zoomLevel})`),
    (e.frame.frame.style.width = 100 / e.zoomLevel + '%'),
    (e.frame.frame.style.height = 100 / e.zoomLevel + '%'),
    (document.getElementById('zoom-level').textContent = `${Math.round(100 * e.zoomLevel)}%`)),
    toggleMenu());
}
function toggleFullScreen() {
  const e = document.getElementById('iframe-container');
  (document.fullscreenElement ? document.exitFullscreen() : e.requestFullscreen(), toggleMenu());
}
function showHistory() {
  const e = document.getElementById('history-modal');
  ((document.getElementById('history-list').innerHTML = store.history
    .slice()
    .reverse()
    .map(
      (e, t) =>
        `<div class="history-item" onclick="createTab('${e.url}'); document.getElementById('iframe-container').appendChild(tabs[tabs.length-1].frame.frame); switchTab(tabs[tabs.length-1].id); document.getElementById('history-modal').close();">\n          <span>${e.title}</span><br>\n          <small>${e.url} - ${new Date(e.timestamp).toLocaleString()}</small>\n        </div>`
    )
    .join('')),
    e.showModal(),
    toggleMenu());
}
function fixProxy() {
  navigator.serviceWorker.getRegistrations().then((e) => {
    const t = e.map((e) =>
      e.unregister().then((e) => {
        console.log(`Service Worker unregistered: ${e}`);
      })
    );
    Promise.all(t).then(() => {
      const e = '$scramjet',
        t = indexedDB.deleteDatabase(e);
      ((t.onsuccess = () => {
        console.log(`Deleted IndexedDB: ${e}`);
      }),
        (t.onerror = () => {
          console.error(`Failed to delete IndexedDB: ${e}`);
        }),
        (t.onblocked = () => {
          console.warn(`Delete blocked for IndexedDB: ${e}`);
        }),
        localStorage.setItem('bare-mux-path', '/baremux/worker.js'));
    });
  });
}
function showSecurePopup() {
  const e = document.getElementById('secure-popup');
  e && e.remove();
  const t = document.createElement('div');
  ((t.id = 'secure-popup'),
    (t.className = 'secure-popup'),
    (t.innerHTML =
      '\n    <div class="secure-message">Website is secure and proxy forwarding is active over WISP</div>\n    <div class="secure-icon"><i class="fas fa-circle active"></i></div>\n  '),
    document.body.appendChild(t));
  const n = document.getElementById('address-bar').getBoundingClientRect();
  ((t.style.top = `${n.bottom + 5}px`), (t.style.left = `${n.left}px`));
  const o = (e) => {
    t.contains(e.target) || (t.remove(), document.removeEventListener('click', o));
  };
  document.addEventListener('click', o);
}
window.open = (function (e) {
  return function (t, n, o) {
    if (t && 'string' == typeof t && t.includes('?webfix')) return e.call(window, t, n, o);
    if (t && ('_blank' === n || '_top' === n || '_parent' === n || !n)) {
      const e = createTab(t),
        n = document.getElementById('iframe-container');
      return (n && n.appendChild(e.frame.frame), switchTab(e.id), null);
    }
    return e.call(window, t, n, o);
  };
})(window.open);
class Search {
  constructor(e, t) {
    ((this.scramjet = e),
      (this.store = t),
      (this.currentSectionIndex = 0),
      (this.maxResults = 8),
      (this.sections = {}),
      (this.selectedSuggestionIndex = -1));
  }
  init() {
    const e = document.getElementById('address-bar'),
      t = document.querySelector('.nav'),
      n = document.createElement('div');
    ((n.id = 'suggestion-list'),
      (n.className = 'suggestion-list'),
      t.appendChild(n),
      (this.sections = { searchResults: this.createSection('Search Results'), history: this.createSection('History') }),
      Object.values(this.sections).forEach(({ section: e }) => n.appendChild(e)),
      e.addEventListener('input', async (e) => {
        n.style.display = 'flex';
        const t = e.target.value.trim();
        if ('' === t && 'deleteContentBackward' === e.inputType) return (this.clearSuggestions(), void (n.style.display = 'none'));
        let o = t.replace(/^(petezah:\/\/|petezah:\/|petezah:)/, '');
        const s = await this.generateSuggestions(o);
        (this.clearSuggestions(), this.populateSections(s, t));
      }),
      e.addEventListener('keydown', (t) => {
        if ('Escape' === t.key || t.ctrlKey || t.shiftKey || t.altKey || t.metaKey) return ((n.style.display = 'none'), void this.clearSuggestions());
        const o = this.getCurrentSuggestionItems(),
          s = o.length;
        if ('ArrowDown' === t.key)
          (t.preventDefault(),
            this.selectedSuggestionIndex + 1 >= s
              ? (this.moveToNextSection(), (this.selectedSuggestionIndex = 0))
              : (this.selectedSuggestionIndex = (this.selectedSuggestionIndex + 1) % s),
            this.updateSelectedSuggestion());
        else if ('ArrowUp' === t.key)
          (t.preventDefault(),
            this.selectedSuggestionIndex <= 0
              ? this.moveToPreviousSection()
              : (this.selectedSuggestionIndex = (this.selectedSuggestionIndex - 1 + s) % s),
            this.updateSelectedSuggestion());
        else if ('Tab' === t.key || 'ArrowRight' === t.key) {
          if (-1 !== this.selectedSuggestionIndex) {
            t.preventDefault();
            const s = o[this.selectedSuggestionIndex].querySelector('.suggestion-text').textContent;
            ((e.value = s), this.clearSuggestions(), (n.style.display = 'none'));
          }
        } else if ('Enter' === t.key)
          if ((t.preventDefault(), -1 !== this.selectedSuggestionIndex)) {
            const t = o[this.selectedSuggestionIndex].querySelector('.suggestion-text').textContent;
            ((e.value = t), this.clearSuggestions(), (n.style.display = 'none'), handleSubmit());
          } else (this.clearSuggestions(), (n.style.display = 'none'), handleSubmit());
        else 'Backspace' === t.key && '' === e.value && ((n.style.display = 'none'), this.clearSuggestions());
      }),
      document.addEventListener('click', (t) => {
        e.contains(t.target) || n.contains(t.target) || ((n.style.display = 'none'), this.clearSuggestions());
      }));
  }
  createSection(e) {
    const t = document.createElement('div');
    t.className = 'search-section';
    const n = document.createElement('div');
    n.className = 'search-title';
    const o = document.createElement('img');
    ((o.src = '/storage/images/logo-png-removebg-preview.png'), (o.className = 'searchEngineIcon'));
    const s = document.createElement('span');
    ((s.textContent = e), n.appendChild(o), n.appendChild(s));
    const a = document.createElement('div');
    return ((a.className = 'search-results'), t.appendChild(n), t.appendChild(a), { section: t, searchResults: a });
  }
  async generateSuggestions(e) {
    try {
      const t = await fetch(`/results/${encodeURIComponent(e)}`);
      if (!t.ok) throw new Error('Network response was not ok');
      return (await t.json()).map((e) => e.phrase);
    } catch (e) {
      return (console.error('Error fetching suggestions:', e), []);
    }
  }
  populateSections(e, t) {
    (this.populateSearchResults(e), this.populateHistory(t));
  }
  populateSearchResults(e) {
    const { searchResults: t, section: n } = this.sections.searchResults;
    e.length > 0
      ? ((n.style.display = 'block'),
        e.slice(0, this.maxResults).forEach((e) => {
          const n = this.createSuggestionItem(e);
          t.appendChild(n);
        }))
      : (n.style.display = 'none');
  }
  populateHistory(e) {
    const { searchResults: t, section: n } = this.sections.history,
      o = e.toLowerCase(),
      s = this.store.history.filter((e) => e.url.toLowerCase().includes(o) || e.title.toLowerCase().includes(o)).slice(0, this.maxResults);
    s.length > 0
      ? ((n.style.display = 'block'),
        s.forEach((e) => {
          const n = this.createSuggestionItem(e.url, e.title);
          t.appendChild(n);
        }))
      : (n.style.display = 'none');
  }
  createSuggestionItem(e, t = e) {
    const n = document.createElement('div'),
      o = document.createElement('i');
    o.className = 'fas fa-search';
    const s = document.createElement('span');
    return (
      (s.className = 'suggestion-text'),
      (s.textContent = t),
      n.appendChild(o),
      n.appendChild(s),
      n.addEventListener('click', () => {
        ((document.getElementById('address-bar').value = e),
          this.clearSuggestions(),
          (document.getElementById('suggestion-list').style.display = 'none'),
          handleSubmit());
      }),
      n
    );
  }
  clearSuggestions() {
    (Object.values(this.sections).forEach(({ searchResults: e, section: t }) => {
      ((e.innerHTML = ''), (t.style.display = 'none'));
    }),
      (this.selectedSuggestionIndex = -1),
      (this.currentSectionIndex = 0));
  }
  getCurrentSuggestionItems() {
    return Object.values(this.sections)[this.currentSectionIndex].searchResults.querySelectorAll('div');
  }
  moveToNextSection() {
    const e = Object.values(this.sections);
    for (this.currentSectionIndex = (this.currentSectionIndex + 1) % e.length; 0 === e[this.currentSectionIndex].searchResults.children.length; )
      this.currentSectionIndex = (this.currentSectionIndex + 1) % e.length;
    ((this.selectedSuggestionIndex = -1), this.updateSelectedSuggestion());
  }
  moveToPreviousSection() {
    const e = Object.values(this.sections);
    for (
      this.currentSectionIndex = (this.currentSectionIndex - 1 + e.length) % e.length;
      0 === e[this.currentSectionIndex].searchResults.children.length;

    )
      this.currentSectionIndex = (this.currentSectionIndex - 1 + e.length) % e.length;
    const t = this.getCurrentSuggestionItems();
    ((this.selectedSuggestionIndex = t.length - 1), this.updateSelectedSuggestion());
  }
  updateSelectedSuggestion() {
    const e = this.getCurrentSuggestionItems();
    (document.querySelectorAll('.search-results div.selected').forEach((e) => {
      e.classList.remove('selected');
    }),
      e.forEach((e, t) => {
        e.classList.toggle('selected', t === this.selectedSuggestionIndex);
      }));
  }
}
window.addEventListener('load', async () => {
  document.getElementById('app').innerHTML =
    `\n    <div class="browser-container">\n      <dialog id="config-modal" class="cfg">\n        <h2>Settings</h2>\n        <div class="flex col input_row">\n          <label for="wisp_url_input">Wisp:</label>\n          <input id="wisp_url_input" value="${store.wispurl}" spellcheck="false">\n        </div>\n        <div class="flex col input_row">\n          <label for="bare_url_input">Bare:</label>\n          <input id="bare_url_input" value="${store.bareurl}" spellcheck="false">\n        </div>\n        <div class="flex col input_row">\n          <label for="homepage_input">Homepage:</label>\n          <input id="homepage_input" value="${store.homepage}" spellcheck="false">\n        </div>\n        <div class="flex buttons">\n          <button onclick="fixProxy();">Fix Proxy</button>\n        </div>\n        <div class="flex buttons centered">\n          <button onclick="closeConfig()">x</button>\n        </div>\n      </dialog>\n\n      <dialog id="history-modal" class="history-modal">\n        <h2>Browsing History</h2>\n        <div id="history-list" style="max-height: 300px; overflow-y: auto;"></div>\n        <div class="flex buttons centered">\n          <button onclick="document.getElementById('history-modal').close()">x</button>\n        </div>\n      </dialog>\n\n      <div class="flex tabs" id="tabs-container"></div>\n\n      <div class="flex nav">\n        <button onclick="showConfig()" title="Settings"><i class="fas fa-cog"></i></button>\n        <button onclick="getActiveTab()?.frame.back()" title="Back"><i class="fas fa-chevron-left"></i></button>\n        <button onclick="getActiveTab()?.frame.forward()" title="Forward"><i class="fas fa-chevron-right"></i></button>\n        <button onclick="getActiveTab()?.frame.reload()" title="Reload"><i class="fas fa-rotate-right"></i></button>\n        <div class="address-bar-container">\n          <button id="secure-icon" onclick="showSecurePopup()" title="Site Info"><i class="fas fa-lock"></i></button>\n          <input class="bar" id="address-bar" autocomplete="off" autocapitalize="off" autocorrect="off"\n            onkeyup="event.keyCode === 13 && handleSubmit()" placeholder="Enter URL or search query">\n          <button id="favorite-button" onclick="toggleFavorite()" title="Favorite"><i class="fas fa-star"></i></button>\n        </div>\n        <button onclick="window.open(scramjet.encodeUrl(getActiveTab()?.url))" title="Open in new window"><i class="fas fa-arrow-up-right-from-square"></i></button>\n        <button class="menu-btn" onclick="toggleMenu()" title="Menu"><i class="fas fa-ellipsis-v"></i></button>\n        <div class="menu-dropdown" id="menu-dropdown">\n          <button onclick="createTab(); document.getElementById('iframe-container').appendChild(tabs[tabs.length-1].frame.frame); switchTab(tabs[tabs.length-1].id); toggleMenu()">\n            <i class="fas fa-plus"></i>\n            <span>New Tab</span>\n          </button>\n          <button onclick="closeAllTabs()">\n            <i class="fas fa-times"></i>\n            <span>Close All Tabs</span>\n          </button>\n          <div class="zoom-controls">\n            <button onclick="zoomOut()"><i class="fas fa-minus"></i></button>\n            <span id="zoom-level">100%</span>\n            <button onclick="zoomIn()"><i class="fas fa-plus"></i></button>\n          </div>\n          <button onclick="showHistory()">\n            <i class="fas fa-history"></i>\n            <span>History</span>\n          </button>\n          <button onclick="toggleFullScreen()">\n            <i class="fas fa-expand"></i>\n            <span>Fullscreen</span>\n          </button>\n        </div>\n      </div>\n\n      <div class="iframe-container" id="iframe-container"></div>\n    </div>\n  `;
  const e = createTab(),
    t = document.getElementById('iframe-container');
  (t && t.appendChild(e.frame.frame),
    switchTab(e.id),
    updateTabsUI(),
    new Search(scramjet, store).init(),
    document.getElementById('wisp_url_input').addEventListener('change', (e) => {
      ((store.wispurl = e.target.value), connection.setTransport('/epoxy/index.mjs', [{ wisp: store.wispurl }]));
    }),
    document.getElementById('bare_url_input').addEventListener('change', (e) => {
      store.bareurl = e.target.value;
    }),
    document.getElementById('homepage_input').addEventListener('change', (e) => {
      store.homepage = e.target.value;
    }),
    document.addEventListener('click', (e) => {
      const t = document.getElementById('menu-dropdown'),
        n = document.querySelector('.menu-btn');
      t.contains(e.target) || n.contains(e.target) || t.classList.remove('show');
    }));
  try {
    console.log(
      '%cb',
      `\n        background-image: url(data:image/png;base64,${(function (e) {
        let t = '';
        const n = new Uint8Array(e),
          o = n.byteLength;
        for (let e = 0; e < o; e++) t += String.fromCharCode(n[e]);
        return btoa(t);
      })(
        arraybuffer
      )});\n        color: transparent;\n        padding-left: 200px;\n        padding-bottom: 100px;\n        background-size: contain;\n        background-position: center center;\n        background-repeat: no-repeat;\n      `
    );
  } catch (e) {}
  window.addEventListener('message', (e) => {
    const t = e.data;
    if (!t) return;
    let n = t.url,
      o = !1;
    if (
      (('openInNewTab' !== t.action &&
        'openInTop' !== t.action &&
        'openInParent' !== t.action &&
        'newTab' !== t.action &&
        'OPEN_IN_TOP' !== t.type &&
        'openNewTab' !== t.type &&
        'newTab' !== t.type &&
        'open' !== t.type) ||
        (o = !0),
      o && n)
    ) {
      let e = n;
      !n.startsWith('/scramjet/') && n.startsWith('http') && (e = scramjet.encodeUrl(n));
      const t = createTab(e),
        o = document.getElementById('iframe-container');
      (o && o.appendChild(t.frame.frame), switchTab(t.id));
    }
    if ('navigate' === t.action && n) {
      const e = getActiveTab();
      e &&
        (n.startsWith('/scramjet/')
          ? ((e.frame.frame.src = n), (e.url = n), updateTabsUI(), updateAddressBar())
          : n.startsWith('http')
            ? e.frame.go(n)
            : ((e.frame.frame.src = n), (e.url = n), updateTabsUI(), updateAddressBar()));
    }
  });
});

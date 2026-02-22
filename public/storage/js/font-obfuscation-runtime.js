!(function () {
  'use strict';
  let t = {},
    e = {},
    n = !1,
    o = !0,
    s = 'plusjakartasans';
  if ('undefined' != typeof window && window.FONT_OBFUSCATION_CONFIG) {
    const t = window.FONT_OBFUSCATION_CONFIG;
    ((o = !1 !== t.enabled), (s = t.defaultFont || 'plusjakartasans'));
  }
  const a = {
    excludeSelectors: [
    "script",
    "style",
    "meta",
    "title",
    "link",
    "[data-no-obfuscate]",
    ".no-obfuscate",
    "code",
    "pre",
    "[data-lucide]",
    ".lucide",
    ".lucide-icon",
    "svg[data-lucide]",
    "svg",
    "svg *",
    "path",
    "circle",
    "rect",
    "line",
    "polygon",
    "polyline",
    "i",
    ".icon",
    "[class*='icon']",
    "select",
    "option",
    "select *",
    "option *",
    "sidebar",
    ".sidebar",
    ".sidebar *",
    ".popup",
    ".popup *",
    ".widget-button",
    "ad",
    "google",
    "data-google *",
    "data-google",
    ".google-anno-sa-qtx",
    ".google-anno-sa-qtx *",
    "iframe",
    "img",
  ],
    forceObfuscateSelectors: ['.obfuscated', '.ob-p', '[data-obfuscate]', '.tab-title', '.menu-text', '.ui-text'],
    inputElements: []
  };
  async function i() {
    if (!n)
      try {
        const [o, s] = await Promise.all([
          fetch('/plusjakartasans-obf-mappings.json')
            .then((t) => t.json())
            .catch(() => ({})),
          fetch('/plusjakartasans-obf-reverse-mappings.json')
            .then((t) => t.json())
            .catch(() => ({}))
        ]);
        ((t = { plusjakartasans: o }), (e = { plusjakartasans: s }), (n = !0), x(), setTimeout(() => O(), 100));
      } catch (t) {
        console.warn('Failed to load font obfuscation mappings:', t);
      }
  }
  function r(e, o = s) {
    if (!n) return e;
    const a = t[o];
    return a
      ? e
          .split('')
          .map((t) => a[t] || t)
          .join('')
      : e;
  }
  function c(t, o = s) {
    if (!n) return t;
    const a = e[o];
    return a
      ? t
          .split('')
          .map((t) => a[t] || t)
          .join('')
      : t;
  }
  function l(t) {
    if (!t || !n) return !1;
    for (const e of a.forceObfuscateSelectors)
      try {
        if (t.matches && t.matches(e)) return !0;
      } catch (t) {}
    if (!o) return !1;
    for (const e of a.excludeSelectors)
      try {
        if (t.matches && t.matches(e)) return !1;
        if (t.closest && t.closest(e)) return !1;
      } catch (t) {}
    for (const e of a.inputElements)
      try {
        if (t.matches && t.matches(e)) return !0;
      } catch (t) {}
    return (!t.hasAttribute || !t.hasAttribute('data-lucide')) && (!t.closest || !t.closest('.no-obfuscate, [data-no-obfuscate]'));
  }
  function u(t, e) {
    if (!l(t)) return e;
    return r(e, 'plusjakartasans');
  }
  function d(t) {
    if (!t || !l(t)) return;
    if (
      a.inputElements.some((e) => {
        try {
          return t.matches && t.matches(e);
        } catch (t) {
          return !1;
        }
      })
    )
      return;
    (t.classList.contains('ob-p') || t.classList.contains('obfuscated') || t.classList.add('ob-p'),
      (t.style.fontFamily = "'plusjakartasans-obf', sans-serif"),
      (t.style.fontVariantLigatures = 'none'));
  }
  const f = Object.getOwnPropertyDescriptor(Node.prototype, 'textContent'),
    p = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'innerText'),
    m = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
  (f &&
    f.set &&
    Object.defineProperty(Node.prototype, 'textContent', {
      get: f.get,
      set: function (t) {
        if ('string' == typeof t && 1 === this.nodeType) {
          const e = u(this, t);
          (d(this), f.set.call(this, e));
        } else f.set.call(this, t);
      },
      configurable: !0,
      enumerable: !0
    }),
    p &&
      p.set &&
      Object.defineProperty(HTMLElement.prototype, 'innerText', {
        get: p.get,
        set: function (t) {
          if ('string' == typeof t) {
            const e = u(this, t);
            (d(this), p.set.call(this, e));
          } else p.set.call(this, t);
        },
        configurable: !0,
        enumerable: !0
      }),
    m &&
      m.set &&
      Object.defineProperty(Element.prototype, 'innerHTML', {
        get: m.get,
        set: function (t) {
          (m.set.call(this, t), setTimeout(() => w(this), 0));
        },
        configurable: !0,
        enumerable: !0
      }));
  const b = Document.prototype.createElement;
  Document.prototype.createElement = function (t, e) {
    const n = b.call(this, t, e);
    return (
      setTimeout(() => {
        (n.textContent || n.innerText) && w(n);
      }, 0),
      n
    );
  };
  const h = Node.prototype.appendChild;
  Node.prototype.appendChild = function (t) {
    const e = h.call(this, t);
    return (
      t && 1 === t.nodeType
        ? (w(t), setTimeout(() => w(t), 0))
        : t && 3 === t.nodeType && 'string' == typeof t.textContent && l(this) && ((t.textContent = r(t.textContent, 'plusjakartasans')), d(this)),
      e
    );
  };
  const y = Node.prototype.insertBefore;
  function g(t, e) {
    return 'placeholder' === e ? !1 !== window.FONT_OBFUSCATION_CONFIG?.obfuscatePlaceholders : l(t);
  }
  Node.prototype.insertBefore = function (t, e) {
    const n = y.call(this, t, e);
    return (
      t && 1 === t.nodeType
        ? (w(t), setTimeout(() => w(t), 0))
        : t && 3 === t.nodeType && 'string' == typeof t.textContent && l(this) && ((t.textContent = r(t.textContent, 'plusjakartasans')), d(this)),
      n
    );
  };
  const T = Element.prototype.setAttribute;
  function w(t) {
    if (t && 1 === t.nodeType) {
      if (l(t)) {
        if ((d(t), 0 === t.children.length && t.textContent && t.textContent.trim())) {
          const e = t.textContent,
            n = r(e, 'plusjakartasans');
          n !== e && (t.textContent = n);
        }
        ['title', 'placeholder', 'alt'].forEach((e) => {
          const n = t.getAttribute(e);
          if (n && n.trim() && g(t, e)) {
            const o = r(n, 'plusjakartasans');
            o !== n && T.call(t, e, o);
          }
        });
      }
      for (let e of t.children) w(e);
    }
  }
  function O() {
    if (!n) return;
    const t = document.createTreeWalker(document.body || document.documentElement, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, null, !1),
      e = [];
    let o;
    for (; (o = t.nextNode()); ) 1 === o.nodeType && e.push(o);
    (e.forEach((t) => {
      l(t) && w(t);
    }),
      document.body.classList.add('font-obfuscation-ready'),
      (function () {
        if ('undefined' == typeof MutationObserver) return;
        const t = new MutationObserver((t) => {
          t.forEach((t) => {
            if (
              (t.addedNodes.forEach((t) => {
                1 === t.nodeType && l(t) && w(t);
              }),
              'characterData' === t.type && t.target.parentElement)
            ) {
              const e = t.target.parentElement;
              l(e) && d(e);
            }
          });
        });
        t.observe(document.body || document.documentElement, { childList: !0, subtree: !0, characterData: !0 });
      })());
  }
  function x() {
    document.addEventListener('copy', (t) => {
      if (n)
        try {
          const e = window.getSelection();
          if (!e || 0 === e.rangeCount) return;
          const n = c(e.toString(), s);
          (t.preventDefault(), t.clipboardData && t.clipboardData.setData('text/plain', n));
        } catch (t) {
          console.warn('Clipboard interception failed:', t);
        }
    });
    const t = navigator.clipboard?.writeText;
    t &&
      (navigator.clipboard.writeText = async function (e) {
        if (!n) return t.call(this, e);
        const o = c(e, s);
        return t.call(this, o);
      });
  }
  async function E() {
    if ('fonts' in document)
      try {
        (await Promise.all([
          document.fonts.load('16px plusjakartasans-obf'),
          document.fonts.load('14px plusjakartasans-obf'),
          document.fonts.load('18px plusjakartasans-obf')
        ]),
          await new Promise((t) => setTimeout(t, 100)));
      } catch (t) {
        (console.warn('Font loading failed, continuing anyway:', t), await new Promise((t) => setTimeout(t, 500)));
      }
    else await new Promise((t) => setTimeout(t, 1e3));
  }
  ((Element.prototype.setAttribute = function (t, e) {
    return ('string' != typeof e || ('title' !== t && 'placeholder' !== t && 'alt' !== t) || (g(this, t) && (e = u(this, e))), T.call(this, t, e));
  }),
    (window.fontObfuscation = {
      encode: r,
      decode: c,
      processElement: w,
      processExistingDOM: O,
      isInitialized: () => n,
      setGlobalObfuscation: (t) => {
        ((o = t), t && O());
      },
      setDefaultFont: (t) => {
        s = t;
      },
      config: a,
      setupClipboardInterceptor: x
    }),
    'loading' === document.readyState
      ? document.addEventListener('DOMContentLoaded', async () => {
          (await i(), await E(), setTimeout(() => O(), 200));
        })
      : Promise.all([i(), E()]).then(() => {
          setTimeout(() => O(), 200);
        }),
    window.addEventListener('load', () => {
      setTimeout(() => {
        n && O();
      }, 300);
    }),
    i());
})();

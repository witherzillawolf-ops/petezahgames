const sidebar = document.querySelector('.sidebar'),
  sidebarToggler = document.querySelector('.sidebar-toggler'),
  menuToggler = document.querySelector('.menu-toggler'),
  mainContent = document.querySelector('.main-content'),
  navLinks = document.querySelectorAll('.sidebar-nav .nav-link'),
  mainFrame = document.getElementById('mainFrame'),
  widgetButton = document.querySelector('.widget-button'),
  widgetPopup = document.querySelector('.widget-popup'),
  widgetOptions = document.querySelectorAll('.widget-option');

function isMobile() {
  return window.innerWidth <= 1024;
}

if ((location.pathname.endsWith('index.html') && '#blank' === location.hash) || location.href.endsWith('#blank')) {
  const e = window.open(),
    t = e.document.createElement('iframe');
  t.src = location.origin + location.pathname.replace('index.html', '') + '/';
  t.style = 'border:none; width:100%; height:100vh; position:fixed; top:0; left:0;';
  t.allow = 'fullscreen';
  t.referrerpolicy = 'no-referrer';
  e.document.body.style.margin = '0';
  e.document.body.appendChild(t);
  window.location = 'about:blank';
}

function handleToggle() {
  isMobile()
    ? (sidebar.classList.toggle('mobile-hidden'), sidebar.classList.toggle('mobile-visible'))
    : (sidebar.classList.toggle('collapsed'), mainContent.classList.toggle('sidebar-expanded'));
}

let resizeTimer;

function normalizeSrc(src) {
  try {
    const url = new URL(src, window.location.origin);
    return url.pathname;
  } catch {
    return src;
  }
}

function matchesNavSrc(iframeSrc, navSrc) {
  const normalizedIframe = normalizeSrc(iframeSrc);
  const normalizedNav = normalizeSrc(navSrc);
  return normalizedIframe === normalizedNav || normalizedIframe.endsWith(normalizedNav);
}

function updateActiveNavLink(src) {
  if (!src) return;
  let matched = false;
  navLinks.forEach((link) => {
    const dataSrc = link.getAttribute('data-src');
    if (dataSrc && matchesNavSrc(src, dataSrc)) {
      link.classList.add('active');
      matched = true;
    } else {
      link.classList.remove('active');
    }
  });
  if (!matched) {
    navLinks.forEach((link) => link.classList.remove('active'));
  }
}

function fadeToSrc(src) {
  mainFrame.style.transition = 'opacity 0.27s ease';
  mainFrame.style.opacity = '0';
  mainFrame.addEventListener('transitionend', () => {
    mainFrame.src = src;
  }, { once: true });
}

isMobile() ? sidebar.classList.add('mobile-hidden') : (sidebar.classList.add('collapsed'), mainContent.classList.remove('sidebar-expanded'));

sidebarToggler.addEventListener('click', handleToggle);
menuToggler && menuToggler.addEventListener('click', handleToggle);

window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    isMobile()
      ? (sidebar.classList.remove('collapsed'),
        mainContent.classList.remove('sidebar-expanded'),
        sidebar.classList.contains('mobile-visible') || sidebar.classList.add('mobile-hidden'))
      : (sidebar.classList.remove('mobile-hidden', 'mobile-visible'),
        sidebar.classList.contains('collapsed') || sidebar.classList.add('collapsed'));
  }, 250);
});

if (mainFrame) {
  mainFrame.style.transition = 'opacity 0.27s ease';
  mainFrame.addEventListener('load', () => {
    mainFrame.style.opacity = '1';
    let src = null;
    try {
      src = mainFrame.contentWindow.location.href;
    } catch {
      src = mainFrame.getAttribute('src');
    }
    if (src) updateActiveNavLink(src);
  });
}

class TxtType {
  constructor(e, t, i) {
    this.toRotate = t;
    this.el = e;
    this.loopNum = 0;
    this.period = Number.parseInt(i, 10) || 2e3;
    this.txt = '';
    this.tick();
    this.isDeleting = false;
  }
  tick() {
    const e = this.loopNum % this.toRotate.length,
      t = this.toRotate[e];
    this.isDeleting ? (this.txt = t.substring(0, this.txt.length - 1)) : (this.txt = t.substring(0, this.txt.length + 1));
    this.el.innerHTML = '<span class="wrap">' + this.txt + '</span>';
    let i = 200 - 100 * Math.random();
    this.isDeleting && (i /= 2);
    if (!this.isDeleting && this.txt === t) {
      i = this.period;
      this.isDeleting = true;
    } else if (this.isDeleting && this.txt === '') {
      this.isDeleting = false;
      this.loopNum++;
      i = 500;
    }
    setTimeout(() => this.tick(), i);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const elements = document.getElementsByClassName('typewrite');
  for (let i = 0; i < elements.length; i++) {
    const dataType = elements[i].getAttribute('data-type'),
      period = elements[i].getAttribute('data-period');
    dataType && new TxtType(elements[i], JSON.parse(dataType), period);
  }
  const style = document.createElement('style');
  style.innerHTML = '.typewrite > .wrap { border-right: 0.06em solid #a04cff}';
  document.body.appendChild(style);
  if (navLinks.length > 0) {
    const src = mainFrame.getAttribute('src');
    src ? updateActiveNavLink(src) : navLinks[0].classList.add('active');
  }
});

navLinks.forEach((link) => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const src = link.getAttribute('data-src');
    if (src) {
      navLinks.forEach((l) => l.classList.remove('active'));
      link.classList.add('active');
      fadeToSrc(src);
    }
  });
});

widgetButton.addEventListener('click', () => {
  widgetPopup.classList.toggle('show');
});

widgetOptions.forEach((option) => {
  option.addEventListener('click', () => {
    const src = option.getAttribute('data-src');
    if (src) fadeToSrc(src);
    widgetPopup.classList.remove('show');
  });
});

document.addEventListener('click', (e) => {
  widgetButton.contains(e.target) || widgetPopup.contains(e.target) || widgetPopup.classList.remove('show');
});

window.addEventListener('message', (e) => {
  if (e.origin !== window.location.origin) return;
  if (e.data.type === 'login_success' || e.data.type === 'signup_success') fadeToSrc('pages/settings/p2.html');
  if (e.data.type === 'logout') fadeToSrc('pages/settings/p.html');
});

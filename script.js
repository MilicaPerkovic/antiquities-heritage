// === App config (set Formspree endpoint here once signed up at formspree.io) ===
const APP_CONFIG = {
  // Formspree endpoint for delivering contact-form inquiries to
  // perkan66@gmail.com. Set up at https://formspree.io.
  formspreeEndpoint: 'https://formspree.io/f/mnpqgngz',
};

// === Internationalisation (EN / SR toggle) — dictionaries live in i18n.js ===
const STORAGE_KEY = 'site-lang';

// Visitors whose browser is set to any language of the region read Serbian.
const REGIONAL_LANGS = ['sr', 'bs', 'hr', 'sh', 'cnr', 'me'];

function detectLang() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'en' || stored === 'sr') return stored;
  } catch (e) {
    // ignore (e.g., localStorage disabled)
  }
  const langs = (navigator && (navigator.languages || [navigator.language])) || [];
  const regional = langs.some((l) =>
    REGIONAL_LANGS.includes(String(l).toLowerCase().split('-')[0]),
  );
  return regional ? 'sr' : 'en';
}

// Translate one key in the active language (for strings built in JS).
function t(key, fallback) {
  const lang = document.documentElement.getAttribute('lang') === 'en' ? 'en' : 'sr';
  const value = I18N[lang] && I18N[lang][key];
  return value != null ? value : fallback;
}

function applyLang(lang) {
  const dict = I18N[lang];
  if (!dict) return;
  document.documentElement.setAttribute('lang', lang);
  document.body && document.body.setAttribute('data-lang', lang);

  // 1. text content (and aria-labels) on every element with [data-i18n]
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    const value = dict[key];
    if (value != null) el.textContent = value;
  });

  // 2. placeholders via data-i18n-placeholder
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const key = el.getAttribute('data-i18n-placeholder');
    const value = dict[key];
    if (value != null) el.setAttribute('placeholder', value);
  });

  // 3. alt text via data-i18n-alt
  document.querySelectorAll('[data-i18n-alt]').forEach((el) => {
    const key = el.getAttribute('data-i18n-alt');
    const value = dict[key];
    if (value != null) el.setAttribute('alt', value);
  });

  // 4. aria-label via data-i18n-aria
  document.querySelectorAll('[data-i18n-aria]').forEach((el) => {
    const key = el.getAttribute('data-i18n-aria');
    const value = dict[key];
    if (value != null) el.setAttribute('aria-label', value);
  });

  // 5. document title
  const titleKey = document.documentElement.getAttribute('data-i18n-title');
  if (titleKey && dict[titleKey]) {
    document.title = dict[titleKey];
  }

  // 6. meta description
  const metaDesc = document.querySelector('meta[name="description"][data-i18n]');
  if (metaDesc) {
    const key = metaDesc.getAttribute('data-i18n');
    if (dict[key]) metaDesc.setAttribute('content', dict[key]);
  }

  // 7. Update lang toggle button label, if present
  const toggle = document.querySelector('[data-lang-toggle]');
  if (toggle) {
    toggle.textContent = lang === 'en' ? 'SR' : 'EN';
    toggle.setAttribute('aria-label', `${dict['lang.toggle.label'] || 'Language'}: ${lang === 'en' ? 'Srpski' : 'English'}`);
  }

  // 8. Let widgets built in JS (carousel, galleries, lightbox) re-translate themselves
  document.dispatchEvent(new CustomEvent('langchange', { detail: { lang } }));
}

function setLang(lang) {
  try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) {}
  applyLang(lang);
}

const currentLang = detectLang();
applyLang(currentLang);

document.querySelectorAll('[data-lang-toggle]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const next = (document.documentElement.getAttribute('lang') === 'en') ? 'sr' : 'en';
    setLang(next);
  });
});

const menuToggle = document.querySelector('.menu-toggle');
const siteNav = document.querySelector('.site-nav');
const revealItems = document.querySelectorAll('.reveal');
const contactForm = document.querySelector('.contact-form');

if (menuToggle && siteNav) {
  menuToggle.addEventListener('click', () => {
    const isOpen = siteNav.classList.toggle('is-open');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
  });

  siteNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      siteNav.classList.remove('is-open');
      menuToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.16 },
  );

  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add('is-visible'));
}

if (contactForm) {
  const submitBtn = contactForm.querySelector('button[type="submit"]');
  const status = contactForm.querySelector('.form-status');

  // The status line keeps its data-i18n key, so the EN/SR toggle re-translates it.
  function setStatus(key, state) {
    if (!status) return;
    status.setAttribute('data-i18n', key);
    status.textContent = t(key, '');
    status.dataset.state = state;
    status.hidden = false;
  }

  // The browser validates the required fields and the email format before
  // this runs; the message is only confirmed once Formspree accepts it.
  contactForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const data = {
      name: contactForm.elements.name.value.trim(),
      email: contactForm.elements.email.value.trim(),
      message: contactForm.elements.message.value.trim(),
    };

    if (submitBtn) submitBtn.disabled = true;
    setStatus('contact.form.sending', 'pending');

    try {
      const response = await fetch(APP_CONFIG.formspreeEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      contactForm.reset();
      setStatus('contact.form.status', 'success');
    } catch (err) {
      console.warn('Inquiry send failed:', err);
      setStatus('contact.form.error', 'error');
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}

// === Lightbox + Carousel shared state ===
// Lightbox state lives at script top-level so the carousel (and other
// future callers) can open it without scope problems.
const galleryImages = Array.from(
  document.querySelectorAll('.archive-card img, .carousel-source img'),
);

let lightboxEl = null;
let lightboxIndex = 0;

function buildLightbox() {
  if (lightboxEl) return;
  lightboxEl = document.createElement('div');
  lightboxEl.className = 'lightbox';
  lightboxEl.setAttribute('role', 'dialog');
  lightboxEl.setAttribute('aria-modal', 'true');
  lightboxEl.setAttribute('data-i18n-aria', 'lightbox.viewer');
  lightboxEl.innerHTML = `
    <button class="lightbox-close" type="button" data-i18n-aria="lightbox.close">&times;</button>
    <button class="lightbox-nav lightbox-prev" type="button" data-i18n-aria="lightbox.prev">&lsaquo;</button>
    <figure class="lightbox-figure">
      <img src="" alt="" />
      <figcaption></figcaption>
    </figure>
    <button class="lightbox-nav lightbox-next" type="button" data-i18n-aria="lightbox.next">&rsaquo;</button>
  `;
  // Built after the first applyLang() ran, so label it now; later toggles
  // pick up the data-i18n-aria attributes automatically.
  lightboxEl.setAttribute('aria-label', t('lightbox.viewer', 'Pregled fotografija'));
  lightboxEl.querySelectorAll('[data-i18n-aria]').forEach((el) => {
    el.setAttribute('aria-label', t(el.getAttribute('data-i18n-aria'), ''));
  });
  document.body.appendChild(lightboxEl);

  lightboxEl.querySelector('.lightbox-close').addEventListener('click', closeLightbox);
  lightboxEl.querySelector('.lightbox-prev').addEventListener('click', () => lightboxStep(-1));
  lightboxEl.querySelector('.lightbox-next').addEventListener('click', () => lightboxStep(1));
  lightboxEl.addEventListener('click', (event) => {
    if (event.target === lightboxEl) closeLightbox();
  });
}

function lightboxRender() {
  if (!lightboxEl || !galleryImages.length) return;
  const img = galleryImages[lightboxIndex];
  lightboxEl.querySelector('.lightbox-figure img').src = img.getAttribute('src');
  lightboxEl.querySelector('.lightbox-figure img').alt = img.alt || '';
  const title = img.closest('figure')?.querySelector('h3');
  lightboxEl.querySelector('.lightbox-figure figcaption').textContent = title
    ? title.textContent
    : img.alt || '';
}

function openLightbox(index) {
  if (!galleryImages.length) return;
  buildLightbox();
  lightboxIndex = index;
  lightboxRender();
  lightboxEl.classList.add('is-open');
  document.body.classList.add('no-scroll');
}

function closeLightbox() {
  if (!lightboxEl) return;
  lightboxEl.classList.remove('is-open');
  document.body.classList.remove('no-scroll');
}

function lightboxStep(direction) {
  if (!galleryImages.length) return;
  lightboxIndex =
    (lightboxIndex + direction + galleryImages.length) % galleryImages.length;
  lightboxRender();
}

if (galleryImages.length) {
  galleryImages.forEach((img, index) => {
    const figure = img.closest('figure');
    figure.style.cursor = 'zoom-in';
    img.tabIndex = 0;
    img.setAttribute('role', 'button');
    img.setAttribute('data-i18n-aria', 'lightbox.enlarge');
    img.setAttribute('aria-label', t('lightbox.enlarge', 'Uvećaj fotografiju'));

    const handleOpen = (event) => {
      event.preventDefault();
      openLightbox(index);
    };

    img.addEventListener('click', handleOpen);
    img.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') handleOpen(event);
    });
  });

  document.addEventListener('keydown', (event) => {
    if (!lightboxEl || !lightboxEl.classList.contains('is-open')) return;
    if (event.key === 'Escape') closeLightbox();
    if (event.key === 'ArrowLeft') lightboxStep(-1);
    if (event.key === 'ArrowRight') lightboxStep(1);
  });
}

// === Carousel for current.html — three cards (left prev, center active, right next) ===
const carousel = document.querySelector('[data-carousel]');
const carouselDataEl = document.getElementById('carousel-data');
const carouselSourceItems = Array.from(
  document.querySelectorAll('.carousel-source li'),
);

if (carousel && carouselDataEl && carouselSourceItems.length) {
  const items = JSON.parse(carouselDataEl.textContent);
  const total = carouselSourceItems.length;

  const cards = {
    left: carousel.querySelector('[data-carousel-side="left"]'),
    center: carousel.querySelector('[data-carousel-side="center"]'),
    right: carousel.querySelector('[data-carousel-side="right"]'),
  };

  const captionCounter = carousel.querySelector('[data-carousel-counter]');
  const captionTitle = carousel.querySelector('[data-carousel-title]');
  const captionDetail = carousel.querySelector('[data-carousel-detail]');
  const captionTheme = carousel.querySelector('[data-carousel-theme]');
  // The dots list sits right after the carousel, not inside it.
  const dotsContainer = carousel.parentElement.querySelector('.carousel-dots');
  const prevBtn = carousel.querySelector('.carousel-prev');
  const nextBtn = carousel.querySelector('.carousel-next');

  const themeKeys = {
    domacinstvo: 'theme.household',
    tekstil: 'theme.textile',
    tehnika: 'theme.technology',
    memorabilije: 'theme.memorabilia',
  };

  const themeTabs = Array.from(
    document.querySelectorAll('.archive-theme-tab'),
  );

  let current = 0;

  const pad = (n) => String(n).padStart(2, '0');

  const wrapIndex = (i) => ((i % total) + total) % total;

  // "Fotografija 3 od 16" — used for alt text and dot labels.
  const photoLabel = (i) =>
    t('opening.thumb.aria', 'Fotografija {n} od {total}')
      .replace('{n}', String(i + 1))
      .replace('{total}', String(total));

  function buildCard(slot, offset) {
    const idx = wrapIndex(current + offset);
    const sourceImg = carouselSourceItems[idx].querySelector('img');
    const item = items[idx] || {};
    const alt = sourceImg.alt || photoLabel(idx);

    const img = document.createElement('img');
    img.src = sourceImg.getAttribute('src');
    img.alt = alt;
    img.loading = 'lazy';
    img.decoding = 'async';

    const caption = document.createElement('figcaption');
    const counter = document.createElement('span');
    counter.className = 'label';
    counter.textContent = `${pad(idx + 1)} / ${pad(total)}`;
    caption.appendChild(counter);
    if (item.title) {
      const heading = document.createElement('h3');
      heading.textContent = item.title;
      caption.appendChild(heading);
    }

    slot.replaceChildren(img, caption);
    slot.dataset.index = String(idx);
  }

  function updateCaption() {
    const sourceImg = carouselSourceItems[current].querySelector('img');
    const item = items[current] || {};
    if (captionCounter) captionCounter.textContent = pad(current + 1);
    if (captionTitle) captionTitle.textContent = item.title || '';
    if (captionDetail) captionDetail.textContent = sourceImg.alt || '';
    if (captionTheme) {
      const theme = item.theme;
      if (theme && themeKeys[theme]) {
        captionTheme.textContent = t(themeKeys[theme], theme);
        captionTheme.hidden = false;
      } else {
        captionTheme.hidden = true;
      }
    }
  }

  function updateDots() {
    if (!dotsContainer) return;
    dotsContainer.querySelectorAll('.carousel-dot').forEach((dot, i) => {
      dot.setAttribute('aria-current', i === current ? 'true' : 'false');
    });
  }

  function updateActiveTheme() {
    const item = items[current] || {};
    const theme = item.theme;
    themeTabs.forEach((tab) => {
      tab.setAttribute(
        'aria-current',
        tab.dataset.theme === theme ? 'true' : 'false',
      );
    });
  }

  function buildDots() {
    if (!dotsContainer) return;
    dotsContainer.innerHTML = '';
    carouselSourceItems.forEach((_item, i) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'carousel-dot';
      dot.setAttribute('aria-label', photoLabel(i));
      dot.addEventListener('click', () => {
        current = i;
        render();
      });
      dotsContainer.appendChild(dot);
    });
  }

  function render() {
    buildCard(cards.left, -1);
    buildCard(cards.center, 0);
    buildCard(cards.right, 1);
    updateCaption();
    updateDots();
    updateActiveTheme();
  }

  function go(direction) {
    current = wrapIndex(current + direction);
    render();
  }

  // Side cards: clicking advances to that side's image
  cards.left.addEventListener('click', () => go(-1));
  cards.right.addEventListener('click', () => go(1));

  // Center card: opening the lightbox at the current image
  cards.center.addEventListener('click', () => {
    const sourceImg = carouselSourceItems[current].querySelector('img');
    if (!sourceImg || !galleryImages.length) return;
    const idx = galleryImages.indexOf(sourceImg);
    if (idx >= 0) openLightbox(idx);
  });

  // Keyboard for cards: Enter / Space triggers the appropriate action
  cards.left.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      go(-1);
    }
  });
  cards.right.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      go(1);
    }
  });
  cards.center.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      cards.center.click();
    }
  });

  if (prevBtn) prevBtn.addEventListener('click', () => go(-1));
  if (nextBtn) nextBtn.addEventListener('click', () => go(1));

  // Theme tabs (archive.html): jump carousel to the first image of the theme
  themeTabs.forEach((tab) => {
    tab.addEventListener('click', (event) => {
      event.preventDefault();
      const start = parseInt(tab.dataset.themeStart, 10);
      if (Number.isInteger(start) && start >= 0 && start < total) {
        current = start;
        render();
      }
      const theme = tab.dataset.theme;
      if (theme) {
        history.replaceState(null, '', `#${theme}`);
      }
    });
  });

  // Honour deep links from index.html (e.g. archive.html#tekstil)
  const initialHash = window.location.hash ? window.location.hash.slice(1) : '';
  if (initialHash) {
    const initialTab = themeTabs.find(
      (tab) => tab.dataset.theme === initialHash,
    );
    if (initialTab) {
      const start = parseInt(initialTab.dataset.themeStart, 10);
      if (Number.isInteger(start) && start >= 0 && start < total) {
        current = start;
      }
    }
  }

  buildDots();
  render();

  // Re-label the cards and dots when the visitor switches EN/SR.
  document.addEventListener('langchange', () => {
    render();
    if (dotsContainer) {
      dotsContainer.querySelectorAll('.carousel-dot').forEach((dot, i) => {
        dot.setAttribute('aria-label', photoLabel(i));
      });
    }
  });

  // Global keyboard navigation when not in a form field or button
  document.addEventListener('keydown', (event) => {
    if (!carousel) return;
    const target = event.target;
    const tag = target && target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (lightboxEl && lightboxEl.classList.contains('is-open')) return;
    // The other galleries' lightboxes handle the arrow keys themselves
    if (document.querySelector('.opening-lightbox.is-open, .radio-lightbox.is-open')) return;

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      go(-1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      go(1);
    }
  });
}

// === Read more / read less toggle (index.html, etc.) ===
const readMoreBtns = document.querySelectorAll('.about-readmore-btn');
readMoreBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    const targetId = btn.getAttribute('aria-controls');
    const more = targetId ? document.getElementById(targetId) : null;
    if (!more) return;

    const wasHidden = more.hidden;
    more.hidden = !wasHidden;

    const showText = btn.querySelector('.readmore-text-show');
    const hideText = btn.querySelector('.readmore-text-hide');
    const icon = btn.querySelector('.readmore-icon');

    if (showText) showText.hidden = wasHidden;
    if (hideText) hideText.hidden = !wasHidden;
    if (icon) icon.style.transform = wasHidden ? 'rotate(180deg)' : '';

    btn.setAttribute('aria-expanded', String(wasHidden));
  });
});

// === Otvorenje izložbe — gallery section ===
(function () {
  var OPENING_IMAGES = [
    "IMG_5396.jpg",
    "IMG_5399.jpg",
    "IMG_5402.jpg",
    "IMG_5403.jpg",
    "IMG_5404.jpg",
    "IMG_5405.jpg",
    "IMG_5406.jpg",
    "IMG_5407.jpg",
    "IMG_5408.jpg",
    "IMG_5409.jpg",
    "IMG_5410.jpg",
    "IMG_5411.jpg",
    "IMG_5413.jpg",
    "IMG_5414.jpg",
    "IMG_5416.jpg",
    "IMG_5417.jpg",
    "IMG_5419.jpg",
    "IMG_5421.jpg",
    "IMG_5422.jpg",
    "IMG_5423.jpg",
    "IMG_5424.jpg",
    "IMG_5425.jpg",
    "IMG_5426.jpg",
    "IMG_5427.jpg",
    "IMG_5429.jpg",
    "IMG_5430.jpg",
    "IMG_5431.jpg",
    "IMG_5432.jpg",
    "IMG_5433.jpg",
    "IMG_5434.jpg",
    "IMG_5435.jpg",
    "IMG_5436.jpg",
    "IMG_5437.jpg",
    "IMG_5438.jpg",
    "IMG_5439.jpg",
    "IMG_5440.jpg",
    "IMG_5441.jpg",
    "IMG_5442.jpg",
    "IMG_5443.jpg",
    "IMG_5444.jpg",
    "IMG_5445.jpg",
    "IMG_5446.jpg",
    "IMG_5447.jpg",
    "IMG_5448.jpg",
    "IMG_5449.jpg",
    "IMG_5450.jpg",
    "IMG_5451.jpg",
    "IMG_5453.jpg",
    "IMG_5454.jpg",
    "IMG_5455.jpg",
    "IMG_5457.jpg",
    "IMG_5463.jpg",
    "IMG_5464.jpg",
    "IMG_5465.jpg",
    "IMG_5466.jpg",
    "IMG_5467.jpg",
    "IMG_5468.jpg",
    "IMG_5469.jpg",
    "IMG_5472.jpg",
    "IMG_5473.jpg",
    "IMG_5474.jpg",
    "IMG_5476.jpg",
    "IMG_5477.jpg",
    "IMG_5478.jpg",
    "IMG_5480.jpg",
    "IMG_5482.jpg",
    "IMG_5483.jpg",
  ];
  // Small 600px copies for the grid, 1600px copies for the lightbox.
  // (Full-size originals stay in otvorenje/jpg and are not loaded.)
  var THUMB_DIR = 'otvorenje/thumb/';
  var FULL_DIR = 'otvorenje/web/';
  var DEFAULT_VISIBLE = 6;
  var galleries = document.querySelectorAll('[data-opening-gallery]');
  if (!galleries.length || !OPENING_IMAGES.length) return;

  // Build a single shared lightbox DOM for the page
  var lb = document.createElement('div');
  lb.className = 'opening-lightbox';
  lb.setAttribute('role', 'dialog');
  lb.setAttribute('aria-modal', 'true');

  var closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'opening-lb opening-lb-close';
  closeBtn.innerHTML = '&times;';

  var prevBtn = document.createElement('button');
  prevBtn.type = 'button';
  prevBtn.className = 'opening-lb opening-lb-prev';
  prevBtn.innerHTML = '&lsaquo;';

  var nextBtn = document.createElement('button');
  nextBtn.type = 'button';
  nextBtn.className = 'opening-lb opening-lb-next';
  nextBtn.innerHTML = '&rsaquo;';

  var lbImg = document.createElement('img');
  lbImg.className = 'opening-lb-img';
  lbImg.alt = '';

  lb.appendChild(closeBtn);
  lb.appendChild(prevBtn);
  lb.appendChild(lbImg);
  lb.appendChild(nextBtn);
  document.body.appendChild(lb);

  var current = 0;
  function show() { lbImg.src = FULL_DIR + OPENING_IMAGES[current]; }
  function open(idx) {
    current = ((idx % OPENING_IMAGES.length) + OPENING_IMAGES.length) % OPENING_IMAGES.length;
    show();
    lb.classList.add('is-open');
    document.body.classList.add('opening-lb-active');
  }
  function close() {
    lb.classList.remove('is-open');
    document.body.classList.remove('opening-lb-active');
  }
  function step(delta) {
    current = ((current + delta) % OPENING_IMAGES.length + OPENING_IMAGES.length) % OPENING_IMAGES.length;
    show();
  }

  closeBtn.addEventListener('click', close);
  prevBtn.addEventListener('click', function () { step(-1); });
  nextBtn.addEventListener('click', function () { step(1); });
  lb.addEventListener('click', function (event) {
    if (event.target === lb) close();
  });

  // Build thumbnails in each gallery
  galleries.forEach(function (gallery) {
    var grid = gallery.querySelector('[data-opening-grid]');
    if (!grid) return;

    // Per-page visible count (defaults to DEFAULT_VISIBLE = 6).
    // Homepage can show only 3 by adding data-opening-count="3".
    var rawCount = parseInt(gallery.getAttribute('data-opening-count'), 10);
    var visibleCount = (Number.isInteger(rawCount) && rawCount > 0)
      ? rawCount
      : DEFAULT_VISIBLE;
    var shown = Math.min(visibleCount, OPENING_IMAGES.length);

    for (var i = 0; i < shown; i++) {
      var item = document.createElement('button');
      item.type = 'button';
      item.className = 'opening-gallery-item';
      item.dataset.openingIndex = String(i);

      var img = document.createElement('img');
      img.src = THUMB_DIR + OPENING_IMAGES[i];
      img.loading = 'lazy';
      img.decoding = 'async';
      item.appendChild(img);

      // "+X fotografija" overlay on the LAST visible thumbnail,
      // unless this gallery opts out via data-opening-overlay="false"
      var overlayAttr = gallery.getAttribute('data-opening-overlay');
      var showOverlay = overlayAttr !== 'false';
      if (showOverlay && i === shown - 1) {
        var remaining = OPENING_IMAGES.length - shown;
        if (remaining > 0) {
          var overlay = document.createElement('span');
          overlay.className = 'opening-gallery-overlay';
          overlay.dataset.remaining = String(remaining);
          item.appendChild(overlay);
        }
      }

      grid.appendChild(item);
    }

    grid.addEventListener('click', function (event) {
      var btn = event.target.closest('.opening-gallery-item');
      if (!btn) return;
      var idx = parseInt(btn.dataset.openingIndex, 10);
      if (Number.isInteger(idx)) open(idx);
    });
  });

  // Translate everything this widget built; re-run on every EN/SR toggle.
  function translateGallery() {
    lb.setAttribute('aria-label', t('opening.lb.aria', 'Pregled fotografija sa otvorenja izložbe'));
    closeBtn.setAttribute('aria-label', t('lightbox.close', 'Zatvori'));
    prevBtn.setAttribute('aria-label', t('lightbox.prev', 'Prethodna fotografija'));
    nextBtn.setAttribute('aria-label', t('lightbox.next', 'Sljedeća fotografija'));

    var thumbAlt = t('opening.thumb.alt', 'Fotografija sa otvorenja izložbe Srce Semberije');
    var thumbAriaTpl = t('opening.thumb.aria', 'Fotografija {n} od {total}');
    var moreTpl = t('opening.more', '+{n} fotografija');

    document.querySelectorAll('.opening-gallery-item').forEach(function (item) {
      var n = parseInt(item.dataset.openingIndex, 10) + 1;
      item.setAttribute(
        'aria-label',
        thumbAriaTpl
          .replace('{n}', String(n))
          .replace('{total}', String(OPENING_IMAGES.length))
      );
      var img = item.querySelector('img');
      if (img) img.alt = thumbAlt;
      var overlay = item.querySelector('.opening-gallery-overlay');
      if (overlay) overlay.textContent = moreTpl.replace('{n}', overlay.dataset.remaining);
    });
  }

  translateGallery();
  document.addEventListener('langchange', translateGallery);

  // Global keyboard navigation while lightbox is open
  document.addEventListener('keydown', function (event) {
    if (!lb.classList.contains('is-open')) return;
    if (event.key === 'Escape') close();
    else if (event.key === 'ArrowLeft') step(-1);
    else if (event.key === 'ArrowRight') step(1);
  });
})();

// === Radio exhibition gallery ("Zvuci prošlosti") — archive.html ===
(function () {
  var IMAGES = [];
  for (var i = 5365; i <= 5384; i++) {
    IMAGES.push('radioizlozba/IMG_' + i + '.JPG');
  }

  var grid = document.querySelector('[data-radio-gallery-grid]');
  if (!grid || !IMAGES.length) return;

  function photoLabel(idx) {
    return t('opening.thumb.aria', 'Fotografija {n} od {total}')
      .replace('{n}', String(idx + 1))
      .replace('{total}', String(IMAGES.length));
  }

  // Build thumbnails
  IMAGES.forEach(function (src, idx) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'radio-thumb';
    btn.dataset.radioIndex = String(idx);
    var img = document.createElement('img');
    img.src = src;
    img.alt = '';
    img.loading = 'lazy';
    img.decoding = 'async';
    btn.appendChild(img);
    grid.appendChild(btn);
  });

  // Build lightbox DOM
  var lb = document.createElement('div');
  lb.className = 'radio-lightbox';
  lb.setAttribute('role', 'dialog');
  lb.setAttribute('aria-modal', 'true');

  var closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'radio-lb-close';
  closeBtn.innerHTML = '&times;';

  var prevBtn = document.createElement('button');
  prevBtn.type = 'button';
  prevBtn.className = 'radio-lb-prev';
  prevBtn.innerHTML = '&lsaquo;';

  var nextBtn = document.createElement('button');
  nextBtn.type = 'button';
  nextBtn.className = 'radio-lb-next';
  nextBtn.innerHTML = '&rsaquo;';

  var lbImg = document.createElement('img');
  lbImg.className = 'radio-lightbox-img';
  lbImg.alt = '';

  lb.appendChild(closeBtn);
  lb.appendChild(prevBtn);
  lb.appendChild(lbImg);
  lb.appendChild(nextBtn);
  document.body.appendChild(lb);

  function translateGallery() {
    lb.setAttribute('aria-label', t('lightbox.viewer', 'Pregled fotografija'));
    closeBtn.setAttribute('aria-label', t('lightbox.close', 'Zatvori'));
    prevBtn.setAttribute('aria-label', t('lightbox.prev', 'Prethodna fotografija'));
    nextBtn.setAttribute('aria-label', t('lightbox.next', 'Sljedeća fotografija'));
    grid.querySelectorAll('.radio-thumb').forEach(function (btn) {
      btn.setAttribute('aria-label', photoLabel(parseInt(btn.dataset.radioIndex, 10)));
    });
  }

  translateGallery();
  document.addEventListener('langchange', translateGallery);

  var current = 0;

  function show() {
    lbImg.src = IMAGES[current];
  }

  function open(idx) {
    current = ((idx % IMAGES.length) + IMAGES.length) % IMAGES.length;
    show();
    lb.classList.add('is-open');
    document.body.classList.add('radio-lb-active');
  }

  function close() {
    lb.classList.remove('is-open');
    document.body.classList.remove('radio-lb-active');
  }

  function step(delta) {
    current = ((current + delta) % IMAGES.length + IMAGES.length) % IMAGES.length;
    show();
  }

  // Click a thumbnail -> open at its index
  grid.addEventListener('click', function (event) {
    var btn = event.target.closest('.radio-thumb');
    if (!btn) return;
    var idx = parseInt(btn.dataset.radioIndex, 10);
    if (Number.isInteger(idx)) open(idx);
  });

  closeBtn.addEventListener('click', close);
  prevBtn.addEventListener('click', function () { step(-1); });
  nextBtn.addEventListener('click', function () { step(1); });

  // Click on overlay (but not on image / buttons) -> close
  lb.addEventListener('click', function (event) {
    if (event.target === lb) close();
  });

  // Keyboard: Esc / ← / →
  document.addEventListener('keydown', function (event) {
    if (!lb.classList.contains('is-open')) return;
    if (event.key === 'Escape') {
      close();
    } else if (event.key === 'ArrowLeft') {
      step(-1);
    } else if (event.key === 'ArrowRight') {
      step(1);
    }
  });
})();

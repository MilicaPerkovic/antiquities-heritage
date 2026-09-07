const menuToggle = document.querySelector('.menu-toggle');
const siteNav = document.querySelector('.site-nav');
const revealItems = document.querySelectorAll('.reveal');
const contactForm = document.querySelector('.contact-form');
const formStatus = document.querySelector('.form-status');

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
  contactForm.addEventListener('submit', (event) => {
    event.preventDefault();
    contactForm.reset();
    if (formStatus) {
      formStatus.hidden = false;
      window.setTimeout(() => {
        formStatus.hidden = true;
      }, 6000);
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
  lightboxEl.setAttribute('aria-label', 'Photo viewer');
  lightboxEl.innerHTML = `
    <button class="lightbox-close" type="button" aria-label="Close">&times;</button>
    <button class="lightbox-nav lightbox-prev" type="button" aria-label="Previous">&lsaquo;</button>
    <figure class="lightbox-figure">
      <img src="" alt="" />
      <figcaption></figcaption>
    </figure>
    <button class="lightbox-nav lightbox-next" type="button" aria-label="Next">&rsaquo;</button>
  `;
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
    img.setAttribute('aria-label', 'Enlarge photo');

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
  const dotsContainer = carousel.querySelector('.carousel-dots');
  const prevBtn = carousel.querySelector('.carousel-prev');
  const nextBtn = carousel.querySelector('.carousel-next');

  const themeLabels = {
    domacinstvo: 'Household',
    tekstil: 'Textile',
    tehnika: 'Technology',
    memorabilije: 'Memorabilia',
  };

  const themeTabs = Array.from(
    document.querySelectorAll('.archive-theme-tab'),
  );

  let current = 0;

  const pad = (n) => String(n).padStart(2, '0');

  const wrapIndex = (i) => ((i % total) + total) % total;

  function buildCard(slot, offset) {
    const idx = wrapIndex(current + offset);
    const sourceImg = carouselSourceItems[idx].querySelector('img');
    const item = items[idx] || {};
    const title = item.title || sourceImg.alt || '';
    const alt = sourceImg.alt || '';
    slot.innerHTML = `
      <img
        src="${sourceImg.getAttribute('src')}"
        alt="${alt}"
        loading="lazy"
        decoding="async"
      />
      <figcaption>
        <span class="label">Photo ${pad(idx + 1)}</span>
        <h3>${title}</h3>
      </figcaption>
    `;
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
      if (theme && themeLabels[theme]) {
        captionTheme.textContent = themeLabels[theme];
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
      const item = items[i] || {};
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'carousel-dot';
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-label', `Image ${i + 1}: ${item.title || ''}`);
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

  // Global keyboard navigation when not in a form field or button
  document.addEventListener('keydown', (event) => {
    if (!carousel) return;
    const target = event.target;
    const tag = target && target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (lightboxEl && lightboxEl.classList.contains('is-open')) return;

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

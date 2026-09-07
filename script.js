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
  const fields = contactForm.querySelectorAll('.contact-field');
  const submitBtn = contactForm.querySelector('button[type="submit"]');
  const confirmation = contactForm.querySelector('[data-form-confirmation]');
  const resetBtn = contactForm.querySelector('[data-form-reset]');
  const confirmationFields = contactForm.querySelectorAll('[data-confirmation-field]');

  contactForm.addEventListener('submit', (event) => {
    event.preventDefault();

    // Capture values into confirmation fields (preserve line breaks for message)
    const data = {
      name: contactForm.elements.name.value.trim(),
      email: contactForm.elements.email.value.trim(),
      message: contactForm.elements.message.value.trim(),
    };

    confirmationFields.forEach((el) => {
      const key = el.getAttribute('data-confirmation-field');
      const val = data[key] || '';
      if (key === 'message') {
        // Preserve newlines in message
        el.textContent = val;
        el.style.whiteSpace = 'pre-wrap';
      } else {
        el.textContent = val;
      }
    });

    // Hide the input fields + submit button, show confirmation
    fields.forEach((el) => { el.hidden = true; });
    if (submitBtn) submitBtn.hidden = true;
    if (confirmation) confirmation.hidden = false;
  });

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      contactForm.reset();
      fields.forEach((el) => { el.hidden = false; });
      if (submitBtn) submitBtn.hidden = false;
      if (confirmation) confirmation.hidden = true;
    });
  }
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

// === Internationalisation (EN / SR toggle) ===
const STORAGE_KEY = 'site-lang';

const I18N = {
  en: {
    // Brand & navigation (common)
    'brand.home': 'Association "Poljoprivrednik"',
    'brand.home.about': 'Association "Poljoprivreda"',
    'brand.subtitle.home': 'Antiquities and Heritage',
    'brand.subtitle.current': 'Current Exhibition',
    'brand.subtitle.archive': 'Exhibition Archive',
    'brand.subtitle.about': 'About the Association',
    'brand.img.alt': 'Antiquities and Heritage',
    'nav.about': 'About the Association',
    'nav.home': 'Home',
    'nav.upcoming': 'Upcoming Exhibition',
    'nav.archive': 'Archive',
    'nav.contact': 'Contact',
    'footer.copy': 'Exhibition and archive of the Agricultural Producers Association.',
    'footer.copy.about': 'Exhibition and archive of the Agricultural Producers Association "Poljoprivreda".',
    'footer.about': 'About the Association',
    'footer.current': 'Current Exhibition',
    'footer.archive': 'Archive',
    'footer.contact': 'Contact',
    'footer.back': 'Back to Home',

    // index.html — Hero
    'hero.eyebrow.home': 'Ethno Exhibition',
    'hero.h1.home': 'Antiquities and Rural Heritage',
    'hero.lead.home': 'Exhibitions and archives preserve objects, stories and memories of the rural household — from kitchen furniture and textiles to old telephones, books and tools.',
    'hero.cta.view': 'View Current Exhibition',
    'hero.cta.about': 'About the Association',
    'hero.cta.archive': 'Archive',
    'hero.panel.association': 'Association',
    'hero.panel.association.value': 'Agronomists and Farmers',
    'hero.panel.city': 'City',
    'hero.panel.city.value': 'Bijeljina, Bosnia and Herzegovina, Republika Srpska',
    'hero.panel.year': 'Year',
    // About
    'about.eyebrow': 'About the Association and the Upcoming Exhibition',
    'about.h2': 'Tradition, Customs and Rural Heritage',
    'about.lead': 'The Agricultural Producers Association brings together people who preserve objects, stories and memories of life in Bosnian-Herzegovinian villages.',
    'about.p1': 'The association was founded with the primary goal of preserving tradition, customs and life across the territory of the former Yugoslavia, primarily from the area of the Bosnian-Herzegovinian villages. Members of the association had been actively collecting objects and items from our past even before the formal founding. The collection holds a large number of old machines, tools, implements and objects connected to land cultivation. The preservation of old crafts, handiwork and products of artisan activities that are important for the village can also be found in this collection.',
    'about.more.p1': 'Hundreds of books, textiles and clothing, an impressive collection of old radio and TV sets, a rich collection of old furniture and carpets will be displayed at the ethno exhibition "Srce Semberije" (Heart of Semberija). The exhibition aims to show what was used in our region at the end of the 19th and the beginning of the 20th century, which materials were used, how they were made, how long they lasted, and many other questions this exhibition will answer.',
    'about.more.p2': 'The careful visitor of the exhibition will not miss how rational, efficient and simple life and work in the past were, how everyday objects were made of natural materials, how much harmony existed between life in the village and the natural surroundings — and that is just one of the goals this exhibition aims to show. We particularly want to point out that each visitor should pay attention to the design, ergonomics and colours of the objects as well as the textiles and clothing used in the past.',
    'about.more.p3': 'The exhibition will display more than 1,000 exhibits covering a range of segments from the past, such as agriculture, crafts, education, music and medicine. We highlight the collection of old irons, cameras, radio devices, clocks, books, dishes, clothing, carpets, handiwork, vinyl records, furniture, typewriters, lamps and more.',
    'about.more.p4': 'The goal of the exhibition is to educate and inform visitors about the past and to encourage them to think about the connection between the past and the present, and to awaken feeling and emotion. The association has repeatedly appeared publicly at fairs and ethno gatherings in Republika Srpska, and during 2026 they independently organised an ethno exhibition set up across a surface of 400 m² with an equally impressive number of displayed objects. The exhibition lasted two months and was visited by more than 10,000 visitors. More than 70,000 visitors viewed the online presentation.',
    'about.more.p5': 'We were particularly pleased by the positive comments about the exhibition, and what is encouraging is the fact that the exhibition presented only a part of the objects in our collection. Due to conditions, the impossibility of properly processing the objects, and the lack of adequate exhibition space and furniture, a large part of the objects remained in the association\'s storage to be preserved, hopefully until the next exhibition. We invite you to visit our exhibition.',
    'about.readmore.show': 'Read more',
    'about.readmore.hide': 'Read less',
    'about.stat1.value': '100+',
    'about.stat1.label': 'Exhibits in the collection',
    'about.stat2.value': '400 m²',
    'about.stat2.label': 'Area of the largest exhibition',
    'about.stat3.value': '10,000+',
    'about.stat3.label': 'Exhibition visitors',
    'about.stat4.value': '70,000+',
    'about.stat4.label': 'Online visits',
    'about.cta.text': 'For the full story of the association, its founding, members and rich collection of over 30,000 exhibits',
    'about.cta.button': 'More about the Association',
    // Current teaser
    'current.eyebrow': 'Current',
    'current.h2': 'Current Exhibition in Progress',
    'current.lead': 'Browse the photo gallery from the latest exhibition — objects, tools, textiles and personal items from a former rural household.',
    'current.cta': 'Open Gallery',
    // Contribute
    'contribute.eyebrow': 'Participate',
    'contribute.h2': 'Have an object, photo or story?',
    'contribute.lead': 'The association collects objects, testimonies and photographs related to rural households and heritage. Each contribution helps preserve the story of the exhibition for future generations.',
    'contribute.cta': 'Contact Us',
    'contribute.item1.label': 'Objects',
    'contribute.item1.text': 'Old household items, furniture, textiles, tools and technical devices.',
    'contribute.item2.label': 'Photographs',
    'contribute.item2.text': 'Family photos, postcards and household shots.',
    'contribute.item3.label': 'Stories',
    'contribute.item3.text': 'Memories, craft tips and oral traditions connected to the village.',
    // Contact form
    'contact.eyebrow': 'Contact',
    'contact.h2': 'Reach the Association',
    'contact.lead': 'For all information about the exhibition, donating objects or future displays, write or call the association.',
    'contact.label.email': 'Email',
    'contact.label.phone': 'Phone',
    'contact.label.place': 'Place',
    'contact.form.name': 'Full Name',
    'contact.form.name.placeholder': 'Your name',
    'contact.form.email': 'Email',
    'contact.form.email.placeholder': 'name@example.com',
    'contact.form.message': 'Message',
    'contact.form.message.placeholder': "Briefly write what you'd like to know",
    'contact.form.submit': 'Send Inquiry',
    'contact.form.status': 'Thank you for your message. The association will reply as soon as possible.',
    'contact.form.confirmation.title': 'Your message has been received',
    'contact.form.confirmation.lead': 'Thank you for reaching out. Here is what we received from you:',
    'contact.form.confirmation.name': 'Name',
    'contact.form.confirmation.email': 'Email',
    'contact.form.confirmation.message': 'Message',
    'contact.form.confirmation.new': 'Send another message',

    // current.html
    'current.eyebrow.current': 'Current Exhibition',
    'current.h1.current': 'Heart of Semberija',
    'current.lead.current': 'Hundreds of books, textiles and clothing, an impressive collection of old radio and TV sets, a rich collection of old furniture and carpets will be displayed at the ethno exhibition "Srce Semberije" (Heart of Semberija). The exhibition opens on September 15 at the address and will be open to visitors for 45 days. The exhibition aims to show what was used in our region at the end of the 19th and the beginning of the 20th century, which materials were used, how they were made, how long they lasted, and many other questions this exhibition will answer. The careful visitor of the exhibition will not miss how rational, efficient and simple life and work in the past were, how everyday objects were made of natural materials, how much harmony existed between life in the village and the natural surroundings — and that is just one of the goals this exhibition aims to show. We particularly want to point out that each visitor should pay attention to the design, ergonomics and colours of the objects as well as the textiles and clothing used in the past. The exhibition will display more than 1,000 exhibits covering a range of segments from the past, such as agriculture, crafts, education, music and medicine. We highlight the collection of old irons, cameras, radio devices, clocks, books, dishes, clothing, carpets, handiwork, vinyl records, furniture, typewriters, lamps and more. The goal of the exhibition is to educate and inform visitors about the past and to encourage them to think about the connection between the past and the present, and to awaken feeling and emotion. The association has repeatedly appeared publicly at fairs and ethno gatherings in Republika Srpska, and during 2026 they independently organised an ethno exhibition set up across a surface of 400 m² with an equally impressive number of displayed objects. The exhibition lasted two months and was visited by more than 10,000 visitors. More than 70,000 visitors viewed the online presentation. We were particularly pleased by the positive comments about the exhibition, and what is encouraging is the fact that the exhibition presented only a part of the objects in our collection. Due to conditions, the impossibility of properly processing the objects, and the lack of adequate exhibition space and furniture, a large part of the objects remained in the association\'s storage to be preserved, hopefully until the next exhibition. We invite you to visit our exhibition.',
    'current.feature.img.alt': 'Old village of Semberija — visual introduction to the exhibition description',
    'current.gallery.h2': 'Exhibition Gallery',
    'current.carousel.prev': 'Previous image',
    'current.carousel.center': 'Center image — click to enlarge',
    'current.carousel.right': 'Next image',
    'current.carousel.dots.aria': 'Direct image selection',

    // archive.html
    'archive.subtitle': 'Exhibition archive',
    'archive.eyebrow.hero': 'Ethno Exhibition, October 2025',
    'archive.hero.p': 'The Agricultural Producers Association "Poljoprivreda" from Bijeljina and the Faculty of Agriculture of the University of East Sarajevo organised an ethno exhibition in Bijeljina with several hundred exhibits.',
    'archive.media.eyebrow': 'Media about the Exhibition',
    'archive.media.label1': 'Video',
    'archive.media.title1': 'Goran Perković on the ethno exhibition in Bijeljina — 15.10.2025.',
    'archive.media.label2': 'TV Show',
    'archive.media.title2': 'Morning for Everyone: Goran Perković, collector from Bijeljina',
    'archive.media.label3': 'Article',
    'archive.media.title3': 'Objects older than a century exhibited in Bijeljina — Infobijeljina',
    'archive.events.eyebrow': 'Previous Exhibitions',
    'archive.event1.title': '"Zvuci prošlosti" (Sounds of the Past), September 2023.',
    'archive.event1.text': '"Zvuci prošlosti" — Sounds of the Past — from the radio device collection is the name of an exhibition with 43 exhibits held at the Semberija Museum.',
    'archive.event1.link1': 'Sounds of the Past — Radio Device Collection',
    'archive.event1.link2': 'Collection of 43 Radio Devices',
    'archive.event1.link3': 'Sounds of the Past — RTRS',
    'archive.event2.title': 'Agriculture Fair "Interagro", September 2023.',
    'archive.event2.text': 'An ethno collection with 40 types of pliers used by blacksmiths was exhibited at the "Interagro" Agriculture Fair in Bijeljina.',

    // udruzenje.html
    'about.headquarters.label': 'Headquarters',
    'about.headquarters.value': 'Bijeljina, Bosnia and Herzegovina',
    'about.founded.label': 'Founded',
    'about.founded.value': '2007',
    'about.members.label': 'Members',
    'about.members.value': '14 dedicated members',
    'about.prose': 'The Agricultural Producers Association "Poljoprivreda" with its headquarters in Bijeljina was founded in 2007. Our community brings together 14 dedicated members who have been passionately collecting and preserving objects, stories and memories of life in the villages of Bosnia and Herzegovina for nearly three decades, saving valuable witnesses of past times from being forgotten. Through decades of work and field collection efforts, we have created an impressive and rich collection that today holds over 30,000 exhibits. The collection contains a large number of old machines, tools, implements and objects connected to land cultivation. The preservation of old crafts, handiwork and products of artisan activities that are important for the village can also be found in this collection. Our goal is to preserve the identity, tradition and cultural heritage of the territory of the former Yugoslavia, primarily that of our villages, and to pass them on to future generations.',
    'about.association.name': 'Agricultural Producers Association Poljoprivreda',
    'about.association.founder': 'Jelena Perković',
    'about.association.description': 'Agricultural Producers Association that brings together 14 members and preserves a collection of over 30,000 exhibits, with more than 1,000 authentic ethno artefacts from Semberija and the wider region.',
    'site.author.name': 'MilicaPerkovic',
    'site.title': 'Antiquities and Heritage | Home',
    'site.title.about': 'About the Association | Antiquities and Heritage',
    'site.title.current': 'Current Exhibition | Antiquities and Heritage',
    'site.title.archive': 'Archive | Antiquities and Heritage',
    'site.description.home': 'Exhibition and archive of antiquities and rural heritage of the Agricultural Producers Association.',
    'site.description.about': 'Agricultural Producers Association Poljoprivreda from Bijeljina — founding, members, collection of over 30,000 exhibits and the preservation of Semberija\'s tradition.',
    'site.description.current': 'Photos from the current ethno exhibition of the Agricultural Producers Association.',
    'site.description.archive': 'Archive page with clearly arranged photographs of the 2025 exhibition of antiquities and rural heritage.',
    'lang.toggle.label': 'Language',
    'theme.household': 'Household',
    'theme.textile': 'Textile',
    'theme.technology': 'Technology',
    'theme.memorabilia': 'Memorabilia',
  },
  sr: {
    'brand.home': 'Udruženje "Poljoprivrednik"',
    'brand.home.about': 'Udruženje "Poljoprivreda"',
    'brand.subtitle.home': 'Antikviteti i nasleđe',
    'brand.subtitle.current': 'Trenutna izložba',
    'brand.subtitle.archive': 'Arhiv izložbe',
    'brand.subtitle.about': 'O udruženju',
    'brand.img.alt': 'Antikviteti i nasleđe',
    'nav.about': 'O udruženju',
    'nav.home': 'Početna',
    'nav.upcoming': 'Predstojeća izložba',
    'nav.archive': 'Arhiv',
    'nav.contact': 'Kontakt',
    'footer.copy': 'Izložba i arhiv Udruženja poljoprivrednih proizvođača.',
    'footer.copy.about': 'Izložba i arhiv Udruženja poljoprivrednih proizvođača "Poljoprivreda".',
    'footer.about': 'O udruženju',
    'footer.current': 'Trenutna izložba',
    'footer.archive': 'Arhiv',
    'footer.contact': 'Kontakt',
    'footer.back': 'Nazad na početnu',

    'hero.eyebrow.home': 'Etno izložba',
    'hero.h1.home': 'Antikviteti i seosko nasleđe',
    'hero.lead.home': 'Izložbe i arhiv čuvaju predmete, priče i sećanja seoskog domaćinstva — od kuhinjskog nameštaja i tekstila, do starih telefona, knjiga i alata.',
    'hero.cta.view': 'Pogledaj trenutnu izložbu',
    'hero.cta.about': 'O udruženju',
    'hero.cta.archive': 'Arhiv',
    'hero.panel.association': 'Udruženje',
    'hero.panel.association.value': 'Agronomi i poljoprivrednici',
    'hero.panel.city': 'Grad',
    'hero.panel.city.value': 'Bijeljina, Bosna i Hercegovina, Republika Srpska',
    'hero.panel.year': 'Godina',
    'about.eyebrow': 'O udruženju i predstojećoj izložbi',
    'about.h2': 'Tradicija, običaji i seosko nasleđe',
    'about.lead': 'Udruženje poljoprivrednih proizvođača okuplja ljude koji čuvaju predmete, priče i uspomene iz života u Bosansko-hercegovačkim selima.',
    'about.p1': 'Udruženje je osnovano sa primarnim ciljem očuvanja tradicije, običaja i života na području stare Jugoslavije, a prvenstveno sa područja Bosansko-hercegovačkih sela. Članovi udruženja su i prije osnivanja aktivno radili na sakupljanju predmeta i stvari iz naše prošlosti. U kolekciji se nalazi veliki broj starih mašina, alata, oruđa i predmeta koji su vezani za obradu zemlje. Očuvanje starih zanata, rukotvorina i proizvoda iz zanatskih djelatnosti koji su važni za selo, takođe se nalaze u ovoj kolekciji.',
    'about.more.p1': 'Više stotina knjiga, tekstila i odjeće, zavidna kolekcija starih radio i TV aparata, bogata kolekcija starog namještaja i ćilima će biti izložena na etno izložbi „Srce Semberije". Izložba treba da prikaže šta se sve koristilo na našim prostorima krajem 19. i početkom 20. vijeka, koji materijali su se koristili, kako su pravljeni, koliko su trajali i niz drugih pitanja i odgovora daće ova izložba.',
    'about.more.p2': 'Pažljivom posjetiocu izložbe neće promaći koliko je život i rad u prošlosti bio racionalan, efikasan i jednostavan, koliko su svakodnevni predmeti bili od prirodnih materijala, koliki je sklad postojao između života na selu i prirodnog okruženja, i to je samo jedan od ciljeva koje treba da prikaže ova izložba. Posebno želimo da istaknemo da svaki posjetilac obrati pažnju na dizajn, ergonomiju i boje predmeta ali i tekstila kao i odjeće koja se koristila u prošlosti.',
    'about.more.p3': 'Na izložbi će biti prikazano više od 1000 eksponata, kojim je obuhvaćen niz segmenata iz prošlosti, kao što su: poljoprivreda, zanatstvo, školstvo, muzika i medicina. Ističemo kolekciju starih pegli, fotoaparata, radio uređaja, satova, knjiga, posuđa, odjeće, ćilima, rukotvorina, ploča, namještaja, pisaćih mašina, lampi i drugog.',
    'about.more.p4': 'Cilj izložbe je da edukuje i informiše posjetioce o prošlosti i da ih podstakne da razmišljaju o vezi između prošlosti i sadašnjosti, ali i da probudi osjećaj i emocije. Udruženje je do sada više puta javno nastupalo na sajmovima i etno smotrama u Republici Srpskoj, a tokom 2026. godine samostalno su organizovali etno izložbu koja je bila postavljena na površini od 400 m² sa takođe zavidnim brojem izloženih predmeta. Izložba je trajala dva mjeseca, a istu je posjetilo preko 10.000 posjetilaca. Internet prezentaciju je pogledalo više od 70.000 posjetilaca.',
    'about.more.p5': 'Posebno su nas obradovali pozitivni komentari izložbe, a ono što ohrabruje jeste činjenica da je na izložbi predstavljen samo dio predmeta koji se nalaze u našoj kolekciji. Zbog uslova, nemogućnosti pravilne obrade predmeta, nepostojanja adekvatnog izložbenog prostora i namještaja, veliki dio predmeta ostao je u magacinu udruženja da se čuva, nadamo se, do sledeće izložbe. Pozivamo vas da posjetite našu izložbu.',
    'about.readmore.show': 'Pročitaj više',
    'about.readmore.hide': 'Pročitaj manje',
    'about.stat1.value': '100+',
    'about.stat1.label': 'Eksponata u kolekciji',
    'about.stat2.value': '400 m²',
    'about.stat2.label': 'Površina najveće izložbe',
    'about.stat3.value': '10.000+',
    'about.stat3.label': 'Posetilaca izložbe',
    'about.stat4.value': '70.000+',
    'about.stat4.label': 'Poseta online',
    'about.cta.text': 'Za cjelokupnu priču o udruženju, osnivanju, članovima i bogatoj zbirci od preko 30.000 eksponata',
    'about.cta.button': 'Više o udruženju',
    'current.eyebrow': 'Aktuelno',
    'current.h2': 'Trenutna izložba u toku',
    'current.lead': 'Pogledajte galeriju fotografija sa aktuelne postavke — predmeti, alati, tekstil i lične stvari iz nekadašnjeg seoskog domaćinstva.',
    'current.cta': 'Otvori galeriju',
    'contribute.eyebrow': 'Učestvovanje',
    'contribute.h2': 'Imate predmet, fotografiju ili priču?',
    'contribute.lead': 'Udruženje prikuplja predmete, svedočanstva i fotografije vezane za seosko domaćinstvo i nasleđe. Svaki prilog pomaže da se priča izložbe sačuva za buduće generacije.',
    'contribute.cta': 'Kontaktirajte nas',
    'contribute.item1.label': 'Predmeti',
    'contribute.item1.text': 'Stari kućni predmeti, nameštaj, tekstil, alati i tehničke naprave.',
    'contribute.item2.label': 'Fotografije',
    'contribute.item2.text': 'Porodične fotografije, razglednice i snimci iz domaćinstva.',
    'contribute.item3.label': 'Priče',
    'contribute.item3.text': 'Sećanja, zanatski saveti i usmena predanja vezana za selo.',
    'contact.eyebrow': 'Kontakt',
    'contact.h2': 'Javite se udruženju',
    'contact.lead': 'Za sve informacije o izložbi, predaji predmeta ili budućim postavkama, pišite ili pozovite udruženje.',
    'contact.label.email': 'Email',
    'contact.label.phone': 'Telefon',
    'contact.label.place': 'Mesto',
    'contact.form.name': 'Ime i prezime',
    'contact.form.name.placeholder': 'Tvoje ime',
    'contact.form.email': 'Email',
    'contact.form.email.placeholder': 'ime@primer.rs',
    'contact.form.message': 'Poruka',
    'contact.form.message.placeholder': 'Napiši kratko šta te zanima',
    'contact.form.submit': 'Pošalji upit',
    'contact.form.status': 'Hvala na poruci. Udruženje će odgovoriti u najkraćem roku.',
    'contact.form.confirmation.title': 'Vaša poruka je primljena',
    'contact.form.confirmation.lead': 'Hvala vam što ste nas kontaktirali. Evo šta smo primili od vas:',
    'contact.form.confirmation.name': 'Ime',
    'contact.form.confirmation.email': 'Email',
    'contact.form.confirmation.message': 'Poruka',
    'contact.form.confirmation.new': 'Pošalji novu poruku',

    'current.eyebrow.current': 'Trenutna postavka',
    'current.h1.current': 'Srce Semberije',
    'current.lead.current': 'Više stotina knjiga, tekstila i odjeće, zavidna kolekcija starih radio i TV aparata, bogata kolekcija starog namještaja i ćilima će biti izložena na etno izložbi „Srce Semberije". Izložba se otvara 15. Septembra na adresi i biće otvorena za posjetioce 45 dana. Izložba treba da prikaže šta se sve koristilo na našim prostorima krajem 19. i početkom 20. vijeka, koji materijali su se koristili, kako su pravljeni, koliko su trajali i niz drugih pitanja i odgovora daće ova izložba. Pažljivom posjetiocu izložbe neće promaći koliko je život i rad u prošlosti bio racionalan, efikasan i jednostavan, koliko su svakodnevni predmeti bili od prirodnih materijala, koliki je sklad postojao između života na selu i prirodnog okruženja, i to je samo jedan od ciljeva koje treba da prikaže ova izložba. Posebno želimo da istaknemo da svaki posjetilac obrati pažnju na dizajn, ergonomiju i boje predmeta ali i tekstila kao i odjeće koja se koristila u prošlosti. Na izložbi će biti prikazano više od 1000 eksponata, kojim je obuhvaćen niz segmenata iz prošlosti, kao što su: poljoprivreda, zanatstvo, školstvo, muzika i medicina. Ističemo kolekciju starih pegli, fotoaparata, radio uređaja, satova, knjiga, posuđa, odjeće, ćilima, rukotvorina, ploča, namještaja, pisaćih mašina, lampi i drugog. Cilj izložbe je da edukuje i informiše posjetioce o prošlosti i da ih podstakne da razmišljaju o vezi između prošlosti i sadašnjosti, ali i da probudi osjećaj i emocije. Udruženje je do sada više puta javno nastupalo na sajmovima i etno smotrama u Republici Srpskoj, a tokom 2026. godine samostalno su organizovali etno izložbu koja je bila postavljena na površini od 400 m² sa takođe zavidnim brojem izloženih predmeta. Izložba je trajala dva mjeseca, a istu je posjetilo preko 10.000 posjetilaca. Internet prezentaciju je pogledalo više od 70.000 posjetilaca. Posebno su nas obradovali pozitivni komentari izložbe, a ono što ohrabruje jeste činjenica da je na izložbi predstavljen samo dio predmeta koji se nalaze u našoj kolekciji. Zbog uslova, nemogućnosti pravilne obrade predmeta, nepostojanja adekvatnog izložbenog prostora i namještaja, veliki dio predmeta ostao je u magacinu udruženja da se čuva, nadamo se, do sledeće izložbe. Pozivamo vas da posjetite našu izložbu.',
    'current.feature.img.alt': 'Staro selo Semberije — vizuelni uvod u opis izložbe',
    'current.gallery.h2': 'Galerija izložbe',
    'current.carousel.prev': 'Prethodna slika',
    'current.carousel.center': 'Centralna slika — kliknite da uvećate',
    'current.carousel.right': 'Sljedeća slika',
    'current.carousel.dots.aria': 'Direktan odabir slike',

    'archive.subtitle': 'Arhiv izložbe',
    'archive.eyebrow.hero': 'Etno izložba, oktobar 2025.',
    'archive.hero.p': 'Udruženje poljoprivrednih proizvođača "Poljoprivreda" Bijeljina i Poljoprivredni fakultet Univerziteta u Istočnom Sarajevu organizovali su u Bijeljini etno izložbu sa više stotina eksponata.',
    'archive.media.eyebrow': 'Mediji o izložbi',
    'archive.media.label1': 'Video',
    'archive.media.title1': 'Goran Perković o etno izložbi u Bijeljini — 15.10.2025.',
    'archive.media.label2': 'TV emisija',
    'archive.media.title2': 'Jutro za sve: Goran Perković, kolekcionar iz Bijeljine',
    'archive.media.label3': 'Članak',
    'archive.media.title3': 'Predmeti stariji od vijeka izloženi u Bijeljini — Infobijeljina',
    'archive.events.eyebrow': 'Prethodne postavke',
    'archive.event1.title': '"Zvuci prošlosti", septembar 2023.',
    'archive.event1.text': '"Zvuci prošlosti" iz kolekcije radio-aparata naziv je izložbe sa 43 eksponata koja je održana u Muzeju Semberije.',
    'archive.event1.link1': 'Zvuci prošlosti — kolekcija radio-aparata',
    'archive.event1.link2': 'Zbirka od 43 radio-aparata',
    'archive.event1.link3': 'Zvuci prošlosti — RTRS',
    'archive.event2.title': 'Sajam poljoprivrede "Interagro", septembar 2023.',
    'archive.event2.text': 'Etno-kolekcija sa 40 vrsta kliješta koje su koristili kovači izložena je na Sajmu poljoprivrede "Interagro" u Bijeljini.',

    'about.headquarters.label': 'Sjedište',
    'about.headquarters.value': 'Bijeljina, Bosna i Hercegovina',
    'about.founded.label': 'Osnovano',
    'about.founded.value': '2007. godine',
    'about.members.label': 'Članovi',
    'about.members.value': '14 posvećenih članova',
    'about.prose': 'Udruženje poljoprivrednih proizvođača "Poljoprivreda" sa sjedištem u Bijeljini osnovano je 2007. godine. Naša zajednica okuplja 14 posvećenih članova koji već skoro tri decenije sakupljaju i čuvaju predmete, priče i uspomene iz života u Bosansko-hercegovačkim selima, spasavajući od zaborava dragocjene svjedoke prošlih vremena. Kroz višedecenijski rad i terenski sakupljački trud, stvorili smo impresivnu i bogatu zbirku koja danas broji preko 30.000 eksponata. U kolekciji se nalazi veliki broj starih mašina, alata, oruđa i predmeta koji su vezani za obradu zemlje. Očuvanje starih zanata, rukotvorina i proizvoda iz zanatskih djelatnosti koji su važni za selo, takođe se nalaze u ovoj kolekciji. Naš cilj je očuvanje identiteta, tradicije i kulturnog nasljeđa područja stare Jugoslavije, a prvenstveno sa područja naših sela, te njihovo prenošenje na buduće generacije.',
    'about.association.name': 'Udruženje poljoprivrednih proizvođača Poljoprivreda',
    'about.association.founder': 'Jelena Perković',
    'about.association.description': 'Udruženje poljoprivrednih proizvođača koje okuplja 14 članova i čuva zbirku od preko 30.000 eksponata, sa više od 1.000 autentičnih etno artefakata iz Semberije i šireg regiona.',
    'site.author.name': 'MilicaPerkovic',
    'site.title': 'Antikviteti i nasleđe | Početna',
    'site.title.about': 'O udruženju | Antikviteti i nasleđe',
    'site.title.current': 'Trenutna izložba | Antikviteti i nasleđe',
    'site.title.archive': 'Arhiv | Antikviteti i nasleđe',
    'site.description.home': 'Izložba i arhiv antikviteta i seoskog nasleđa Udruženja poljoprivrednih proizvođača.',
    'site.description.about': 'Udruženje poljoprivrednih proizvođača Poljoprivreda iz Bijeljine — osnivanje, članovi, zbirka od preko 30.000 eksponata i očuvanje tradicije Semberije.',
    'site.description.current': 'Fotografije sa trenutne etno izložbe Udruženja poljoprivrednih proizvođača.',
    'site.description.archive': 'Arhivska stranica sa pregledno raspoređenim fotografijama izložbe antikviteta i seoskog nasleđa iz 2025. godine.',
    'lang.toggle.label': 'Jezik',
    'theme.household': 'Domaćinstvo',
    'theme.textile': 'Tekstil',
    'theme.technology': 'Tehnika',
    'theme.memorabilia': 'Memorabilije',
  },
};

function detectLang() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'en' || stored === 'sr') return stored;
  } catch (e) {
    // ignore (e.g., localStorage disabled)
  }
  const nav = (navigator && navigator.language) || '';
  return nav.toLowerCase().startsWith('sr') ? 'sr' : 'en';
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

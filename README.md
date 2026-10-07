# Antiquities and Heritage

Static website of the Agricultural Producers Association — exhibition and archive of
antiquities and rural heritage from Semberija and the wider region.

## Pages

- `index.html` — homepage with hero, association overview, current exhibition teaser,
  contribution call-to-action and contact form.
- `udruzenje.html` — about the association: founding, members, collection and contact.
- `current.html` — gallery of photographs from the current ethno exhibition
  ("Srce Semberije") with a three-card carousel.
- `archive.html` — archive of the 2025 exhibition with carousel, media links and
  previous exhibitions (e.g. "Zvuci prošlosti").
- `styles.css` — design system in the logo's colours (deep green, white, black,
  terracotta): tokens at the top, then header, buttons, sections, cards, galleries,
  carousel, timeline, contact form and footer.
- `i18n.js` — all Serbian / English texts (`I18N.sr` and `I18N.en`). Every
  `data-i18n…` key used in the HTML must exist in both dictionaries. The text
  written in the HTML is the Serbian fallback.
- `script.js` — EN/SR toggle, mobile menu, reveal-on-scroll, contact form
  (Formspree), lightbox, carousel, opening and radio galleries, read-more toggle.

## Folder structure

```
projectG/
├── index.html
├── udruzenje.html
├── current.html
├── archive.html
├── styles.css
├── i18n.js               ← translations (SR + EN)
├── script.js
├── logo-full.png         ← full association logo
├── logo-mark.png         ← logo emblem used in the header
├── favicon.png           ← browser tab icon (+ apple-touch-icon.png)
├── staroselo.jpeg        ← featured village photo (current.html hero)
├── slika*.png            ← unused — ignored by git
├── slike/                ← archive photos used by archive.html
├── otvorenje/
│   ├── jpg/              ← full-size originals (not loaded by the site)
│   ├── web/              ← 1600px copies shown in the lightbox
│   └── thumb/            ← 600px copies shown in the grids
├── radioizlozba/         ← "Zvuci prošlosti" photos (archive.html)
└── trenutnaizlozba/      ← current exhibition photos (jpg/ + thumb/)

New photos: make the web-sized copies on a Mac with
`sips -Z 1600 -s formatOptions 72 IN.jpg --out web/` (and `-Z 600` for thumb/).
```

## Running locally

Open `index.html` in your browser, or use VS Code's **Live Server** extension for
hot reloads. There is no build step — the site is 100% static (HTML, CSS, JS,
images).

## Hosting

The site is fully static and ready for any free static host:

- **GitHub Pages** — `Settings → Pages → Branch: main → /(root)` (recommended)
- **Netlify** — drag and drop the folder, or connect the GitHub repo
- **Cloudflare Pages** — connect the GitHub repo for fast global delivery
- **Vercel** — works out of the box

No build, no package manager, no server-side code.

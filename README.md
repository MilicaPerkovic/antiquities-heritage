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
- `styles.css` — full visual system (dark warm tones, gold accents, serif headings,
  carousel, theme chips, archive media list, etc.).
- `script.js` — mobile menu toggle, reveal-on-scroll, contact form, lightbox and
  carousel logic, read-more / read-less toggle.

## Folder structure

```
projectG/
├── index.html
├── udruzenje.html
├── current.html
├── archive.html
├── styles.css
├── script.js
├── logo.jpg              ← site logo
├── favicon.svg
├── staroselo.jpeg        ← featured village photo (current.html hero)
├── slika*.png            ← unused — ignored by git
├── slike/                ← archive photos used by archive.html
└── trenutnaizlozba/      ← current exhibition photos used by current.html
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

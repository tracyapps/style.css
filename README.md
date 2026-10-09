# Style Junkie

A personal CSS/Tailwind field guide dressed as a handmade zine. **Style Junkie is a working name.**

## Run locally

Requires Node.js 22.18+ (Node 24 recommended).

```sh
npm install
npm run dev
```

Open the localhost address printed by Vite. The current development preview uses http://127.0.0.1:5173. Search with **⌘K / Ctrl+K** or **/**; Enter opens the first result. In Unite Pro, create an app pointing at that address and keep the server running. For a production build:

```sh
npm run build
npm run preview
```

Point Unite at the preview address instead (normally port 4173). This is a local web app; it does not install a native shell or auto-start its server.

## What's included

- Live search across 23,312 Tailwind entries, 672 CSS properties, and 67 selector guides.
- All finite utilities exposed by Tailwind 4.3.3's default design system, plus representative arbitrary-value and variant templates. Numeric/arbitrary utilities and arbitrary combinations are open-ended; your project's custom theme is not indexed.
- CSS's full formal grammar, recursively discovered keywords/types/functions, and CSS-wide keywords. Some grammar tokens are not standalone CSS values; they remain searchable and appear as dashed chips. Enter full values in the lab.
- Related references, CSS equivalents, common shortcuts, recent searches/references, bookmarks, category filters, relevance/alphabetical/recent sorting, and copy controls.
- Independent search/filter/sort/selection/list positions in each section, restored from browser storage. Recent searches are recorded after a pause in typing.
- Syntax highlighting using Prism, with Midnight, Candy and Paper themes. Dark by default; Light and System options follow your choice.
- A contained example lab, especially for flex/grid alignment. Demos are illustrative: container/item context and individual browser support matter. The Tailwind example environment includes the default theme; advanced compositional effects can require further utilities. Shared Tailwind property registrations are supplied by Tailwind itself and omitted from per-class reference snippets.
- Versioned MDN property/selector browser compatibility and links to full MDN tables, Tailwind, Caniuse, CSS-Tricks, W3Schools and the original selector article.
- Responsive layout, keyboard focus, reduced-motion support, self-hosted fonts and art. No runtime account, API key or external data request is needed to search. Documentation links leave the app; sandbox examples block scripts and external resources.

## Refresh reference data

Browser support is a **dated snapshot, not a live service**. Updating the snapshot is explicit and reproducible:

```sh
npm update mdn-data @mdn/browser-compat-data tailwindcss @tailwindcss/node
npm run data:refresh
npm test
npm run build
```

Review changed versions/data before publishing. Source packages and exact versions are recorded in `package-lock.json` and `src/data/metadata.json`. The generator uses Tailwind's unstable design-system API; an upgrade may require adapting the generator. Runtime browsing uses generated static data and never imports that compiler API.

Caniuse publishes reusable JSON under CC BY 4.0 at https://github.com/Fyrd/caniuse. This app currently displays MDN browser-compat-data, not copied Caniuse tables. Browser badges describe earliest base-property/selector support; values, flags, prefixes, removed support and modern subfeatures can differ. Notes and full-table links expose those limits.

## Vercel later

This is a static Vite application. Import this directory/repository into Vercel, use the **Vite** preset, `npm run build`, and output directory `dist`. There are no required environment variables, server functions or database. No deployment has been performed. Preferences are stored per browser/origin, so localhost bookmarks will not automatically move to a future domain.

## Architecture and next slices

See [docs/ROADMAP.md](docs/ROADMAP.md) and [docs/VERIFICATION.md](docs/VERIFICATION.md) for module ownership, expansion order and acceptance checks. `src/types.ts` is the reference contract; `src/data/` is generated content. Adding future SVG/filter catalogs means adding data adapters and a mode, not replacing search, persistence or the interface.

```sh
npm test        # catalog/search/persistence contracts
npm run build  # TypeScript + static production bundle
```

## Sources and artwork

- MDN data and browser-compat-data: CC0 1.0, https://github.com/mdn/data and https://github.com/mdn/browser-compat-data. Teaching descriptions and selector examples are original; formal syntax and support records retain their upstream wording.
- Tailwind CSS: MIT, https://github.com/tailwindlabs/tailwindcss.
- Prism: MIT, https://github.com/PrismJS/prism.
- Fonts: Oswald, Space Mono, IBM Plex Sans, Kalam, delivered locally via Fontsource under their packaged open-font licenses.
- `public/collage.png`: original generated art, built-in imagegen. Prompt: a transparent handmade 1996 punk photocopy collage with a pink-hatted giraffe, flamingo, Apple IIe-style computer, Atari-style joystick, yellow taco truck, coffee ring, tape, torn paper and stars; magenta, acid yellow, photographic magazine cutouts and halftone grain; no text or app UI. Full production prompt is in `docs/ARTWORK.md`.

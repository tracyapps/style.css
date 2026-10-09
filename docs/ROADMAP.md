# Style Junkie handoff

## Current seams

| Surface | Owner/module | Acceptance contract |
| --- | --- | --- |
| Catalog types | `src/types.ts` | IDs are deterministic; modes remain isolated; related IDs resolve |
| Source adapters | `scripts/generate-data.mjs`, `src/data/curated.mjs` | MDN grammar/support retained; every Tailwind candidate compiles; defaults exist |
| Generated snapshot | `src/data/catalog.json`, `src/data/metadata.json` | Package versions and support snapshot date visible; no fabricated compatibility |
| Transfer packing | `scripts/pack-data.mjs`, `src/catalog.ts`, `src/catalog-codec.ts` | Small gzip asset loads independently of app JS; plain JSON fallback available |
| Search | `src/search.ts` | All matching entries searched before rendering limits; values/grammar searchable; exact names rank first |
| Preferences | `src/state.ts` | Independent section state; malformed storage is preserved until reset; blocked storage degrades to session-only |
| Interaction | `src/App.tsx`, `src/components/CodeBlock.tsx`, `src/components/ReferenceDetail.tsx` | Copy success requires clipboard success; related links select entries; modal keyboard focus contained |
| Examples | `src/demo.ts` | No script execution/external requests; item versus container alignment modeled; compiled Tailwind theme used |
| Art/theme | `src/styles.css`, `public/collage.png` | Readable code/control states, responsive layout, dark/light/system and independent code themes |

The app is static and needs no backend. Keep personal preferences in an isolated storage adapter so future native or synced storage can replace localStorage without rewriting catalogs/search.

## Dependency-ordered future work

1. **Owner feedback and content depth.** Use the reference on actual work. Identify properties whose default/initial-value demos are unhelpful. Add original descriptions/contextual examples in `src/data/curated.mjs`; keep generated data reproducible. Acceptance: each added example demonstrates the selected property on the correct element and matches its text.
2. **Deeper modern support.** Extend Entry with value/subfeature support records from MDN BCD. Add a value-sensitive table in `src/components/ReferenceDetail.tsx`. Optionally add a Caniuse adapter for feature-level historical tables, retaining attribution. Acceptance: `subgrid`, flex gap and selector flags show their own support, not the older base property's version. Refresh snapshots on builds or controlled CI before adding a live data service.
3. **Tailwind project profiles.** Index a chosen project's custom theme/version as a separate profile; use a compiler service in a controlled build step, not browser filesystem access. Acceptance: profile name/version is visible; default and custom token results cannot be confused; invalid configs fail visibly.
4. **SVG and filters.** Add a separate catalog adapter and mode through `src/types.ts`, `src/state.ts`, source generation and the shared UI. Add purpose-built SVG/filter/feColorMatrix labs to `src/demo.ts`. Acceptance: independent remembered state and bookmarks; real code/output correspondence; strict resource confinement.
5. **Portability.** Export/import bookmarks and view preferences with schema validation and a preview before replacing data. Acceptance: current bookmarks survive malformed imports; IDs that no longer exist are reported rather than silently lost.
6. **App wrapper/offline installation.** Unite works with a running local server now. A later PWA, Tauri or macOS shell can reuse this static build. Do not assume a service worker/native background process already exists. Acceptance: launch/restart, offline data availability, clipboard, keyboard shortcut and update behavior tested in the chosen wrapper.

## Current verification boundary

Node contract tests and TypeScript/production build run locally. Browser checks cover live Tailwind/CSS value search, clipboard content, bookmarks, section state across reload, syntax/UI themes, related references, selectors and responsive sizing. This is local browser evidence; no Vercel deployment, real Unite wrapper, native installation or screen-reader test has occurred. Compatibility data is an upstream snapshot, not a claim that all values were tested in all four engines.

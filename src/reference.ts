import { loadCatalog } from "./catalog";
import metadata from "./data/metadata.json";
import { displayCategory } from "./grouping";
import type { Metadata } from "./types";
// Categories are a desk decision, not a data-pipeline one: re-bucket Tailwind
// entries on load so search, sidebar, and detail all agree.
export const entries = (await loadCatalog()).map((e) =>
  e.mode === "tailwind" ? { ...e, category: displayCategory(e) } : e,
);
export const meta = metadata as Metadata;
export const byId = new Map(entries.map((e) => [e.id, e]));

import { loadCatalog } from "./catalog";
import metadata from "./data/metadata.json";
import type { Metadata } from "./types";
export const entries = await loadCatalog();
export const meta = metadata as Metadata;
export const byId = new Map(entries.map((e) => [e.id, e]));

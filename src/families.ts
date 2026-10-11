import type { Entry } from "./types";
import { compareChips, familyMeta, displayName } from "./grouping.ts";
export interface EntryFamily {
  key: string;
  name: string;
  members: Entry[];
  representative: Entry;
  kind: "chips" | "family" | "single";
  category: string;
}
export function familyKey(entry: Entry): string {
  return familyMeta(entry).key;
}
export function groupEntries(entries: Entry[]): EntryFamily[] {
  const families = new Map<string, EntryFamily>();
  for (const entry of entries) {
    const meta = familyMeta(entry);
    const existing = families.get(meta.key);
    if (existing) {
      existing.members.push(entry);
      continue;
    }
    families.set(meta.key, {
      key: meta.key,
      name: displayName(meta),
      members: [entry],
      representative: entry,
      kind: meta.kind,
      category: meta.category,
    });
  }
  return [...families.values()].map((f) => {
    if (f.kind === "chips") f.members.sort(compareChips);
    if (f.members.length > 1)
      f.representative =
        f.members.find((e) => /-500$/.test(e.name)) ||
        f.members.find((e) => /-4$/.test(e.name)) ||
        f.members[0];
    return f;
  });
}

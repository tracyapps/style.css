import type { Entry } from "./types";
export interface EntryFamily {
  key: string;
  name: string;
  members: Entry[];
  representative: Entry;
}
export function familyKey(entry: Entry): string {
  if (entry.mode !== "tailwind" || /[:\[\]()]/.test(entry.name))
    return entry.id;
  const numeric = entry.name.match(/^(.*)-(\d+(?:\.\d+)?(?:\/\d+)?)$/);
  if (numeric) return `${entry.cssProperty || entry.category}:${numeric[1]}-*`;
  const named = entry.name.match(/^(.*)-([a-z]+)$/);
  return named
    ? `${entry.cssProperty || entry.category}:${named[1]}-*`
    : entry.id;
}
export function groupEntries(entries: Entry[]): EntryFamily[] {
  const families = new Map<string, EntryFamily>();
  for (const entry of entries) {
    const key = familyKey(entry);
    const existing = families.get(key);
    if (existing) {
      existing.members.push(entry);
      continue;
    }
    families.set(key, {
      key,
      name: entry.name,
      members: [entry],
      representative: entry,
    });
  }
  return [...families.values()].map((f) => {
    if (f.members.length > 1) {
      f.name = f.key.slice(f.key.indexOf(":") + 1);
      f.representative =
        f.members.find((e) => /-500$/.test(e.name)) ||
        f.members.find((e) => /-4$/.test(e.name)) ||
        f.members[0];
    }
    return f;
  });
}

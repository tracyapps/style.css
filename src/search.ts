import type { Entry } from "./types";
import type { ViewState } from "./state";
const searchText = new WeakMap<Entry, string>();
function searchable(entry: Entry) {
  let cached = searchText.get(entry);
  if (!cached) {
    cached =
      `${entry.name} ${entry.description} ${entry.syntax} ${entry.values.join(" ")} ${entry.tags.join(" ")} ${entry.cssProperty || ""}`.toLowerCase();
    searchText.set(entry, cached);
  }
  return cached;
}
export function findEntries(
  entries: Entry[],
  view: ViewState,
  bookmarks: string[],
  recent: string[],
): Entry[] {
  const query = view.query.toLowerCase().trim();
  const words = query.split(/\s+/).filter(Boolean);
  let matches = entries.filter(
    (entry) =>
      (view.category === "All" || entry.category === view.category) &&
      (view.scope !== "saved" || bookmarks.includes(entry.id)) &&
      (view.scope !== "recent" || recent.includes(entry.id)) &&
      words.every((word) => searchable(entry).includes(word)),
  );
  const relevance = (entry: Entry) =>
    entry.name === query
      ? 100
      : entry.name.startsWith(query) && query
        ? 50
        : entry.name.includes(query) && query
          ? 30
          : [
                "items-center",
                "justify-center",
                "flex",
                "grid",
                "gap-4",
                "align-items",
                "justify-content",
                ":has()",
                ":nth-child()",
              ].includes(entry.name)
            ? 15
            : 0;
  matches = matches.sort((a, b) =>
    view.sort === "az"
      ? a.name.localeCompare(b.name)
      : view.sort === "za"
        ? b.name.localeCompare(a.name)
        : view.sort === "recent"
          ? (recent.indexOf(a.id) < 0 ? 99999 : recent.indexOf(a.id)) -
              (recent.indexOf(b.id) < 0 ? 99999 : recent.indexOf(b.id)) ||
            a.name.localeCompare(b.name)
          : relevance(b) - relevance(a) || a.name.localeCompare(b.name),
  );
  return matches;
}

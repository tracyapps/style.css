import type { Entry } from "./types";
export const breakpoints = [
  { prefix: "sm", rem: 40, pixels: 640 },
  { prefix: "md", rem: 48, pixels: 768 },
  { prefix: "lg", rem: 64, pixels: 1024 },
  { prefix: "xl", rem: 80, pixels: 1280 },
  { prefix: "2xl", rem: 96, pixels: 1536 },
] as const;
export function responsivePrefix(name: string) {
  return name.match(/^((?:max-)?(?:sm|md|lg|xl|2xl)):/)?.[1] || "";
}
export function parseResponsiveSearch(query: string) {
  const prefix = responsivePrefix(query.trim());
  return {
    prefix,
    query: prefix ? query.trim().slice(prefix.length + 1) : query,
  };
}
export function breakpointFor(prefix: string) {
  return breakpoints.find((b) => b.prefix === prefix.replace(/^max-/, ""));
}
export function responsiveEntry(entry: Entry, prefix: string): Entry {
  const breakpoint = breakpointFor(prefix);
  if (!breakpoint || entry.mode !== "tailwind") return entry;
  const name = `${prefix}:${entry.name}`;
  const escaped = name
    .replace(/([^a-zA-Z0-9_-])/g, "\\$1")
    .replace(/^([0-9])/, "\\3$1 ");
  const originalSelector = entry.code.match(/^\.([^\s{]+)\s*\{/);
  if (!originalSelector) return entry;
  const code = entry.code.replace(originalSelector[0], `.${escaped} {`);
  return {
    ...entry,
    name,
    syntax: name,
    description: `${entry.description} Active ${prefix.startsWith("max-") ? "below" : "from"} ${breakpoint.pixels}px (${breakpoint.rem}rem). Base utilities apply at every size.`,
    code: `@media (width ${prefix.startsWith("max-") ? "<" : ">="} ${breakpoint.rem}rem) {\n${code
      .split("\n")
      .map((l) => "  " + l)
      .join("\n")}\n}`,
    tags: [...entry.tags, "responsive", "breakpoint", prefix],
  };
}

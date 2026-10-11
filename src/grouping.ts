/**
 * Presentation-level grouping for the reference desk.
 *
 * The generated catalog stores raw utility data; how classes are bucketed into
 * sidebar categories and result families is a desk decision, so it lives here
 * instead of the data pipeline. Three kinds of family exist:
 *
 *   chips  — palette color utilities (`bg-red-500`, `text-sky-200`) shown as
 *            paint-chip walls; every shade stays one click away.
 *   family — a utility stem with a scale or named values (`p-*`, `rounded-*`).
 *   single — one-of-a-kind classes and arbitrary/variant templates.
 */
import { palettes as paletteData, solos } from "./data/palettes.ts";
import type { Entry } from "./types";

export interface PaintData {
  palettes: Record<string, Record<string, string>>;
  solos: Record<string, string>;
}
export const paint: PaintData = { palettes: paletteData, solos };
export { paletteData as palettes };
export const PALETTE_ORDER = Object.keys(paint.palettes);
export const SHADE_ORDER = [
  "50",
  "100",
  "200",
  "300",
  "400",
  "500",
  "600",
  "700",
  "800",
  "900",
  "950",
];
export const SOLO_ORDER = ["inherit", "current", "transparent", "black", "white"];

/** Every utility stem whose palette shades render as paint chips. */
const COLOR_STEMS = new Set(
  [
    "bg",
    "text",
    "placeholder",
    "border",
    "border-x",
    "border-y",
    "border-s",
    "border-e",
    "border-t",
    "border-b",
    "border-l",
    "border-r",
    "border-bs",
    "border-be",
    "divide",
    "outline",
    "ring",
    "ring-offset",
    "inset-ring",
    "shadow",
    "inset-shadow",
    "text-shadow",
    "drop-shadow",
    "decoration",
    "accent",
    "caret",
    "fill",
    "stroke",
    "from",
    "via",
    "to",
    "scrollbar-thumb",
    "scrollbar-track",
    ...["l", "r", "t", "b", "x", "y", "linear", "radial", "conic"].flatMap(
      (side) => [`mask-${side}-from`, `mask-${side}-to`],
    ),
  ],
);

/** Tailwind scale words treated like numbers when stripping a stem. */
const SCALE_WORDS = new Set([
  "px",
  "full",
  "auto",
  "none",
  "min",
  "max",
  "fit",
  "screen",
  "2xs",
  "xs",
  "sm",
  "md",
  "lg",
  "2xl",
  "3xl",
  "4xl",
  "5xl",
  "6xl",
  "7xl",
  "8xl",
  "9xl",
  "dvh",
  "svh",
  "lvh",
  "dvi",
  "svi",
  "lvi",
  "dvw",
  "svw",
  "lvw",
  "video",
]);

/** Properties whose utility stem is fixed regardless of value suffixes. */
const STEMS_BY_PROPERTY: Record<string, string> = {
  cursor: "cursor",
  "transition-timing-function": "ease",
  "text-wrap": "text-wrap",
  "text-align": "text",
  "text-transform": "text",
  "font-style": "italic",
  "font-stretch": "font-stretch",
  "text-decoration-line": "underline",
  "vertical-align": "align",
  "touch-action": "touch",
  "forced-color-adjust": "forced-color-adjust",
  "grid-auto-flow": "grid-flow",
  "justify-content": "justify",
  "justify-items": "justify-items",
  "justify-self": "justify-self",
  "align-content": "content",
  "align-items": "items",
  "align-self": "self",
  "place-content": "place-content",
  "place-items": "place-items",
  "place-self": "place-self",
  "scroll-snap-type": "snap",
  "scroll-snap-align": "snap-align",
  "scroll-snap-stop": "snap-stop",
  "scrollbar-width": "scrollbar",
  "scrollbar-gutter": "scrollbar-gutter",
  "color-scheme": "scheme",
  "mix-blend-mode": "mix-blend",
  isolation: "isolation",
  "border-collapse": "border-collapse",
  "background-repeat": "bg-repeat",
  "background-blend-mode": "bg-blend",
  "mask-position": "mask",
  "mask-size": "mask",
  "mask-mode": "mask",
  "mask-repeat": "mask-repeat",
  "mask-clip": "mask-clip",
  "mask-origin": "mask-origin",
  "mask-type": "mask-type",
  "mask-composite": "mask-composite",
  "object-position": "object",
  float: "float",
  clear: "clear",
  "transform-origin": "origin",
  "perspective-origin": "perspective-origin",
  "background-position": "bg",
};

export interface FamilyMeta {
  key: string;
  stem: string;
  kind: "chips" | "family" | "single";
  category: string;
}

export const CATEGORY_ORDER = [
  "Layout",
  "Flexbox & Grid",
  "Spacing",
  "Sizing",
  "Typography",
  "Backgrounds",
  "Gradients",
  "Borders",
  "Accents & SVG",
  "Effects",
  "Masks",
  "Transforms",
  "Motion",
  "Interaction",
  "Accessibility",
  "Responsive",
  "Variants",
  "Other",
] as const;

/** Slot names for family keys that share a stem with different meanings. */
const SLOTS: Record<string, string> = {
  "background-position:bg": "position",
  "background-size:bg": "size",
  "background-repeat:bg": "repeat",
  "background-attachment:bg": "attachment",
  "background-clip:bg": "clip",
  "background-origin:bg": "origin",
  "background-blend-mode:bg-blend": "mode",
  "background-repeat:bg-repeat": "repeat",
  "background-image:bg": "image",
  "background-image:from": "%",
  "background-image:via": "%",
  "background-image:to": "%",
  "font-size:text": "size",
  "text-align:text": "align",
  "text-transform:text": "case",
  "color:text": "color",
  "color:placeholder": "color",
  "line-height:leading": "size",
  "font-weight:font": "weight",
  "font-family:font": "family",
  "font-stretch:font-stretch": "stretch",
  "box-shadow:shadow": "size",
  "box-shadow:inset-shadow": "size",
  "box-shadow:ring": "width",
  "box-shadow:inset-ring": "width",
  "text-shadow:text-shadow": "size",
  "filter:drop-shadow": "size",
  "list-style-type:list": "marker",
  "list-style-position:list": "position",
  "text-decoration-style:decoration": "style",
  "text-decoration-thickness:decoration": "thickness",
  "mask-position:mask": "position",
  "mask-size:mask": "size",
  "mask-image:mask": "image",
  "mask-mode:mask": "mode",
  "color-scheme:scheme": "scheme",
  "object-fit:object": "fit",
  "object-position:object": "position",
  "scroll-snap-type:snap": "type",
  "mask-image:mask-l-from": "%",
  "mask-image:mask-r-from": "%",
  "mask-image:mask-t-from": "%",
  "mask-image:mask-b-from": "%",
  "mask-image:mask-x-from": "%",
  "mask-image:mask-y-from": "%",
  "mask-image:mask-linear-from": "%",
  "mask-image:mask-radial-from": "%",
  "mask-image:mask-conic-from": "%",
};

function isScaleToken(token: string) {
  return (
    /^\d+(?:\.\d+)?$/.test(token) ||
    /^\d+\/\d+$/.test(token) ||
    /^\d+(?:\.\d+)?%$/.test(token) ||
    SCALE_WORDS.has(token)
  );
}

function stripScale(name: string) {
  const tokens = name.split("-");
  let end = tokens.length;
  while (end > 1 && isScaleToken(tokens[end - 1])) end--;
  return tokens.slice(0, end).join("-");
}

export function chipsColor(entry: Entry): string | null {
  if (entry.mode !== "tailwind") return null;
  const name = entry.name.replace(/^-/, "");
  const shade = name.match(/^([a-z][a-z-]*)-([a-z]+)-(\d{2,3})$/);
  if (
    shade &&
    COLOR_STEMS.has(shade[1]) &&
    paint.palettes[shade[2]]?.[shade[3]] &&
    entry.code.includes("var(--color-")
  )
    return paint.palettes[shade[2]][shade[3]];
  const solo = name.match(
    /^([a-z][a-z-]*)-(black|white|transparent|current|inherit)$/,
  );
  if (solo && COLOR_STEMS.has(solo[1])) {
    if (solo[2] === "black") return paint.solos.black;
    if (solo[2] === "white") return paint.solos.white;
    if (solo[2] === "current") return "currentColor";
    return solo[2];
  }
  return null;
}

export function chipsStem(entry: Entry): string | null {
  if (chipsColor(entry) === null) return null;
  const name = entry.name.replace(/^-/, "");
  return (
    name.match(/^([a-z][a-z-]*)-[a-z]+-\d{2,3}$/)?.[1] ??
    name.match(/^([a-z][a-z-]*)-(?:black|white|transparent|current|inherit)$/)?.[1] ??
    name
  );
}

function filterStem(name: string) {
  return name.match(
    /^(backdrop-)?(?:blur|brightness|contrast|grayscale|hue-rotate|invert|saturate|sepia|drop-shadow)/,
  )?.[0];
}

/** Border/outline/divide width utilities report a style property first; the code tells the truth. */
function refinedProperty(entry: Entry): string | undefined {
  const property = entry.cssProperty;
  if (/^(border|outline|divide)/.test(entry.name) && entry.code) {
    if (/-width:/.test(entry.code)) {
      if (property?.endsWith("-width")) return property;
      return `${property?.replace(/-style$|-color$/, "")}-width`;
    }
    if (/style:/.test(entry.code)) return property;
  }
  return property;
}

/**
 * Tailwind category for an entry. Name rules win: gradient stops and ring
 * utilities do not carry a distinguishing cssProperty.
 */
export function categoryOf(entry: Entry): string {
  const name = entry.name;
  const property = entry.cssProperty;
  if (/^(bg-linear|bg-conic|bg-radial|from-|via-|to-)/.test(name) || property === "background-image")
    return "Gradients";
  if (/^background/.test(property ?? "") || /^bg-/.test(name))
    return "Backgrounds";
  if (/^(ring|inset-ring)/.test(name)) return "Borders";
  if (name.startsWith("text-shadow")) return "Typography";
  if (/^scrollbar/.test(name)) return "Interaction";
  if (/^mask-/.test(name)) return "Masks";
  if (property === "border-collapse") return "Layout";
  if (/^(sr-only|not-sr-only)$/.test(name)) return "Accessibility";
  if (property === "color")
    return /^(text|placeholder|decoration)-/.test(name) ? "Typography" : "Accents & SVG";
  if (
    /^(accent-|caret-|fill-|stroke-\D|color-scheme)/.test(name) ||
    ["accent-color", "caret-color", "fill", "color-scheme"].includes(property ?? "")
  )
    return "Accents & SVG";
  if (/^sr-only$|^not-sr-only$/.test(name) || property === "forced-color-adjust")
    return "Accessibility";
  if (
    /^(border|divide|outline|rounded)/.test(name) ||
    /^(border|divide|outline)/.test(property ?? "")
  )
    return "Borders";
  if (/^(scrollbar-thumb|scrollbar-track)-/.test(name)) return "Interaction";
  if (
    /^(shadow|inset-shadow|opacity|mix-blend|isolate|backdrop-)/.test(name) ||
    ["box-shadow", "opacity", "mix-blend-mode", "isolation"].includes(property ?? "") ||
    property === "filter" ||
    property === "backdrop-filter"
  )
    return "Effects";
  if (
    /^(rotate|translate|scale|skew|transform|perspective|backface)/.test(name) ||
    /^(transform|rotate|translate|scale|perspective|backface)/.test(property ?? "")
  )
    return "Transforms";
  if (
    /^(transition|duration|ease|delay|animate|will-change)/.test(name) ||
    /^(transition|animation|will-change)/.test(property ?? "")
  )
    return "Motion";
  if (
    /^(cursor|pointer-events|resize|select|touch|snap|scroll-m|scroll-p|scroll-|overscroll|field-sizing|appearance)/.test(
      name,
    ) ||
    /^(cursor|pointer-events|resize|user-select|touch-action|scroll-snap|scroll-margin|scroll-padding|scroll-behavior|overscroll|field-sizing|appearance|-webkit-user-select)/.test(
      property ?? "",
    )
  )
    return "Interaction";
  if (/^(m|p|space)-/.test(name) || /^(margin|padding)/.test(property ?? ""))
    return "Spacing";
  if (
    /^(flex|grid|col-|row-|auto-cols|auto-rows|gap|order|basis|justify|items|self|content-|place)/.test(
      name,
    ) ||
    /^(flex|grid|gap|order|align|justify|place)/.test(property ?? "")
  )
    return "Flexbox & Grid";
  if (
    /^(w|h|size|min-|max-|aspect)/.test(name) ||
    /^(width|height|inline-size|block-size|aspect-ratio)/.test(property ?? "")
  )
    return "Sizing";
  if (
    /^(font|text|leading|tracking|whitespace|word|hyphens|indent|list|align|line-clamp|underline|overline|not-italic|italic|tabular|ordinal|slashed|oldstyle|lining|proportional|normal-case|uppercase|lowercase|capitalize|truncate|placeholder|decoration)/.test(
      name,
    ) ||
    /^(font|line-height|letter-spacing|white-space|word-break|overflow-wrap|hyphens|list-style|vertical-align|line-clamp|text-|tab-size)/.test(
      property ?? "",
    )
  )
    return "Typography";
  if (
    /^(display|position|inset|top|right|bottom|left|z-index|overflow|visibility|object|float|clear|box-sizing|box-decoration|columns|contain|content|break-)/.test(
      property ?? "",
    ) ||
    /^(static|fixed|absolute|relative|sticky|block|inline|flex$|grid$|table|hidden|contents|flow-root|isolate|invisible|visible|float|clear|object|z-|inset|top|right|bottom|left|start-|end-|overflow|box-|decoration-slice|decoration-clone|break-|columns|container$|@container|truncate|antialiased|subpixel-antialiased)/.test(
      name,
    )
  )
    return "Layout";
  return "Other";
}

const metaCache = new WeakMap<Entry, FamilyMeta>();

export function familyMeta(entry: Entry): FamilyMeta {
  const cached = metaCache.get(entry);
  if (cached) return cached;
  const meta = computeMeta(entry);
  metaCache.set(entry, meta);
  return meta;
}

function computeMeta(entry: Entry): FamilyMeta {
  if (entry.mode !== "tailwind" || /[:[(]/.test(entry.name)) {
    // Arbitrary-value and variant templates stand alone; keep the curated
    // sidebar bucket when the generator assigned one that still exists.
    const kept =
      entry.category === "Responsive" || entry.category === "Variants"
        ? entry.category
        : entry.category === "Grid"
          ? "Flexbox & Grid"
          : categoryOf(entry);
    return { key: entry.id, stem: entry.name, kind: "single", category: kept };
  }
  const category = categoryOf(entry);
  if (/^(sr-only|not-sr-only)$/.test(entry.name))
    return { key: entry.id, stem: entry.name, kind: "single", category };
  const bare = entry.name.replace(/^-/, "");
  const stem = chipsStem(entry);
  if (stem) return { key: `chips:${stem}`, stem, kind: "chips", category };

  const property = refinedProperty(entry);
  // Filter and backdrop-filter stems carry their filter name (backdrop-blur-*).
  const filter =
    property === "filter" || /backdrop-filter$/.test(property ?? "")
      ? filterStem(bare)
      : null;
  if (filter) return { key: `${property}:${filter}`, stem: filter, kind: "family", category };

  if (/^mask-radial/.test(bare) && !/^mask-radial-(from|to)-/.test(bare))
    return { key: "mask-image:mask-radial", stem: "mask-radial", kind: "family", category };

  if (property === "background-image" && /^bg-/.test(bare)) {
    const gradientStem = /^bg-linear-to-/.test(bare)
      ? "bg-linear-to"
      : (bare.match(/^bg-(linear|conic|radial|none)/)?.[0] ?? "bg");
    return {
      key: `background-image:${gradientStem}`,
      stem: gradientStem,
      kind: "family",
      category: "Gradients",
    };
  }

  const scoped = STEMS_BY_PROPERTY[property ?? ""];
  if (scoped)
    return { key: `${property}:${scoped}`, stem: scoped, kind: "family", category };

  const scaleStem = stripScale(bare);
  if (scaleStem !== bare)
    return {
      key: `${property ?? category}:${scaleStem}`,
      stem: scaleStem,
      kind: "family",
      category,
    };
  // A lone trailing word is a named value (flex-wrap, ease-in, text-left),
  // but never strip the side letters of per-side utilities (border-x) or
  // compound stems whose last word is part of the utility name (inset-ring).
  const protectedNames = new Set(["inset-ring"]);
  const named = protectedNames.has(bare)
    ? null
    : bare.match(/^(.*)-([a-z]{2,})$/);
  const finalStem = named ? named[1] : bare;
  return {
    key: `${property ?? category}:${finalStem}`,
    stem: finalStem,
    kind: "family",
    category,
  };
}

export function familyKey(entry: Entry): string {
  return familyMeta(entry).key;
}

/** The sidebar category for an entry, replacing the generator's raw bucket. */
export function displayCategory(entry: Entry): string {
  if (entry.mode !== "tailwind") return entry.category;
  if (entry.category === "Responsive" || entry.category === "Variants")
    return entry.category;
  return categoryOf(entry);
}

export function displayName(meta: FamilyMeta): string {
  if (meta.kind === "single") return meta.stem;
  const inferred =
    meta.kind === "chips" ? "color" : meta.key.match(/-(width|style|color):/)?.[1];
  const slot = inferred ?? SLOTS[meta.key] ?? "…";
  return `${meta.stem}-{${slot}}`;
}

/** Sort chips members palette by palette, light to dark, solos last. */
export function compareChips(a: Entry, b: Entry): number {
  const info = (e: Entry) => {
    const name = e.name.replace(/^-/, "");
    const shade = name.match(/^[a-z][a-z-]*-([a-z]+)-(\d{2,3})$/);
    if (shade)
      return {
        palette: PALETTE_ORDER.indexOf(shade[1]),
        shade: SHADE_ORDER.indexOf(shade[2]),
      };
    const solo = name.match(/-([a-z]+)$/)?.[1] ?? "";
    return { palette: 999, shade: SOLO_ORDER.indexOf(solo) };
  };
  const x = info(a);
  const y = info(b);
  return x.palette - y.palette || x.shade - y.shade;
}

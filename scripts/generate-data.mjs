/**
 * Rebuild with `npm run data:refresh` (offline; uses the installed lockfile versions).
 * Sources/license metadata:
 *   mdn-data: https://github.com/mdn/data — CC0-1.0.
 *   @mdn/browser-compat-data: https://github.com/mdn/browser-compat-data — CC0-1.0.
 *   Tailwind CSS: https://github.com/tailwindlabs/tailwindcss — MIT.
 * Package versions and BCD source date are recorded in metadata.json.
 *
 * Coverage: every MDN property; every finite class reported by Tailwind's v4
 * design system; compiler-verified examples of open-ended arbitrary/variant
 * syntax; original selector teaching examples in curated.mjs.
 * Grammar tokens in `values` are reference syntax, not all executable values.
 * CSS `code` uses valid representative values (or the CSS-wide initial keyword
 * for complex shorthands). Tailwind `code` is the actual compiler utility rule,
 * intended for a Tailwind project with its theme and shared registrations.
 * Shared @property registrations are omitted to avoid repeating them thousands
 * of times. Browser records describe property-level support, not every value;
 * prefixes, removals, partial implementation and flag requirements stay in notes.
 * Missing BCD records remain unknown. General selector-list support does not
 * imply all arguments are supported. Tutsplus is an external reading link only;
 * no descriptions or examples were copied from that article.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { compile, __unstable__loadDesignSystem } from "@tailwindcss/node";
import {
  descriptions,
  examples,
  selectors,
  arbitrary,
} from "../src/data/curated.mjs";
const require = createRequire(import.meta.url);
const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const mdn = require("mdn-data");
const bcd = require("@mdn/browser-compat-data");
const browserKeys = [
  ["Chromium", "chrome"],
  ["Firefox", "firefox"],
  ["Safari", "safari"],
  ["Edge", "edge"],
];
const globalValues = ["inherit", "initial", "unset", "revert", "revert-layer"];
const unique = (items) => [...new Set(items)];
function support(compat) {
  if (!compat?.support) return undefined;
  return browserKeys.map(([browser, key]) => {
    const records = [compat.support[key]].flat().filter(Boolean);
    const best =
      records.find(
        (x) =>
          x.version_added &&
          !x.version_removed &&
          !x.prefix &&
          !x.alternative_name &&
          !x.partial_implementation &&
          !x.flags,
      ) ??
      records.find((x) => !x.version_removed && x.version_added) ??
      records[0];
    if (!best)
      return {
        browser,
        version: null,
        notes: "No compatibility record in this dataset.",
      };
    const notes = unique(
      records
        .flatMap((x) => [
          ...(Array.isArray(x.notes) ? x.notes : x.notes ? [x.notes] : []),
          x.prefix
            ? `Prefixed record: ${x.prefix} from ${x.version_added}.`
            : null,
          x.alternative_name
            ? `Alternative name ${x.alternative_name} (since ${x.version_added}).`
            : null,
          x.version_removed
            ? `Support from ${x.version_added} removed in ${x.version_removed}.`
            : null,
          x.partial_implementation
            ? `Partial implementation since ${x.version_added}.`
            : null,
          x.flags
            ? `Requires ${x.flags.map((f) => f.name).join(", ")} flag.`
            : null,
        ])
        .filter(Boolean),
    );
    return {
      browser,
      version: best.version_removed ? false : (best.version_added ?? null),
      ...(best.partial_implementation ||
      best.prefix ||
      best.alternative_name ||
      best.flags
        ? { partial: true }
        : {}),
      ...(notes.length ? { notes: notes.join(" ") } : {}),
    };
  });
}
function grammarValues(syntax, visited = new Set()) {
  const values = [];
  for (const match of syntax.matchAll(/<([^>]+)>/g)) {
    const name = match[1];
    values.push(`<${name}>`);
    if (visited.has(name)) continue;
    const next = new Set([...visited, name]);
    const property = name.match(/^'(.+)'$/)?.[1];
    const definition = property
      ? mdn.css.properties[property]
      : mdn.css.syntaxes[name];
    if (definition?.syntax)
      values.push(...grammarValues(definition.syntax, next));
  }
  const literals =
    syntax
      .replace(/<[^>]+>/g, " ")
      .match(/(?:--)?[a-zA-Z][\w-]*(?:\([^)]*\))?/g) ?? [];
  // Expose function names rather than pretending a grammar expression is a usable value.
  values.push(
    ...literals.map((x) =>
      x.includes("(") ? `${x.slice(0, x.indexOf("("))}()` : x,
    ),
  );
  return unique(values);
}
function exampleValue(name, data) {
  if (examples[name]) return examples[name];
  const initial = typeof data.initial === "string" ? data.initial : null;
  const symbolic = {
    dependsOnUserAgent: "revert",
    autoForSmartphoneBrowsersSupportingInflation: "auto",
    noPracticalInitialValue: "initial",
    noneButOverriddenInUserAgentCSS: "none",
    seeProse: "initial",
    zoomForTheTopLevelNoneForTheRest: "none",
    startOrNamelessValueIfLTRRightIfRTL: "start",
  };
  if (initial)
    return (
      symbolic[initial] ??
      (/^[\w.%()", -]+$/.test(initial) ? initial : "initial")
    );
  // Shorthand initial values are arrays of longhand names, not valid CSS declarations.
  return "initial";
}
function status(compat, fallback) {
  if (compat?.status?.deprecated) return "deprecated";
  if (compat?.status?.experimental) return "experimental";
  return (
    fallback ?? (compat?.status?.standard_track ? "standard" : "nonstandard")
  );
}
const cssEntries = Object.entries(mdn.css.properties).map(([name, data]) => {
  let compat =
    bcd.css.properties[name === "--*" ? "custom-property" : name]?.__compat;
  if (!compat) {
    const prefix = name.match(/^(-webkit-|-moz-|-ms-)/)?.[1];
    const base = prefix
      ? bcd.css.properties[name.slice(prefix.length)]?.__compat
      : null;
    if (
      base &&
      browserKeys.some(([, key]) =>
        [base.support[key]]
          .flat()
          .some(
            (record) =>
              record?.prefix === prefix || record?.alternative_name === name,
          ),
      )
    ) {
      compat = {
        ...base,
        support: Object.fromEntries(
          browserKeys.map(([, key]) => [
            key,
            [base.support[key]]
              .flat()
              .filter(
                (record) =>
                  record?.prefix === prefix ||
                  record?.alternative_name === name,
              ),
          ]),
        ),
      };
    }
  }
  const propertySupport =
    support(compat) ??
    browserKeys.map(([browser]) => ({
      browser,
      version: null,
      notes: "No compatibility record in this dataset.",
    }));
  for (const row of propertySupport)
    row.notes = `Property-level support; individual values can differ.${row.notes ? " " + row.notes : ""}`;
  const category = data.groups?.[0]?.replace(/^CSS /, "") ?? "Other";
  const value = name === "--*" ? "#2563eb" : exampleValue(name, data);
  const exampleProperty = name === "--*" ? "--brand-color" : name;
  const symbolicInitial =
    /^(?:dependsOnUserAgent|autoForSmartphoneBrowsersSupportingInflation|noPracticalInitialValue|noneButOverriddenInUserAgentCSS|seeProse|zoomForTheTopLevelNoneForTheRest|startOrNamelessValueIfLTRRightIfRTL)$/.test(
      data.initial,
    );
  const initial = Array.isArray(data.initial)
    ? `Initial values are defined by ${data.initial.join(", ")}.`
    : symbolicInitial
      ? "Initial behavior depends on the specification or browser context."
      : `Initial value: ${data.initial}.`;
  const description =
    descriptions[name] ??
    `${category} property. ${initial} ${data.inherited ? "Inherited by child elements." : "Not inherited by default."}`;
  return {
    id: `css-${name}`,
    mode: "css",
    name,
    category,
    description,
    syntax: data.syntax,
    values: unique([...grammarValues(data.syntax), ...globalValues]),
    code: `.example {\n  ${exampleProperty}: ${value};\n}`,
    example: `${exampleProperty}: ${value};`,
    tags: unique([
      category.toLowerCase(),
      ...name.split("-"),
      ...(/^(align-|justify-|place-|flex-)/.test(name)
        ? [
            "flex",
            "grid",
            "alignment",
            "main axis",
            "cross axis",
            "center",
            "wrap",
          ]
        : []),
    ]),
    related: [],
    docs:
      data.mdn_url ??
      `https://developer.mozilla.org/en-US/docs/Web/CSS/${name}`,
    cssProperty: name,
    support: propertySupport,
    status: status(compat, data.status),
  };
});
const cssMap = new Map(cssEntries.map((x) => [x.name, x]));
for (const entry of cssEntries)
  entry.related = cssEntries
    .filter((x) => x.category === entry.category && x.id !== entry.id)
    .sort(
      (a, b) =>
        Number(b.name.split("-")[0] === entry.name.split("-")[0]) -
          Number(a.name.split("-")[0] === entry.name.split("-")[0]) ||
        Number(a.name.startsWith("-")) - Number(b.name.startsWith("-")) ||
        Number(a.status === "deprecated") - Number(b.status === "deprecated"),
    )
    .slice(0, 8)
    .map((x) => x.id);
// Tailwind's own compiler is the authority for every emitted utility declaration.
const ds = await __unstable__loadDesignSystem(
  `@import "tailwindcss/theme.css";`,
  { base: root },
);
const finiteClasses = ds.getClassList().map(([name]) => name);
const candidates = unique([...finiteClasses, ...arbitrary.map((x) => x[0])]);
const compiled = ds.candidatesToCss(candidates);
function propertiesFromCss(code) {
  const main = code.split("@property")[0];
  return unique(
    [...main.matchAll(/^\s+(-?[a-z][\w-]*):\s*([^;]+);/gm)].map((x) => x[1]),
  );
}
function categoryFor(property, name) {
  if (
    /^(flex|grid|align|justify|place|gap|row-gap|column-gap|order)/.test(
      property,
    )
  )
    return "Layout";
  if (/^(margin|padding|space)/.test(property) || /^(space)-/.test(name))
    return "Spacing";
  if (/^(width|height|min-|max-|aspect)/.test(property)) return "Sizing";
  if (
    /^(font|text|line|letter|word|list|white-space|vertical-align|hyphens)/.test(
      property,
    )
  )
    return "Typography";
  if (/^(background|color|fill|stroke|accent|caret)/.test(property))
    return "Color";
  if (/^(border|outline)/.test(property)) return "Borders";
  if (
    /^(position|inset|top|right|bottom|left|z-index|float|clear)/.test(property)
  )
    return "Position";
  if (/^(transform|translate|rotate|scale|perspective|backface)/.test(property))
    return "Transforms";
  if (/^(animation|transition)/.test(property)) return "Motion";
  if (
    /^(filter|backdrop|box-shadow|opacity|mix-blend|isolation|mask)/.test(
      property,
    )
  )
    return "Effects";
  if (/^(cursor|pointer|user|touch|scroll|resize|appearance)/.test(property))
    return "Interaction";
  if (
    /^(display|overflow|visibility|object|break|columns|contain)/.test(property)
  )
    return "Layout";
  return "Other";
}
function docsFor(property, name) {
  const topics = {
    "align-items": "align-items",
    "align-self": "align-self",
    "align-content": "align-content",
    "justify-content": "justify-content",
    "justify-items": "justify-items",
    "justify-self": "justify-self",
    "grid-template-columns": "grid-template-columns",
    "grid-template-rows": "grid-template-rows",
    color: "color",
    "background-color": "background-color",
    "padding-inline": "padding",
    "padding-block": "padding",
    "margin-inline": "margin",
    "margin-block": "margin",
    "column-gap": "gap",
    "row-gap": "gap",
    "font-size": "font-size",
    "line-height": "line-height",
    "box-shadow": "box-shadow",
    transform: "transform",
    width: "width",
    height: "height",
    display: "display",
  };
  return `https://tailwindcss.com/docs/${topics[property] ?? "styling-with-utility-classes"}`;
}
const templates = new Map(
  arbitrary.map(([name, syntax, category]) => [name, { syntax, category }]),
);
const tailwindEntries = [];
let skipped = 0;
for (let index = 0; index < candidates.length; index++) {
  const name = candidates[index];
  // Shared @property registrations are supplied by Tailwind itself, not repeated in each snippet.
  const code = compiled[index]?.split("@property")[0].trim();
  if (!code) {
    skipped++;
    continue;
  }
  const props = propertiesFromCss(code);
  const indirectProperty =
    /--tw-(?:drop-shadow|blur|brightness|contrast|grayscale|hue-rotate|invert|saturate|sepia)/.test(
      code,
    )
      ? "filter"
      : /--tw-backdrop-/.test(code)
        ? "backdrop-filter"
        : /--tw-(?:shadow|ring|inset-ring)/.test(code)
          ? "box-shadow"
          : /--tw-gradient-/.test(code)
            ? "background-image"
            : undefined;
  const property = props[0] ?? indirectProperty;
  const template = templates.get(name);
  const values = unique(
    [
      ...code.split("@property")[0].matchAll(/^\s+[a-z][\w-]*:\s*([^;]+);/gm),
    ].map((x) => x[1]),
  );
  const category = template?.category ?? categoryFor(property ?? "", name);
  const core = descriptions[property];
  const responsive = name.match(/^((?:max-)?(?:sm|md|lg|xl|2xl)):/)?.[1];
  const pixels = { sm: 640, md: 768, lg: 1024, xl: 1280, "2xl": 1536 }[
    responsive?.replace(/^max-/, "")
  ];
  const description = template
    ? `Template: ${template.syntax}. Shown class is a compiler-verified example. Replace the parameter with a valid CSS value; underscores represent spaces inside brackets.`
    : core &&
        /^(items-|justify-|content-|self-|place-|flex-(row|col|wrap))/.test(
          name,
        )
      ? core
      : property
        ? `${props.length ? "Sets " + props.slice(0, 3).join(", ") : "Configures " + property}.`
        : "Generated Tailwind utility; see the compiled CSS for its effects.";
  tailwindEntries.push({
    id: `tw-${name}`,
    mode: "tailwind",
    name,
    category,
    description: responsive
      ? `Responsive utility: active ${responsive.startsWith("max-") ? "below" : "at and above"} ${pixels}px (${pixels / 16}rem). Base classes apply to all sizes; sm: is not a mobile-only modifier.`
      : description,
    syntax: template?.syntax ?? name,
    values: values.slice(0, 8),
    code,
    tags: unique([
      category.toLowerCase(),
      ...(responsive ? ["responsive", "mobile", "breakpoint", responsive] : []),
      ...(property ? [property] : []),
      ...(core
        ? [
            "flex",
            "grid",
            "alignment",
            "main axis",
            "cross axis",
            "center",
            "wrap",
          ]
        : []),
    ]),
    related: [],
    docs: docsFor(property, name),
    ...(property ? { cssProperty: property } : {}),
  });
}
const byProperty = new Map();
for (const entry of tailwindEntries) {
  const p = entry.cssProperty ?? entry.category;
  const group = byProperty.get(p) ?? [];
  group.push(entry);
  byProperty.set(p, group);
}
for (const entry of tailwindEntries) {
  const family = byProperty.get(entry.cssProperty ?? entry.category) ?? [];
  const stem = entry.name.replace(/-[^-]+$/, "");
  entry.related = family
    .filter((x) => x.id !== entry.id)
    .sort(
      (a, b) =>
        Number(b.name.startsWith(stem + "-")) -
        Number(a.name.startsWith(stem + "-")),
    )
    .slice(0, 8)
    .map((x) => x.id);
  if (entry.cssProperty && cssMap.has(entry.cssProperty))
    entry.related.push(cssMap.get(entry.cssProperty).id);
}
function selectorCompat(id, key) {
  const record = bcd.css.selectors[key];
  if (id === "nth-child-of")
    return record?.of_syntax?.__compat ?? record?.__compat;
  if (id === "attribute-insensitive")
    return record?.case_insensitive_modifier?.__compat ?? record?.__compat;
  if (id === "attribute-sensitive")
    return record?.case_sensitive_modifier?.__compat ?? record?.__compat;
  return record?.__compat;
}
const selectorEntries = selectors.map(
  ([id, name, key, description, category]) => {
    const compat = selectorCompat(id, key);
    const declaration =
      id === "before" || id === "after"
        ? 'content: "◆";\n  color: #2563eb;'
        : id === "selection"
          ? "background: #bfdbfe;\n  color: #172554;"
          : id === "marker"
            ? "color: #2563eb;"
            : "color: #2563eb;";
    const prefix =
      id === "nesting"
        ? ".card {\n  &:hover {\n    color: #2563eb;\n  }\n}"
        : `${name} {\n  ${declaration}\n}`;
    return {
      id: `sel-${id}`,
      mode: "selectors",
      name,
      category,
      description,
      syntax: name,
      values: [],
      code: prefix,
      example: name,
      tags: [category.toLowerCase(), key, ...id.split("-")],
      related: [],
      docs:
        compat?.mdn_url ??
        `https://developer.mozilla.org/en-US/docs/Web/CSS/${encodeURIComponent(name)}`,
      support: support(compat),
      status: status(compat, "standard"),
    };
  },
);
for (const entry of selectorEntries)
  entry.related = selectorEntries
    .filter((x) => x.category === entry.category && x.id !== entry.id)
    .slice(0, 8)
    .map((x) => x.id);
const entries = [...tailwindEntries, ...cssEntries, ...selectorEntries];
const previewCompiler = await compile(
  '@import "tailwindcss/theme.css" theme(static); @tailwind utilities;',
  { base: root, onDependency() {} },
);
const previewRuntime = previewCompiler.build([
  "shadow-lg",
  "inset-shadow-sm",
  "text-shadow-lg",
  "drop-shadow-lg",
  "blur-md",
  "backdrop-blur-lg",
  "rotate-45",
  "translate-x-4",
  "scale-125",
  "skew-x-12",
  "ring-2",
  "outline-2",
  "animate-spin",
  "animate-bounce",
  "animate-pulse",
  "animate-ping",
  "bg-linear-to-r",
]);
await fs.writeFile(
  path.join(root, "src/data/preview-runtime.css"),
  previewRuntime,
);

const metadata = {
  generated: new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Chicago",
  }).format(new Date()),
  mdnVersion: require("mdn-data/package.json").version,
  compatVersion: bcd.__meta.version,
  tailwindVersion: JSON.parse(
    await fs.readFile(
      path.join(
        path.dirname(require.resolve("tailwindcss/theme.css")),
        "package.json",
      ),
      "utf8",
    ),
  ).version,
  compatDate: bcd.__meta.timestamp.slice(0, 10),
};
await fs.mkdir(path.join(root, "src/data"), { recursive: true });
await fs.writeFile(
  path.join(root, "src/data/catalog.json"),
  JSON.stringify(entries),
);
await fs.writeFile(
  path.join(root, "src/data/metadata.json"),
  JSON.stringify(metadata, null, 2) + "\n",
);
if (new Set(entries.map((x) => x.id)).size !== entries.length)
  throw new Error("Duplicate catalog IDs.");
for (const id of ["tw-items-center", "css-align-items", "sel-has"])
  if (!entries.some((x) => x.id === id)) throw new Error(`Missing ${id}`);
console.log(
  JSON.stringify(
    {
      tailwind: tailwindEntries.length,
      css: cssEntries.length,
      selectors: selectorEntries.length,
      skipped,
      bytes: Buffer.byteLength(JSON.stringify(entries)),
      metadata,
    },
    null,
    2,
  ),
);

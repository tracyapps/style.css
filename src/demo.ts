import type { Entry } from "./types";
import { palettes } from "./data/palettes.ts";
import { chipsColor } from "./grouping.ts";
const escape = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
export function initialValue(entry: Entry) {
  return entry.mode === "css"
    ? entry.example?.replace(/^[^:]+:\s*/, "").replace(/;\s*$/, "") || "initial"
    : entry.values[0] || "initial";
}

export interface GradientStop {
  palette: string;
  shade: string;
  position: string;
}
export interface GradientState {
  type: "linear" | "conic" | "radial";
  direction: string;
  from: GradientStop;
  via: GradientStop | null;
  to: GradientStop;
}
export const GRADIENT_TYPES = ["linear", "conic", "radial"] as const;
/** CSS keyword ↔ Tailwind suffix for the eight named linear directions. */
export const LINEAR_DIRECTIONS: [string, string][] = [
  ["to right", "r"],
  ["to bottom right", "br"],
  ["to bottom", "b"],
  ["to bottom left", "bl"],
  ["to left", "l"],
  ["to top left", "tl"],
  ["to top", "t"],
  ["to top right", "tr"],
];
export const STOP_POSITIONS = [
  "",
  "0%",
  "10%",
  "20%",
  "30%",
  "40%",
  "50%",
  "60%",
  "70%",
  "80%",
  "90%",
  "100%",
];
export const DEFAULT_GRADIENT: GradientState = {
  type: "linear",
  direction: "to right",
  from: { palette: "pink", shade: "500", position: "" },
  via: { palette: "amber", shade: "300", position: "" },
  to: { palette: "sky", shade: "600", position: "" },
};
function stopColor(stop: GradientStop | null): string {
  if (!stop) return "transparent";
  return palettes[stop.palette]?.[stop.shade] ?? "transparent";
}
function stopDecl(stop: GradientStop | null): string {
  if (!stop) return "";
  return stop.position ? `${stopColor(stop)} ${stop.position}` : stopColor(stop);
}
/** The plain CSS gradient behind the composed Tailwind classes. */
export function gradientCss(state: GradientState): string {
  const stops = [state.from, state.via, state.to]
    .map(stopDecl)
    .filter(Boolean)
    .join(", ");
  if (state.type === "radial") return `radial-gradient(closest-side, ${stops})`;
  if (state.type === "conic") {
    const from = state.direction.match(/^(-?\d+)deg$/)?.[1];
    return `conic-gradient(from ${from ?? 0}deg at 50% 50%, ${stops})`;
  }
  const named = LINEAR_DIRECTIONS.find(([css]) => css === state.direction);
  const angle = state.direction.match(/^(-?\d+)deg$/)?.[1];
  return `linear-gradient(${named ? named[0] : `${angle ?? 0}deg`}, ${stops})`;
}
/** The equivalent Tailwind class list for the current lab settings. */
export function gradientClasses(state: GradientState): string {
  const named = LINEAR_DIRECTIONS.find(([css]) => css === state.direction);
  const angle = state.direction.match(/^(-?\d+)deg$/)?.[1];
  const base =
    state.type === "radial"
      ? "bg-radial"
      : state.type === "conic"
        ? `bg-conic${angle ? `-${angle}` : ""}`
        : named
          ? `bg-linear-to-${named[1]}`
          : `bg-linear-${angle ?? 0}`;
  const stops = [state.from, state.via, state.to].filter(Boolean) as GradientStop[];
  const classes = [
    base,
    ...stops.flatMap((stop) => {
      const color = `${stop.palette}-${stop.shade}`;
      const name =
        stop === state.from ? "from" : stop === state.via ? "via" : "to";
      return stop.position ? [`${name}-${color}`, `${name}-${stop.position}`] : [`${name}-${color}`];
    }),
  ];
  return classes.join(" ");
}
/** Starting point for the lab when a gradient utility is open. */
export function initialGradient(entry: Entry): GradientState {
  const state: GradientState = structuredClone(DEFAULT_GRADIENT);
  const name = entry.name;
  if (/^bg-conic/.test(name)) {
    state.type = "conic";
    state.direction = `${name.match(/-(\d+)$/)?.[1] ?? 0}deg`;
  } else if (/^bg-radial/.test(name)) {
    state.type = "radial";
    state.direction = "";
  } else {
    const dir = name.match(/^bg-linear-to-([trbl]+)$/)?.[1];
    if (dir)
      state.direction =
        LINEAR_DIRECTIONS.find(([, suffix]) => suffix === dir)?.[0] ??
        "to right";
    const angle = name.match(/^bg-linear-(\d+)$/)?.[1];
    if (angle) state.direction = `${angle}deg`;
  }
  for (const stop of ["from", "via", "to"] as const) {
    const color = name.match(
      new RegExp(`^${stop}-([a-z]+)-(\\d{2,3})$`),
    );
    if (color && palettes[color[1]]) {
      if (stop === "via" && !state.via) state.via = { ...state.from };
      state[stop] = { palette: color[1], shade: color[2], position: "" };
      continue;
    }
    const position = name.match(new RegExp(`^${stop}-(\\d+)%$`));
    if (position) {
      const target =
        stop === "via"
          ? (state.via ??= { ...state.from })
          : state[stop];
      target.position = `${position[1]}%`;
    }
  }
  if (name === "via-none") state.via = null;
  return state;
}

/** True when the entry participates in gradient composition. */
export function isGradientEntry(entry: Entry): boolean {
  return (
    entry.mode === "tailwind" &&
    (entry.cssProperty === "background-image" ||
      /^(from|via|to)-/.test(entry.name))
  );
}

const STICKER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'%3E%3Crect width='48' height='48' fill='%23f2d34e'/%3E%3Cpath d='M24 6l4.6 12.2 13.4.5-10.5 8.3 3.7 12.8L24 32.5l-11.2 7.3 3.7-12.8L6 18.7l13.4-.5z' fill='%23e8558f'/%3E%3C/svg%3E";

/** The paint aisle: demos that paint with the selected color itself. */
function colorDemo(entry: Entry, utility: string) {
  const color = chipsColor(entry);
  if (!color) return null;
  const property = entry.cssProperty ?? "";
  const name = entry.name.replace(/^-/, "");
  const paint = (
    declaration: string,
    html: string,
    extra = "",
  ) => ({
    html: `<div class="demo">${html}</div>`,
    css: `:where(.demo) { display: grid; place-items: center; padding: 18px; } :where(.demo .scrap, .demo .sample, .demo .field) { font: 15px/1.4 system-ui; color: #252522; } ${extra}\n:where(.demo .scrap, .demo .sample) { ${declaration} }\n${entry.code}`,
    kind: "color" as const,
  });
  if (property === "background-color")
    return paint(
      `background-color: ${color}; border: 2px solid #242522; padding: 14px 20px; font-weight: 700;`,
      `<div class="scrap ${utility}">paint&nbsp;me</div>`,
    );
  if (property === "color")
    return paint(
      `color: ${color}; font-weight: 700;`,
      `<p class="sample ${utility}">The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs.</p>`,
      ":where(.sample) { font: 22px/1.6 system-ui; max-width: 420px; margin: 0; }",
    );
  if (/color$/.test(property) && /border/.test(property))
    return paint(
      `border: 6px solid ${color}; padding: 16px 22px; background: #ffffffb8;`,
      `<div class="scrap ${utility}">framed</div>`,
    );
  if (name.startsWith("divide-"))
    return {
      html: `<div class="demo"><div class="stack ${utility}"><div>scrap one</div><div>scrap two</div><div>scrap three</div></div></div>`,
      css: `:where(.demo) { display: grid; place-items: center; padding: 16px; } :where(.stack) { width: 220px; background: #ffffffb8; } :where(.stack div) { padding: 12px 14px; font: 15px system-ui; color: #252522; border-bottom: 4px solid transparent; } :where(.stack div:last-child) { border-bottom: 0; }\n${entry.code}`,
      kind: "color",
    };
  if (name.startsWith("ring-offset"))
    return paint(
      `box-shadow: 0 0 0 3px #e9e6d9, 0 0 0 7px ${color}; padding: 16px 22px;`,
      `<div class="scrap ${utility}">ringed</div>`,
    );
  if (name.startsWith("ring"))
    return paint(
      `box-shadow: 0 0 0 4px ${color}; padding: 16px 22px;`,
      `<div class="scrap ${utility}">ringed</div>`,
    );
  if (name.startsWith("inset-ring"))
    return paint(
      `box-shadow: inset 0 0 0 4px ${color}; padding: 16px 22px; background: #ffffffb8;`,
      `<div class="scrap ${utility}">inset ring</div>`,
    );
  if (name.startsWith("shadow"))
    return paint(
      `box-shadow: 0 10px 22px -6px ${color}; padding: 18px 24px; background: #ffffffd4;`,
      `<div class="scrap ${utility}">shadowed</div>`,
    );
  if (name.startsWith("text-shadow"))
    return paint(
      `text-shadow: 3px 3px 0 ${color};`,
      `<p class="sample ${utility}">make it loud</p>`,
      ":where(.sample) { font: 800 26px system-ui; margin: 0; }",
    );
  if (name.startsWith("drop-shadow"))
    return {
      html: `<div class="demo"><svg class="sample ${utility}" viewBox="0 0 120 80" width="180" height="120" role="img" aria-label="Shape with the selected drop shadow"><circle cx="38" cy="40" r="26"/><rect x="72" y="14" width="52" height="52" rx="8"/></svg></div>`,
      css: `:where(.demo) { display: grid; place-items: center; padding: 18px; } :where(svg.sample) { fill: #ef9cb7; stroke: #252522; stroke-width: 3px; }\n:where(.demo svg) { filter: drop-shadow(6px 6px 0 ${color}); }\n${entry.code}`,
      kind: "color",
    };
  if (property === "outline-color")
    return paint(
      `outline: 3px solid ${color}; outline-offset: 4px; padding: 16px 22px;`,
      `<div class="scrap ${utility}">outlined</div>`,
    );
  if (name.startsWith("placeholder-"))
    return {
      html: `<div class="demo"><label class="field">Your email<input class="scrap ${utility}" type="email" placeholder="you@example.com"/></label></div>`,
      css: `:where(.demo) { display: grid; place-items: center; padding: 18px; } :where(.field) { display: grid; gap: 7px; font: 13px system-ui; color: #252522; } :where(.field input) { font: 16px system-ui; padding: 10px 12px; border: 2px solid #242522; width: 240px; background: #fff; }\n${entry.code}`,
      kind: "color",
    };
  if (name.startsWith("caret-"))
    return {
      html: `<div class="demo"><label class="field">Click in and type<input class="scrap ${utility}" type="text" value="the caret wears your color"/></label></div>`,
      css: `:where(.demo) { display: grid; place-items: center; padding: 18px; } :where(.field) { display: grid; gap: 7px; font: 13px system-ui; color: #252522; } :where(.field input) { font: 16px system-ui; padding: 10px 12px; border: 2px solid #242522; width: 260px; background: #fff; }\n${entry.code}`,
      kind: "color",
    };
  if (name.startsWith("accent-"))
    return {
      html: `<div class="demo"><div class="field ${utility}"><label><input type="checkbox" checked/> Check me</label><label><input type="radio" name="accent" checked/> Pick me</label><label><input type="range"/> Slide me</label><label><progress max="100" value="70"></progress></label></div></div>`,
      css: `:where(.demo) { display: grid; place-items: center; padding: 18px; } :where(.field) { display: grid; gap: 12px; font: 15px system-ui; color: #252522; background: #ffffffc4; padding: 16px 20px; border: 2px solid #242522; width: max-content; }\n${entry.code}`,
      kind: "color",
    };
  if (name.startsWith("scrollbar-"))
    return {
      html: `<div class="demo"><div class="scrollbox ${utility}"><p>scroll me — the bar wears your color</p>${"<p>·</p>".repeat(14)}</div></div>`,
      css: `:where(.demo) { display: grid; place-items: center; padding: 16px; } :where(.scrollbox) { width: 240px; height: 140px; overflow: auto; background: #ffffffc4; border: 2px solid #242522; } :where(.scrollbox p) { margin: 6px 14px; font: 13px/1.6 system-ui; color: #252522; }\n${entry.code}`,
      kind: "color",
    };
  return null;
}

function backgroundDemo(entry: Entry, utility: string) {
  const property = entry.cssProperty ?? "";
  const name = entry.name;
  if (property === "background-position")
    return {
      html: `<div class="demo"><div class="frame ${utility}"></div></div>`,
      css: `:where(.demo) { display: grid; place-items: center; padding: 16px; } :where(.frame) { width: 240px; height: 130px; border: 2px dashed #242522; background-color: #ffffffa6; background-image: url("${STICKER}"); background-repeat: no-repeat; background-size: 48px 48px; }\n${entry.code}`,
      kind: "background",
    };
  if (property === "background-size")
    return {
      html: `<div class="demo"><div class="frame ${utility}"></div></div>`,
      css: `:where(.demo) { display: grid; place-items: center; padding: 16px; } :where(.frame) { width: 240px; height: 130px; border: 2px dashed #242522; background-color: #ffffffa6; background-image: url("${STICKER}"); background-repeat: no-repeat; background-position: center; }\n${entry.code}`,
      kind: "background",
    };
  if (property === "background-repeat" || property === "background-attachment")
    return {
      html: `<div class="demo"><div class="frame ${utility}"><p>repeat, round, and space treat leftover room differently.</p></div></div>`,
      css: `:where(.demo) { display: grid; place-items: center; padding: 16px; } :where(.frame) { width: 260px; height: 130px; border: 2px dashed #242522; background-color: #ffffffa6; background-image: url("${STICKER}"); overflow: auto; } :where(.frame p) { margin: 120px 10px 6px; font: 12px/1.5 system-ui; color: #252522; }\n${entry.code}`,
      kind: "background",
    };
  if (property === "background-clip" || property === "background-origin")
    return {
      html: `<div class="demo"><div class="frame ${utility}">${property === "background-clip" && name.endsWith("text") ? "<span>CLIPPED</span>" : "padding box"}</div></div>`,
      css: `:where(.demo) { display: grid; place-items: center; padding: 16px; } :where(.frame) { width: 250px; padding: 26px; border: 10px dashed #242522; background-color: #ef9cb7; background-image: url("${STICKER}"); background-repeat: no-repeat; font: 700 22px system-ui; color: #252522; }\n${property === "background-clip" && name.endsWith("text") ? `:where(.frame) { color: transparent; background-image: linear-gradient(90deg, #e8558f, #f2d34e, #6fc3df); background-size: 100%; -webkit-background-clip: text; }\n${entry.code}` : entry.code}`,
      kind: "background",
    };
  if (property === "background-blend-mode")
    return {
      html: `<div class="demo"><div class="frame ${utility}"></div></div>`,
      css: `:where(.demo) { display: grid; place-items: center; padding: 16px; } :where(.frame) { width: 250px; height: 130px; border: 2px dashed #242522; background-color: #2f6fb5; background-image: url("${STICKER}"); background-repeat: round; background-size: 60px 60px; }\n${entry.code}`,
      kind: "background",
    };
  if (entry.cssProperty === "color-scheme" || /^scheme-/.test(name))
    return {
      html: `<div class="demo"><div class="frame ${utility}"><input type="date"/><select><option>forms follow the scheme</option></select><input type="text" placeholder="inputs too"/></div></div>`,
      css: `:where(.demo) { display: grid; place-items: center; padding: 16px; } :where(.frame) { display: grid; gap: 10px; padding: 16px; border: 2px dashed #242522; background: #ffffff9c; width: 250px; } :where(.frame input, .frame select) { font: 13px system-ui; padding: 6px; }\n${entry.code}`,
      kind: "background",
    };
  return null;
}

export function demoFor(
  entry: Entry,
  value: string,
  direction: string,
  gradient?: GradientState,
) {
  const property =
    entry.cssProperty || (entry.mode === "css" ? entry.name : "");
  const tw = entry.mode === "tailwind";
  const utility = escape(entry.name);
  if (gradient && tw && isGradientEntry(entry)) {
    const classes = gradientClasses(gradient);
    return {
      html: `<div class="demo"><div class="grad" style="background-image: ${gradientCss(gradient)}"><span>${escape(classes.split(" ")[0])}</span></div></div>`,
      css: `:where(.demo) { display: grid; place-items: center; padding: 18px; } :where(.grad) { width: 300px; height: 130px; border: 2px solid #242522; display: grid; place-items: center; } :where(.grad span) { background: #ffffffd9; border: 1px solid #242522; padding: 3px 9px; font: 12px system-ui; color: #252522; }\n/* Tailwind: ${classes} */\n${entry.code}`,
      kind: "gradient" as const,
    };
  }
  if (/^(text-decoration|text-underline-offset)/.test(property)) {
    return {
      html: `<p class="sample ${tw ? utility : ""}">Make code fun.<br/>One good underline.</p>`,
      css: `:where(.sample) { margin: 24px 12px; color: #252522; font: 24px/1.8 system-ui; text-decoration-line: underline; text-decoration-color: #e879ad; text-decoration-thickness: 3px; text-underline-offset: 6px; }\n${tw ? entry.code : `.sample { ${property}: ${value}; }`}`,
      kind: "decoration" as const,
    };
  }
  if (/^(align-|justify-|place-)/.test(property)) {
    const grid =
      property.includes("justify-items") ||
      property.includes("justify-self") ||
      property.startsWith("place-");
    const self = property.endsWith("-self");
    const wrapping =
      property === "align-content" || property === "place-content";
    const count = wrapping ? 6 : 3;
    const html = `<div class="demo ${tw && !self ? utility : ""}">${Array.from({ length: count }, (_, i) => `<span class="${tw && self && i === 1 ? utility : ""}">${String(i + 1).padStart(2, "0")}</span>`).join("")}</div>`;
    return {
      html,
      css: `:where(.demo) { display: ${grid ? "grid" : "flex"}; ${grid ? "grid-template-columns: repeat(3, 60px);" : `flex-direction: ${direction};`} ${wrapping && !grid ? "flex-wrap: wrap; width: 230px;" : ""} gap: 8px; height: 170px; align-items: start; } :where(.demo span) { padding: 10px; background: #e6ef75; color: #232321; border: 2px solid #232321; ${wrapping ? "width: 60px; height: 44px;" : "min-width: 40px;"} } :where(.demo span:nth-child(2)) { background: #ef9cb7; ${wrapping ? "" : "min-height: 56px;"} }\n${tw ? entry.code : `${self ? ".demo span:nth-child(2)" : ".demo"} { ${property}: ${value}; }`}`,
      kind: "alignment" as const,
    };
  }
  if (entry.mode === "selectors") {
    let html =
      '<div class="demo"><article class="card"><h2>A little card</h2><p>The first paragraph.</p><p>The next paragraph.</p><div><p>A nested paragraph.</p></div></article><article class="card muted"><p>Another little card.</p></article></div>';
    if (entry.id === "sel-has")
      html =
        '<div class="demo"><article class="card"><img width="38" height="38" alt="Tiny yellow square" src="data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2738%27 height=%2738%27%3E%3Crect width=%2738%27 height=%2738%27 fill=%27%23e6ef75%27/%3E%3C/svg%3E"/><p>I have a direct image child.</p></article><article class="card"><p>No image here.</p></article></div>';
    else if (entry.name.includes("li"))
      html =
        '<ul class="demo"><li>First scrap</li><li>Second scrap</li><li>Third scrap</li><li>Fourth scrap</li><li>Fifth scrap</li></ul>';
    else if (
      ["Forms", "Interaction"].includes(entry.category) ||
      entry.name.includes("input") ||
      entry.name.includes("button")
    )
      html =
        '<div class="field demo"><label>Email <input type="email" required placeholder="you@example.com"/></label><label><input type="checkbox" checked/> Checked checkbox</label><button>Hover, focus, or press me</button><button disabled>Disabled button</button><input type="file" aria-label="Choose a file"/></div>';
    else if (entry.category === "Links" || entry.name.includes("href"))
      html =
        '<div class="demo"><a href="https://example.com">A web link</a><br/><a href="guide.pdf">A PDF link</a></div>';
    else if (entry.category === "Attributes")
      html =
        '<div class="demo"><p class="card" data-state="OPEN" data-label="rough draft" lang="en-US">Attributes live here.</p><p data-state="open">Lowercase open.</p><input type="email" placeholder="Email"/><button disabled>Disabled button</button></div>';
    else if (entry.name.includes(".label"))
      html =
        '<div class="demo"><p class="label">Generated content lives beside this label.</p></div>';
    else if (entry.id === "sel-empty")
      html =
        '<div class="demo"><div class="message"></div><div class="message">This one has text.</div></div>';
    else if (entry.id === "sel-id")
      html =
        '<nav id="navigation">The navigation with an ID.</nav><nav>Another navigation.</nav>';
    else if (entry.category === "Language")
      html =
        '<div class="demo"><p lang="en">English text.</p><p dir="rtl">نص عربي</p></div>';
    return {
      html,
      css: `body { font: 14px system-ui; color: #252522; line-height: 1.5; } .card { padding: 8px; margin: 4px; border: 1px solid #b7b3a5; } .message { min-height: 30px; border: 1px solid #888; margin: 8px; } label { display: block; margin-bottom: 12px; } button, input { margin: 5px; }\n${entry.code}`,
      kind: "selector" as const,
    };
  }
  if (tw) {
    // Color utilities demo with the chosen paint before anything generic.
    const paint = colorDemo(entry, utility);
    if (paint) return paint;
    const background = backgroundDemo(entry, utility);
    if (background) return background;
    const container =
      /^(display|flex-direction|flex-wrap|grid-|gap|row-gap|column-gap)/.test(
        property,
      );
    let html = container
      ? `<div class="demo ${utility}"><span>01</span><span>02</span><span>03</span><span>04</span><span>05</span><span>06</span></div>`
      : `<div class="demo"><div class="scrap ${utility}">Make something<br/>a little weird.</div></div>`;
    let context = "";
    let kind: string = "utility";
    if (property === "grid-template-columns") {
      context =
        ":where(.demo) { grid-template-columns: 1fr; } :where(.demo span) { padding: 0; height: 18px; font: 12px/14px system-ui; text-align: center; }";
      kind = "grid-columns";
    } else if (
      /^(font|text-|line-height|letter-spacing|word|white-space|hyphens)/.test(
        property,
      )
    ) {
      html = `<div class="demo"><p class="sample ${utility}">Letters with a little attitude.<br/>Pack my box with five dozen liquor jugs.</p></div>`;
      context =
        ":where(.sample) { font: 24px/1.6 system-ui; margin: 8px; max-width: 420px; color:#252522; }";
      kind = "typography";
    } else if (/^(fill|stroke)/.test(property)) {
      html = `<svg class="sample ${utility}" viewBox="0 0 180 90" width="240" height="130" role="img" aria-label="Two shapes showing the selected SVG style"><circle cx="48" cy="45" r="30"/><rect x="100" y="15" width="60" height="60"/></svg>`;
      context =
        ":where(svg.sample) { fill:#efa3bd; stroke:#252522; stroke-width:4px; }";
      kind = "svg";
    } else if (/^(overflow|overscroll)/.test(property)) {
      html = `<div class="demo"><div class="scrap ${utility}"><p>A long scrap that spills outside the box. A long scrap that spills outside the box.</p></div></div>`;
      context =
        ":where(.scrap) { width:180px; height:100px; } :where(.scrap p) { width:330px; height:160px; margin:0; background:#efa3bd; padding:12px; }";
      kind = "overflow";
    } else if (/^(outline)/.test(property))
      context =
        ":where(.scrap) { outline:3px solid #d74b85; outline-offset:4px; margin:10px; }";
    else if (/^(filter|backdrop-filter)/.test(property))
      context =
        ":where(.demo) { background: repeating-linear-gradient(45deg,#efa3bd 0px,#efa3bd 15px,#e8f178 15px,#e8f178 30px); } :where(.scrap) { background:rgb(255 255 255 / .55); }";
    return {
      html,
      css: `:root { --brand: #ef9cb7; --panel-width: 180px; } :where(.demo) { display:${property.startsWith("flex") ? "flex" : "grid"}; grid-template-columns: repeat(3, 1fr); gap:8px; padding:16px; } :where(.demo span,.scrap) { padding:14px; border:2px solid #242522; background-color:#e6ef75; color:#242522; font:18px system-ui; } :where(.scrap) { grid-column:1 / -1; } ${context}\n${entry.code}`,
      kind,
    };
  }
  const grid = /^grid-|^(gap|row-gap|column-gap)$/.test(property);
  const flex = /^flex/.test(property);
  const html =
    grid || flex
      ? '<div class="demo"><span>01</span><span>02</span><span>03</span><span>04</span><span>05</span><span>06</span></div>'
      : '<div class="demo"><div class="scrap">Make something<br/><strong>a little weird.</strong></div></div>';
  const item = /^(flex|flex-grow|flex-shrink|flex-basis|order)$/.test(property);
  return {
    html,
    css: `.demo { ${grid ? "display: grid; grid-template-columns: repeat(3, 1fr);" : flex ? "display: flex;" : ""} gap: 8px; padding: 16px; } .demo span, .scrap { padding: 14px; border: 2px solid #242522; background-color: #e6ef75; color: #242522; font: 18px system-ui; }\n${grid || (flex && !item) ? ".demo" : ".scrap, .demo span"} { ${property === "--*" ? "--brand-color" : property}: ${value}; }`,
    kind: grid || flex ? "layout" : "generic",
  };
}
export function previewDocument(html: string, css: string, runtime = "") {
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"/><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:;"><style>body{margin:14px;font:14px system-ui;color:#252522}*{box-sizing:border-box}${runtime}\n${css}</style></head><body>${html}</body></html>`;
}

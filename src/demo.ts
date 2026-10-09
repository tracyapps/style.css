import type { Entry } from "./types";
const escape = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
export function initialValue(entry: Entry) {
  return entry.mode === "css"
    ? entry.example?.replace(/^[^:]+:\s*/, "").replace(/;\s*$/, "") || "initial"
    : entry.values[0] || "initial";
}
export function demoFor(entry: Entry, value: string, direction: string) {
  const property =
    entry.cssProperty || (entry.mode === "css" ? entry.name : "");
  const tw = entry.mode === "tailwind";
  const utility = escape(entry.name);
  if (/^(text-decoration|text-underline-offset)/.test(property)) {
    return {
      html: `<p class="sample ${tw ? utility : ""}">Make code fun.<br/>One good underline.</p>`,
      css: `:where(.sample) { margin: 24px 12px; color: #252522; font: 24px/1.8 system-ui; text-decoration-line: underline; text-decoration-color: #e879ad; text-decoration-thickness: 3px; text-underline-offset: 6px; }\n${tw ? entry.code : `.sample { ${property}: ${value}; }`}`,
      kind: "decoration",
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
      kind: "alignment",
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
      kind: "selector",
    };
  }
  if (tw) {
    const container =
      /^(display|flex-direction|flex-wrap|grid-|gap|row-gap|column-gap)/.test(
        property,
      );
    let html = container
      ? `<div class="demo ${utility}"><span>01</span><span>02</span><span>03</span><span>04</span><span>05</span><span>06</span></div>`
      : `<div class="demo"><div class="scrap ${utility}">Make something<br/>a little weird.</div></div>`;
    let context = "";
    let kind = "utility";
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

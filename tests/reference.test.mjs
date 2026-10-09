import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { findEntries } from "../src/search.ts";
import { defaults, readState, STORAGE_KEY } from "../src/state.ts";
const entries = JSON.parse(
  fs.readFileSync(new URL("../src/data/catalog.json", import.meta.url)),
);
test("catalog covers core utilities, newer CSS, selectors and valid related links", () => {
  const ids = new Set(entries.map((e) => e.id));
  assert.equal(ids.size, entries.length);
  for (const id of [
    "tw-items-center",
    "tw-grid",
    "tw-bg-pink-500",
    "css-align-content",
    "css-grid-template-columns",
    "css-container-type",
    "css-scroll-timeline",
    "sel-has",
    "sel-where",
    "sel-nth-child-of",
  ])
    assert.ok(ids.has(id), id);
  for (const e of entries)
    for (const id of e.related) assert.ok(ids.has(id), `${e.id} -> ${id}`);
});
test("CSS search finds keywords nested inside formal syntax", () => {
  const css = entries.filter((e) => e.mode === "css");
  const view = defaults().views.css;
  assert.ok(
    findEntries(css, { ...view, query: "subgrid" }, [], []).some(
      (e) => e.name === "grid-template-columns",
    ),
  );
  assert.ok(
    findEntries(css, { ...view, query: "align center" }, [], []).some(
      (e) => e.name === "align-items",
    ),
  );
});
test("bookmark and category filters search the entire catalog", () => {
  const e = entries.find((e) => e.id === "tw-bg-pink-500");
  const view = defaults().views.tailwind;
  const matched = findEntries(
    entries.filter((e) => e.mode === "tailwind"),
    { ...view, scope: "saved", category: e.category },
    [e.id],
    [],
  );
  assert.deepEqual(
    matched.map((e) => e.id),
    [e.id],
  );
  assert.equal(
    findEntries(
      entries,
      { ...view, query: "definitely-does-not-exist" },
      [],
      [],
    ).length,
    0,
  );
});
test("recent sort puts opened entries before unvisited references", () => {
  const view = { ...defaults().views.tailwind, sort: "recent" };
  const result = findEntries(
    entries.filter((e) => e.mode === "tailwind"),
    view,
    [],
    ["tw-gap-4", "tw-flex"],
  );
  assert.deepEqual(
    result.slice(0, 2).map((e) => e.id),
    ["tw-gap-4", "tw-flex"],
  );
});
test("corrupt stored state is preserved and independent section state round trips", () => {
  const raw = "{broken";
  const storage = { getItem: () => raw };
  assert.equal(readState(storage).issue, true);
  assert.equal(storage.getItem(STORAGE_KEY), raw);
  const s = defaults();
  s.views.tailwind.query = "items";
  s.views.css.query = "subgrid";
  s.bookmarks = ["css-align-items"];
  assert.deepEqual(readState({ getItem: () => JSON.stringify(s) }), {
    state: s,
    issue: false,
  });
  assert.equal(
    readState({ getItem: () => JSON.stringify({ ...s, views: null }) }).issue,
    true,
  );
});

test("catalog decoding accepts both raw gzip and a transparently decoded response", async () => {
  const { decodeCatalog } = await import("../src/catalog-codec.ts");
  const { gzipSync } = await import("node:zlib");
  const original = [{ id: "css-display", name: "display" }];
  const plain = Buffer.from(JSON.stringify(original));
  assert.deepEqual(await decodeCatalog(plain), original);
  assert.deepEqual(await decodeCatalog(gzipSync(plain)), original);
  await assert.rejects(decodeCatalog(Buffer.from("broken json")));
});

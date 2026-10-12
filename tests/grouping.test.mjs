import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  familyMeta,
  displayName,
  categoryOf,
  chipsColor,
  colorStemCategory,
  COLOR_CATEGORY_ORDER,
  CATEGORY_ORDER,
} from "../src/grouping.ts";
const entries = JSON.parse(
  fs.readFileSync(new URL("../src/data/catalog.json", import.meta.url)),
).filter((e) => e.mode === "tailwind");
const tw = (name) => entries.find((e) => e.name === name);

test("every tailwind category stays skimable without pagination", () => {
  const families = new Map();
  for (const e of entries) {
    const meta = familyMeta(e);
    families.set(meta.key, meta.category);
  }
  const byCategory = new Map();
  for (const [, category] of families)
    byCategory.set(category, (byCategory.get(category) ?? 0) + 1);
  for (const [category, count] of byCategory)
    assert.ok(
      count <= 80,
      `${category} has ${count} families; keep categories under one page`,
    );
});

test("the paint aisle detects every palette color and no pretenders", () => {
  assert.match(String(chipsColor(tw("bg-red-500"))), /^oklch\(/);
  assert.equal(chipsColor(tw("bg-black")), "#000");
  assert.equal(chipsColor(tw("text-current")), "currentColor");
  assert.equal(chipsColor(tw("bg-conic-90")), null);
  assert.equal(chipsColor(tw("text-xl")), null);
});

test("categories sort in zine order and keep gradient stops together", () => {
  const ranks = CATEGORY_ORDER.map((c) =>
    categoryOf(tw("p-4")) === c ? c : null,
  );
  assert.equal(ranks.filter(Boolean).length, 1);
  for (const name of [
    "bg-linear-to-r",
    "from-red-500",
    "via-50%",
    "to-transparent",
  ])
    assert.equal(categoryOf(tw(name)), "Gradients", name);
  assert.equal(categoryOf(tw("bg-red-500")), "Backgrounds");
  assert.equal(categoryOf(tw("text-red-500")), "Typography");
  assert.equal(categoryOf(tw("ring-2")), "Borders");
  assert.equal(categoryOf(tw("shadow-sm")), "Effects");
  assert.equal(categoryOf(tw("sr-only")), "Accessibility");
});

test("display names disambiguate shared stems", () => {
  const show = (name) => displayName(familyMeta(tw(name)));
  assert.equal(show("text-xl"), "text-{size}");
  assert.equal(show("text-red-500"), "text-{color}");
  assert.equal(show("text-left"), "text-{align}");
  assert.equal(show("border-2"), "border-{width}");
  assert.equal(show("border-dashed"), "border-{style}");
  assert.equal(show("bg-top-left"), "bg-{position}");
  assert.equal(show("from-50%"), "from-{%}");
});

test("the Colors tab buckets stems by what they paint, in shelf order", () => {
  assert.equal(colorStemCategory("bg"), "Backgrounds");
  assert.equal(colorStemCategory("from"), "Gradients");
  assert.equal(colorStemCategory("via"), "Gradients");
  assert.equal(colorStemCategory("text"), "Text");
  assert.equal(colorStemCategory("placeholder"), "Text");
  assert.equal(colorStemCategory("border-b"), "Borders");
  assert.equal(colorStemCategory("ring-offset"), "Borders");
  assert.equal(colorStemCategory("shadow"), "Shadows");
  assert.equal(colorStemCategory("drop-shadow"), "Shadows");
  assert.equal(colorStemCategory("mask-l-from"), "Masks");
  assert.equal(colorStemCategory("fill"), "Accents & SVG");
  assert.equal(colorStemCategory("scrollbar-thumb"), "Accents & SVG");
  const shelf = [...COLOR_CATEGORY_ORDER];
  assert.deepEqual(
    ["Backgrounds", "Gradients", "Borders"].map((c) => shelf.indexOf(c)).sort(),
    [0, 1, 3],
  );
});

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { groupEntries } from "../src/families.ts";
import {
  parseResponsiveSearch,
  responsiveEntry,
  breakpoints,
} from "../src/responsive.ts";
const entries = JSON.parse(
  fs.readFileSync(new URL("../src/data/catalog.json", import.meta.url)),
);
test("color shades and opacity variants collapse into one family without losing choices", () => {
  const matches = entries.filter(
    (e) => e.name.startsWith("decoration-gray-") && e.mode === "tailwind",
  );
  const groups = groupEntries(matches);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].name, "decoration-gray-*");
  assert.equal(groups[0].members.length, matches.length);
  assert.equal(groups[0].representative.name, "decoration-gray-500");
});
test("properties, palettes, modes, and arbitrary expressions remain distinct", () => {
  const names = [
    "decoration-gray-500",
    "decoration-green-500",
    "text-blue-500",
    "text-3xl",
    "p-4",
    "p-8",
    "p-[13px]",
  ];
  const selection = entries.filter(
    (e) => e.mode === "tailwind" && names.includes(e.name),
  );
  const groups = groupEntries(selection);
  assert.equal(groups.length, 6);
  assert.equal(groups.find((g) => g.name === "p-*").members.length, 2);
});
test("an exact class match stays visible rather than becoming a wildcard", () => {
  const entry = entries.find((e) => e.id === "tw-decoration-green-500");
  assert.equal(groupEntries([entry])[0].name, entry.name);
});
test("responsive queries select a breakpoint and preserve the utility query", () => {
  assert.deepEqual(parseResponsiveSearch(" md:decoration-green-500 "), {
    prefix: "md",
    query: "decoration-green-500",
  });
  assert.deepEqual(parseResponsiveSearch("max-lg:"), {
    prefix: "max-lg",
    query: "",
  });
  assert.equal(parseResponsiveSearch("decoration").prefix, "");
});
test("every default breakpoint wraps utility CSS and escapes the copied selector", () => {
  const base = entries.find((e) => e.id === "tw-decoration-green-500");
  for (const b of breakpoints) {
    const variant = responsiveEntry(base, b.prefix);
    assert.equal(variant.name, `${b.prefix}:decoration-green-500`);
    assert.ok(variant.code.startsWith(`@media (width >= ${b.rem}rem)`));
    assert.ok(
      variant.code.includes("text-decoration-color: var(--color-green-500)"),
    );
    assert.ok(variant.code.includes("\\:decoration-green-500"));
    assert.equal(variant.id, base.id);
  }
  assert.ok(
    responsiveEntry(base, "max-md").code.startsWith("@media (width < 48rem)"),
  );
});

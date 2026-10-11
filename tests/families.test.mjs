import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { groupEntries, familyKey } from "../src/families.ts";
import {
  parseResponsiveSearch,
  responsiveEntry,
  breakpoints,
} from "../src/responsive.ts";
const entries = JSON.parse(
  fs.readFileSync(new URL("../src/data/catalog.json", import.meta.url)),
);
const tw = (name) => entries.find((e) => e.id === `tw-${name}`);

test("every palette shade becomes one paint-chip family without losing choices", () => {
  const matches = entries.filter(
    (e) => e.name.startsWith("decoration-gray-") && e.mode === "tailwind",
  );
  const groups = groupEntries(matches);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].name, "decoration-{color}");
  assert.equal(groups[0].kind, "chips");
  assert.equal(groups[0].members.length, matches.length);
  assert.equal(groups[0].representative.name, "decoration-gray-500");
});

test("utilities, palettes, modes, and arbitrary expressions remain distinct", () => {
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
  assert.equal(groups.length, 5);
  const p = groups.find((g) => g.name.startsWith("p-"));
  assert.equal(p.members.length, 2);
  // The two decoration shades share one chip wall; text color is its own wall.
  assert.equal(familyKey(tw("decoration-gray-500")), "chips:decoration");
  assert.equal(familyKey(tw("decoration-green-500")), "chips:decoration");
  assert.equal(familyKey(tw("text-blue-500")), "chips:text");
});

test("an exact class match stays visible rather than becoming a wildcard", () => {
  const entry = tw("decoration-green-500");
  const group = groupEntries([entry])[0];
  assert.equal(group.representative.name, entry.name);
  assert.ok(group.members.includes(entry));
});

test("background positions combine into one family, shades merge by stem", () => {
  const positions = [
    "bg-top",
    "bg-bottom",
    "bg-top-left",
    "bg-bottom-right",
    "bg-center",
  ];
  const selection = positions.map(tw);
  const groups = groupEntries(selection);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].name, "bg-{position}");
  const rounding = groupEntries([tw("rounded-tl-2xl"), tw("rounded-tl-md")]);
  assert.equal(rounding.length, 1);
  const negative = groupEntries([tw("m-4"), tw("-m-4"), tw("mt-2")]);
  assert.equal(negative.filter((g) => g.name === "m-{…}").length, 1);
});

test("text colors leave the Color bucket for Typography", () => {
  const groups = groupEntries(entries.filter((e) => e.mode === "tailwind"));
  const textColors = groups.find((g) => g.key === "chips:text");
  assert.equal(textColors.category, "Typography");
  assert.equal(textColors.kind, "chips");
  const bgColors = groups.find((g) => g.key === "chips:bg");
  assert.equal(bgColors.category, "Backgrounds");
  assert.ok(textColors.members.length > 200);
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

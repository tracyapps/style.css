import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { demoFor, previewDocument } from "../src/demo.ts";
import { responsiveEntry } from "../src/responsive.ts";
import { compile } from "@tailwindcss/node";
const entries = JSON.parse(
  fs.readFileSync(new URL("../src/data/catalog.json", import.meta.url)),
);
const entry = (name) => entries.find((e) => e.id === `tw-${name}`);

test("decoration demos include an underline, the actual class, and overridable context", () => {
  for (const name of [
    "decoration-green-500",
    "decoration-wavy",
    "decoration-2",
    "underline-offset-8",
  ]) {
    const e = entry(name);
    const demo = demoFor(e, "", "row");
    assert.ok(demo.html.includes(name));
    assert.ok(demo.css.includes("text-decoration-line: underline"));
    assert.ok(demo.css.startsWith(":where(.sample)"));
    assert.ok(demo.css.endsWith(e.code));
  }
});

test("responsive alignment is controlled by the selected utility on the correct element", () => {
  const container = demoFor(
    responsiveEntry(entry("items-center"), "md"),
    "",
    "row",
  );
  assert.ok(container.html.includes('class="demo md:items-center"'));
  assert.ok(container.css.includes("@media (width >= 48rem)"));
  assert.ok(!container.css.includes(".demo { align-items: center; }"));
  const self = demoFor(entry("self-end"), "", "row");
  assert.ok(self.html.includes('<span class="self-end">02</span>'));
});

test("breakpoint CSS matches official compiler semantics, including numeric prefixes", async () => {
  const compiler = await compile(
    '@import "tailwindcss/theme.css" theme(static); @tailwind utilities;',
    {
      base: new URL("..", import.meta.url).pathname,
      onDependency() {},
    },
  );
  for (const prefix of ["md", "max-md", "2xl"]) {
    const generated = responsiveEntry(entry("decoration-green-500"), prefix);
    const official = compiler.build([generated.name]);
    const selector = generated.code.match(/\n  (\.[^\n{]+) \{/)[1];
    assert.ok(official.includes(selector), selector);
    const condition =
      prefix === "max-md"
        ? "width < 48rem"
        : prefix === "2xl"
          ? "width >= 96rem"
          : "width >= 48rem";
    assert.ok(official.includes(`@media (${condition})`));
    assert.ok(
      official.includes("text-decoration-color: var(--color-green-500)"),
    );
  }
});

test("preview document keeps sandbox resources confined and includes compiler defaults", () => {
  const runtime = fs.readFileSync(
    new URL("../src/data/preview-runtime.css", import.meta.url),
    "utf8",
  );
  const doc = previewDocument("<p>Preview</p>", ".sample {}", runtime);
  assert.ok(doc.includes("default-src 'none'"));
  assert.ok(doc.includes("@property --tw-"));
  assert.ok(doc.includes("@keyframes spin"));
  assert.ok(doc.includes("--color-green-500"));
});

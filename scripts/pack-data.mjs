import { readFile, writeFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";
const source = new URL("../src/data/catalog.json", import.meta.url);
const data = await readFile(source);
await writeFile(
  new URL("../src/data/catalog.json.gz", import.meta.url),
  gzipSync(data, { level: 9 }),
);
console.log(
  `Packed reference: ${data.length.toLocaleString()} bytes → ${gzipSync(data, { level: 9 }).length.toLocaleString()} bytes`,
);

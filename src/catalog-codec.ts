import type { Entry } from "./types";
/** Some static servers transparently decode .gz; others serve its raw bytes. */
export async function decodeCatalog(bytes: Uint8Array): Promise<Entry[]> {
  if (bytes[0] === 0x1f && bytes[1] === 0x8b) {
    if (typeof DecompressionStream === "undefined")
      throw new Error("Gzip decoding unavailable");
    const stream = new Blob([bytes as BlobPart])
      .stream()
      .pipeThrough(new DecompressionStream("gzip"));
    return JSON.parse(await new Response(stream).text());
  }
  return JSON.parse(new TextDecoder().decode(bytes));
}

import compressedUrl from "./data/catalog.json.gz?url";
import fallbackUrl from "./data/catalog.json?url";
import type { Entry } from "./types";
import { decodeCatalog } from "./catalog-codec";
export async function loadCatalog(): Promise<Entry[]> {
  try {
    const response = await fetch(compressedUrl);
    if (!response.ok) throw new Error("Reference download failed");
    return await decodeCatalog(new Uint8Array(await response.arrayBuffer()));
  } catch {
    /* Older wrappers can use the ordinary JSON asset. */
  }
  const response = await fetch(fallbackUrl);
  if (!response.ok) throw new Error("Reference download failed");
  return response.json();
}

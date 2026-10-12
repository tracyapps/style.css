import type { Mode } from "./types";
export interface ViewState {
  query: string;
  category: string;
  sort: string;
  selected: string;
  scope: string;
  scroll: number;
  variant?: string;
}
/** Desk panel sizes in pixels; the color wall value is a maximum height. */
export interface PanelSizes {
  sidebar: number;
  results: number;
  colorWall: number;
}
export interface ColorPick {
  palette: string;
  shade: string;
}
export interface AppState {
  mode: Mode;
  views: Record<Mode, ViewState>;
  bookmarks: string[];
  recent: string[];
  searches: string[];
  theme: "dark" | "light" | "system";
  codeTheme: "midnight" | "candy" | "paper";
  sizes: PanelSizes;
  /** Palette rows the painter collapsed; empty means every row is open. */
  colorCollapsed: string[];
  /** The last shade picked on the paint wall, carried across families. */
  lastColor: ColorPick | null;
}
export const STORAGE_KEY = "style-junkie-v1";
const view = (selected: string): ViewState => ({
  query: "",
  category: "All",
  sort: "recommended",
  selected,
  scope: "all",
  scroll: 0,
  variant: "",
});
const defaultSizes = (): PanelSizes => {
  const wide =
    typeof window === "undefined" ? 1280 : (window.innerWidth ?? 1280);
  return {
    sidebar: wide >= 1151 ? 200 : wide >= 900 ? 160 : 150,
    results: wide >= 1151 ? 320 : wide >= 900 ? 260 : 240,
    colorWall: 320,
  };
};
export const defaults = (): AppState => ({
  mode: "tailwind",
  views: {
    colors: view("tw-bg-red-500"),
    tailwind: view("tw-items-center"),
    css: view("css-align-items"),
    selectors: view("sel-has"),
  },
  bookmarks: [],
  recent: [],
  searches: [],
  theme: "dark",
  codeTheme: "midnight",
  sizes: defaultSizes(),
  colorCollapsed: [],
  lastColor: null,
});
const modes: Mode[] = ["colors", "tailwind", "css", "selectors"];
const clamp = (n: unknown, lo: number, hi: number, fallback: number) =>
  typeof n === "number" && Number.isFinite(n)
    ? Math.min(hi, Math.max(lo, Math.round(n)))
    : fallback;
export function readState(storage: Pick<Storage, "getItem">): {
  state: AppState;
  issue: boolean;
} {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return { state: defaults(), issue: false };
    const parsed = JSON.parse(raw);
    if (
      !parsed ||
      !modes.includes(parsed.mode) ||
      !["dark", "light", "system"].includes(parsed.theme) ||
      !["midnight", "candy", "paper"].includes(parsed.codeTheme)
    )
      throw new Error("Invalid preferences");
    for (const key of ["bookmarks", "recent", "searches"])
      if (
        !Array.isArray(parsed[key]) ||
        !parsed[key].every((x: unknown) => typeof x === "string")
      )
        throw new Error("Invalid lists");
    if (!parsed.views || typeof parsed.views !== "object")
      throw new Error("Invalid views");
    // Sections added after a saved desk (the Colors tab, say) start from
    // defaults instead of invalidating everything else.
    for (const mode of modes) {
      const v = parsed.views[mode];
      if (v === undefined) {
        parsed.views[mode] = view(defaults().views[mode].selected);
        continue;
      }
      if (
        !v ||
        !["query", "category", "sort", "selected", "scope"].every(
          (k) => typeof v[k] === "string",
        ) ||
        !Number.isFinite(v.scroll) ||
        (v.variant !== undefined &&
          ![
            "",
            "sm",
            "md",
            "lg",
            "xl",
            "2xl",
            "max-sm",
            "max-md",
            "max-lg",
            "max-xl",
            "max-2xl",
          ].includes(v.variant))
      )
        throw new Error("Invalid view");
    }
    const base = defaults();
    const sizes = parsed.sizes ?? {};
    parsed.sizes = {
      sidebar: clamp(sizes.sidebar, 140, 340, base.sizes.sidebar),
      results: clamp(sizes.results, 230, 640, base.sizes.results),
      colorWall: clamp(sizes.colorWall, 140, 720, base.sizes.colorWall),
    };
    parsed.colorCollapsed = Array.isArray(parsed.colorCollapsed)
      ? parsed.colorCollapsed.filter(
          (x: unknown): x is string => typeof x === "string",
        )
      : [];
    parsed.lastColor =
      parsed.lastColor &&
      typeof parsed.lastColor.palette === "string" &&
      typeof parsed.lastColor.shade === "string"
        ? parsed.lastColor
        : null;
    return { state: parsed, issue: false };
  } catch {
    return { state: defaults(), issue: true };
  }
}

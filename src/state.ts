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
export interface AppState {
  mode: Mode;
  views: Record<Mode, ViewState>;
  bookmarks: string[];
  recent: string[];
  searches: string[];
  theme: "dark" | "light" | "system";
  codeTheme: "midnight" | "candy" | "paper";
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
export const defaults = (): AppState => ({
  mode: "tailwind",
  views: {
    tailwind: view("tw-items-center"),
    css: view("css-align-items"),
    selectors: view("sel-has"),
  },
  bookmarks: [],
  recent: [],
  searches: [],
  theme: "dark",
  codeTheme: "midnight",
});
const modes = ["tailwind", "css", "selectors"];
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
    for (const mode of modes) {
      const v = parsed.views?.[mode];
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
    return { state: parsed, issue: false };
  } catch {
    return { state: defaults(), issue: true };
  }
}

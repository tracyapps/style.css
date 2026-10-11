/**
 * Glyphs come from Font Awesome (solid style).
 *
 * This build ships the free set self-hosted. To switch to a Pro kit:
 * install `@fortawesome/fontawesome-pro` (needs your npm token) or load your
 * kit script, then swap the two CSS imports below — the icon names are the
 * same in Pro, so nothing else changes.
 */
import "@fortawesome/fontawesome-free/css/fontawesome.min.css";
import "@fortawesome/fontawesome-free/css/solid.min.css";

/** Font Awesome icon names for each desk category. */
export const categoryIcons: Record<string, string> = {
  Layout: "table-cells-large",
  "Flexbox & Grid": "table-cells",
  Spacing: "arrows-left-right",
  Sizing: "up-right-and-down-left-from-center",
  Typography: "font",
  Backgrounds: "paint-roller",
  Gradients: "fill-drip",
  Borders: "border-all",
  "Accents & SVG": "palette",
  Effects: "wand-magic-sparkles",
  Masks: "mask",
  Transforms: "arrows-up-down-left-right",
  Motion: "wave-square",
  Interaction: "hand-pointer",
  Accessibility: "universal-access",
  Responsive: "mobile-screen",
  Variants: "code-branch",
  Other: "box-open",
  Everything: "asterisk",
  Saved: "bookmark",
};

export const FALLBACK_ICON = "tag";

/** Glyphs for the syntax-theme buttons in preferences. */
export const codeThemeIcons: Record<string, string> = {
  midnight: "circle-half-stroke",
  candy: "wand-magic-sparkles",
  paper: "scroll",
};

export function iconFor(name: string): string {
  return `fa-solid fa-${categoryIcons[name] ?? FALLBACK_ICON}`;
}

export function CategoryIcon({ name }: { name: string }) {
  return <i aria-hidden="true" className={iconFor(name)} />;
}

import { useEffect, useRef, useState } from "react";
import { Check, ChevronRight } from "lucide-react";
import type { Entry } from "../types";
import type { EntryFamily } from "../families";
import {
  chipsColor,
  compareChips,
  palettes,
  PALETTE_ORDER,
  SHADE_ORDER,
} from "../grouping";

const SOLO_NAMES = new Set(["black", "white", "transparent", "current", "inherit"]);

function chipLabel(entry: Entry) {
  const name = entry.name.replace(/^-/, "");
  if (SOLO_NAMES.has(name.split("-").at(-1)!)) return name.split("-").at(-1)!;
  const parts = name.split("-");
  return `${parts.at(-2)}-${parts.at(-1)}`;
}

/**
 * One paint chip: paper frame, swatch, and a chin label. Clicking copies the
 * class name (and selects it when a picker is attached).
 */
export function PaintChip({
  entry,
  prefix = "",
  onPick,
  selected = false,
  compact = false,
  copy,
}: {
  entry: Entry;
  prefix?: string;
  onPick?: (e: Entry) => void;
  selected?: boolean;
  compact?: boolean;
  copy: (text: string) => Promise<void>;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const color = chipsColor(entry);
  const text =
    prefix && !entry.name.includes(":") ? `${prefix}:${entry.name}` : entry.name;
  const special =
    color === "transparent" || color === "inherit" || color === "currentColor";
  return (
    <button
      type="button"
      className={`paint-chip ${compact ? "compact" : ""} ${selected ? "selected" : ""} ${special ? entry.name.split("-").at(-1) : ""}`}
      style={special ? undefined : ({ "--chip": color } as React.CSSProperties)}
      aria-label={`Copy ${text}`}
      aria-pressed={selected}
      title={`${text} · ${color}`}
      onClick={async () => {
        try {
          await copy(text);
          setCopied(true);
          clearTimeout(timer.current);
          timer.current = setTimeout(() => setCopied(false), 1300);
        } catch {
          /* the caller reports clipboard failures */
        }
        onPick?.(entry);
      }}
    >
      <span className="chip-swatch">
        {copied && (
          <span className="chip-copied">
            <Check size={compact ? 12 : 16} strokeWidth={3} />
          </span>
        )}
      </span>
      <span className="chip-chin">{copied ? "copied" : chipLabel(entry)}</span>
    </button>
  );
}

function paletteOf(entry: Entry) {
  return (
    entry.name.match(/^-?[a-z][a-z-]*-([a-z]+)-\d{2,3}$/)?.[1] ?? "solos"
  );
}

function stripPreview(palette: string) {
  if (palette === "solos")
    return "repeating-linear-gradient(45deg, #cfcaba 0 5px, #f7f4e7 5px 10px)";
  const shades = palettes[palette];
  if (!shades) return "transparent";
  return `linear-gradient(90deg, ${SHADE_ORDER.map((s) => shades[s]).join(", ")})`;
}

/**
 * The paint aisle as collapsible rows: every palette spans the full width,
 * light to dark, in Tailwind's theme order (red, orange, amber, …).
 */
export function PaintChipWall({
  family,
  selected,
  prefix,
  onSelect,
  copy,
  collapsed,
  onToggle,
}: {
  family: EntryFamily;
  selected: Entry;
  prefix: string;
  onSelect: (e: Entry) => void;
  copy: (text: string) => Promise<void>;
  /** Controlled accordion state (persisted); omit for local state. */
  collapsed?: string[];
  onToggle?: (palette: string) => void;
}) {
  const activePalette = paletteOf(selected);
  const rows = new Map<string, Entry[]>();
  for (const member of [...family.members].sort(compareChips)) {
    const palette = paletteOf(member);
    if (!rows.has(palette)) rows.set(palette, []);
    rows.get(palette)!.push(member);
  }
  // Uncontrolled walls (the reference panel) start with only the active
  // palette open; controlled ones (the Colors tab) read the desk preference.
  const [local, setLocal] = useState<string[] | null>(null);
  const isCollapsed = (palette: string) => {
    if (collapsed) return collapsed.includes(palette);
    if (local === null) return palette !== activePalette;
    return local.includes(palette);
  };
  const toggle = (palette: string) => {
    if (onToggle) {
      onToggle(palette);
      return;
    }
    const current =
      local ?? [...rows.keys()].filter((p) => p !== activePalette);
    setLocal(
      current.includes(palette)
        ? current.filter((x) => x !== palette)
        : [...current, palette],
    );
  };
  const ordered = [...rows.entries()].sort(([a], [b]) => {
    if (a === "solos") return 1;
    if (b === "solos") return -1;
    return PALETTE_ORDER.indexOf(a) - PALETTE_ORDER.indexOf(b);
  });
  const open = ordered.filter(([palette]) => !isCollapsed(palette));
  const shut = ordered.filter(([palette]) => isCollapsed(palette));
  return (
    <div
      className="paint-wall"
      role="group"
      aria-label={`${family.name} paint chips`}
    >
      {open.map(([palette, members]) => (
        <div
          key={palette}
          className={`paint-acc open ${palette === activePalette ? "active" : ""}`}
        >
          <button
            type="button"
            className="paint-acc-head"
            aria-expanded={true}
            aria-label={`Fold up ${palette === "solos" ? "special values" : palette}`}
            onClick={() => toggle(palette)}
          >
            <ChevronRight size={12} className="acc-chevron" />
            <span className="paint-acc-name">
              {palette === "solos" ? "solos" : palette}
            </span>
            <span
              className="paint-acc-strip"
              style={{ background: stripPreview(palette) }}
            />
            <span className="paint-acc-count">{members.length}</span>
          </button>
          <div className="paint-acc-body">
            {members.map((member) => (
              <PaintChip
                key={member.id}
                entry={member}
                prefix={prefix}
                selected={member.id === selected.id}
                onPick={onSelect}
                copy={copy}
              />
            ))}
          </div>
        </div>
      ))}
      {shut.length > 0 && (
        <div className="paint-tray" role="group" aria-label="Folded palettes">
          <span className="paint-tray-label">folded</span>
          {shut.map(([palette]) => (
            <button
              key={palette}
              type="button"
              className={`paint-pill ${palette === activePalette ? "active" : ""}`}
              aria-label={`Open ${palette === "solos" ? "special values" : palette}`}
              onClick={() => toggle(palette)}
            >
              <span
                className="pill-strip"
                style={{ background: stripPreview(palette) }}
              />
              <span className="pill-name">
                {palette === "solos" ? "solos" : palette}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** A one-palette preview strip for result rows. */
export function PaintChipStrip({
  family,
  selected,
  prefix,
  copy,
}: {
  family: EntryFamily;
  selected: Entry;
  prefix: string;
  copy: (text: string) => Promise<void>;
}) {
  const palette = paletteOf(
    selected.id === family.representative.id ? selected : family.representative,
  );
  const members = family.members
    .filter((m) => paletteOf(m) === palette && paletteOf(m) !== "solos")
    .sort(compareChips);
  const solos = family.members.filter((m) => paletteOf(m) === "solos");
  return (
    <div className="paint-strip" aria-hidden="true">
      {members.slice(0, 11).map((member) => (
        <PaintChip
          key={member.id}
          entry={member}
          prefix={prefix}
          compact
          selected={member.id === selected.id}
          copy={copy}
        />
      ))}
      {solos.slice(0, 2).map((member) => (
        <PaintChip
          key={member.id}
          entry={member}
          prefix={prefix}
          compact
          copy={copy}
        />
      ))}
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import type { Entry } from "../types";
import type { EntryFamily } from "../families";
import { chipsColor, compareChips } from "../grouping";

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
  const text = prefix && !entry.name.includes(":") ? `${prefix}:${entry.name}` : entry.name;
  const special =
    color === "transparent" || color === "inherit" || color === "currentColor";
  return (
    <button
      type="button"
      className={`paint-chip ${compact ? "compact" : ""} ${selected ? "selected" : ""} ${special ? entry.name.split("-").at(-1) : ""}`}
      style={special ? undefined : { "--chip": color } as React.CSSProperties}
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
    entry.name.match(/^-?[a-z][a-z-]*-([a-z]+)-\d{2,3}$/)?.[1] ?? "\u0000solos"
  );
}

/** The full paint aisle: every palette in the family, one row per palette. */
export function PaintChipWall({
  family,
  selected,
  prefix,
  onSelect,
  copy,
}: {
  family: EntryFamily;
  selected: Entry;
  prefix: string;
  onSelect: (e: Entry) => void;
  copy: (text: string) => Promise<void>;
}) {
  const rows = new Map<string, Entry[]>();
  for (const member of [...family.members].sort(compareChips)) {
    const palette = paletteOf(member);
    if (!rows.has(palette)) rows.set(palette, []);
    rows.get(palette)!.push(member);
  }
  const activePalette = paletteOf(selected);
  const ordered = [...rows.entries()].sort(([a], [b]) =>
    a === activePalette ? -1 : b === activePalette ? 1 : a.localeCompare(b),
  );
  return (
    <div className="paint-wall" role="group" aria-label={`${family.name} paint chips`}>
      {ordered.map(([palette, members]) => (
        <div key={palette} className={`paint-row ${palette === activePalette ? "active" : ""}`}>
          <span className="paint-row-label">
            {palette === "\u0000solos" ? "solos" : palette}
          </span>
          <div className="paint-row-chips">
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
  const palette = paletteOf(selected.id === family.representative.id ? selected : family.representative);
  const members = family.members
    .filter((m) => paletteOf(m) === palette && !paletteOf(m).startsWith("\u0000"))
    .sort(compareChips);
  const solos = family.members.filter((m) => paletteOf(m).startsWith("\u0000"));
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
        <PaintChip key={member.id} entry={member} prefix={prefix} compact copy={copy} />
      ))}
    </div>
  );
}

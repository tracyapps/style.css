import { ChevronsDownUp, ChevronsUpDown } from "lucide-react";
import type { Entry } from "../types";
import type { EntryFamily } from "../families";
import { PaintChipWall } from "./PaintChips";
import CopyButton from "./CopyButton";
import ResizeHandle from "./ResizeHandle";

/**
 * The always-on paint shelf at the top of the Colors desk: every palette
 * spans the width as a collapsible row, and picking a chip copies the class
 * and populates the example underneath.
 */
export default function ColorPanel({
  family,
  selected,
  onSelect,
  copy,
  collapsed,
  onToggle,
  onCollapseAll,
  onExpandAll,
  wallMax,
  onWallMax,
}: {
  family: EntryFamily;
  selected: Entry;
  onSelect: (e: Entry) => void;
  copy: (text: string) => Promise<void>;
  collapsed: string[];
  onToggle: (palette: string) => void;
  onCollapseAll: () => void;
  onExpandAll: () => void;
  wallMax: number;
  onWallMax: (n: number) => void;
}) {
  const allCollapsed = collapsed.length > 0;
  return (
    <section
      className="color-panel"
      aria-label="Tailwind color shelf"
      style={{ maxHeight: `min(${wallMax}px, 50%)` }}
    >
      <header className="color-panel-head">
        <div className="color-panel-title">
          <code>{family.name}</code>
          <span className="color-panel-count">
            {family.members.length.toLocaleString()} classes
          </span>
        </div>
        <div className="color-panel-tools">
          <span className="handwritten">pick a chip ↓</span>
          <CopyButton
            text={selected.name}
            label={`Copy ${selected.name}`}
            caption={selected.name}
            onCopy={copy}
          />
          <button
            className="panel-tool"
            onClick={allCollapsed ? onExpandAll : onCollapseAll}
            title={allCollapsed ? "Expand every palette" : "Collapse every palette"}
          >
            {allCollapsed ? (
              <ChevronsUpDown size={14} />
            ) : (
              <ChevronsDownUp size={14} />
            )}
            {allCollapsed ? "open all" : "fold all"}
          </button>
        </div>
      </header>
      <div className="color-wall-scroll">
        <PaintChipWall
          family={family}
          selected={selected}
          prefix=""
          onSelect={onSelect}
          copy={copy}
          collapsed={collapsed}
          onToggle={onToggle}
        />
      </div>
      <ResizeHandle
        axis="y"
        size={wallMax}
        min={140}
        max={720}
        onSize={onWallMax}
        label="Resize color shelf"
      />
    </section>
  );
}

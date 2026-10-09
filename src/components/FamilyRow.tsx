import { Bookmark, ChevronRight } from "lucide-react";
import type { Entry } from "../types";
import type { EntryFamily } from "../families";
import CopyButton from "./CopyButton";
export default function FamilyRow({
  family,
  selected,
  variant,
  bookmarks,
  onSelect,
  onBookmark,
  onCopy,
}: {
  family: EntryFamily;
  selected: Entry;
  variant: string;
  bookmarks: string[];
  onSelect: (e: Entry) => void;
  onBookmark: (e: Entry) => void;
  onCopy: (text: string) => Promise<void>;
}) {
  const selectedMember = family.members.find(
    (e) => e.id === selected.id || e.name === selected.name,
  );
  const active = !!selectedMember;
  const entry = active ? selectedMember! : family.representative;
  const name =
    variant && !family.name.includes(":")
      ? `${variant}:${family.name}`
      : family.name;
  const saved = bookmarks.includes(entry.id);
  const copyName =
    variant && entry.mode === "tailwind" && !entry.name.includes(":")
      ? `${variant}:${entry.name}`
      : entry.name;
  const copyText = entry.mode === "selectors" ? entry.syntax : copyName;
  return (
    <div className={`result-row ${active ? "selected" : ""}`}>
      <button
        className="result-select"
        aria-label={`Open ${name}`}
        aria-pressed={active}
        onClick={() => onSelect(entry)}
      >
        <span className="result-title">
          <code>{name}</code>
          {active && <ChevronRight size={16} />}
        </span>
        <span className="result-description">
          {active && family.members.length > 1
            ? `Selected: ${selected.name}. `
            : ""}
          {entry.description}
        </span>
        <span className="result-category">
          {entry.category}
          {family.members.length > 1 &&
            ` · ${family.members.length.toLocaleString()} classes`}
        </span>
      </button>
      <CopyButton
        text={copyText}
        label={`Copy ${copyText}`}
        className="row-copy"
        onCopy={onCopy}
      />
      <button
        className={`row-bookmark ${saved ? "bookmarked" : ""}`}
        aria-label={`${saved ? "Unbookmark" : "Bookmark"} ${entry.name}`}
        onClick={() => onBookmark(entry)}
      >
        <Bookmark size={15} fill={saved ? "currentColor" : "none"} />
      </button>
    </div>
  );
}

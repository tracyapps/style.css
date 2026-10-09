import { useEffect, useRef, useState } from "react";
import {
  Bookmark,
  Sparkles,
  ArrowUpRight,
  ChevronRight,
  ExternalLink,
  Braces,
  SlidersHorizontal,
  Copy,
} from "lucide-react";
import type { Entry } from "../types";
import type { AppState } from "../state";
import { byId, meta } from "../reference";
import { demoFor, initialValue, previewDocument } from "../demo";
import Code from "./CodeBlock";
export default function Detail({
  entry,
  state,
  save,
  select,
  toast,
}: {
  entry: Entry;
  state: AppState;
  save: (s: AppState) => void;
  select: (e: Entry) => void;
  toast: (s: string) => void;
}) {
  const [tab, setTab] = useState<"reference" | "try">("reference");
  const [value, setValue] = useState("");
  const [direction, setDirection] = useState("row");
  const detailRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    setValue(initialValue(entry));
    setTab("reference");
    detailRef.current?.scrollTo(0, 0);
  }, [entry.id]);
  const bookmarked = state.bookmarks.includes(entry.id);
  const cssEntry =
    entry.mode === "tailwind"
      ? byId.get(`css-${entry.cssProperty}`)
      : undefined;
  const support = entry.support || cssEntry?.support;
  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast("Copied. Go make something.");
    } catch {
      toast("Clipboard unavailable. Select and copy the code manually.");
      throw new Error("Clipboard unavailable");
    }
  };
  const demo = demoFor(entry, value, direction);
  const doc = previewDocument(demo.html, demo.css);
  const related = [...new Set(entry.related)]
    .map((id) => byId.get(id))
    .filter(
      (x): x is Entry => !!x && x.id !== entry.id && x.mode === entry.mode,
    )
    .slice(0, 8);
  const referenceCode =
    entry.mode === "css"
      ? `.example {\n  ${entry.name === "--*" ? "--brand-color" : entry.name}: ${value || initialValue(entry)};\n}`
      : entry.code;
  return (
    <article
      className="detail-panel"
      ref={detailRef}
      aria-label="Reference detail"
    >
      <div className="entry-heading">
        <div>
          <div className="eyebrow">
            {entry.category}{" "}
            <span>
              {" "}
              /{" "}
              {entry.mode === "tailwind"
                ? "UTILITY CLASS"
                : entry.mode === "css"
                  ? "PROPERTY"
                  : "SELECTOR"}
            </span>
          </div>
          <h2>{entry.name}</h2>
        </div>
        <button
          className={`icon-button save-entry ${bookmarked ? "bookmarked" : ""}`}
          title={bookmarked ? "Remove bookmark" : "Bookmark reference"}
          aria-label={bookmarked ? "Remove bookmark" : "Bookmark reference"}
          aria-pressed={bookmarked}
          onClick={() =>
            save({
              ...state,
              bookmarks: bookmarked
                ? state.bookmarks.filter((x) => x !== entry.id)
                : [...state.bookmarks, entry.id],
            })
          }
        >
          <Bookmark size={21} fill={bookmarked ? "currentColor" : "none"} />
        </button>
      </div>
      <p className="entry-description">{entry.description}</p>
      <div className="detail-tabs">
        <button
          className={tab === "reference" ? "active" : ""}
          onClick={() => setTab("reference")}
        >
          The reference
        </button>
        <button
          className={tab === "try" ? "active" : ""}
          onClick={() => setTab("try")}
        >
          Play with it <Sparkles size={13} />
        </button>
        <a href={entry.docs} target="_blank" rel="noreferrer">
          Docs <ArrowUpRight size={15} />
        </a>
      </div>
      {tab === "reference" ? (
        <>
          <div className="section-label">
            THE SHORT VERSION <span>✂</span>
          </div>
          <Code
            code={referenceCode}
            title={entry.mode === "tailwind" ? "COMPILED CSS" : "CSS"}
            onCopy={copy}
          />
          {entry.mode === "tailwind" && (
            <div className="class-snippet">
              <code>{entry.name}</code>
              <button onClick={() => void copy(entry.name).catch(() => {})}>
                <Copy size={13} /> Copy class
              </button>
            </div>
          )}
          {entry.mode === "tailwind" && (
            <p className="small-muted">
              Compiled for Tailwind {meta.tailwindVersion}. Theme variables and
              shared registrations come from Tailwind; use the class in a
              Tailwind project.
            </p>
          )}
          <div className="preview-note">
            <div className="section-label">
              SEE IT IN ACTION{" "}
              <span className="handwritten">a little show & tell ↴</span>
            </div>
            <iframe
              title={`Live example of ${entry.name}`}
              sandbox=""
              srcDoc={doc}
            />
            <div className="preview-caption">
              {demo.kind === "alignment"
                ? "Three items. One container. A little room to move."
                : "Illustrative sandbox · switch to Play with it to inspect the example."}
              <button onClick={() => setTab("try")}>
                Tinker <SlidersHorizontal size={13} />
              </button>
            </div>
          </div>
          {entry.mode !== "tailwind" && (
            <>
              <div className="section-label">
                {entry.mode === "selectors"
                  ? "SELECTOR SYNTAX"
                  : "VALUES & SYNTAX"}
              </div>
              <div className="syntax">
                <code>{entry.syntax}</code>
              </div>
              <div className="value-chips">
                {entry.values.map((v) => (
                  <button
                    key={v}
                    disabled={!CSS.supports(entry.name, v)}
                    title={
                      CSS.supports(entry.name, v)
                        ? `Try ${v}`
                        : "Grammar token; enter a complete value in the lab"
                    }
                    className={value === v ? "active" : ""}
                    onClick={() => setValue(v)}
                  >
                    <code>{v}</code>
                  </button>
                ))}
              </div>
              {entry.mode === "css" && (
                <p className="small-muted">
                  Keywords and types from the formal grammar. Types such as
                  &lt;length&gt; allow open-ended values; all properties also
                  accept CSS-wide keywords.
                </p>
              )}
            </>
          )}
          {/(align|justify|place)/.test(entry.cssProperty || entry.name) && (
            <aside className="margin-note">
              <span className="handwritten">wait, which axis?</span>
              <p>
                <strong>Flexbox:</strong> justify-content moves items along the
                main axis. align-items moves them across it. align-content moves
                wrapped lines when there’s spare space. justify-items has no
                effect on flex items.
              </p>
              <p>
                <strong>Grid:</strong> justify is inline; align is block.
                “items” aligns within cells; “content” aligns the whole grid.
              </p>
            </aside>
          )}
        </>
      ) : (
        <>
          <div className="section-label">
            THE LITTLE LAB <span className="handwritten">poke it!</span>
          </div>
          <div className="lab-controls">
            {entry.mode === "css" && (
              <label>
                Value
                <input
                  aria-label="Preview value"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                />
              </label>
            )}
            {/^(align-|justify-|place-)/.test(
              entry.cssProperty || entry.name,
            ) && (
              <label>
                Flex direction
                <select
                  value={direction}
                  onChange={(e) => setDirection(e.target.value)}
                >
                  <option>row</option>
                  <option>column</option>
                </select>
              </label>
            )}
          </div>
          <iframe
            className="lab-frame"
            title={`Interactive preview of ${entry.name}`}
            sandbox=""
            srcDoc={doc}
          />
          <p className="small-muted">
            A contained example. Browser behavior depends on the surrounding
            layout; inspect the code below.
          </p>
          <Code
            code={entry.mode === "tailwind" ? entry.code : demo.css}
            title="EXAMPLE CSS"
            onCopy={copy}
          />
          <Code
            code={demo.html}
            language="markup"
            title="EXAMPLE HTML"
            onCopy={copy}
          />
          {entry.mode === "tailwind" && (
            <Code
              code={`<div class="${entry.name}">...</div>`}
              language="markup"
              title="TAILWIND HTML"
              onCopy={copy}
            />
          )}{" "}
        </>
      )}
      {related.length > 0 && (
        <section className="related">
          <div className="section-label">IN THE SAME NEIGHBORHOOD</div>
          <div>
            {related.map((e) => (
              <button key={e.id} onClick={() => select(e)}>
                <code>{e.name}</code>
                <ChevronRight size={14} />
              </button>
            ))}
          </div>
        </section>
      )}
      {cssEntry && (
        <button className="cross-link" onClick={() => select(cssEntry)}>
          <Braces size={15} /> Under the hood: {cssEntry.name}
          <ArrowUpRight size={15} />
        </button>
      )}
      {support?.length ? (
        <section className="support">
          <div className="section-label">
            BROWSER SUPPORT{" "}
            <a
              href={cssEntry?.docs || entry.docs}
              target="_blank"
              rel="noreferrer"
            >
              Full table <ExternalLink size={12} />
            </a>
          </div>
          <div className="support-grid">
            {support.map((s) => (
              <div
                key={s.browser}
                className={
                  s.version === false || s.version === null
                    ? "unsupported"
                    : s.partial
                      ? "partial"
                      : ""
                }
                title={s.notes}
              >
                <span>{s.browser}</span>
                <strong>
                  {s.version === true
                    ? "Supported"
                    : s.version === false
                      ? "No support"
                      : s.version === null
                        ? "Unknown"
                        : `${s.version}+`}
                  {s.partial ? " †" : ""}
                </strong>
              </div>
            ))}
          </div>
          <p className="small-muted">
            Minimum versions for the base{" "}
            {entry.mode === "selectors" ? "selector" : "property"}; individual
            values may differ.{" "}
            {support.some((s) => s.partial) ? "† Restrictions apply. " : ""}
            Snapshot: {meta.compatDate?.slice(0, 10)} · MDN BCD{" "}
            {meta.compatVersion}
          </p>
          {support
            .filter((s) => s.notes)
            .map((s) => (
              <p className="support-note" key={s.browser}>
                <strong>{s.browser}:</strong> {s.notes}
              </p>
            ))}
        </section>
      ) : (
        <p className="small-muted">
          No mapped compatibility table for this entry. Check its documentation
          for support.
        </p>
      )}
      <div className="reference-links">
        <a
          href={`https://caniuse.com/?search=${encodeURIComponent(entry.cssProperty || entry.name)}`}
          target="_blank"
          rel="noreferrer"
        >
          Caniuse <ArrowUpRight size={13} />
        </a>
        <a
          href="https://css-tricks.com/snippets/css/a-guide-to-flexbox/"
          target="_blank"
          rel="noreferrer"
        >
          CSS-Tricks <ArrowUpRight size={13} />
        </a>
        <a
          href="https://www.w3schools.com/cssref/index.php"
          target="_blank"
          rel="noreferrer"
        >
          W3Schools <ArrowUpRight size={13} />
        </a>
        {entry.mode === "selectors" && (
          <a
            href="https://webdesign.tutsplus.com/the-30-css-selectors-you-must-memorize--net-16048t"
            target="_blank"
            rel="noreferrer"
          >
            The selector article <ArrowUpRight size={13} />
          </a>
        )}
      </div>
      <p className="detail-footer">
        KEEP YOUR CODE CLEAN. YOUR DESK? OPTIONAL.
      </p>
    </article>
  );
}

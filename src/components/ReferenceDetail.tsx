import { useEffect, useRef, useState } from "react";
import {
  Bookmark,
  Sparkles,
  ArrowUpRight,
  ChevronRight,
  ExternalLink,
  Braces,
  SlidersHorizontal,
  Plus,
  X,
  Palette,
} from "lucide-react";
import type { Entry } from "../types";
import type { AppState } from "../state";
import { byId, meta } from "../reference";
import {
  demoFor,
  initialValue,
  previewDocument,
  initialGradient,
  isGradientEntry,
  gradientClasses,
  gradientCss,
  GRADIENT_TYPES,
  LINEAR_DIRECTIONS,
  STOP_POSITIONS,
  type GradientState,
  type GradientStop,
} from "../demo";
import { PALETTE_ORDER, SHADE_ORDER, palettes } from "../grouping";
import Code from "./CodeBlock";
import CopyButton from "./CopyButton";
import LivePreview from "./LivePreview";
import { PaintChipWall } from "./PaintChips";
import runtime from "../data/preview-runtime.css?raw";
import type { EntryFamily } from "../families";

const ANGLES = [0, 45, 90, 135, 180, 225, 270, 315].map((n) => `${n}deg`);

function StopEditor({
  stop,
  label,
  onChange,
  onToggle,
}: {
  stop: GradientStop | null;
  label: string;
  onChange: (s: GradientStop) => void;
  onToggle?: () => void;
}) {
  if (!stop)
    return (
      <div className="stop-editor empty">
        <span className="stop-name">{label}</span>
        <button className="stop-add" onClick={onToggle}>
          <Plus size={12} /> add a middle color
        </button>
      </div>
    );
  return (
    <div className="stop-editor">
      <span className="stop-name">{label}</span>
      <label className="stop-palette">
        <span>palette</span>
        <select
          aria-label={`${label} palette`}
          value={stop.palette}
          onChange={(e) => onChange({ ...stop, palette: e.target.value })}
        >
          {PALETTE_ORDER.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </label>
      <div className="stop-shades" role="group" aria-label={`${label} shade`}>
        {SHADE_ORDER.map((shade) => (
          <button
            key={shade}
            className={stop.shade === shade ? "active" : ""}
            style={{ background: palettes[stop.palette]?.[shade] }}
            aria-label={`${label} ${stop.palette} ${shade}`}
            aria-pressed={stop.shade === shade}
            onClick={() => onChange({ ...stop, shade })}
          >
            {shade}
          </button>
        ))}
        {onToggle && (
          <button
            className="stop-drop"
            aria-label="Remove via stop"
            onClick={onToggle}
          >
            <X size={12} />
          </button>
        )}
      </div>
      <label className="stop-position">
        <span>stop</span>
        <select
          aria-label={`${label} stop position`}
          value={stop.position}
          onChange={(e) => onChange({ ...stop, position: e.target.value })}
        >
          {STOP_POSITIONS.map((p) => (
            <option key={p} value={p}>
              {p || "auto"}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

export default function Detail({
  entry,
  state,
  save,
  select,
  copy,
  family,
  prefix,
  hideWall = false,
  colorLink,
}: {
  entry: Entry;
  family?: EntryFamily;
  prefix: string;
  /** The Colors tab shows its chip wall on the always-on shelf above. */
  hideWall?: boolean;
  /** Paint-chip sibling family on the Colors desk, for cross-linking. */
  colorLink?: EntryFamily;
  state: AppState;
  save: (s: AppState) => void;
  select: (e: Entry) => void;
  copy: (text: string) => Promise<void>;
}) {
  const [tab, setTab] = useState<"reference" | "try">("reference");
  const [value, setValue] = useState("");
  const [direction, setDirection] = useState("row");
  const [gradient, setGradient] = useState<GradientState>(() =>
    initialGradient(entry),
  );
  const detailRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    setValue(initialValue(entry));
  }, [entry.id]);
  const gradientEntry = entry.mode === "tailwind" && isGradientEntry(entry);
  useEffect(() => {
    if (gradientEntry) setGradient(initialGradient(entry));
  }, [entry.id, gradientEntry]);
  const referenceGroup = family?.key || entry.id;
  useEffect(() => {
    setTab("reference");
    detailRef.current?.scrollTo(0, 0);
  }, [referenceGroup]);
  const bookmarked = state.bookmarks.includes(entry.id);
  const cssEntry =
    entry.mode === "tailwind"
      ? byId.get(`css-${entry.cssProperty}`)
      : undefined;
  const support = entry.support || cssEntry?.support;
  const demo = demoFor(
    entry,
    value,
    direction,
    gradientEntry ? gradient : undefined,
  );
  const doc = previewDocument(demo.html, demo.css, runtime);
  const patchGradient = (patch: Partial<GradientState>) =>
    setGradient((g) => ({ ...g, ...patch }));
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
          <div className="entry-title">
            <h2>{entry.name}</h2>
            <CopyButton
              text={entry.mode === "selectors" ? entry.syntax : entry.name}
              label={`Copy ${entry.mode === "tailwind" ? "class name" : entry.mode === "css" ? "property name" : "selector"} ${entry.name}`}
              onCopy={copy}
            />
          </div>
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
      {family && family.kind === "chips" && !hideWall ? (
        <div className="family-picker chip-picker">
          <label>
            {family.name}{" "}
            <span>
              · {family.members.length.toLocaleString()} shades — click one to
              copy it
            </span>
          </label>
          <PaintChipWall
            family={family}
            selected={entry}
            prefix={prefix}
            onSelect={select}
            copy={copy}
          />
        </div>
      ) : (
        family &&
        family.members.length > 1 && (
          <div className="family-picker">
            <label>
              {family.name}{" "}
              <span>· {family.members.length.toLocaleString()} choices</span>
              <select
                aria-label="Choose a class in this family"
                value={entry.id}
                onChange={(e) => {
                  const chosen = byId.get(e.target.value);
                  if (chosen) select(chosen);
                }}
              >
                {[...family.members]
                  .sort((a, b) =>
                    a.name.localeCompare(b.name, undefined, { numeric: true }),
                  )
                  .map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name}
                    </option>
                  ))}
              </select>
            </label>
            <div className="family-values">
              {family.members
                .filter((e) => /-\d+(?:\.\d+)?$/.test(e.name))
                .slice(0, 12)
                .map((e) => (
                  <button
                    key={e.id}
                    className={e.id === entry.id ? "active" : ""}
                    aria-label={`Choose ${e.name}`}
                    aria-pressed={e.id === entry.id}
                    onClick={() => select(e)}
                  >
                    {e.name.split("-").at(-1)}
                  </button>
                ))}
            </div>
          </div>
        )
      )}
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
          <div className="preview-note">
            <div className="section-label">
              SEE IT IN ACTION{" "}
              <span className="handwritten">a little show & tell ↴</span>
            </div>
            <LivePreview
              document={doc}
              title={`Live example of ${entry.name}`}
              prefix={prefix}
            />
            <div className="preview-caption">
              {demo.kind === "decoration"
                ? "Underline supplied so decoration color, style, and thickness are visible."
                : demo.kind === "alignment"
                  ? "Three items. One container. A little room to move."
                  : demo.kind === "color"
                    ? "Painted with the selected shade."
                    : demo.kind === "gradient"
                      ? "Mixed in the lab below — switch to Play with it to remix."
                      : demo.kind === "background"
                        ? "The sticker image makes position, size, and repeat visible."
                        : "Illustrative sandbox · switch to Play with it to inspect the example."}
              <button onClick={() => setTab("try")}>
                Tinker <SlidersHorizontal size={13} />
              </button>
            </div>
          </div>
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
              <CopyButton
                text={entry.name}
                label="Copy class"
                caption="Copy class"
                onCopy={copy}
              />
            </div>
          )}
          {entry.mode === "tailwind" && (
            <p className="small-muted">
              Compiled for Tailwind {meta.tailwindVersion}. Theme variables and
              shared registrations come from Tailwind; use the class in a
              Tailwind project.
            </p>
          )}
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
          {gradientEntry && (
            <div className="gradient-lab">
              <div className="section-label">
                MIX A GRADIENT{" "}
                <span className="handwritten">real colors, real stops ↴</span>
              </div>
              <div className="lab-row">
                <label>
                  Kind
                  <select
                    aria-label="Gradient kind"
                    value={gradient.type}
                    onChange={(e) =>
                      patchGradient({
                        type: e.target.value as GradientState["type"],
                      })
                    }
                  >
                    {GRADIENT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </label>
                {gradient.type !== "radial" && (
                  <label>
                    {gradient.type === "conic" ? "From angle" : "Direction"}
                    <select
                      aria-label="Gradient direction"
                      value={gradient.direction}
                      onChange={(e) =>
                        patchGradient({ direction: e.target.value })
                      }
                    >
                      {gradient.type === "linear" &&
                        LINEAR_DIRECTIONS.map(([css]) => (
                          <option key={css} value={css}>
                            {css}
                          </option>
                        ))}
                      {ANGLES.map((a) => (
                        <option key={a} value={a}>
                          {a}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
              </div>
              <StopEditor
                label="from"
                stop={gradient.from}
                onChange={(from) => patchGradient({ from })}
              />
              <StopEditor
                label="via"
                stop={gradient.via}
                onChange={(via) => patchGradient({ via })}
                onToggle={() =>
                  patchGradient({
                    via: gradient.via
                      ? null
                      : { ...gradient.from, position: "" },
                  })
                }
              />
              <StopEditor
                label="to"
                stop={gradient.to}
                onChange={(to) => patchGradient({ to })}
              />
              <div
                className="gradient-swatch"
                style={{ background: gradientCss(gradient) }}
                aria-hidden="true"
              />
              <div className="gradient-classes">
                <code>{gradientClasses(gradient)}</code>
                <CopyButton
                  text={gradientClasses(gradient)}
                  label="Copy gradient classes"
                  caption="Copy classes"
                  onCopy={copy}
                />
              </div>
              <p className="small-muted">
                The classes above are the real Tailwind recipe for the gradient
                you mixed. <code>via</code> is optional; stop positions come
                from <code>from-10%</code>-style classes.
              </p>
            </div>
          )}
          <LivePreview
            document={doc}
            title={`Interactive preview of ${entry.name}`}
            prefix={prefix}
            lab
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
      {colorLink && (
        <button
          className="cross-link paint-link"
          onClick={() => select(colorLink.representative)}
        >
          <Palette size={15} /> Paint it: {colorLink.name} on the color shelf
          <ArrowUpRight size={15} />
        </button>
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

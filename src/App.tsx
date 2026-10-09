import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  Bookmark,
  Settings2,
  ArrowUpRight,
  Check,
  X,
  Clock3,
  SlidersHorizontal,
  Moon,
  Sun,
  ChevronRight,
  Braces,
  Layers,
  Hash,
  ArrowLeft,
} from "lucide-react";

import { entries, byId, meta } from "./reference";
import Code from "./components/CodeBlock";
import Detail from "./components/ReferenceDetail";
import FamilyRow from "./components/FamilyRow";
import { familyKey, groupEntries } from "./families";
import {
  breakpoints,
  parseResponsiveSearch,
  responsivePrefix,
  responsiveEntry,
} from "./responsive";

import type { Entry, Mode } from "./types";
import {
  defaults,
  readState,
  STORAGE_KEY,
  type AppState,
  type ViewState,
} from "./state";
import { findEntries } from "./search";

const modes: Mode[] = ["tailwind", "css", "selectors"];
const labels = { tailwind: "Tailwind", css: "CSS", selectors: "Selectors" };
const categoryIcons: Record<string, string> = {
  Layout: "▦",
  "Flexbox & Grid": "▤",
  Spacing: "↔",
  Sizing: "⤢",
  Typography: "Aa",
  Backgrounds: "◩",
  Borders: "▣",
  Effects: "✳",
  Transforms: "⤨",
  Animation: "◎",
  Interactivity: "☞",
  Accessibility: "◉",
  Colors: "◐",
};
const modeEntries = Object.fromEntries(
  modes.map((m) => [m, entries.filter((e) => e.mode === m)]),
) as Record<Mode, Entry[]>;
const tailwindFamilies = new Map(
  groupEntries(modeEntries.tailwind).map((f) => [f.key, f]),
);
export default function App() {
  const [initial] = useState(() => {
    try {
      return readState(localStorage);
    } catch {
      return { state: defaults(), issue: true };
    }
  });
  const [state, setState] = useState<AppState>(initial.state);
  const [storageIssue, setStorageIssue] = useState(initial.issue);
  const [notice, setNotice] = useState("");
  const [pageSize, setPageSize] = useState(80);
  const scrollTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const restoreScroll = useRef(0);
  const [mobileDetail, setMobileDetail] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const deskRef = useRef<HTMLDivElement>(null);
  const view = state.views[state.mode];
  const responsiveSearch =
    state.mode === "tailwind"
      ? parseResponsiveSearch(view.query)
      : { prefix: "", query: view.query };
  const variant =
    state.mode === "tailwind"
      ? responsiveSearch.prefix || view.variant || ""
      : "";
  const searchView = { ...view, query: responsiveSearch.query };
  const source = modeEntries[state.mode];
  const categories = useMemo(
    () =>
      [...new Set(source.map((e) => e.category))].sort((a, b) =>
        a === "Responsive" || a === "Flexbox & Grid"
          ? -1
          : b === "Responsive" || b === "Flexbox & Grid"
            ? 1
            : a.localeCompare(b),
      ),
    [source],
  );
  const matches = useMemo(
    () =>
      findEntries(
        variant && view.category !== "Responsive" && view.scope === "all"
          ? source.filter((e) => !responsivePrefix(e.name))
          : source,
        searchView,
        state.bookmarks,
        state.recent,
      ),
    [
      source,
      view.query,
      view.category,
      view.scope,
      view.sort,
      variant,
      state.bookmarks,
      state.recent,
    ],
  );
  const groups = useMemo(() => groupEntries(matches), [matches]);
  const rawEntry = byId.get(view.selected) || source[0];
  const nativePrefix = responsivePrefix(rawEntry.name);
  const baseEntry = nativePrefix
    ? byId.get(`tw-${rawEntry.name.slice(nativePrefix.length + 1)}`) || rawEntry
    : rawEntry;
  const entry = responsiveEntry(baseEntry, variant || nativePrefix);
  const family =
    state.mode === "tailwind"
      ? tailwindFamilies.get(familyKey(baseEntry))
      : undefined;
  const dockDesk = () => {
    if ((deskRef.current?.getBoundingClientRect().top || 0) > 1)
      deskRef.current?.scrollIntoView({ block: "start" });
  };
  useEffect(() => {
    const desk = deskRef.current;
    if (!desk) return;
    const dock = (e: WheelEvent) => {
      const top = desk.getBoundingClientRect().top;
      if (top > 1 && e.deltaY > 0) {
        e.preventDefault();
        window.scrollBy(0, Math.min(top, e.deltaY));
      }
    };
    desk.addEventListener("wheel", dock, { passive: false, capture: true });
    return () => desk.removeEventListener("wheel", dock, true);
  }, []);
  const save = (next: AppState) => setState(next);
  const patchView = (patch: Partial<ViewState>) => {
    clearTimeout(scrollTimer.current);
    if (listRef.current) listRef.current.scrollTop = 0;
    setPageSize(80);
    setState((s) => ({
      ...s,
      views: {
        ...s.views,
        [s.mode]: { ...s.views[s.mode], ...patch, scroll: 0 },
      },
    }));
  };
  const rememberScroll = () => {
    clearTimeout(scrollTimer.current);
    const scroll = listRef.current?.scrollTop || 0;
    const mode = state.mode;
    scrollTimer.current = setTimeout(
      () =>
        setState((s) => ({
          ...s,
          views: { ...s.views, [mode]: { ...s.views[mode], scroll } },
        })),
      150,
    );
  };
  const toast = (text: string) => setNotice(text);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 3000);
    return () => clearTimeout(timer);
  }, [notice]);
  useEffect(() => {
    if (storageIssue) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      setStorageIssue(true);
    }
  }, [state, storageIssue]);
  useEffect(() => {
    const m = matchMedia("(prefers-color-scheme: light)");
    const update = () =>
      (document.documentElement.dataset.theme =
        state.theme === "system"
          ? m.matches
            ? "light"
            : "dark"
          : state.theme);
    update();
    m.addEventListener("change", update);
    return () => m.removeEventListener("change", update);
  }, [state.theme]);
  useEffect(() => {
    document.documentElement.dataset.code = state.codeTheme;
  }, [state.codeTheme]);
  useLayoutEffect(() => {
    restoreScroll.current = view.scroll;
    setPageSize(Math.max(80, Math.ceil(view.scroll / 100) + 20));
    if (listRef.current) listRef.current.scrollTop = view.scroll;
  }, [state.mode]);
  useLayoutEffect(() => {
    if (listRef.current && restoreScroll.current) {
      listRef.current.scrollTop = restoreScroll.current;
      restoreScroll.current = 0;
    }
  }, [pageSize, state.mode]);
  useEffect(() => () => clearTimeout(scrollTimer.current), []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        (e.key === "k" && (e.metaKey || e.ctrlKey)) ||
        (e.key === "/" &&
          !["INPUT", "TEXTAREA", "SELECT"].includes(
            (e.target as HTMLElement).tagName,
          ))
      ) {
        e.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      }
      if (e.key === "Escape") {
        searchRef.current?.blur();
        setMobileDetail(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  useEffect(() => {
    if (!view.query.trim()) return;
    const q = view.query.trim();
    const t = setTimeout(
      () =>
        setState((s) => ({
          ...s,
          searches: [
            `${state.mode}:${q}`,
            ...s.searches.filter((x) => x !== `${state.mode}:${q}`),
          ].slice(0, 12),
        })),
      1200,
    );
    return () => clearTimeout(t);
  }, [view.query, state.mode]);
  const switchMode = (mode: Mode) => {
    clearTimeout(scrollTimer.current);
    setState((s) => ({
      ...s,
      mode,
      views: {
        ...s.views,
        [s.mode]: {
          ...s.views[s.mode],
          scroll: listRef.current?.scrollTop || 0,
        },
      },
    }));
  };
  const select = (e: Entry) => {
    dockDesk();
    const prefix = responsivePrefix(e.name);
    setState((s) => ({
      ...s,
      mode: e.mode,
      views: {
        ...s.views,
        [s.mode]: {
          ...s.views[s.mode],
          scroll: listRef.current?.scrollTop || 0,
        },
        [e.mode]: {
          ...s.views[e.mode],
          selected: e.id,
          ...(prefix ? { variant: prefix } : {}),
          ...(s.mode === e.mode
            ? { scroll: listRef.current?.scrollTop || 0 }
            : {}),
        },
      },
      recent: [e.id, ...s.recent.filter((id) => id !== e.id)].slice(0, 24),
    }));
    setMobileDetail(true);
  };
  const clearFilters = () =>
    patchView({ query: "", category: "All", scope: "all" });
  const recent = state.recent
    .map((id) => byId.get(id))
    .filter((e): e is Entry => !!e && e.mode === state.mode)
    .slice(0, 4);
  const common = (
    state.mode === "tailwind"
      ? ["tw-flex", "tw-grid", "tw-justify-center", "tw-gap-4"]
      : state.mode === "css"
        ? [
            "css-justify-content",
            "css-align-items",
            "css-display",
            "css-grid-template-columns",
          ]
        : ["sel-has", "sel-not", "sel-nth-child", "sel-where"]
  )
    .map((id) => byId.get(id))
    .filter((e): e is Entry => !!e);
  return (
    <>
      <div className="app-shell">
        <section className="masthead" aria-label="Style Junkie">
          <div className="masthead-type">
            <div className="issue-tag">ISSUE 001 / THE REFERENCE DESK</div>
            <h1>
              <span className="style-word">STYLE</span>
              <span className="junkie-word">
                JUNKIE<span className="title-star">✳</span>
              </span>
            </h1>
            <div className="masthead-caption">
              <span className="handwritten">
                less remembering. more making.
              </span>
              <span className="edition-stamp">
                EST.
                <br />
                1996-ish
              </span>
            </div>
          </div>
          <img
            src="/collage.png"
            alt="A pink-hatted giraffe, flamingo, vintage computer, taco truck and joystick cut out of a very strange magazine"
            className="collage"
          />
          <span className="collage-label">the internet is your scrapbook.</span>
        </section>
        <div className="reference-desk" id="reference-desk" ref={deskRef}>
          <header className="topline">
            <a href="/" className="mini-logo">
              [ sj. ]
            </a>
            <span>A FIELD GUIDE FOR THE WEB-OBSESSED</span>
            <div>
              <button
                className={`top-button ${view.scope === "saved" ? "active" : ""}`}
                onClick={() =>
                  patchView({
                    scope: view.scope === "saved" ? "all" : "saved",
                    category: "All",
                    query: "",
                  })
                }
              >
                <Bookmark size={15} /> Saved{" "}
                <b>
                  {
                    state.bookmarks.filter(
                      (id) => byId.get(id)?.mode === state.mode,
                    ).length
                  }
                </b>
              </button>
              <button
                className="icon-button"
                aria-label="Open preferences"
                onClick={() => dialogRef.current?.showModal()}
              >
                <Settings2 size={18} />
              </button>
            </div>
          </header>
          <main>
            <div className="desk-controls">
              <div className="workbench-toolbar">
                <nav className="mode-tabs" aria-label="Reference sections">
                  {modes.map((m) => (
                    <button
                      key={m}
                      className={state.mode === m ? "active" : ""}
                      aria-pressed={state.mode === m}
                      onClick={() => {
                        switchMode(m);
                        setMobileDetail(false);
                      }}
                    >
                      {m === "tailwind" ? (
                        <Layers size={16} />
                      ) : m === "css" ? (
                        <Braces size={16} />
                      ) : (
                        <Hash size={16} />
                      )}{" "}
                      {labels[m]}
                      <span>{modeEntries[m].length.toLocaleString()}</span>
                    </button>
                  ))}
                </nav>
                <span className="toolbar-scribble handwritten">
                  find it. copy it. make it weird. ✶
                </span>
              </div>
              <div className="search-strip">
                <div className="search-field">
                  <Search size={21} />
                  <input
                    ref={searchRef}
                    onFocus={dockDesk}
                    value={view.query}
                    onChange={(e) => patchView({ query: e.target.value })}
                    placeholder={
                      state.mode === "tailwind"
                        ? "Search classes, properties, or “center”…"
                        : state.mode === "css"
                          ? "Search properties, values, or “flex”…"
                          : "Search selectors, patterns, or “parent”…"
                    }
                    aria-label={`Search ${labels[state.mode]}`}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && matches[0]) select(matches[0]);
                    }}
                  />
                  {view.query ? (
                    <button
                      aria-label="Clear search"
                      onClick={() => patchView({ query: "" })}
                    >
                      <X size={16} />
                    </button>
                  ) : (
                    <kbd>⌘ K</kbd>
                  )}
                </div>
                <label className="sort-label">
                  <SlidersHorizontal size={15} />
                  <select
                    aria-label="Sort results"
                    value={view.sort}
                    onChange={(e) => patchView({ sort: e.target.value })}
                  >
                    <option value="recommended">Relevance</option>
                    <option value="az">A → Z</option>
                    <option value="za">Z → A</option>
                    <option value="recent">Recently opened</option>
                  </select>
                </label>
              </div>
              {state.mode === "tailwind" && (
                <div className="responsive-bar">
                  <label>
                    Breakpoint{" "}
                    <select
                      aria-label="Responsive breakpoint"
                      value={variant}
                      onChange={(e) =>
                        patchView({
                          variant: e.target.value,
                          query: responsiveSearch.query,
                          selected: baseEntry.id,
                        })
                      }
                    >
                      <option value="">Base · all sizes / mobile first</option>
                      {breakpoints.map((b) => (
                        <option key={b.prefix} value={b.prefix}>
                          {b.prefix}: · {b.pixels}px and up
                        </option>
                      ))}
                      {breakpoints.map((b) => (
                        <option
                          key={`max-${b.prefix}`}
                          value={`max-${b.prefix}`}
                        >
                          max-{b.prefix}: · below {b.pixels}px
                        </option>
                      ))}
                    </select>
                  </label>
                  <span>
                    Try{" "}
                    <button
                      onClick={() =>
                        patchView({
                          category: "Responsive",
                          query: "",
                          scope: "all",
                          variant: "",
                        })
                      }
                    >
                      responsive examples
                    </button>{" "}
                    · or type <code>md:your-class</code>
                  </span>
                </div>
              )}
            </div>
            <div className={`workspace ${mobileDetail ? "show-detail" : ""}`}>
              <aside className="sidebar">
                <div className="section-label">RUMMAGE AROUND</div>
                <button
                  className={`category-button ${view.category === "All" && view.scope === "all" ? "active" : ""}`}
                  onClick={() => patchView({ category: "All", scope: "all" })}
                >
                  <span>✳</span> Everything{" "}
                  <b>{source.length.toLocaleString()}</b>
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    className={`category-button ${view.category === cat ? "active" : ""}`}
                    onClick={() => patchView({ category: cat, scope: "all" })}
                  >
                    <span>{categoryIcons[cat] || "◇"}</span>
                    {cat}
                    <b>
                      {source
                        .filter((e) => e.category === cat)
                        .length.toLocaleString()}
                    </b>
                  </button>
                ))}
                <div className="sidebar-rule" />
                <button
                  className={`category-button ${view.scope === "saved" ? "active" : ""}`}
                  onClick={() => patchView({ scope: "saved", category: "All" })}
                >
                  <Bookmark size={15} /> Bookmarks{" "}
                  <b>
                    {
                      state.bookmarks.filter(
                        (id) => byId.get(id)?.mode === state.mode,
                      ).length
                    }
                  </b>
                </button>
                <button
                  className={`category-button ${view.scope === "recent" ? "active" : ""}`}
                  onClick={() =>
                    patchView({ scope: "recent", category: "All" })
                  }
                >
                  <Clock3 size={15} /> Recently opened
                </button>
                <div className="quick-note">
                  <span className="tape" />
                  <span className="handwritten">the usual suspects</span>
                  {common.map((e) => (
                    <button key={e.id} onClick={() => select(e)}>
                      {e.name}
                      <ArrowUpRight size={12} />
                    </button>
                  ))}
                </div>
                {recent.length > 0 && (
                  <div className="recent-section">
                    <div className="section-label">BACK TO IT</div>
                    {recent.map((e) => (
                      <button key={e.id} onClick={() => select(e)}>
                        <Clock3 size={12} />
                        {e.name}
                      </button>
                    ))}
                  </div>
                )}
                {state.searches.filter((s) => s.startsWith(state.mode + ":"))
                  .length > 0 && (
                  <div className="recent-section">
                    <div className="section-label">RECENT SEARCHES</div>
                    {state.searches
                      .filter((s) => s.startsWith(state.mode + ":"))
                      .slice(0, 3)
                      .map((s) => (
                        <button
                          key={s}
                          onClick={() =>
                            patchView({
                              query: s.slice(s.indexOf(":") + 1),
                              category: "All",
                              scope: "all",
                            })
                          }
                        >
                          <Search size={12} />
                          {s.slice(s.indexOf(":") + 1)}
                        </button>
                      ))}
                  </div>
                )}
                <div className="sidebar-foot handwritten">
                  made of pixels.
                  <br />
                  smells like paper. ↟
                </div>
              </aside>
              <section className="results-pane" aria-label="Search results">
                <div className="results-header">
                  <span>
                    {view.scope === "saved"
                      ? "YOUR BOOKMARKS"
                      : view.scope === "recent"
                        ? "RECENTLY OPENED"
                        : view.category === "All"
                          ? "THE GOOD STUFF"
                          : view.category.toUpperCase()}
                  </span>
                  <span aria-live="polite">
                    {state.mode === "tailwind"
                      ? `${groups.length.toLocaleString()} ${groups.length === 1 ? "group" : "groups"} · ${matches.length.toLocaleString()} ${matches.length === 1 ? "class" : "classes"}`
                      : `${matches.length.toLocaleString()} found`}
                  </span>
                </div>
                <div
                  className="results-list"
                  ref={listRef}
                  onScroll={rememberScroll}
                >
                  {matches.length === 0 ? (
                    <div className="empty-state">
                      <Search size={30} />
                      <h3>No scraps here.</h3>
                      <p>
                        {view.scope === "saved"
                          ? "Bookmark a reference to keep it here."
                          : "Try a different word or loosen the filters."}
                      </p>
                      <button onClick={clearFilters}>Show everything</button>
                    </div>
                  ) : (
                    groups.slice(0, pageSize).map((group) => (
                      <FamilyRow
                        key={group.key}
                        family={group}
                        selected={entry}
                        variant={variant}
                        bookmarks={state.bookmarks}
                        onSelect={select}
                        onBookmark={(e) =>
                          save({
                            ...state,
                            bookmarks: state.bookmarks.includes(e.id)
                              ? state.bookmarks.filter((id) => id !== e.id)
                              : [...state.bookmarks, e.id],
                          })
                        }
                      />
                    ))
                  )}
                  {groups.length > pageSize && (
                    <button
                      className="load-more"
                      onClick={() => setPageSize((n) => n + 100)}
                    >
                      Dig up 100 more{" "}
                      <span>
                        ({(groups.length - pageSize).toLocaleString()} left)
                      </span>
                    </button>
                  )}
                </div>
                <div className="results-bottom">
                  {state.mode === "tailwind"
                    ? `TAILWIND ${meta.tailwindVersion}`
                    : "MDN REFERENCE"}
                  <span>← pick a scrap</span>
                </div>
              </section>
              <div className="detail-wrap">
                <button
                  className="mobile-back"
                  onClick={() => setMobileDetail(false)}
                >
                  <ArrowLeft size={16} /> Back to results
                </button>
                {entry && (
                  <Detail
                    entry={entry}
                    family={family}
                    prefix={variant || nativePrefix}
                    state={state}
                    save={save}
                    select={select}
                    toast={toast}
                  />
                )}
              </div>
            </div>
          </main>
          <footer className="app-footer">
            <span>
              <span className="pink">✳</span> STYLE JUNKIE{" "}
              <span> · AN EVER-GROWING PILE OF USEFUL THINGS</span>
            </span>
            <span>
              REFERENCE DATA:{" "}
              <a
                href="https://github.com/mdn/data"
                target="_blank"
                rel="noreferrer"
              >
                MDN
              </a>{" "}
              +{" "}
              <a
                href="https://tailwindcss.com"
                target="_blank"
                rel="noreferrer"
              >
                TAILWIND
              </a>
              <span className="footer-star">✧</span>
            </span>
          </footer>
        </div>
      </div>
      {storageIssue && (
        <div className="storage-notice" role="status">
          Saved preferences couldn’t be read or written. Existing data is
          preserved; changes stay in this session. Reset storage in preferences
          to try again.
        </div>
      )}
      {notice && (
        <div className="toast" role="status">
          <Check size={16} />
          {notice}
        </div>
      )}
      <dialog
        ref={dialogRef}
        className="preferences"
        aria-label="Desk preferences"
        onClick={(e) => {
          if (e.target === dialogRef.current) dialogRef.current.close();
        }}
      >
        <div className="dialog-header">
          <div>
            <span className="eyebrow">PERSONALIZE YOUR DESK</span>
            <h2>A little to your taste.</h2>
          </div>
          <button
            autoFocus
            className="icon-button"
            aria-label="Close preferences"
            onClick={() => dialogRef.current?.close()}
          >
            <X size={20} />
          </button>
        </div>
        <fieldset>
          <legend>Paper & ink</legend>
          <div className="option-buttons">
            {(["dark", "light", "system"] as const).map((theme) => (
              <button
                key={theme}
                className={state.theme === theme ? "active" : ""}
                aria-pressed={state.theme === theme}
                onClick={() => save({ ...state, theme })}
              >
                {theme === "dark" ? (
                  <Moon size={15} />
                ) : theme === "light" ? (
                  <Sun size={15} />
                ) : (
                  <Settings2 size={15} />
                )}{" "}
                {theme}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend>Syntax coloring</legend>
          <div className="option-buttons">
            {(["midnight", "candy", "paper"] as const).map((codeTheme) => (
              <button
                key={codeTheme}
                className={state.codeTheme === codeTheme ? "active" : ""}
                aria-pressed={state.codeTheme === codeTheme}
                onClick={() => save({ ...state, codeTheme })}
              >
                {codeTheme === "midnight"
                  ? "◐"
                  : codeTheme === "candy"
                    ? "✳"
                    : "▤"}{" "}
                {codeTheme}
              </button>
            ))}
          </div>
          <Code
            code={".scrapbook {\n  display: grid;\n  color: #ef9cb7;\n}"}
            onCopy={async (text) => {
              try {
                await navigator.clipboard.writeText(text);
                toast("Copied.");
              } catch {
                toast("Select the code to copy manually.");
              }
            }}
          />
        </fieldset>
        <p className="small-muted">
          Bookmarks, recent searches, and your place in each section are saved
          in this browser. No account needed.
        </p>
        <div className="data-credit">
          Data snapshot · {meta.compatDate?.slice(0, 10)}
          <br />
          Tailwind {meta.tailwindVersion} · MDN data {meta.mdnVersion} · BCD{" "}
          {meta.compatVersion}
          <br />
          <a
            href="https://github.com/mdn/browser-compat-data/blob/main/LICENSE"
            target="_blank"
            rel="noreferrer"
          >
            MDN data licensing & attribution <ArrowUpRight size={12} />
          </a>
        </div>
        {storageIssue && (
          <button
            className="reset-storage"
            onClick={() => {
              try {
                localStorage.removeItem(STORAGE_KEY);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
                setStorageIssue(false);
                toast("Preferences saved again.");
              } catch {
                toast("Browser storage is still unavailable.");
              }
            }}
          >
            Reset unreadable storage
          </button>
        )}
      </dialog>
    </>
  );
}

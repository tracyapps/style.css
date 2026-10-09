import { useEffect, useRef, useState } from "react";
import { breakpointFor } from "../responsive";
export default function LivePreview({
  document,
  title,
  prefix,
  lab = false,
}: {
  document: string;
  title: string;
  prefix: string;
  lab?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [available, setAvailable] = useState(500);
  const [width, setWidth] = useState("auto");
  useEffect(() => {
    const breakpoint = breakpointFor(prefix);
    setWidth(
      breakpoint
        ? String(breakpoint.pixels + (prefix.startsWith("max-") ? -32 : 0))
        : "auto",
    );
  }, [prefix]);
  useEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver(([entry]) =>
      setAvailable(entry.contentRect.width),
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  const actual = width === "auto" ? available : Number(width);
  const scale = Math.min(1, available / actual);
  const breakpoint = breakpointFor(prefix);
  const active =
    breakpoint &&
    (prefix.startsWith("max-")
      ? actual < breakpoint.pixels
      : actual >= breakpoint.pixels);
  const height = lab ? 250 : 210;
  return (
    <div className="live-preview">
      <div className="preview-controls">
        <label>
          Example width
          <select
            aria-label="Example viewport width"
            value={width}
            onChange={(e) => setWidth(e.target.value)}
          >
            <option value="auto">Fit panel</option>
            {[
              390, 608, 640, 736, 768, 992, 1024, 1248, 1280, 1504, 1536, 1568,
            ].map((n) => (
              <option key={n} value={n}>
                {n}px
              </option>
            ))}
          </select>
        </label>
        {breakpoint && (
          <span
            className={`breakpoint-status ${active ? "active" : ""}`}
            role="status"
          >
            {prefix}: {active ? "active" : "inactive"} ·{" "}
            {prefix.startsWith("max-") ? "below" : "from"} {breakpoint.pixels}px
          </span>
        )}
      </div>
      <div
        className="preview-window"
        ref={ref}
        style={{ height: height * scale }}
      >
        <iframe
          key={document}
          title={title}
          sandbox=""
          srcDoc={document}
          style={{
            width: width === "auto" ? "100%" : `${actual}px`,
            height,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        />
      </div>
    </div>
  );
}

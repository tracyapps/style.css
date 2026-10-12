import { useRef } from "react";

/**
 * A pointer-drag divider for desk panels. Dragging reports the proposed size
 * (already clamped) so the parent can commit it live and persist on release.
 */
export default function ResizeHandle({
  axis,
  size,
  min,
  max,
  onSize,
  label,
}: {
  axis: "x" | "y";
  size: number;
  min: number;
  max: number;
  onSize: (next: number) => void;
  label: string;
}) {
  const dragging = useRef(false);
  const start = useRef(0);
  const base = useRef(0);
  const down = (e: React.PointerEvent) => {
    dragging.current = true;
    start.current = axis === "x" ? e.clientX : e.clientY;
    base.current = size;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    e.preventDefault();
  };
  const move = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    const delta =
      (axis === "x" ? e.clientX : e.clientY) - start.current;
    onSize(Math.round(Math.min(max, Math.max(min, base.current + delta))));
  };
  const up = () => {
    dragging.current = false;
  };
  return (
    <div
      role="separator"
      aria-orientation={axis === "x" ? "vertical" : "horizontal"}
      aria-label={label}
      className={`resize-handle ${axis}`}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      onDoubleClick={() => onSize(Math.round((min + max) / 2))}
      title="Drag to resize · double-click to center"
    >
      <span className="resize-grip" aria-hidden="true" />
    </div>
  );
}

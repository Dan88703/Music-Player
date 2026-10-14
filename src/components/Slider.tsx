import { useState } from "react";

// while dragging show dragValue, not currentTime, otherwise timeupdate makes the thumb jump back
export function Slider({
  value,
  max,
  onCommit,
  onLive,
  label,
  className = "",
}: {
  value: number;
  max: number;
  onCommit: (v: number) => void;
  onLive?: (v: number) => void;
  label: string;
  className?: string;
}) {
  const [dragValue, setDragValue] = useState<number | null>(null);
  const shown = dragValue ?? value;
  const pct = max > 0 ? (shown / max) * 100 : 0;

  const commit = () => {
    if (dragValue !== null) onCommit(dragValue);
    setDragValue(null);
  };

  return (
    <input
      type="range"
      className={`slider ${className}`}
      aria-label={label}
      min={0}
      max={max || 1}
      step="any"
      value={shown}
      style={{ "--pct": `${pct}%` } as React.CSSProperties}
      onChange={(e) => {
        const v = Number(e.target.value);
        setDragValue(v);
        onLive?.(v);
      }}
      onPointerUp={commit}
      onKeyUp={commit}
      onBlur={commit}
    />
  );
}

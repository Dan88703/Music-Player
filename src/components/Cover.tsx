import { useState } from "react";
import type { Track } from "../types";
import { Note } from "./Icons";

// no cover -> gradient, color is taken from track id so it's always the same per song
export function Cover({ track, size, className = "" }: { track: Track | null; size: number; className?: string }) {
  const [broken, setBroken] = useState<string | null>(null);
  const showImg = track?.cover && broken !== track.cover;

  const hue = track ? parseInt(track.id.slice(0, 6), 16) % 360 : 220;
  return (
    <div
      className={`cover ${className}`}
      style={{ width: size, height: size, background: showImg ? undefined : `linear-gradient(135deg, hsl(${hue} 55% 32%), hsl(${(hue + 50) % 360} 60% 18%))` }}
    >
      {showImg ? (
        <img src={track!.cover!} alt="" loading="lazy" onError={() => setBroken(track!.cover)} />
      ) : (
        <Note size={Math.round(size * 0.38)} />
      )}
    </div>
  );
}

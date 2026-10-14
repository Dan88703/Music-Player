import type { Track } from "../types";
import { formatTime } from "../format";
import { Cover } from "./Cover";

export function TrackList({
  tracks,
  currentId,
  isPlaying,
  onPlay,
}: {
  tracks: Track[];
  currentId: string | null;
  isPlaying: boolean;
  onPlay: (id: string) => void;
}) {
  if (tracks.length === 0) {
    return <p className="empty">Ничего не найдено</p>;
  }

  return (
    <ol className="list">
      {tracks.map((t, i) => {
        const active = t.id === currentId;
        return (
          <li key={t.id}>
            <button className={`row ${active ? "active" : ""}`} onClick={() => onPlay(t.id)}>
              <span className="row-num">
                {active && isPlaying ? (
                  <span className="eq" aria-label="Играет">
                    <i /><i /><i />
                  </span>
                ) : (
                  i + 1
                )}
              </span>
              <Cover track={t} size={40} />
              <span className="row-meta">
                <span className="row-title">{t.title}</span>
                <span className="row-artist">
                  {t.artist}
                  {t.album && <span className="row-album"> · {t.album}</span>}
                </span>
              </span>
              <span className="row-dur">{t.duration ? formatTime(t.duration) : ""}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

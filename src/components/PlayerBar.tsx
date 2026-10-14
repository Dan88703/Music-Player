import type { Player } from "../hooks/usePlayer";
import { formatTime } from "../format";
import { Cover } from "./Cover";
import { Slider } from "./Slider";
import * as I from "./Icons";

export function PlayerBar({ p }: { p: Player }) {
  const t = p.current;
  const repeatTitle = { off: "Повтор выключен", all: "Повтор очереди", one: "Повтор трека" }[p.repeat];

  return (
    <footer className="bar">
      <div className="bar-track">
        <Cover track={t} size={52} />
        <div className="bar-meta">
          <div className="bar-title">{t?.title ?? "Ничего не выбрано"}</div>
          <div className="bar-artist">{p.error ?? t?.artist ?? "—"}</div>
        </div>
      </div>

      <div className="bar-center">
        <div className="controls">
          <button className={`icon-btn ${p.shuffle ? "on" : ""}`} onClick={p.toggleShuffle} title="Перемешать (S)" aria-pressed={p.shuffle}>
            <I.Shuffle />
          </button>
          <button className="icon-btn" onClick={p.prev} title="Назад (Shift+←)">
            <I.Prev />
          </button>
          <button className={`play-btn ${p.buffering ? "loading" : ""}`} onClick={p.toggle} title="Пауза / играть (Пробел)" disabled={!t}>
            {p.isPlaying ? <I.Pause size={26} /> : <I.Play size={26} />}
          </button>
          <button className="icon-btn" onClick={p.next} title="Вперёд (Shift+→)">
            <I.Next />
          </button>
          <button className={`icon-btn ${p.repeat !== "off" ? "on" : ""}`} onClick={p.cycleRepeat} title={`${repeatTitle} (R)`}>
            {p.repeat === "one" ? <I.RepeatOne /> : <I.Repeat />}
          </button>
        </div>
        <div className="progress">
          <span className="time">{formatTime(p.currentTime)}</span>
          <Slider label="Перемотка" value={p.currentTime} max={p.duration} onCommit={p.seek} />
          <span className="time">{formatTime(p.duration)}</span>
        </div>
      </div>

      <div className="bar-volume">
        <button className="icon-btn" onClick={p.toggleMute} title="Без звука (M)">
          {p.muted || p.volume === 0 ? <I.Mute /> : <I.Volume />}
        </button>
        <Slider label="Громкость" className="vol" value={p.muted ? 0 : p.volume} max={1} onLive={p.setVolume} onCommit={p.setVolume} />
      </div>
    </footer>
  );
}

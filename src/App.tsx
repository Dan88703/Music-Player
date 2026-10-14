import { useDeferredValue, useEffect, useMemo, useState } from "react";
import type { Manifest, Track } from "./types";
import { usePlayer } from "./hooks/usePlayer";
import { PlayerBar } from "./components/PlayerBar";
import { TrackList } from "./components/TrackList";
import { Cover } from "./components/Cover";
import { Search } from "./components/Icons";

// 1 трек, 2 трека, 5 треков
const ruPlural = new Intl.PluralRules("ru");
function plural(n: number, [one, few, many]: [string, string, string]) {
  const cat = ruPlural.select(n);
  return cat === "one" ? one : cat === "few" ? few : many;
}

export default function App() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetch("/tracks.json", { cache: "no-cache" })
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json() as Promise<Manifest>;
      })
      .then((m) => {
        setTracks(m.tracks);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }, []);

  const p = usePlayer(tracks);

  // deferred so typing doesn't lag on big libraries
  const deferredQuery = useDeferredValue(query);
  const visible = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    if (!q) return tracks;
    return tracks.filter((t) => `${t.title} ${t.artist} ${t.album}`.toLowerCase().includes(q));
  }, [tracks, deferredQuery]);

  // hotkeys (skip when typing in search)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" && (target as HTMLInputElement).type !== "range") return;
      if (e.code === "Space") {
        e.preventDefault();
        p.toggle();
      } else if (e.shiftKey && e.code === "ArrowRight") p.next();
      else if (e.shiftKey && e.code === "ArrowLeft") p.prev();
      else if (e.code === "ArrowRight") p.seek(p.currentTime + 10);
      else if (e.code === "ArrowLeft") p.seek(p.currentTime - 10);
      else if (e.code === "KeyM") p.toggleMute();
      else if (e.code === "KeyS") p.toggleShuffle();
      else if (e.code === "KeyR") p.cycleRepeat();
      else if (e.code === "Slash") {
        e.preventDefault();
        document.getElementById("search")?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [p]);

  useEffect(() => {
    document.title = p.current ? `${p.isPlaying ? "▶ " : ""}${p.current.title} — ${p.current.artist}` : "Мой плеер";
  }, [p.current, p.isPlaying]);

  const totalMinutes = Math.round(tracks.reduce((s, t) => s + t.duration, 0) / 60);

  return (
    <div className="app">
      <main className="main">
        <header className="hero">
          <Cover track={p.current} size={168} className="hero-cover" />
          <div className="hero-text">
            <span className="eyebrow">Сейчас</span>
            <h1>{p.current?.title ?? "Мой плеер"}</h1>
            <p className="hero-artist">
              {p.current ? [p.current.artist, p.current.album].filter(Boolean).join(" · ") : "Личная музыка, где угодно"}
            </p>
            <p className="stats">
              {tracks.length} {plural(tracks.length, ["трек", "трека", "треков"])} · {totalMinutes} мин
            </p>
          </div>
        </header>

        <label className="search">
          <Search />
          <input
            id="search"
            type="search"
            placeholder="Поиск по названию, исполнителю, альбому  ( / )"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
          />
        </label>

        {status === "loading" && <p className="empty">Загружаю библиотеку…</p>}
        {status === "error" && <p className="empty">Не удалось загрузить tracks.json. Запусти `npm run manifest`.</p>}
        {status === "ready" && tracks.length === 0 && (
          <div className="empty">
            <p>Библиотека пуста.</p>
            <p>Положи mp3-файлы в <code>public/music/</code> и пересобери проект.</p>
          </div>
        )}
        {status === "ready" && tracks.length > 0 && (
          <TrackList tracks={visible} currentId={p.current?.id ?? null} isPlaying={p.isPlaying} onPlay={p.playTrack} />
        )}
      </main>

      <PlayerBar p={p} />
    </div>
  );
}

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RepeatMode, Track } from "../types";
import { load, save } from "../storage";

export function usePlayer(tracks: Track[]) {
  // one audio element for the whole app
  const audioRef = useRef<HTMLAudioElement | null>(null);
  if (audioRef.current === null && typeof Audio !== "undefined") {
    audioRef.current = new Audio();
    audioRef.current.preload = "metadata";
  }

  const [currentId, setCurrentId] = useState<string | null>(() => load("lastTrack", null));
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffering, setBuffering] = useState(false);
  const [volume, setVolumeState] = useState<number>(() => load("volume", 0.8));
  const [muted, setMuted] = useState(false);
  const [repeat, setRepeat] = useState<RepeatMode>(() => load("repeat", "all"));
  const [shuffle, setShuffle] = useState<boolean>(() => load("shuffle", false));
  const [error, setError] = useState<string | null>(null);

  const [shuffleSeed, setShuffleSeed] = useState(0);
  const queue = useMemo(() => {
    const ids = tracks.map((t) => t.id);
    if (!shuffle) return ids;
    // fisher-yates, current track stays first so the song doesn't stop
    const arr = ids.filter((id) => id !== currentId);
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return currentId && ids.includes(currentId) ? [currentId, ...arr] : arr;
    // no currentId in deps on purpose, otherwise it reshuffles on every track change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tracks, shuffle, shuffleSeed]);

  const byId = useMemo(() => new Map(tracks.map((t) => [t.id, t])), [tracks]);
  const current = currentId ? byId.get(currentId) ?? null : null;

  // audio listeners are attached once, so they read fresh values from here
  const stateRef = useRef({ queue, currentId, repeat });
  stateRef.current = { queue, currentId, repeat };

  const loadTrack = useCallback(
    (id: string, autoplay: boolean) => {
      const audio = audioRef.current;
      const track = byId.get(id);
      if (!audio || !track) return;
      setError(null);
      setCurrentId(id);
      save("lastTrack", id);
      if (audio.src !== new URL(track.src, location.href).href) {
        audio.src = track.src;
        setCurrentTime(0);
        setDuration(track.duration || 0);
      }
      if (autoplay) {
        // rejects if the browser blocks autoplay before the first click
        audio.play().catch((e: DOMException) => {
          if (e.name !== "AbortError") setIsPlaying(false);
        });
      }
    },
    [byId],
  );

  const step = useCallback(
    (dir: 1 | -1, fromEnded = false) => {
      const { queue, currentId, repeat } = stateRef.current;
      if (queue.length === 0) return;
      const audio = audioRef.current;

      if (fromEnded && repeat === "one" && audio) {
        audio.currentTime = 0;
        void audio.play();
        return;
      }
      // like spotify: "prev" after 3s restarts the song
      if (dir === -1 && audio && audio.currentTime > 3) {
        audio.currentTime = 0;
        return;
      }

      const idx = currentId ? queue.indexOf(currentId) : -1;
      let next = idx + dir;
      if (next >= queue.length) {
        if (repeat === "off" && fromEnded) {
          setIsPlaying(false);
          return;
        }
        next = 0;
      }
      if (next < 0) next = queue.length - 1;
      loadTrack(queue[next], true);
    },
    [loadTrack],
  );

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const on: Record<string, () => void> = {
      play: () => setIsPlaying(true),
      pause: () => setIsPlaying(false),
      timeupdate: () => setCurrentTime(audio.currentTime),
      durationchange: () => Number.isFinite(audio.duration) && setDuration(audio.duration),
      waiting: () => setBuffering(true),
      playing: () => setBuffering(false),
      canplay: () => setBuffering(false),
      ended: () => step(1, true),
      error: () => {
        setBuffering(false);
        setIsPlaying(false);
        setError("Не удалось загрузить трек");
      },
    };
    for (const [ev, fn] of Object.entries(on)) audio.addEventListener(ev, fn);
    return () => {
      for (const [ev, fn] of Object.entries(on)) audio.removeEventListener(ev, fn);
    };
  }, [step]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;
    audio.muted = muted;
    save("volume", volume);
  }, [volume, muted]);

  useEffect(() => save("repeat", repeat), [repeat]);
  useEffect(() => save("shuffle", shuffle), [shuffle]);

  // restore last track on load (without autoplay)
  useEffect(() => {
    if (tracks.length === 0) return;
    const start = currentId && byId.has(currentId) ? currentId : tracks[0].id;
    loadTrack(start, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tracks]);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !currentId) return;
    if (audio.paused) audio.play().catch(() => setIsPlaying(false));
    else audio.pause();
  }, [currentId]);

  const playTrack = useCallback(
    (id: string) => {
      if (id === currentId) toggle();
      else loadTrack(id, true);
    },
    [currentId, loadTrack, toggle],
  );

  const seek = useCallback((time: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, Math.min(time, audio.duration || time));
    setCurrentTime(audio.currentTime);
  }, []);

  const setVolume = useCallback((v: number) => {
    setVolumeState(Math.max(0, Math.min(1, v)));
    setMuted(false);
  }, []);

  const cycleRepeat = useCallback(
    () => setRepeat((r) => (r === "off" ? "all" : r === "all" ? "one" : "off")),
    [],
  );
  const toggleShuffle = useCallback(() => {
    setShuffle((s) => !s);
    setShuffleSeed((n) => n + 1);
  }, []);

  // lock screen / media keys
  useEffect(() => {
    if (!("mediaSession" in navigator) || !current) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: current.title,
      artist: current.artist,
      album: current.album,
      artwork: current.cover
        ? [{ src: new URL(current.cover, location.href).href, sizes: "512x512" }]
        : [],
    });
  }, [current]);

  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    const ms = navigator.mediaSession;
    const handlers: [MediaSessionAction, MediaSessionActionHandler][] = [
      ["play", () => void audioRef.current?.play()],
      ["pause", () => audioRef.current?.pause()],
      ["previoustrack", () => step(-1)],
      ["nexttrack", () => step(1)],
      ["seekto", (d) => d.seekTime != null && seek(d.seekTime)],
    ];
    for (const [action, fn] of handlers) {
      try {
        ms.setActionHandler(action, fn);
      } catch {
        // not supported in some browsers
      }
    }
  }, [step, seek]);

  return {
    current,
    queue,
    isPlaying,
    buffering,
    currentTime,
    duration,
    volume,
    muted,
    repeat,
    shuffle,
    error,
    playTrack,
    toggle,
    next: () => step(1),
    prev: () => step(-1),
    seek,
    setVolume,
    toggleMute: () => setMuted((m) => !m),
    cycleRepeat,
    toggleShuffle,
  };
}

export type Player = ReturnType<typeof usePlayer>;

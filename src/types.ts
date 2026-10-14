export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number; // seconds, 0 if unknown
  src: string;
  cover: string | null;
}

export interface Manifest {
  generatedAt: string;
  tracks: Track[];
}

export type RepeatMode = "off" | "all" | "one";

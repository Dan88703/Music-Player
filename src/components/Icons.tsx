type P = { size?: number };
const svg = (size: number, d: React.ReactNode) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    {d}
  </svg>
);

export const Play = ({ size = 24 }: P) => svg(size, <path d="M8 5.14v13.72a1 1 0 0 0 1.5.86l11-6.86a1 1 0 0 0 0-1.72l-11-6.86A1 1 0 0 0 8 5.14z" />);
export const Pause = ({ size = 24 }: P) => svg(size, <path d="M7 4h3.5v16H7zM13.5 4H17v16h-3.5z" />);
export const Next = ({ size = 24 }: P) => svg(size, <path d="M5 5.5v13a.8.8 0 0 0 1.2.7l9.3-6.5a.85.85 0 0 0 0-1.4L6.2 4.8A.8.8 0 0 0 5 5.5zM17 5h2.5v14H17z" />);
export const Prev = ({ size = 24 }: P) => svg(size, <path d="M19 5.5v13a.8.8 0 0 1-1.2.7l-9.3-6.5a.85.85 0 0 1 0-1.4l9.3-6.5a.8.8 0 0 1 1.2.7zM4.5 5H7v14H4.5z" />);
export const Shuffle = ({ size = 20 }: P) =>
  svg(size, <path d="M17 3l4 4-4 4V8h-2.2l-3 4 3 4H17v-3l4 4-4 4v-3h-3.2l-3.3-4.4L7.2 18H3v-2h3.2l3-4-3-4H3V6h4.2l3.3 4.4L13.8 6H17z" />);
export const Repeat = ({ size = 20 }: P) =>
  svg(size, <path d="M7 7h10v3l4-4-4-4v3H5v6h2zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2z" />);
export const RepeatOne = ({ size = 20 }: P) =>
  svg(size, <path d="M7 7h10v3l4-4-4-4v3H5v6h2zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2zm-4-2V9h-1l-2 1v1h1.5v4z" />);
export const Volume = ({ size = 20 }: P) =>
  svg(size, <path d="M3 9v6h4l5 5V4L7 9zm13.5 3A4.5 4.5 0 0 0 14 8v8a4.5 4.5 0 0 0 2.5-4zM14 3.2v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6z" />);
export const Mute = ({ size = 20 }: P) =>
  svg(size, <path d="M3 9v6h4l5 5V4L7 9zm18.3 3 2.2-2.2-1.4-1.4-2.2 2.2-2.2-2.2-1.4 1.4 2.2 2.2-2.2 2.2 1.4 1.4 2.2-2.2 2.2 2.2 1.4-1.4z" />);
export const Search = ({ size = 18 }: P) =>
  svg(size, <path d="M10 2a8 8 0 0 1 6.3 12.9l5.4 5.4-1.4 1.4-5.4-5.4A8 8 0 1 1 10 2zm0 2a6 6 0 1 0 0 12 6 6 0 0 0 0-12z" />);
export const Note = ({ size = 28 }: P) => svg(size, <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3z" />);

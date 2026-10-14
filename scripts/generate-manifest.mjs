// Builds public/tracks.json from everything in public/music.
// Runs before dev/build, because Vercel is static-only and can't list files at runtime.

import { readdir, readFile, writeFile, mkdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { parseFile } from "music-metadata";

const ROOT = process.cwd();
const MUSIC_DIR = path.join(ROOT, "public", "music");
const COVERS_DIR = path.join(ROOT, "public", "covers");
const OUTPUT = path.join(ROOT, "public", "tracks.json");
const REMOTE_FILE = path.join(ROOT, "remote-tracks.json");

const AUDIO_EXT = new Set([".mp3", ".m4a", ".aac", ".ogg", ".opus", ".flac", ".wav", ".webm"]);
const MIME_EXT = { "image/jpeg": ".jpg", "image/jpg": ".jpg", "image/png": ".png", "image/webp": ".webp" };

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (AUDIO_EXT.has(path.extname(entry.name).toLowerCase())) yield full;
  }
}

// encode every segment, otherwise spaces / cyrillic / # break the url
function toPublicUrl(absPath) {
  const rel = path.relative(path.join(ROOT, "public"), absPath);
  return "/" + rel.split(path.sep).map(encodeURIComponent).join("/");
}

// id stays the same as long as the file path doesn't change (needed for "last track")
function idFrom(value) {
  return createHash("sha1").update(value).digest("hex").slice(0, 12);
}

// "01 - My_Song.mp3" -> "My Song"
function titleFromFilename(file) {
  return path
    .basename(file, path.extname(file))
    .replace(/^\d+\s*[-._]\s*/, "")
    .replace(/[_]+/g, " ")
    .trim();
}

async function readLocalTrack(file) {
  const rel = path.relative(MUSIC_DIR, file);
  const id = idFrom(rel);
  const base = {
    id,
    title: titleFromFilename(file),
    artist: "Неизвестный исполнитель",
    album: "",
    duration: 0,
    src: toPublicUrl(file),
    cover: null,
  };

  try {
    const { common, format } = await parseFile(file, { duration: true });
    let cover = null;

    const pic = common.picture?.[0];
    if (pic) {
      const ext = MIME_EXT[pic.format?.toLowerCase()] ?? ".jpg";
      const name = `${id}${ext}`;
      await writeFile(path.join(COVERS_DIR, name), pic.data);
      cover = `/covers/${name}`;
    }

    return {
      ...base,
      title: common.title?.trim() || base.title,
      artist: common.artist?.trim() || common.albumartist?.trim() || base.artist,
      album: common.album?.trim() || "",
      duration: Math.round(format.duration ?? 0),
      cover,
    };
  } catch (err) {
    // broken tags shouldn't kill the whole build
    console.warn(`  can't read tags: ${rel} (${err.message})`);
    return base;
  }
}

async function readRemoteTracks() {
  if (!existsSync(REMOTE_FILE)) return [];
  const list = JSON.parse(await readFile(REMOTE_FILE, "utf8"));
  if (!Array.isArray(list)) throw new Error("remote-tracks.json must be an array");
  return list
    .filter((t) => t && typeof t.src === "string")
    .map((t) => ({
      id: idFrom(t.src),
      title: t.title || "Без названия",
      artist: t.artist || "Неизвестный исполнитель",
      album: t.album || "",
      duration: Number(t.duration) || 0,
      src: t.src,
      cover: t.cover || null,
    }));
}

async function main() {
  await mkdir(MUSIC_DIR, { recursive: true });
  await rm(COVERS_DIR, { recursive: true, force: true });
  await mkdir(COVERS_DIR, { recursive: true });

  const files = [];
  for await (const f of walk(MUSIC_DIR)) files.push(f);

  // 8 at a time so we don't open hundreds of files at once
  const local = [];
  for (let i = 0; i < files.length; i += 8) {
    local.push(...(await Promise.all(files.slice(i, i + 8).map(readLocalTrack))));
  }

  const remote = await readRemoteTracks();

  const collator = new Intl.Collator("ru", { numeric: true, sensitivity: "base" });
  const tracks = [...local, ...remote].sort(
    (a, b) =>
      collator.compare(a.artist, b.artist) ||
      collator.compare(a.album, b.album) ||
      collator.compare(a.title, b.title),
  );

  await writeFile(OUTPUT, JSON.stringify({ generatedAt: new Date().toISOString(), tracks }, null, 2));
  console.log(`tracks.json: ${local.length} local + ${remote.length} remote`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

"""Téléchargement yt-dlp + tagging ID3 pour Navidrome."""

import os
import re
import shutil
import tempfile
import threading
import uuid
from pathlib import Path

import requests
import yt_dlp
from mutagen.id3 import APIC, ID3, TALB, TDRC, TIT2, TPE1, TPE2, TRCK

MUSIC_DIR = Path(os.environ.get("MUSIC_DIR", str(Path.home() / "music")))

jobs: dict[str, dict] = {}
_jobs_lock = threading.Lock()


def sanitize(name: str) -> str:
    name = re.sub(r'[\\/:*?"<>|]', "_", name)
    return name.strip().rstrip(".") or "Inconnu"


def best_thumbnail(thumbnails: list[dict] | None) -> str | None:
    if not thumbnails:
        return None
    url = max(thumbnails, key=lambda t: t.get("width", 0))["url"]
    # Les pochettes YouTube Music acceptent une taille arbitraire dans l'URL
    return re.sub(r"=w\d+-h\d+.*$", "=w600-h600-l90-rj", url)


def fetch_cover(url: str | None) -> bytes | None:
    if not url:
        return None
    try:
        resp = requests.get(url, timeout=15)
        resp.raise_for_status()
        return resp.content
    except requests.RequestException:
        return None


def tag_file(path: Path, meta: dict, cover: bytes | None) -> None:
    tags = ID3()
    tags.add(TIT2(encoding=3, text=meta["title"]))
    tags.add(TPE1(encoding=3, text=meta["artist"]))
    tags.add(TPE2(encoding=3, text=meta.get("album_artist") or meta["artist"]))
    tags.add(TALB(encoding=3, text=meta.get("album") or meta["title"]))
    if meta.get("year"):
        tags.add(TDRC(encoding=3, text=str(meta["year"])))
    if meta.get("track"):
        total = meta.get("track_total")
        trck = f"{meta['track']}/{total}" if total else str(meta["track"])
        tags.add(TRCK(encoding=3, text=trck))
    if cover:
        mime = "image/png" if cover[:8] == b"\x89PNG\r\n\x1a\n" else "image/jpeg"
        tags.add(APIC(encoding=3, mime=mime, type=3, desc="Cover", data=cover))
    tags.save(path, v2_version=3)


def _download_audio(video_id: str, dest_dir: Path, progress_cb) -> Path:
    """Télécharge une vidéo en mp3 dans dest_dir, renvoie le chemin du fichier."""

    def hook(d):
        if d["status"] == "downloading":
            total = d.get("total_bytes") or d.get("total_bytes_estimate")
            if total:
                progress_cb(d.get("downloaded_bytes", 0) / total)
        elif d["status"] == "finished":
            progress_cb(1.0)

    opts = {
        "format": "bestaudio/best",
        "outtmpl": str(dest_dir / "%(id)s.%(ext)s"),
        "postprocessors": [
            {"key": "FFmpegExtractAudio", "preferredcodec": "mp3", "preferredquality": "0"}
        ],
        "quiet": True,
        "no_warnings": True,
        "noplaylist": True,
        "progress_hooks": [hook],
    }
    with yt_dlp.YoutubeDL(opts) as ydl:
        ydl.download([f"https://music.youtube.com/watch?v={video_id}"])
    return dest_dir / f"{video_id}.mp3"


def _finalize_track(tmp_file: Path, meta: dict, cover: bytes | None) -> Path:
    tag_file(tmp_file, meta, cover)
    artist_dir = MUSIC_DIR / sanitize(meta.get("album_artist") or meta["artist"])
    album_dir = artist_dir / sanitize(meta.get("album") or meta["title"])
    album_dir.mkdir(parents=True, exist_ok=True)
    if meta.get("track"):
        filename = f"{int(meta['track']):02d} - {sanitize(meta['title'])}.mp3"
    else:
        filename = f"{sanitize(meta['title'])}.mp3"
    final = album_dir / filename
    shutil.move(str(tmp_file), final)
    return final


def create_job(kind: str, title: str, artist: str, thumbnail: str | None, tracks: list[dict]) -> dict:
    job = {
        "id": uuid.uuid4().hex[:12],
        "kind": kind,  # "song" | "album"
        "title": title,
        "artist": artist,
        "thumbnail": thumbnail,
        "status": "queued",  # queued | downloading | done | error
        "progress": 0.0,
        "error": None,
        "tracks": [
            {"title": t["title"], "status": "queued", "progress": 0.0} for t in tracks
        ],
    }
    with _jobs_lock:
        jobs[job["id"]] = job
    return job


def run_job(job: dict, tracks: list[dict], cover_url: str | None) -> None:
    """Exécuté dans un thread. tracks: [{video_id, title, meta{...}}]."""
    job["status"] = "downloading"
    cover = fetch_cover(cover_url)
    errors = []
    with tempfile.TemporaryDirectory(prefix="yt-get-") as tmp:
        tmp_dir = Path(tmp)
        for i, track in enumerate(tracks):
            jt = job["tracks"][i]
            jt["status"] = "downloading"

            def cb(p, jt=jt, i=i):
                jt["progress"] = p
                job["progress"] = (i + p) / len(tracks)

            try:
                mp3 = _download_audio(track["video_id"], tmp_dir, cb)
                _finalize_track(mp3, track["meta"], cover)
                jt["status"] = "done"
                jt["progress"] = 1.0
            except Exception as exc:  # noqa: BLE001 — un échec de piste ne stoppe pas l'album
                jt["status"] = "error"
                errors.append(f"{track['title']}: {exc}")
            job["progress"] = (i + 1) / len(tracks)

    if errors and all(t["status"] == "error" for t in job["tracks"]):
        job["status"] = "error"
        job["error"] = "; ".join(errors)
    else:
        job["status"] = "done"
        job["error"] = "; ".join(errors) or None


def start_job(kind: str, title: str, artist: str, thumbnail: str | None,
              tracks: list[dict], cover_url: str | None) -> dict:
    job = create_job(kind, title, artist, thumbnail, tracks)
    threading.Thread(target=run_job, args=(job, tracks, cover_url), daemon=True).start()
    return job

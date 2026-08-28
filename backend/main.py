"""API yt-get : recherche YouTube Music, téléchargement et tagging pour Navidrome."""

from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from ytmusicapi import YTMusic

from downloader import (
    MUSIC_DIR,
    QUALITIES,
    best_thumbnail,
    jobs,
    list_formats,
    start_job,
)

app = FastAPI(title="yt-get")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

ytmusic = YTMusic()


def _artists_str(artists: list[dict] | None) -> str:
    return ", ".join(a["name"] for a in (artists or []) if a.get("name")) or "Inconnu"


@app.get("/api/search")
def search(q: str, type: str = "songs"):
    if type not in ("songs", "albums"):
        raise HTTPException(400, "type doit être 'songs' ou 'albums'")
    results = ytmusic.search(q, filter=type, limit=20)
    out = []
    for r in results:
        if type == "songs":
            if not r.get("videoId"):
                continue
            out.append({
                "videoId": r["videoId"],
                "title": r.get("title", ""),
                "artist": _artists_str(r.get("artists")),
                "album": (r.get("album") or {}).get("name"),
                "albumId": (r.get("album") or {}).get("id"),
                "duration": r.get("duration"),
                "thumbnail": best_thumbnail(r.get("thumbnails")),
            })
        else:
            if not r.get("browseId"):
                continue
            out.append({
                "browseId": r["browseId"],
                "title": r.get("title", ""),
                "artist": _artists_str(r.get("artists")),
                "year": r.get("year"),
                "type": r.get("type"),
                "thumbnail": best_thumbnail(r.get("thumbnails")),
            })
    return out


@app.get("/api/album/{browse_id}")
def album(browse_id: str):
    try:
        a = ytmusic.get_album(browse_id)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(404, f"Album introuvable : {exc}") from exc
    return {
        "browseId": browse_id,
        "title": a.get("title", ""),
        "artist": _artists_str(a.get("artists")),
        "year": a.get("year"),
        "thumbnail": best_thumbnail(a.get("thumbnails")),
        "tracks": [
            {
                "videoId": t.get("videoId"),
                "title": t.get("title", ""),
                "artist": _artists_str(t.get("artists")) if t.get("artists") else None,
                "duration": t.get("duration"),
                "track": t.get("trackNumber") or i + 1,
            }
            for i, t in enumerate(a.get("tracks", []))
        ],
    }


@app.get("/api/formats/{video_id}")
def formats(video_id: str):
    try:
        return list_formats(video_id)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(502, f"Formats indisponibles : {exc}") from exc


class SongRequest(BaseModel):
    videoId: str
    title: str
    artist: str
    album: str | None = None
    albumId: str | None = None
    thumbnail: str | None = None
    quality: str = "best"
    formatId: str | None = None


class AlbumRequest(BaseModel):
    browseId: str
    quality: str = "best"


def _check_quality(quality: str) -> None:
    if quality not in QUALITIES:
        raise HTTPException(400, f"Qualité inconnue : {quality}")


@app.post("/api/download/song")
def download_song(req: SongRequest):
    _check_quality(req.quality)
    meta = {
        "title": req.title,
        "artist": req.artist,
        "album_artist": req.artist,
        "album": req.album,
        "year": None,
        "track": None,
        "track_total": None,
    }
    cover_url = req.thumbnail
    # Si le titre appartient à un album connu, on récupère année, numéro de
    # piste et pochette haute qualité pour un tagging complet.
    if req.albumId:
        try:
            a = ytmusic.get_album(req.albumId)
            meta["album"] = a.get("title") or meta["album"]
            meta["album_artist"] = _artists_str(a.get("artists"))
            meta["year"] = a.get("year")
            cover_url = best_thumbnail(a.get("thumbnails")) or cover_url
            album_tracks = a.get("tracks", [])
            meta["track_total"] = len(album_tracks) or None
            for i, t in enumerate(album_tracks):
                if t.get("videoId") == req.videoId:
                    meta["track"] = t.get("trackNumber") or i + 1
                    break
        except Exception:  # noqa: BLE001 — tagging minimal si l'album est inaccessible
            pass
    tracks = [{
        "video_id": req.videoId,
        "title": req.title,
        "meta": meta,
        "format_id": req.formatId,
    }]
    return start_job(
        "song", req.title, req.artist, req.thumbnail, tracks, cover_url, req.quality
    )


@app.post("/api/download/album")
def download_album(req: AlbumRequest):
    _check_quality(req.quality)
    a = album(req.browseId)
    playable = [t for t in a["tracks"] if t["videoId"]]
    if not playable:
        raise HTTPException(422, "Aucune piste téléchargeable dans cet album")
    tracks = [
        {
            "video_id": t["videoId"],
            "title": t["title"],
            "meta": {
                "title": t["title"],
                "artist": t["artist"] or a["artist"],
                "album_artist": a["artist"],
                "album": a["title"],
                "year": a["year"],
                "track": t["track"],
                "track_total": len(a["tracks"]),
            },
        }
        for t in playable
    ]
    return start_job(
        "album", a["title"], a["artist"], a["thumbnail"], tracks,
        a["thumbnail"], req.quality,
    )


@app.get("/api/jobs")
def list_jobs():
    return list(reversed(list(jobs.values())))


@app.get("/api/config")
def config():
    return {"musicDir": str(MUSIC_DIR)}


# En production : sert le frontend compilé (frontend/dist)
_dist = Path(__file__).resolve().parent.parent / "frontend" / "dist"
if _dist.is_dir():
    app.mount("/", StaticFiles(directory=_dist, html=True), name="frontend")

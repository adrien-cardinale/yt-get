# yt-get

Web UI to search YouTube Music (tracks or albums), download them as audio
files via **yt-dlp** and tag them automatically (ID3v2.3: title, artist, album,
album artist, track number, year, cover art) so they are correctly recognized
by **Navidrome**.

Files are stored as `Artist/Album/NN - Title.mp3` in the music folder
(defaults to `~/music`, configurable through the `MUSIC_DIR` environment
variable).

## Docker (recommended)

```bash
docker compose up -d --build
```

Open <http://localhost:8000>. Music is written to the volume mounted on
`/music` — edit `docker-compose.yml` to point it at the library scanned by
Navidrome (and uncomment `user:` so the files are owned by your user rather
than root).

## Manual installation

Requirements: Python ≥ 3.10, Node ≥ 18, `ffmpeg` in the PATH.

```bash
cd backend
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt

cd ../frontend
npm install
```

### Development

```bash
# Terminal 1 — API (port 8000)
cd backend
MUSIC_DIR=~/music .venv/bin/uvicorn main:app --reload

# Terminal 2 — Frontend (port 5173, proxies /api to :8000)
cd frontend
npm run dev
```

Open <http://localhost:5173>.

### Production (without Docker)

```bash
cd frontend && npm run build
cd ../backend && MUSIC_DIR=/path/to/music .venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000
```

The backend then serves the built frontend (`frontend/dist`) directly on
<http://localhost:8000>.

## How it works

- **Search**: `ytmusicapi` queries YouTube Music (cleaner results than
  YouTube: real titles, artists, albums, years, cover art).
- **Quality**: clicking a thumbnail opens its detail view (track or album);
  that is where the quality dropdown lives — **Original** (Opus/M4A extracted
  without re-encoding, recommended) or MP3 320 / V0 / 192 / 128 kbps — along
  with the download button. The choice is shared and remembered. (The API also
  exposes `GET /api/formats/{videoId}` to list the streams available at the
  source.)
- **Download**: `yt-dlp` fetches the selected audio stream and converts it
  with ffmpeg if needed. An album is a single job that downloads each track
  sequentially; a failed track does not stop the others.
- **Tagging**: `mutagen` writes tags according to the container — ID3v2.3 for
  MP3, Vorbis comments for Opus/Ogg, MP4 atoms for M4A — with embedded 600×600
  cover art. For a single, the original album is looked up to retrieve the
  year and track number. Navidrome reads all three formats.
- **Progress**: the side panel shows real-time progress (polled every
  second).

## Navidrome scan

If the `NAVIDROME_URL`, `NAVIDROME_USER` and `NAVIDROME_PASS` environment
variables are set (see `docker-compose.yml`), a library scan is triggered
automatically through the Subsonic API (`/rest/startScan`) after each
successful download, and a ⟳ button in the Downloads panel lets you start one
manually. Otherwise, run a scan from Navidrome or wait for its automatic scan.

## Disclaimer

This tool is intended for **personal, private use** (building your own
self-hosted music library). It is neither affiliated with nor endorsed by
YouTube, Google or Navidrome.

Downloading content may violate YouTube's Terms of Service and the copyright
law applicable in your country. You are solely responsible for how you use
this software and the files obtained with it; do not host a publicly
accessible instance and do not redistribute downloaded content. The software
is provided "as is", without warranty of any kind.

## License

[MIT](LICENSE)

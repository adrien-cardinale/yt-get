# yt-get

Interface web pour chercher des musiques sur YouTube Music (titres ou albums),
les télécharger en MP3 via **yt-dlp** et les taguer automatiquement (ID3v2.3 :
titre, artiste, album, artiste d'album, numéro de piste, année, pochette) pour
qu'elles soient correctement reconnues par **Navidrome**.

Les fichiers sont rangés en `Artiste/Album/NN - Titre.mp3` dans le dossier
musique (par défaut `~/music`, configurable via la variable d'environnement
`MUSIC_DIR`).

## Prérequis

- Python ≥ 3.10, Node ≥ 18, `ffmpeg` dans le PATH

## Installation

```bash
cd backend
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt

cd ../frontend
npm install
```

## Développement

```bash
# Terminal 1 — API (port 8000)
cd backend
MUSIC_DIR=~/music .venv/bin/uvicorn main:app --reload

# Terminal 2 — Frontend (port 5173, proxy /api vers :8000)
cd frontend
npm run dev
```

Ouvrir <http://localhost:5173>.

## Production

```bash
cd frontend && npm run build
cd ../backend && MUSIC_DIR=/chemin/vers/musique .venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000
```

Le backend sert alors le frontend compilé (`frontend/dist`) directement sur
<http://localhost:8000>.

## Fonctionnement

- **Recherche** : `ytmusicapi` interroge YouTube Music (résultats plus propres
  que YouTube : vrais titres, artistes, albums, années, pochettes).
- **Qualité** : cliquer sur une vignette ouvre sa fiche détail (titre ou
  album) ; c'est là que se trouvent la liste déroulante de qualité —
  **Originale** (Opus/M4A extrait sans réencodage, recommandé) ou MP3 320 /
  V0 / 192 / 128 kbps — et le bouton de téléchargement. Le choix est partagé
  et mémorisé. (L'API expose aussi `GET /api/formats/{videoId}` pour lister
  les flux disponibles à la source.)
- **Téléchargement** : `yt-dlp` récupère le flux audio choisi et le convertit
  si nécessaire via ffmpeg. Un album = un job qui télécharge chaque piste
  séquentiellement ; l'échec d'une piste n'interrompt pas les autres.
- **Tagging** : `mutagen` écrit les tags selon le conteneur — ID3v2.3 pour
  MP3, commentaires Vorbis pour Opus/Ogg, atomes MP4 pour M4A — avec pochette
  intégrée en 600×600. Pour un single, l'album d'origine est consulté pour
  récupérer l'année et le numéro de piste. Navidrome lit les trois formats.
- **Suivi** : le panneau latéral affiche la progression en temps réel
  (polling toutes les secondes).

Après un téléchargement, lancez un scan de bibliothèque dans Navidrome (ou
attendez le scan automatique).

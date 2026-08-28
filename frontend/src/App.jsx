import { useCallback, useEffect, useRef, useState } from 'react'
import * as api from './api.js'
import AlbumView from './components/AlbumView.jsx'
import Downloads from './components/Downloads.jsx'
import Results from './components/Results.jsx'

export default function App() {
  const [query, setQuery] = useState('')
  const [type, setType] = useState('songs')
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [openAlbum, setOpenAlbum] = useState(null)
  const [jobs, setJobs] = useState([])
  const [musicDir, setMusicDir] = useState('')
  const lastSearch = useRef('')

  useEffect(() => {
    api.getConfig().then((c) => setMusicDir(c.musicDir)).catch(() => {})
  }, [])

  // Rafraîchit la liste des téléchargements tant qu'un job est actif
  useEffect(() => {
    const poll = () => api.getJobs().then(setJobs).catch(() => {})
    poll()
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') poll()
    }, 1000)
    return () => clearInterval(id)
  }, [])

  const runSearch = useCallback(
    async (q, t) => {
      if (!q.trim()) return
      lastSearch.current = q
      setLoading(true)
      setError(null)
      try {
        setResults(await api.search(q, t))
      } catch (e) {
        setError(`Recherche impossible : ${e.message}`)
        setResults(null)
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  const onSubmit = (e) => {
    e.preventDefault()
    runSearch(query, type)
  }

  const switchType = (t) => {
    setType(t)
    if (lastSearch.current) runSearch(lastSearch.current, t)
  }

  const startSong = async (song) => {
    try {
      await api.downloadSong(song)
    } catch (e) {
      setError(`Téléchargement impossible : ${e.message}`)
    }
  }

  const startAlbum = async (browseId) => {
    try {
      await api.downloadAlbum(browseId)
    } catch (e) {
      setError(`Téléchargement impossible : ${e.message}`)
    }
  }

  return (
    <div className="layout">
      <main className="main">
        <header className="hero">
          <h1>
            <span className="logo">♫</span> yt-get
          </h1>
          <p className="subtitle">
            Recherchez, téléchargez, taguez — prêt pour Navidrome
            {musicDir && <span className="music-dir"> · {musicDir}</span>}
          </p>
        </header>

        <form className="search-bar" onSubmit={onSubmit}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Artiste, titre, album…"
            autoFocus
          />
          <button type="submit" disabled={loading || !query.trim()}>
            {loading ? '…' : 'Rechercher'}
          </button>
        </form>

        <div className="tabs">
          <button
            className={type === 'songs' ? 'tab active' : 'tab'}
            onClick={() => switchType('songs')}
          >
            Titres
          </button>
          <button
            className={type === 'albums' ? 'tab active' : 'tab'}
            onClick={() => switchType('albums')}
          >
            Albums
          </button>
        </div>

        {error && (
          <div className="error" onClick={() => setError(null)}>
            {error}
          </div>
        )}

        <Results
          results={results}
          type={type}
          loading={loading}
          onDownloadSong={startSong}
          onOpenAlbum={setOpenAlbum}
        />
      </main>

      <Downloads jobs={jobs} />

      {openAlbum && (
        <AlbumView
          browseId={openAlbum}
          onClose={() => setOpenAlbum(null)}
          onDownloadAlbum={startAlbum}
          onDownloadSong={startSong}
        />
      )}
    </div>
  )
}

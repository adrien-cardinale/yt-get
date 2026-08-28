import { useEffect, useState } from 'react'
import { getAlbum } from '../api.js'
import DownloadMenu from './DownloadMenu.jsx'

export default function AlbumView({ browseId, onClose, onDownloadAlbum, onDownloadSong }) {
  const [album, setAlbum] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    getAlbum(browseId)
      .then((a) => !cancelled && setAlbum(a))
      .catch((e) => !cancelled && setError(e.message))
    return () => {
      cancelled = true
    }
  }, [browseId])

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          ✕
        </button>

        {error && <div className="error">{error}</div>}
        {!album && !error && <div className="empty">Chargement…</div>}

        {album && (
          <>
            <div className="album-header">
              {album.thumbnail ? (
                <img className="album-cover" src={album.thumbnail} alt={album.title} />
              ) : (
                <div className="album-cover cover-placeholder">♫</div>
              )}
              <div className="album-info">
                <h2>{album.title}</h2>
                <p>
                  {album.artist}
                  {album.year && ` · ${album.year}`}
                  {` · ${album.tracks.length} piste${album.tracks.length > 1 ? 's' : ''}`}
                </p>
                <DownloadMenu
                  primary
                  label="Télécharger l'album"
                  onDownload={(quality) => {
                    onDownloadAlbum(album, quality)
                    onClose()
                  }}
                />
              </div>
            </div>

            <ol className="tracklist">
              {album.tracks.map((t) => (
                <li key={t.videoId || t.track} className="track">
                  <span className="track-num">{t.track}</span>
                  <span className="track-title">{t.title}</span>
                  {t.duration && <span className="duration">{t.duration}</span>}
                  {t.videoId && (
                    <DownloadMenu
                      onDownload={(quality) =>
                        onDownloadSong(
                          {
                            videoId: t.videoId,
                            title: t.title,
                            artist: t.artist || album.artist,
                            album: album.title,
                            albumId: album.browseId,
                            thumbnail: album.thumbnail,
                          },
                          quality,
                        )
                      }
                    />
                  )}
                </li>
              ))}
            </ol>
          </>
        )}
      </div>
    </div>
  )
}

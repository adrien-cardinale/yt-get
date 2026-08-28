import { useEffect } from 'react'
import DownloadMenu from './DownloadMenu.jsx'

export default function SongView({ song, onClose, onDownloadSong }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal modal-song" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          ✕
        </button>

        <div className="album-header">
          {song.thumbnail ? (
            <img className="album-cover" src={song.thumbnail} alt={song.title} />
          ) : (
            <div className="album-cover cover-placeholder">♫</div>
          )}
          <div className="album-info">
            <h2>{song.title}</h2>
            <p>
              {song.artist}
              {song.album && ` · ${song.album}`}
              {song.duration && ` · ${song.duration}`}
            </p>
            <DownloadMenu
              primary
              onDownload={(quality) => {
                onDownloadSong(song, quality)
                onClose()
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

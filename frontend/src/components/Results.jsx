export default function Results({ results, type, loading, onDownloadSong, onOpenAlbum }) {
  if (loading) {
    return (
      <div className="grid">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="card skeleton" />
        ))}
      </div>
    )
  }
  if (results === null) {
    return (
      <div className="empty">
        <p>Lancez une recherche pour trouver des titres ou des albums.</p>
      </div>
    )
  }
  if (results.length === 0) {
    return (
      <div className="empty">
        <p>Aucun résultat.</p>
      </div>
    )
  }

  return (
    <div className="grid">
      {results.map((r) =>
        type === 'songs' ? (
          <SongCard key={r.videoId} song={r} onDownload={onDownloadSong} />
        ) : (
          <AlbumCard key={r.browseId} album={r} onOpen={onOpenAlbum} />
        ),
      )}
    </div>
  )
}

function Cover({ url, alt }) {
  return url ? (
    <img className="cover" src={url} alt={alt} loading="lazy" />
  ) : (
    <div className="cover cover-placeholder">♫</div>
  )
}

function SongCard({ song, onDownload }) {
  return (
    <div className="card">
      <Cover url={song.thumbnail} alt={song.title} />
      <div className="card-body">
        <div className="card-title" title={song.title}>
          {song.title}
        </div>
        <div className="card-sub" title={song.artist}>
          {song.artist}
        </div>
        <div className="card-meta">
          {song.album && <span className="badge">{song.album}</span>}
          {song.duration && <span className="duration">{song.duration}</span>}
        </div>
      </div>
      <button
        className="btn-download"
        title="Télécharger"
        onClick={() => onDownload(song)}
      >
        ⬇
      </button>
    </div>
  )
}

function AlbumCard({ album, onOpen }) {
  return (
    <div className="card card-clickable" onClick={() => onOpen(album.browseId)}>
      <Cover url={album.thumbnail} alt={album.title} />
      <div className="card-body">
        <div className="card-title" title={album.title}>
          {album.title}
        </div>
        <div className="card-sub" title={album.artist}>
          {album.artist}
        </div>
        <div className="card-meta">
          {album.type && <span className="badge">{album.type}</span>}
          {album.year && <span className="duration">{album.year}</span>}
        </div>
      </div>
      <span className="chevron">›</span>
    </div>
  )
}

export default function Results({ results, type, loading, onOpenSong, onOpenAlbum }) {
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
          <Card
            key={r.videoId}
            title={r.title}
            sub={r.artist}
            badge={r.album}
            extra={r.duration}
            thumbnail={r.thumbnail}
            onClick={() => onOpenSong(r)}
          />
        ) : (
          <Card
            key={r.browseId}
            title={r.title}
            sub={r.artist}
            badge={r.type}
            extra={r.year}
            thumbnail={r.thumbnail}
            onClick={() => onOpenAlbum(r.browseId)}
          />
        ),
      )}
    </div>
  )
}

function Card({ title, sub, badge, extra, thumbnail, onClick }) {
  return (
    <div className="card card-clickable" onClick={onClick}>
      {thumbnail ? (
        <img className="cover" src={thumbnail} alt={title} loading="lazy" />
      ) : (
        <div className="cover cover-placeholder">♫</div>
      )}
      <div className="card-body">
        <div className="card-title" title={title}>
          {title}
        </div>
        <div className="card-sub" title={sub}>
          {sub}
        </div>
        <div className="card-meta">
          {badge && <span className="badge">{badge}</span>}
          {extra && <span className="duration">{extra}</span>}
        </div>
      </div>
      <span className="chevron">›</span>
    </div>
  )
}

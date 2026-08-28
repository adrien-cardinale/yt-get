const STATUS_LABEL = {
  queued: 'En attente',
  downloading: 'Téléchargement',
  done: 'Terminé',
  error: 'Erreur',
}

const QUALITY_LABEL = {
  best: 'Originale',
  'mp3-320': 'MP3 320',
  'mp3-v0': 'MP3 V0',
  'mp3-192': 'MP3 192',
  'mp3-128': 'MP3 128',
}

export default function Downloads({ jobs }) {
  return (
    <aside className="downloads">
      <h2>Téléchargements</h2>
      {jobs.length === 0 && <p className="empty-side">Aucun téléchargement.</p>}
      {jobs.map((job) => (
        <div key={job.id} className={`job job-${job.status}`}>
          <div className="job-row">
            {job.thumbnail ? (
              <img className="job-thumb" src={job.thumbnail} alt="" />
            ) : (
              <div className="job-thumb cover-placeholder">♫</div>
            )}
            <div className="job-info">
              <div className="job-title" title={job.title}>
                {job.title}
              </div>
              <div className="job-sub">
                {job.artist}
                {job.kind === 'album' && ` · ${job.tracks.length} pistes`}
              </div>
              <div className="job-status">
                {STATUS_LABEL[job.status]}
                {job.quality && ` · ${QUALITY_LABEL[job.quality] || job.quality}`}
                {job.status === 'downloading' &&
                  ` — ${Math.round(job.progress * 100)} %`}
              </div>
            </div>
          </div>
          {job.status === 'downloading' && (
            <div className="progress">
              <div
                className="progress-fill"
                style={{ width: `${job.progress * 100}%` }}
              />
            </div>
          )}
          {job.error && <div className="job-error">{job.error}</div>}
        </div>
      ))}
    </aside>
  )
}

const STATUS_LABEL = {
  queued: 'En attente',
  downloading: 'Téléchargement',
  done: 'Terminé',
  error: 'Erreur',
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

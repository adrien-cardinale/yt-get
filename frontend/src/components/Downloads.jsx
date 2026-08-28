import { CheckCircle2Icon, DownloadIcon, Loader2Icon, MusicIcon, XCircleIcon } from 'lucide-react'
import { Progress } from '@/components/ui/progress'

const QUALITY_LABEL = {
  best: 'Originale',
  'mp3-320': 'MP3 320',
  'mp3-v0': 'MP3 V0',
  'mp3-192': 'MP3 192',
  'mp3-128': 'MP3 128',
}

function StatusLine({ job }) {
  const quality = QUALITY_LABEL[job.quality] || job.quality
  if (job.status === 'done') {
    return (
      <span className="text-success flex items-center gap-1">
        <CheckCircle2Icon className="size-3.5" /> Terminé · {quality}
      </span>
    )
  }
  if (job.status === 'error') {
    return (
      <span className="text-destructive flex items-center gap-1">
        <XCircleIcon className="size-3.5" /> Erreur
      </span>
    )
  }
  if (job.status === 'downloading') {
    return (
      <span className="text-muted-foreground flex items-center gap-1">
        <Loader2Icon className="size-3.5 animate-spin" />
        {Math.round(job.progress * 100)} % · {quality}
      </span>
    )
  }
  return <span className="text-muted-foreground">En attente · {quality}</span>
}

export default function Downloads({ jobs }) {
  return (
    <aside className="bg-card/40 shrink-0 border-t p-5 lg:sticky lg:top-0 lg:h-screen lg:w-80 lg:overflow-y-auto lg:border-t-0 lg:border-l">
      <h2 className="text-muted-foreground mb-4 flex items-center gap-2 text-xs font-semibold tracking-wider uppercase">
        <DownloadIcon className="size-3.5" />
        Téléchargements
      </h2>

      {jobs.length === 0 && (
        <p className="text-muted-foreground text-sm">Aucun téléchargement.</p>
      )}

      <div className="space-y-2.5">
        {jobs.map((job) => (
          <div key={job.id} className="bg-card space-y-2.5 rounded-lg border p-3">
            <div className="flex items-center gap-3">
              {job.thumbnail ? (
                <img className="size-10 shrink-0 rounded-md object-cover" src={job.thumbnail} alt="" />
              ) : (
                <div className="bg-muted text-muted-foreground flex size-10 shrink-0 items-center justify-center rounded-md">
                  <MusicIcon className="size-4" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium" title={job.title}>
                  {job.title}
                </p>
                <p className="text-muted-foreground truncate text-xs">
                  {job.artist}
                  {job.kind === 'album' && ` · ${job.tracks.length} pistes`}
                </p>
                <div className="mt-0.5 text-xs">
                  <StatusLine job={job} />
                </div>
              </div>
            </div>
            {job.status === 'downloading' && <Progress value={job.progress * 100} />}
            {job.error && (
              <p className="text-destructive text-xs break-words">{job.error}</p>
            )}
          </div>
        ))}
      </div>
    </aside>
  )
}

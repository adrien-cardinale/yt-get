import { ChevronRightIcon, MusicIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

export default function Results({ results, type, loading, onOpenSong, onOpenAlbum }) {
  if (loading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-[86px] rounded-xl" />
        ))}
      </div>
    )
  }
  if (results === null) {
    return (
      <p className="text-muted-foreground py-20 text-center text-sm">
        Lancez une recherche pour trouver des titres ou des albums.
      </p>
    )
  }
  if (results.length === 0) {
    return <p className="text-muted-foreground py-20 text-center text-sm">Aucun résultat.</p>
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
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
    <div
      className="bg-card hover:bg-accent/50 group flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors"
      onClick={onClick}
    >
      {thumbnail ? (
        <img
          className="size-15 shrink-0 rounded-md object-cover"
          src={thumbnail}
          alt={title}
          loading="lazy"
        />
      ) : (
        <div className="bg-muted text-muted-foreground flex size-15 shrink-0 items-center justify-center rounded-md">
          <MusicIcon className="size-6" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium" title={title}>
          {title}
        </p>
        <p className="text-muted-foreground truncate text-sm" title={sub}>
          {sub}
        </p>
        <div className="mt-1.5 flex items-center gap-2">
          {badge && (
            <Badge variant="secondary" className="max-w-40 truncate">
              {badge}
            </Badge>
          )}
          {extra && <span className="text-muted-foreground text-xs">{extra}</span>}
        </div>
      </div>
      <ChevronRightIcon className="text-muted-foreground group-hover:text-foreground size-4 shrink-0 transition-colors" />
    </div>
  )
}

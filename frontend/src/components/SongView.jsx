import { MusicIcon } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import DownloadMenu from './DownloadMenu.jsx'

export default function SongView({ song, onClose, onDownloadSong }) {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <div className="flex gap-5">
          {song.thumbnail ? (
            <img
              className="size-32 shrink-0 rounded-lg object-cover"
              src={song.thumbnail}
              alt={song.title}
            />
          ) : (
            <div className="bg-muted text-muted-foreground flex size-32 shrink-0 items-center justify-center rounded-lg">
              <MusicIcon className="size-10" />
            </div>
          )}
          <DialogHeader className="min-w-0 justify-center gap-3">
            <DialogTitle className="leading-snug">{song.title}</DialogTitle>
            <DialogDescription>
              {song.artist}
              {song.album && ` · ${song.album}`}
              {song.duration && ` · ${song.duration}`}
            </DialogDescription>
            <DownloadMenu
              onDownload={(quality) => {
                onDownloadSong(song, quality)
                onClose()
              }}
            />
          </DialogHeader>
        </div>
      </DialogContent>
    </Dialog>
  )
}

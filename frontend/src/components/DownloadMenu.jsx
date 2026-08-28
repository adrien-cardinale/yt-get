import { useSyncExternalStore } from 'react'

const OPTIONS = [
  { id: 'best', label: 'Originale' },
  { id: 'mp3-320', label: 'MP3 320' },
  { id: 'mp3-v0', label: 'MP3 V0' },
  { id: 'mp3-192', label: 'MP3 192' },
  { id: 'mp3-128', label: 'MP3 128' },
]

// Qualité partagée entre toutes les listes déroulantes et mémorisée.
let quality = localStorage.getItem('yt-get-quality') || 'best'
const listeners = new Set()

const subscribe = (fn) => {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

const setQuality = (q) => {
  quality = q
  localStorage.setItem('yt-get-quality', q)
  listeners.forEach((fn) => fn())
}

/** Liste déroulante de qualité + bouton télécharger. */
export default function DownloadMenu({ onDownload, primary = false, label = 'Télécharger' }) {
  const q = useSyncExternalStore(subscribe, () => quality)
  return (
    <div className="dl-wrap" onClick={(e) => e.stopPropagation()}>
      <select
        className="dl-select"
        title="Qualité — « Originale » : Opus/M4A sans réencodage"
        value={q}
        onChange={(e) => setQuality(e.target.value)}
      >
        {OPTIONS.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
      <button
        className={primary ? 'btn-primary' : 'btn-download'}
        title="Télécharger"
        onClick={() => onDownload(q)}
      >
        {primary ? `⬇ ${label}` : '⬇'}
      </button>
    </div>
  )
}

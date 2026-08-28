async function request(url, options) {
  const res = await fetch(url, options)
  if (!res.ok) {
    let detail = res.statusText
    try {
      detail = (await res.json()).detail || detail
    } catch {
      /* réponse non-JSON */
    }
    throw new Error(detail)
  }
  return res.json()
}

export const search = (q, type) =>
  request(`/api/search?q=${encodeURIComponent(q)}&type=${type}`)

export const getAlbum = (browseId) =>
  request(`/api/album/${encodeURIComponent(browseId)}`)

export const downloadSong = (song) =>
  request('/api/download/song', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(song),
  })

export const downloadAlbum = (browseId) =>
  request('/api/download/album', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ browseId }),
  })

export const getJobs = () => request('/api/jobs')

export const getConfig = () => request('/api/config')

/**
 * يحول أي رابط فيديو لـ embed URL
 * بيشتغل مع:
 * - YouTube: watch, youtu.be, shorts, embed
 * - Google Drive: /file/d/ID/view → /file/d/ID/preview
 * - روابط مباشرة
 */

// ====== YouTube ======

export function getYouTubeVideoId(url: string): string | null {
  if (!url) return null
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?.*[&?]v=([a-zA-Z0-9_-]{11})/,
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

export function getYouTubeEmbedUrl(url: string): string | null {
  const id = getYouTubeVideoId(url)
  if (!id) return null
  return `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1`
}

export function getYouTubeThumbnail(url: string): string | null {
  const id = getYouTubeVideoId(url)
  if (!id) return null
  return `https://img.youtube.com/vi/${id}/maxresdefault.jpg`
}

export function isYouTubeUrl(url: string): boolean {
  return !!getYouTubeVideoId(url)
}

// ====== Google Drive ======

export function getGoogleDriveFileId(url: string): string | null {
  if (!url) return null
  // /file/d/FILE_ID/view  أو  /file/d/FILE_ID/edit  أو  ?id=FILE_ID
  const patterns = [
    /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/,
    /drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/,
    /docs\.google\.com\/.*\/d\/([a-zA-Z0-9_-]+)/,
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

export function getGoogleDriveEmbedUrl(url: string): string | null {
  const id = getGoogleDriveFileId(url)
  if (!id) return null
  return `https://drive.google.com/file/d/${id}/preview`
}

export function isGoogleDriveUrl(url: string): boolean {
  return !!getGoogleDriveFileId(url)
}

// ====== Universal ======

export type VideoType = "youtube" | "drive" | "direct"

export function detectVideoType(url: string): VideoType {
  if (isYouTubeUrl(url)) return "youtube"
  if (isGoogleDriveUrl(url)) return "drive"
  return "direct"
}

export function getEmbedUrl(url: string): string {
  if (isYouTubeUrl(url)) return getYouTubeEmbedUrl(url) || url
  if (isGoogleDriveUrl(url)) return getGoogleDriveEmbedUrl(url) || url
  return url
}
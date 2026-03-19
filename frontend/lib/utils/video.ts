/**
 * يحول أي رابط يوتيوب لـ embed URL + يجيب الـ video ID
 * بيشتغل مع:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID  (مباشر)
 * - https://www.youtube.com/shorts/VIDEO_ID
 */
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
  // maxresdefault أعلى جودة، لو مش موجودة hqdefault احتياط
  return `https://img.youtube.com/vi/${id}/maxresdefault.jpg`
}

export function isYouTubeUrl(url: string): boolean {
  return !!getYouTubeVideoId(url)
}
/**
 * يحول رابط Google Drive لرابط صورة مباشر
 * بيشتغل مع:
 * - https://drive.google.com/file/d/FILE_ID/view
 * - https://drive.google.com/open?id=FILE_ID
 * - https://drive.google.com/uc?id=FILE_ID  (مباشر، بيرجعه زي ما هو)
 */
export function getGoogleDriveImageUrl(url: string): string {
  if (!url) return url

  // لو مش Google Drive، رجّع كما هو
  if (!url.includes("drive.google.com")) return url

  // لو already direct link
  if (url.includes("uc?") && url.includes("export=view")) return url
  if (url.includes("uc?") && url.includes("id=")) {
    const id = url.match(/id=([a-zA-Z0-9_-]+)/)?.[1]
    if (id) return `https://drive.google.com/uc?export=view&id=${id}`
  }

  // استخرج الـ FILE_ID من /file/d/FILE_ID/
  const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)
  if (fileMatch) {
    return `https://drive.google.com/uc?export=view&id=${fileMatch[1]}`
  }

  // استخرج من open?id=
  const openMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/)
  if (openMatch) {
    return `https://drive.google.com/uc?export=view&id=${openMatch[1]}`
  }

  return url
}

export function isGoogleDriveUrl(url: string): boolean {
  return url?.includes("drive.google.com") ?? false
}

/**
 * يحول أي رابط صورة لرابط يشتغل في <img>
 * - Google Drive: /file/d/ID/view → direct download URL
 * - روابط عادية: تفضل كما هي
 */
export function getImageUrl(url: string | null | undefined): string | null {
  if (!url || !url.trim()) return null

  // Google Drive: /file/d/FILE_ID/view أو /file/d/FILE_ID/edit
  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/)
  if (driveMatch) {
    return `https://drive.google.com/thumbnail?id=${driveMatch[1]}&sz=w800`
  }

  // Google Drive open link: ?id=FILE_ID
  const driveOpenMatch = url.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/)
  if (driveOpenMatch) {
    return `https://drive.google.com/thumbnail?id=${driveOpenMatch[1]}&sz=w800`
  }

  // رابط عادي — رجّعه كما هو
  return url
}
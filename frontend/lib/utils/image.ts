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
/** UI용 임시·샘플 이미지 (저장·표시에서 제외). */
const SAMPLE_HOSTS = ['images.unsplash.com'];

/** Supabase Storage에 실제 저장된 파일 URL인지. */
export function isSupabaseStorageUrl(url: string | undefined | null): boolean {
  if (!url) return false;
  return url.includes('/storage/v1/object/public/');
}

/** blob·unsplash 등 임시 URL인지. */
export function isSampleOrBlobUrl(url: string | undefined | null): boolean {
  if (!url) return true;
  if (url.startsWith('blob:')) return true;
  return SAMPLE_HOSTS.some((h) => url.includes(h));
}

/** 서버·캐시에 보관할 실제 미디어 URL인지. */
export function isPersistableMediaUrl(url: string | undefined | null): boolean {
  return isSupabaseStorageUrl(url);
}

/** 화면에 표시할 수 있는 실제 업로드 URL (없으면 undefined). */
export function resolveDisplayUrl(
  url: string | undefined | null,
  storagePath?: string | null,
  supabaseProjectUrl?: string,
): string | undefined {
  if (isSupabaseStorageUrl(url)) return url!;
  if (storagePath && supabaseProjectUrl) {
    return `${supabaseProjectUrl}/storage/v1/object/public/uploads/${storagePath}`;
  }
  if (url && !isSampleOrBlobUrl(url)) return url;
  return undefined;
}

/** 같은 방문·타입에 여러 행이 있을 때 가장 신뢰할 URL 선택. */
export function pickBestImage<T extends { url: string }>(a: T, b: T): T {
  const score = (img: T) => {
    if (isSupabaseStorageUrl(img.url)) {
      const m = img.url.match(/(\d{13})/);
      return 1000 + (m ? Number(m[1]) % 1_000_000 : 0);
    }
    if (img.url && !isSampleOrBlobUrl(img.url)) return 100;
    return 0;
  };
  return score(a) >= score(b) ? a : b;
}

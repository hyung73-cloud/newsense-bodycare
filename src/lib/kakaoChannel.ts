/** 뉴센스의원 카카오톡 채널 (상담톡) */
export const DEFAULT_KAKAO_CHANNEL_URL = 'https://pf.kakao.com/_vxnCPl/chat';

export const CONSULT_ALIMTALK_TAG = '방문패키지상담';

export function getKakaoChannelUrl(): string {
  const fromEnv = (import.meta.env.VITE_KAKAO_CHANNEL_URL as string | undefined)?.trim();
  return fromEnv || DEFAULT_KAKAO_CHANNEL_URL;
}

export function openKakaoChannelConsult(): void {
  window.open(getKakaoChannelUrl(), '_blank', 'noopener,noreferrer');
}

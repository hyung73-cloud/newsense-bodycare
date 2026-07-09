import { supabase, isSupabaseEnabled } from '../lib/supabase';

/** Supabase에 등록한 클리닉 공용 계정 (환경변수로 덮어쓸 수 있음). */
const DEFAULT_CLINIC_EMAIL = 'clinic@newsense.bodycare';

const AUTH_EMAIL =
  (import.meta.env.VITE_CLINIC_AUTH_EMAIL as string | undefined)?.trim() || DEFAULT_CLINIC_EMAIL;

/** Supabase Auth 로그인 사용 (Supabase 연결 시 항상 시도). */
export function isClinicAuthEnabled(): boolean {
  return isSupabaseEnabled && Boolean(supabase);
}

/**
 * 클리닉 공용 계정으로 Supabase Auth 세션 발급.
 * PIN 검증은 기존 adminAuth에서 수행한 뒤 호출한다.
 */
export async function signInClinic(pin: string): Promise<void> {
  if (!isClinicAuthEnabled() || !supabase) return;

  const password =
    (import.meta.env.VITE_CLINIC_AUTH_PASSWORD as string | undefined)?.trim() || pin;

  const { error } = await supabase.auth.signInWithPassword({
    email: AUTH_EMAIL,
    password,
  });
  if (error) {
    console.error('[auth] Supabase 로그인 실패', error.message);
    throw new Error(
      '서버 인증에 실패했습니다. Supabase 사용자 비밀번호가 PIN과 같은지 확인해주세요.',
    );
  }
}

export async function signOutClinic(): Promise<void> {
  if (supabase) await supabase.auth.signOut();
}

/** 앱 시작 시 기존 세션 복원. */
export async function restoreClinicSession(): Promise<boolean> {
  if (!isClinicAuthEnabled() || !supabase) return false;
  const { data } = await supabase.auth.getSession();
  return Boolean(data.session);
}

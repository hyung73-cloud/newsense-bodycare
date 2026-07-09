import { supabase, isSupabaseEnabled } from '../lib/supabase';

const AUTH_EMAIL = (import.meta.env.VITE_CLINIC_AUTH_EMAIL as string | undefined)?.trim();

/** Supabase Auth 로그인이 설정되어 있는지 (이메일 환경변수 필요). */
export function isClinicAuthEnabled(): boolean {
  return isSupabaseEnabled && Boolean(AUTH_EMAIL) && Boolean(supabase);
}

/**
 * 클리닉 공용 계정으로 Supabase Auth 세션 발급.
 * PIN 검증은 기존 adminAuth에서 수행한 뒤 호출한다.
 */
export async function signInClinic(pin: string): Promise<void> {
  if (!isClinicAuthEnabled() || !supabase || !AUTH_EMAIL) return;

  const password =
    (import.meta.env.VITE_CLINIC_AUTH_PASSWORD as string | undefined)?.trim() || pin;

  const { error } = await supabase.auth.signInWithPassword({
    email: AUTH_EMAIL,
    password,
  });
  if (error) throw new Error('서버 인증에 실패했습니다. 관리자에게 문의하세요.');
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

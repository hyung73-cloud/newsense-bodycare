import { supabase, isSupabaseEnabled } from '../lib/supabase';

/** Supabase에 등록한 클리닉 공용 계정 (환경변수로 덮어쓸 수 있음). */
const DEFAULT_CLINIC_EMAIL = 'clinic@newsense.bodycare';

const AUTH_EMAIL =
  (import.meta.env.VITE_CLINIC_AUTH_EMAIL as string | undefined)?.trim() || DEFAULT_CLINIC_EMAIL;

/** Supabase Auth 로그인 사용 (Supabase 연결 시 항상 시도). */
export function isClinicAuthEnabled(): boolean {
  return isSupabaseEnabled && Boolean(supabase);
}

/** getSession이 응답 없이 멈추는 경우 방지 (무료 서버 sleep 시 흔함). */
async function getSessionWithTimeout(timeoutMs = 5000) {
  if (!supabase) return { data: { session: null } };
  try {
    return await Promise.race([
      supabase.auth.getSession(),
      new Promise<Awaited<ReturnType<typeof supabase.auth.getSession>>>((resolve) =>
        setTimeout(() => resolve({ data: { session: null }, error: null }), timeoutMs),
      ),
    ]);
  } catch {
    return { data: { session: null }, error: null };
  }
}

/** 로그인 화면 표시 전 관리자 목록 조회용 — RLS authenticated 세션 확보 */
export async function bootstrapClinicSession(): Promise<boolean> {
  if (!isClinicAuthEnabled() || !supabase) return false;

  const { data } = await getSessionWithTimeout(3000);
  if (data.session?.access_token) return true;

  const password =
    (import.meta.env.VITE_CLINIC_AUTH_PASSWORD as string | undefined)?.trim() || '327288';

  try {
    const { error } = await Promise.race([
      supabase.auth.signInWithPassword({ email: AUTH_EMAIL, password }),
      new Promise<Awaited<ReturnType<typeof supabase.auth.signInWithPassword>>>((resolve) =>
        setTimeout(
          () =>
            resolve({
              data: { user: null, session: null },
              error: { message: 'timeout', name: 'TimeoutError', status: 408 },
            } as Awaited<ReturnType<typeof supabase.auth.signInWithPassword>>),
          8000,
        ),
      ),
    ]);
    return !error;
  } catch {
    return false;
  }
}

/**
 * 클리닉 공용 계정으로 Supabase Auth 세션 발급.
 * PIN 검증은 기존 adminAuth에서 수행한 뒤 호출한다.
 */
export async function signInClinic(pin: string): Promise<void> {
  if (!isClinicAuthEnabled() || !supabase) return;

  const password =
    (import.meta.env.VITE_CLINIC_AUTH_PASSWORD as string | undefined)?.trim() || pin;

  const signInPromise = supabase.auth.signInWithPassword({
    email: AUTH_EMAIL,
    password,
  });

  const { error } = await Promise.race([
    signInPromise,
    new Promise<Awaited<typeof signInPromise>>((resolve) =>
      setTimeout(
        () =>
          resolve({
            data: { user: null, session: null },
            error: { message: '서버 인증 응답 시간 초과', name: 'TimeoutError', status: 408 },
          } as Awaited<typeof signInPromise>),
        12000,
      ),
    ),
  ]);

  if (error) {
    console.error('[auth] Supabase 로그인 실패', error.message);
    throw new Error(
      '서버 인증에 실패했습니다. Supabase 사용자 비밀번호가 PIN과 같은지 확인해주세요.',
    );
  }
}

export async function signOutClinic(): Promise<void> {
  if (supabase) {
    await Promise.race([
      supabase.auth.signOut(),
      new Promise((r) => setTimeout(r, 3000)),
    ]);
  }
}

/** 앱 시작 시 기존 세션 복원. */
export async function restoreClinicSession(): Promise<boolean> {
  if (!isClinicAuthEnabled() || !supabase) return false;
  const { data } = await getSessionWithTimeout(5000);
  return Boolean(data.session);
}

/** 데이터 로드 전 세션 준비 대기 (로그인 직후·새로고침 직후 레이스 방지). */
export async function waitForAuthSession(timeoutMs = 5000): Promise<void> {
  if (!isClinicAuthEnabled() || !supabase) return;
  if (typeof localStorage !== 'undefined' && localStorage.getItem('bodycare-auth-v1') !== '1') {
    return;
  }
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const { data } = await getSessionWithTimeout(2000);
    if (data.session?.access_token) return;
    await new Promise((r) => setTimeout(r, 200));
  }
  console.warn('[auth] 세션 대기 시간 초과 — 데이터 로드를 계속 시도합니다');
}

/** 관리자 설정 화면용 서버 인증 상태. */
export async function getServerAuthStatus(): Promise<{
  enabled: boolean;
  signedIn: boolean;
  email: string | null;
}> {
  if (!isClinicAuthEnabled() || !supabase) {
    return { enabled: false, signedIn: false, email: null };
  }
  const { data } = await getSessionWithTimeout(3000);
  return {
    enabled: true,
    signedIn: Boolean(data.session),
    email: data.session?.user?.email ?? AUTH_EMAIL,
  };
}

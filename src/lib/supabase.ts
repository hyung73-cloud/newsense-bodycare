import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/**
 * Supabase 연결 여부.
 * 환경변수(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)가 모두 설정된 경우에만 true.
 * 미설정 시에는 기존 mock 동작으로 폴백한다.
 */
export const isSupabaseEnabled = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseEnabled
  ? createClient(supabaseUrl as string, supabaseAnonKey as string)
  : null;

/** 업로드 파일을 보관할 스토리지 버킷 이름 */
export const STORAGE_BUCKET = 'uploads';

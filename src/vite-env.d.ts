/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_CLINIC_AUTH_EMAIL?: string;
  readonly VITE_CLINIC_AUTH_PASSWORD?: string;
  readonly VITE_KAKAO_CHANNEL_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

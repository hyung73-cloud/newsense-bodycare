-- ============================================================
-- NewSense BodyCare - Supabase 스키마
-- Supabase 대시보드 → SQL Editor 에 붙여넣고 실행하세요.
-- ============================================================

-- 환자
create table if not exists patients (
  id text primary key,
  chart_no text not null,
  name text not null,
  sex text not null check (sex in ('여', '남')),
  birth text not null,
  age_at_today int not null default 0,
  height_cm numeric not null default 0,
  start_date text,
  total_visits int not null default 0,
  last_visit_date text,
  phone text,
  created_at timestamptz not null default now()
);

-- 방문 기록
create table if not exists visits (
  id text primary key,
  patient_id text not null references patients(id) on delete cascade,
  date text not null,
  weight_kg numeric not null default 0,
  waist_cm numeric not null default 0,
  body_fat_pct numeric not null default 0,
  skeletal_muscle_kg numeric not null default 0,
  visceral_level int not null default 0,
  doctor_note text default '',
  photo_uploaded boolean not null default false,
  inbody_uploaded boolean not null default false,
  status text not null default '진행중' check (status in ('완료', '진행중', '미완료')),
  entered_by text default '',
  entered_at text default '',
  hidden boolean not null default false,
  package_name text,
  created_at timestamptz not null default now()
);
create index if not exists idx_visits_patient on visits(patient_id);

-- 체형 사진 (파일은 Storage, 여기는 표시 URL + 경로 저장)
create table if not exists visit_images (
  id text primary key,
  visit_id text not null references visits(id) on delete cascade,
  type text not null check (type in ('front', 'side')),
  url text,
  storage_path text,
  weight_kg numeric not null default 0,
  waist_cm numeric not null default 0
);
create index if not exists idx_visit_images_visit on visit_images(visit_id);

-- 인바디 기록 (방문당 1개)
create table if not exists inbody_records (
  visit_id text primary key references visits(id) on delete cascade,
  weight_kg numeric not null default 0,
  skeletal_muscle_kg numeric not null default 0,
  body_fat_pct numeric not null default 0,
  visceral_level int not null default 0,
  bmr_kcal int not null default 0,
  abdominal_fat_ratio numeric not null default 0,
  smi numeric not null default 0,
  sheet_image_url text,
  sheet_storage_path text
);

-- 관리자 계정 (PIN 로그인)
create table if not exists admins (
  id text primary key,
  name text not null,
  pin text not null
);

-- ============================================================
-- RLS (Row Level Security)
-- ⚠️ 현재는 익명(anon) 키로 접근하므로 임시로 전체 허용 정책을 둡니다.
--    추후 Supabase Auth 로그인 도입 시 정책을 강화해야 합니다.
-- ============================================================
alter table patients        enable row level security;
alter table visits          enable row level security;
alter table visit_images    enable row level security;
alter table inbody_records  enable row level security;
alter table admins          enable row level security;

do $$
begin
  -- patients
  if not exists (select 1 from pg_policies where tablename='patients' and policyname='allow_all_patients') then
    create policy allow_all_patients on patients for all using (true) with check (true);
  end if;
  -- visits
  if not exists (select 1 from pg_policies where tablename='visits' and policyname='allow_all_visits') then
    create policy allow_all_visits on visits for all using (true) with check (true);
  end if;
  -- visit_images
  if not exists (select 1 from pg_policies where tablename='visit_images' and policyname='allow_all_visit_images') then
    create policy allow_all_visit_images on visit_images for all using (true) with check (true);
  end if;
  -- inbody_records
  if not exists (select 1 from pg_policies where tablename='inbody_records' and policyname='allow_all_inbody') then
    create policy allow_all_inbody on inbody_records for all using (true) with check (true);
  end if;
  -- admins
  if not exists (select 1 from pg_policies where tablename='admins' and policyname='allow_all_admins') then
    create policy allow_all_admins on admins for all using (true) with check (true);
  end if;
end $$;

-- ============================================================
-- Storage 정책: 'uploads' 버킷 업로드/조회/삭제 허용
-- ⚠️ 임시 전체 허용. 추후 Supabase Auth 도입 시 강화 필요.
-- ============================================================
do $$
begin
  if not exists (select 1 from pg_policies where tablename='objects' and policyname='uploads_anon_all') then
    create policy uploads_anon_all on storage.objects
      for all
      using (bucket_id = 'uploads')
      with check (bucket_id = 'uploads');
  end if;
end $$;

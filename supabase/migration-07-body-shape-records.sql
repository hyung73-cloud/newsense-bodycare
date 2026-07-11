-- ============================================================
-- 7단계: 체형결과지(복부 측정) 테이블
-- Supabase SQL Editor에서 1회 실행하세요.
-- ============================================================

create table if not exists body_shape_records (
  visit_id text primary key references visits(id) on delete cascade,
  outer_circumference_cm numeric not null default 0,
  inner_circumference_cm numeric not null default 0,
  fat_thickness_mm numeric not null default 0,
  note_text text default '',
  sheet_image_url text,
  sheet_storage_path text,
  created_at timestamptz not null default now()
);

alter table body_shape_records enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'body_shape_records' and policyname = 'allow_all_body_shape'
  ) then
    create policy allow_all_body_shape on body_shape_records
      for all using (true) with check (true);
  end if;
end $$;

-- ============================================================
-- 10단계: 출시 안정화 — 차트번호 유니크 + 체형결과지 RLS
-- Supabase SQL Editor에서 1회 실행
-- ============================================================

-- 1) 중복 차트번호가 있으면 먼저 확인 후 정리하세요.
-- select chart_no, count(*) from patients group by chart_no having count(*) > 1;

create unique index if not exists idx_patients_chart_no_unique
  on patients (chart_no);

-- 2) body_shape_records: 개방 정책 제거 후 authenticated만 허용
drop policy if exists allow_all_body_shape on body_shape_records;
drop policy if exists "body_shape_authenticated_all" on body_shape_records;

alter table body_shape_records enable row level security;

create policy "body_shape_authenticated_all"
  on body_shape_records
  for all
  to authenticated
  using (true)
  with check (true);

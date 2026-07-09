-- ============================================================
-- 3단계: Supabase Auth + RLS 강화 (선택 적용)
-- ⚠️ 적용 전 반드시 Supabase 대시보드에서 클리닉 Auth 사용자를 먼저 만드세요.
--
-- 1) Authentication → Users → Add user
--    Email: clinic@newsense.bodycare  (또는 .env 의 VITE_CLINIC_AUTH_EMAIL)
--    Password: 327288  (또는 .env 의 VITE_CLINIC_AUTH_PASSWORD)
--
-- 2) Cloudflare 환경변수 추가:
--    VITE_CLINIC_AUTH_EMAIL=clinic@newsense.bodycare
--    VITE_CLINIC_AUTH_PASSWORD=327288
--
-- 3) 이 SQL 실행 후 재배포
-- ============================================================

-- 익명(anon) 전체 허용 정책 제거
drop policy if exists allow_all_patients on patients;
drop policy if exists allow_all_visits on visits;
drop policy if exists allow_all_visit_images on visit_images;
drop policy if exists allow_all_inbody on inbody_records;
drop policy if exists allow_all_admins on admins;

-- 로그인된 사용자만 읽기/쓰기
create policy auth_patients_all on patients
  for all to authenticated using (true) with check (true);

create policy auth_visits_all on visits
  for all to authenticated using (true) with check (true);

create policy auth_visit_images_all on visit_images
  for all to authenticated using (true) with check (true);

create policy auth_inbody_all on inbody_records
  for all to authenticated using (true) with check (true);

create policy auth_admins_all on admins
  for all to authenticated using (true) with check (true);

-- Storage: 로그인 사용자만 uploads 버킷 접근
drop policy if exists uploads_anon_all on storage.objects;

create policy uploads_auth_all on storage.objects
  for all to authenticated
  using (bucket_id = 'uploads')
  with check (bucket_id = 'uploads');

-- 패키지 공개 페이지용: anon 환자·방문 등록/조회/수정 (패키지 등록)
create policy anon_visits_insert on visits
  for insert to anon
  with check (true);

create policy anon_visits_select on visits
  for select to anon
  using (true);

create policy anon_visits_update on visits
  for update to anon
  using (true)
  with check (true);

create policy anon_patients_insert on patients
  for insert to anon
  with check (true);

create policy anon_patients_select on patients
  for select to anon
  using (true);

create policy anon_patients_update on patients
  for update to anon
  using (true)
  with check (true);

-- ============================================================
-- 백업 (b4): 주 1회 권장
-- Table Editor → patients / visits / visit_images / inbody_records / admins
--   → 각 테이블 우측 ... → Export CSV
-- Storage → uploads 버킷 → 중요 사진 폴더 확인
-- ============================================================

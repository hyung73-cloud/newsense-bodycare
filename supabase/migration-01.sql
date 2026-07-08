-- ============================================================
-- 이미 schema.sql 로 테이블을 만든 프로젝트용 변경 스크립트
-- (표시 URL 컬럼 추가). SQL Editor 에서 실행하세요. 여러 번 실행해도 안전.
-- ============================================================
alter table visit_images   add column if not exists url text;
alter table inbody_records add column if not exists sheet_image_url text;

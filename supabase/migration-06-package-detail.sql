-- 패키지 품목·가격 표시용 컬럼 추가
alter table visits add column if not exists package_detail text;
alter table visits add column if not exists package_price numeric;

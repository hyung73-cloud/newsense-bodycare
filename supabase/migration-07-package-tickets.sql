-- 패키지 영수증(시술권) 상세 JSON 저장
alter table visits add column if not exists package_tickets text;

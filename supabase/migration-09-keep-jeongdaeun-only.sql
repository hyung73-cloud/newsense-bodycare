-- ============================================================
-- 9단계: 정다은만 남기고 나머지 환자 삭제 (수동 1회)
-- 앱에서 이미 지웠다면 실행하지 않아도 됩니다.
-- 실행 전 반드시 확인:
--   select id, name, chart_no from patients order by name;
-- ============================================================

-- 확인용 (실행만, 삭제 아님)
-- select id, name, chart_no from patients where name <> '정다은';

delete from patients
where name <> '정다은';

-- 방문·사진·인바디·체형결과지는 patients ON DELETE CASCADE 로 함께 삭제됩니다.
-- Storage(uploads) 고아 파일은 대시보드에서 별도 정리 가능합니다.

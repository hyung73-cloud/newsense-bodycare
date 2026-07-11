-- ============================================================
-- 8단계: 체형 사진 최초/이전 보관용 타입 허용
-- front_first / side_first : 최초 사진 (덮어쓰지 않음)
-- front_prev / side_prev   : 직전 사진 (재업로드 시 갱신)
-- ============================================================

alter table visit_images drop constraint if exists visit_images_type_check;

alter table visit_images
  add constraint visit_images_type_check
  check (type in ('front', 'side', 'front_prev', 'side_prev', 'front_first', 'side_first'));

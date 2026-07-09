-- ============================================================
-- 4단계: 샘플(unsplash) placeholder 사진·인바디 정리
-- 예전 시드/테스트로 들어간 임시 URL을 제거합니다.
-- Supabase SQL Editor에서 1회 실행하세요.
-- ============================================================

-- unsplash 샘플 사진 행 삭제
delete from visit_images
where url like '%images.unsplash.com%'
   or (url is null and storage_path is null);

-- unsplash 샘플 인바디 이미지 URL 비우기 (수치 데이터는 유지)
update inbody_records
set sheet_image_url = null,
    sheet_storage_path = null
where sheet_image_url like '%images.unsplash.com%';

-- blob 임시 URL 정리
delete from visit_images where url like 'blob:%';
update inbody_records set sheet_image_url = null where sheet_image_url like 'blob:%';

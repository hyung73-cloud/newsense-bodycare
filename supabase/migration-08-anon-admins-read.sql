-- 로그인 화면용 관리자명 조회 (bootstrap 세션 실패 시 폴백)
do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'admins' and policyname = 'anon_admins_select') then
    create policy anon_admins_select on admins
      for select to anon
      using (true);
  end if;
end $$;

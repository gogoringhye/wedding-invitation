# Our Wedding Day

프리미엄 모바일 청첩장과 Supabase 기반 방명록 관리 페이지입니다.

## 구성

- `index.html` : 청첩장 및 방명록
- `admin.html` : 관리자 로그인, 방명록 조회·검색·삭제
- `css/` : 디자인 시스템 및 반응형 스타일
- `js/` : 청첩장, 방명록, 관리자 동작
- `supabase/schema.sql` : 방명록 테이블, RLS 정책, 안전한 등록 함수

## Supabase 설정

1. Supabase 프로젝트의 SQL Editor에서 `supabase/schema.sql` 전체를 실행합니다. 방명록 수정·삭제 복구 기능을 반영하려면 이 파일을 다시 실행하세요. 삭제된 메시지는 실제로 지우지 않고 관리자 화면에서 숨김/복구합니다. 이미 실제 삭제된 메시지는 복구할 수 없습니다.
2. `js/config.js`의 `supabase.url`과 `supabase.anonKey`에 프로젝트 URL과 publishable/anon key를 입력합니다.
3. Supabase Auth에서 관리자 계정을 생성한 뒤, SQL Editor에서 해당 계정에 관리자 역할을 지정합니다.

   ```sql
   UPDATE auth.users
   SET raw_app_meta_data =
     COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
   WHERE email = 'admin@example.com';
   ```

   `app_metadata`에 지정한 역할은 사용자가 직접 수정할 수 없습니다. `service_role` 키는 브라우저 코드나 저장소에 넣지 마세요. 방명록 데이터 접근은 RLS 정책으로 보호되며, 작성자는 등록할 때 설정한 비밀번호로 본인 메시지를 수정할 수 있습니다. 비밀번호 원문은 해시로만 저장되므로 관리자도 확인할 수 없습니다. 관리자 페이지에는 최초 작성 시각과 마지막 수정 시각이 표시되며, 삭제한 메시지는 관리자 목록에서 복구할 수 있습니다.

4. 프로젝트를 정적 웹 호스팅에 배포합니다. Supabase가 설정되지 않은 미리보기에서는 방명록이 현재 브라우저의 `localStorage`에 저장되므로 새로고침 후에도 유지되지만, 다른 브라우저·기기와 공유되지는 않습니다. 방문자 간에 방명록을 공유하려면 Supabase를 설정해야 합니다.

## 로컬 실행

```bash
python -m http.server 8000
```

브라우저에서 `http://localhost:8000`을 열어 확인할 수 있습니다.

# care.newsense.co.kr 배포 가이드 (Cloudflare Pages)

## 사전 준비

- [Cloudflare](https://dash.cloudflare.com) 계정
- [GitHub](https://github.com) 계정
- `newsense.co.kr` 도메인이 Cloudflare DNS에 등록되어 있어야 함

## 1단계 — GitHub에 코드 올리기

프로젝트 폴더에서 cmd 실행:

```cmd
cd C:\Users\user\Desktop\work.newsense.co.kr
git init
git add .
git commit -m "Initial commit: NewSense BodyCare dashboard UI"
```

GitHub에서 새 저장소 생성 (예: `newsense-bodycare`) 후:

```cmd
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/newsense-bodycare.git
git push -u origin main
```

## 2단계 — Cloudflare Pages 프로젝트 생성

1. [Cloudflare 대시보드](https://dash.cloudflare.com) → **Workers & Pages**
2. **Create** → **Pages** → **Connect to Git**
3. GitHub 연동 후 `newsense-bodycare` 저장소 선택
4. 빌드 설정:

| 항목 | 값 |
|------|-----|
| Framework preset | Vite |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Node.js version | 20 (Environment variables → `NODE_VERSION` = `20`) |

5. **Environment variables** (Settings → Environment variables) — 채널톡 방문 상담용:

| 변수 | 설명 |
|------|------|
| `CHANNEL_ACCESS_KEY` | 채널톡 데스크 → 설정 → API Key management |
| `CHANNEL_ACCESS_SECRET` | 위와 함께 발급 |
| `CHANNEL_BOT_NAME` | (선택) 메시지 발신 봇 이름. 채널톡 데스크 → 설정 → 봇 에서 **정확한 봇 이름** 확인 (예: `뉴센스의원 BOT`) |
| `CHANNEL_KAKAO_CHANNEL_URL` | (선택) 카카오톡 채널 상담 URL. 기본값 `https://pf.kakao.com/_vxnCPl/chat` |
| `VITE_KAKAO_CHANNEL_URL` | (선택) 앱 「카카오톡으로 상담하기」 버튼 URL. 위와 동일하게 설정 권장 |

6. **Save and Deploy** 클릭

첫 배포가 끝나면 `https://newsense-bodycare.pages.dev` 같은 임시 URL이 생깁니다.

## 채널톡 알림톡 자동 발송 설정 (1회)

BodyCare 앱은 상담 등록 시 고객에게 **`방문패키지상담`** 태그를 붙입니다.  
채널톡 데스크에서 아래 워크플로우를 설정하면 **알림톡이 자동 발송**됩니다.

### 1. 알림톡 연동

1. 채널톡 데스크 → **채널 설정** → **연동** → **메신저** → **카카오톡** → **알림톡** → 연동
2. [알림톡 연동 가이드](https://docs.channel.io/help/ko/articles/f38990b7) 참고

### 2. 알림톡 템플릿 준비

1. **마케팅** → **일회성** 또는 **캠페인** → 새 메시지
2. 발송 매체: **알림톡**
3. 템플릿 예시 문구:
   - `#{고객명}님, BodyCare 방문 패키지 상담이 접수되었습니다.`
   - `방문 희망 일시 확인 후 연락드리겠습니다.`
   - `카카오톡 채널에서 상담을 이어가실 수 있습니다.`

### 3. 워크플로우 (태그 기반 자동 발송)

1. 채널톡 데스크 → **워크플로우** → **+ 새 워크플로우**
2. **트리거**: `사용자 정보가 변경됨` (또는 `사용자 태그 추가`)
3. **필터**: 사용자 태그에 **`방문패키지상담`** 포함
4. **액션**: `알림톡 발송` (또는 `다른 서비스로 메시지 보내기` → 알림톡)
5. 대상: 해당 고객의 **휴대폰 번호**
6. 저장 후 **활성화**

### 4. 팔로업 알림 (답변을 카톡으로 받기)

상담원이 답변할 때 고객 카톡/문자로 알림:

1. **채널 설정** → **상담** → **팔로업 알림** → **휴대폰 번호** ON
2. [팔로업 알림 가이드](https://docs.channel.io/help/ko/articles/1ab15b6a) 참고

### 5. 테스트

1. BodyCare에서 방문상담 등록 (본인 번호)
2. 채널톡 **고객** 탭에 상담 생성 확인
3. 알림톡 수신 확인
4. **카카오톡으로 상담하기** 버튼 → 카카오 채널에서 한 줄 답장
5. 채널톡에서 답변 → 카카오/알림톡 수신 확인

---

## 3단계 — 서브도메인 연결 (care.newsense.co.kr)

1. Pages 프로젝트 → **Custom domains** → **Set up a custom domain**
2. `care.newsense.co.kr` 입력
3. 도메인이 같은 Cloudflare 계정에 있으면 DNS(CNAME)가 **자동 등록**됨
4. SSL 인증서 발급까지 1~5분 대기

### DNS가 자동으로 안 될 때 (수동)

Cloudflare DNS → `newsense.co.kr` zone:

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| CNAME | care | `newsense-bodycare.pages.dev` | Proxied (주황 구름) |

## 4단계 — 배포 확인

- `https://care.newsense.co.kr` 접속
- 대시보드 `/` 로딩 확인
- 환자 프로파일 `/patient/p1` 직접 접속 시 404 없이 열리는지 확인 (SPA 라우팅)

## 이후 업데이트

`main` 브랜치에 push하면 Cloudflare Pages가 자동 재배포합니다.

```cmd
git add .
git commit -m "변경 내용 설명"
git push
```

## 로컬 빌드 테스트

```cmd
npm run build
npm run preview
```

`http://localhost:4173` 에서 production 빌드 미리보기 가능.

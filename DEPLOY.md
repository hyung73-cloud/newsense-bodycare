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
| `CHANNEL_BOT_NAME` | (선택) 메시지 발신 봇 이름. 채널톡 데스크 → 설정 → 봇 에서 **정확한 봇 이름** 확인 |
| `CHANNEL_NOTIFY_GROUP_NAME` | (선택) 상담 알림을 받을 **팀 채팅(그룹) 이름**. 미설정 시 API로 그룹 목록을 조회해 자동 선택 |

6. **Save and Deploy** 클릭

첫 배포가 끝나면 `https://newsense-bodycare.pages.dev` 같은 임시 URL이 생깁니다.

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

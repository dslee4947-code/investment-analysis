# 투자 전망 분석

내 보유 종목을 수동 입력 또는 스크린샷 업로드(AI 자동 인식)로 정리하고, 자산 배분·손익·추이를
대시보드로 확인하는 개인용 웹앱. 로그인으로 보호되며, 배포 후 핸드폰 브라우저에서 실시간으로 볼 수 있습니다.

## 구조

- `server/` — Express + MongoDB(Mongoose) API, JWT 로그인, Anthropic Vision으로 스크린샷 파싱
- `client/` — React + Vite + Tailwind, Recharts 대시보드

## 로컬 실행

### 1. 서버

```bash
cd server
npm install
cp .env.example .env   # 값 채우기 (아래 참고)
npm run seed            # 로그인 계정 1개 생성 (SEED_EMAIL/SEED_PASSWORD 사용)
npm run dev
```

### 2. 클라이언트

```bash
cd client
npm install
npm run dev
```

브라우저에서 `http://localhost:5173` 접속 → 방금 시딩한 이메일/비밀번호로 로그인.

## 배포 전 사용자가 직접 준비해야 하는 것

Claude가 대신 계정을 만들 수 없는 항목이라 아래는 직접 진행해주세요.

### 1) MongoDB Atlas (무료 DB)

1. https://www.mongodb.com/cloud/atlas/register 에서 무료 가입
2. 무료 M0 클러스터 생성 (리전은 Seoul 권장)
3. Database Access에서 사용자 생성 (아이디/비밀번호)
4. Network Access에서 `0.0.0.0/0` 허용 (또는 배포 플랫폼 IP만)
5. "Connect → Drivers"에서 연결 문자열 복사 → `server/.env`의 `MONGO_URI`에 붙여넣기

### 2) Anthropic API 키 (사진 인식 기능용)

1. https://console.anthropic.com 에서 API 키 발급
2. `server/.env`의 `ANTHROPIC_API_KEY`에 입력
3. 사용량만큼 과금되는 유료 API이므로, 스크린샷을 자주 업로드할 계획이면 요금을 확인하세요

### 3) Render.com 배포 (무료 웹서비스)

1. 이 프로젝트를 GitHub 저장소로 push
2. https://render.com 가입 → New → Web Service → 방금 만든 저장소 선택
3. 설정값
   - Build Command: `npm install --prefix server && npm install --prefix client && npm run build --prefix client`
   - Start Command: `npm start --prefix server`
   - Environment: `NODE_ENV=production`, `MONGO_URI`, `JWT_SECRET`, `ANTHROPIC_API_KEY` 등록
4. 배포 완료 후 발급되는 URL로 핸드폰 브라우저에서 접속

배포 후에도 로그인 계정은 로컬에서 `npm run seed`를 Render의 MongoDB에 연결해 1회 실행하거나,
Render Shell에서 동일하게 실행하면 됩니다.

## 참고

- 업로드한 스크린샷 원본은 서버에 저장하지 않고, AI로 분석한 결과(텍스트)만 확인 후 저장합니다.
- "포트폴리오 인사이트" 카드는 보유 현황을 바탕으로 한 사실 기반 요약이며, 매수/매도를 권유하는
  투자 조언이 아닙니다.

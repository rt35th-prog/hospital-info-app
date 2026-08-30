# hospital-info-app

심평원(건강보험심사평가원, HIRA)의 공공데이터를 활용해 **병원 정보 · 비급여 진료비 · 질병별 다빈도 진료비 통계**를
조회하는 웹앱입니다.

## 주요 기능

- **병원 검색** — 지역(시도) · 진료과목 · 병원명으로 전국 병의원 기본정보 검색
- **비급여 진료비 비교** — 지역 내 병원들의 특정 비급여 항목(도수치료 등) 가격 비교
- **질병별 진료비 통계** — 상병(질병)별 다빈도 진료비·진료인원 순위 및 차트
- **의약품 사용정보** — 약효분류군/성분별 사용량·사용금액 통계 (현재 샘플 데이터, 아래 참고)

## 기술 스택 & 아키텍처

Next.js(App Router) 기반 웹앱입니다. 화면(React 컴포넌트)과 데이터 조회 로직이 이미 분리돼 있습니다.

```
브라우저 ── fetch ──▶ Next.js Route Handlers(src/app/api/**)
                              │
                              ▼
                     src/lib/hira/*.ts (심평원 API 클라이언트)
                              │
                              ▼
                    공공데이터포털(data.go.kr) HIRA Open API
```

- 화면 컴포넌트는 REST API(`/api/hospitals`, `/api/nonpayment/compare`, `/api/diseases`)만 호출합니다.
- 따라서 나중에 트래픽/기능이 늘어 백엔드를 분리하고 싶다면, `src/app/api/**`의 라우트 핸들러와
  `src/lib/hira/**`를 그대로 별도의 Node.js 서버(Express/NestJS 등)나 FastAPI로 옮기고,
  프론트엔드는 `fetch` 주소만 그 서버로 바꾸면 됩니다. 지금 구조는 "모놀리식으로 시작해서 필요할 때
  쪼갤 수 있는" 형태로 설계했습니다.

## 시작하기

```bash
npm install
cp .env.example .env.local   # 아래 서비스키 설정
npm run dev
```

http://localhost:3000 에서 확인할 수 있습니다.

### 공공데이터포털 서비스키 설정

1. [공공데이터포털](https://www.data.go.kr)에서 로그인 후 아래 두 API를 각각 활용신청합니다.
   - 건강보험심사평가원_병원정보서비스
   - 건강보험심사평가원_비급여진료비정보조회서비스
2. 승인 후 발급되는 서비스키(Decoding 방식 권장)를 `.env.local`의 `HIRA_SERVICE_KEY`에 넣습니다.
3. 서비스키가 없어도 앱은 자동으로 **샘플(mock) 데이터 모드**로 동작하므로, 키 발급 전에도 화면과
   흐름을 바로 확인할 수 있습니다.

### 질병별 진료비 통계 데이터

심평원의 "다빈도질병통계"/"건강보험진료통계"는 실시간 API가 아니라 주기적으로 갱신되는
파일(CSV/엑셀) 형태로 공개됩니다. 그래서 이 통계는 `src/data/disease-cost-stats.json`에
정적으로 담아 서빙합니다(현재는 샘플 데이터).

실제 데이터로 갱신하려면:

1. [보건의료빅데이터개방시스템](https://opendata.hira.or.kr) 또는 공공데이터포털에서
   "다빈도질병통계" 또는 "건강보험진료통계" 파일데이터를 CSV로 내려받습니다.
2. 다음 명령으로 변환합니다.

   ```bash
   node scripts/import-disease-stats.mjs ./다운로드한파일.csv 2025
   ```

3. 다운로드한 파일의 컬럼명이 다르면 `scripts/import-disease-stats.mjs`의
   `COLUMN_ALIASES`에 실제 헤더명을 추가하면 됩니다.

### 의약품 사용정보 (건강보험심사평가원_의약품사용정보조회서비스)

이 API는 오퍼레이션이 12개나 되고, 정확한 End Point·오퍼레이션명·파라미터를 문서로
확인하지 못한 상태로 화면/타입만 먼저 만들어뒀습니다. 그래서 아래 두 환경변수를
**둘 다** 채워야만 실제 데이터로 동작하고, 비워두면 항상 샘플 데이터로 표시됩니다
(잘못 추측한 엔드포인트로 호출해 알 수 없는 오류가 나는 걸 막기 위함입니다).

1. data.go.kr에서 "건강보험심사평가원_의약품사용정보조회서비스" 검색 → 활용신청
2. 상세페이지의 **"활용신청 상세기능정보"**에서 사용할 오퍼레이션의 End Point와
   오퍼레이션명을 확인
3. `.env.local`에 추가:
   ```
   HIRA_DRUG_USAGE_BASE_URL=http://apis.data.go.kr/B551182/실제서비스경로
   HIRA_DRUG_USAGE_OPERATION=실제오퍼레이션명
   ```
4. 실제 응답 필드명이 `src/lib/hira/drugUsage.ts`의 후보 필드명과 다르면 그 파일만 고치면 됩니다.

## 참고: API 필드명에 대해

`src/lib/hira/hospitals.ts`, `src/lib/hira/nonpayment.ts`는 심평원 Open API의 공개적으로 알려진
응답 필드명을 기준으로 작성했습니다. 실제 서비스키 발급 후 응답이 예상과 다르면
`src/lib/hira/field-utils.ts`의 후보 필드명 배열에 실제 필드명을 추가해 매핑을 보정하면 됩니다.

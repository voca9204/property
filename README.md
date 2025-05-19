# Property Showcase Platform

부동산 관리 및 쇼케이스 플랫폼 - Vite + React + Firebase

## 기능

- 부동산 정보 관리
- 클라이언트 정보 관리
- 쇼케이스 생성 및 공유
- 사용자 인증 및 권한 관리
- 파일 및 이미지 업로드

## 개발 환경 설정

### 사전 요구사항

- Node.js 20.x 이상
- npm 10.x 이상
- Firebase CLI (`npm install -g firebase-tools`)

### 설치 및 실행

1. 저장소 복제

```bash
git clone <repository-url>
cd property
```

2. 의존성 설치

```bash
npm install
```

3. 로컬 개발 서버 실행

```bash
npm run dev
```

4. Firebase 에뮬레이터 실행 (선택사항)

```bash
npm run emulate
```

## 배포 안내

### 수동 배포

전체 프로젝트 배포:

```bash
npm run deploy
```

특정 서비스만 배포:

```bash
npm run deploy:hosting    # 호스팅만 배포
npm run deploy:functions  # 함수만 배포
npm run deploy:firestore  # Firestore 규칙만 배포
npm run deploy:storage    # Storage 규칙만 배포
```

### CI/CD 파이프라인

GitHub Actions를 통한 자동 배포가 설정되어 있습니다:

- `main` 브랜치로 푸시: 자동으로 프로덕션 환경에 배포
- PR 생성: 미리보기 채널에 배포 (PR 번호 기반)

## 프로젝트 구조

```
/
├── .github/               # GitHub Actions 워크플로우 파일
├── .firebase/             # Firebase 로컬 에뮬레이터 설정
├── functions/             # Firebase Cloud Functions
├── public/                # 정적 파일
├── src/                   # 소스 코드
│   ├── components/        # 재사용 가능한 컴포넌트
│   ├── firebase/          # Firebase 연동 코드
│   ├── hooks/             # 커스텀 React hooks
│   ├── models/            # 데이터 모델 정의
│   ├── pages/             # 페이지 컴포넌트
│   ├── App.jsx            # 메인 앱 컴포넌트
│   └── main.jsx           # 앱 진입점
├── .firebaserc            # Firebase 프로젝트 설정
├── firebase.json          # Firebase 서비스 설정
├── firestore.rules        # Firestore 보안 규칙
├── storage.rules          # Storage 보안 규칙
├── vite.config.js         # Vite 설정
└── package.json           # 프로젝트 의존성 및 스크립트
```

## 환경 변수

- `.env.local` 파일을 생성하여 로컬 개발용 환경 변수 설정
- `.env.production` 파일에 프로덕션 환경 변수 설정

## 라이센스

[MIT License](LICENSE)

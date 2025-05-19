# Project Context and Changes

## Project Overview
Property management and showcase application with Firebase integration. Migrating from Next.js to Vite + React.

## Firebase Configuration
```javascript
// Web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA9fxYo9BbUy5iNpU4IMzdtsLwkXycPkfc",
  authDomain: "property-a148c.firebaseapp.com",
  projectId: "property-a148c",
  storageBucket: "property-a148c.firebasestorage.app",
  messagingSenderId: "752363513923",
  appId: "1:752363513923:web:6db3b5a2d0fc9667b34cf6"
};
```

## Recent Changes
- Initialized project 
- Created context.md file to track changes
- Project migrated from Next.js to Vite + React
- Firebase project setup and SDK integration completed
- Added refactoring system task (#17) for managing files that exceed 1000 lines
- Firebase Authentication implemented
- Firebase 구성 파일 업데이트: `/src/firebase/config.js` 파일에 Firebase 설정 추가 및 서비스 내보내기 설정
- OpenAI API 키 보안 개선: hardcoded API 키를 환경 변수(VITE_OPENAI_API_KEY)로 대체
- Implemented Firestore database layer:
  - Created generic FirestoreService base class for CRUD operations
  - Implemented specialized services for properties, users, clients, and showcases
  - Added React hooks for database interactions with loading states and error handling
  - Implemented real-time data subscription capabilities
  - Added specialized search and filtering functions for each model type
- Implemented Firebase Storage integration:
  - Created base StorageService for file operations
  - Implemented specialized services for property images, profile photos, and documents
  - Added React hooks for file uploads with progress tracking
  - Created reusable file upload components
  - Implemented secure storage rules with proper access control
  - Added image preview and management capabilities
- Implemented Firebase Cloud Functions:
  - Created user management functions for user creation, deletion, and role management
  - Implemented property-related functions for data validation and image processing
  - Added showcase functions for URL generation and tracking
  - Created notification system with email integration
  - Implemented scheduled tasks for data maintenance
  - Added React hooks for calling Cloud Functions from the frontend
- Implemented Firebase Hosting and CI/CD pipeline:
  - Configured Firebase Hosting with proper caching and security headers
  - Set up build output directory and rewrite rules
  - Created GitHub Actions workflows for continuous deployment
  - Implemented separate deployment targets for production and staging
  - Added environment configuration for different deployment environments
  - Created setup scripts and documentation for deployment processes
  - Implemented PR preview channels for testing changes
- Implemented Firebase Analytics and performance optimization:
  - Added Firebase Analytics service with event tracking
  - Implemented Performance Monitoring for critical user interactions
  - Created analytics hooks for easy integration with components
  - Built performance-optimized components (LazyLoad, OptimizedImage)
  - Added code splitting and lazy loading for better load times
  - Implemented service worker for offline support and caching
  - Added analytics consent management for GDPR compliance
  - Optimized build configuration with chunking and compression
- Implemented Guide functionality and test pages (Task #18):
  - Created GuideService for managing property guides in Firestore
  - Implemented Guide data model with validation
  - Developed form component for guide creation with image upload
  - Created guide view component with Naver Maps integration
  - Added guide list component to display all available guides
  - Implemented routing for guide pages
  - Added basic layout and navigation components
  - Created placeholder components for user authentication
  - Integrated Naver Maps API for location visualization
  - Implemented environment configuration for API keys
  - Added location data enrichment for address-based information
  - Created mobile-responsive map experience
- Fixed Vite startup issue by installing Vite globally (npm install -g vite)
- Created missing page components:
  - Login page with Firebase authentication
  - Register page with Firebase authentication
  - Dashboard page to display property statistics
  - Properties page for property management
  - Clients page for client management
  - Showcases page for showcase management
- Fixed import error in analytics.service.js by changing from named import to default import for app
- Modified package.json scripts to use npx prefix for running Vite commands
- Resolved index.html conflicts by renaming the duplicate index.html in public folder
- 구글 로그인/회원가입 기능 추가 및 개선
  - UserService 클래스에 loginWithGoogle 메서드 추가
  - useAuth 훅에 구글 로그인 기능 추가
  - 로그인 및 회원가입 페이지에 구글 로그인 버튼 추가
  - 구글 로그인 오류 처리 개선
  - vite.config.js에 개발 서버 CORS 및 호스트 설정 추가
- 파이어베이스 권한 및 CORS 문제 해결:
  - Firestore 보안 규칙 수정: 사용자 생성 및 가이드 기능 관련 권한 완화
  - Firebase Storage 규칙 수정: 개발 환경에서 보안 규칙 완화
  - Firebase CORS 설정 추가: 호스팅 헤더에 CORS 정책 추가
  - 구글 로그인 방식 변경: 개발 환경에서는 리디렉션 기반 인증 사용
  - 앱 초기화 시 인증 리디렉션 결과 처리 로직 추가
- React 비불린 속성 경고 수정 및 스타일링 개선:
  - `style jsx` 대신 외부 CSS 파일을 사용하도록 컴포넌트 변경:
    - Home 컴포넌트: Home.css 파일 생성 및 인라인 스타일 제거
    - NotFound 컴포넌트: NotFound.css 파일 생성 및 인라인 스타일 제거
    - Performance 컴포넌트: performance.css 파일 생성 및 인라인 스타일 제거
    - LoadingSpinner 컴포넌트 style 속성 적용 방식 수정
- 가이드 폼 OpenAI API 통합 및 자연어 처리 기능 추가:
  - 제목 필드를 고객명으로 변경
  - OpenAI API 서비스 통합으로 자연어 텍스트 분석 기능 추가
  - 사용자가 입력한 자연어 설명에서 부동산 정보 자동 추출
  - 추가 정보 필드 섹션 신설 (층수, 엘리베이터, 평수, 보증금, 월세, 관리비, 위치 상세)
  - 텍스트 입력 디바운싱 처리로 API 호출 최적화
  - 파싱 상태 UI 추가 (진행 중, 완료, 오류)
  - 새로운 스타일 및 레이아웃 개선
- Firebase Storage 및 Firestore 권한 문제 해결:
  - auth.service.js 파일 생성: 익명 인증 지원 로직 추가
  - storage.service.js 파일 수정: auth 객체 import 추가, 인증 검사 로직 추가, 오류 처리 개선, 로깅 추가
  - image.service.js 파일 수정: auth 객체 import 추가, 파일 크기 및 형식 유효성 검사 추가, 인증 검사 로직 통합
  - guide.service.js 파일 수정: auth 객체 import 추가, 다중 이미지 처리 지원, 인증 검사 로직 통합, 권한 오류 처리 개선
  - firestore.rules 파일 수정: 필드 이름을 스네이크 케이스에서 카멜 케이스로 변경(created_at -> createdAt), 가이드 컬렉션 권한 완화
  - .firebaserc 파일 수정: default 프로젝트 설정
- GuideForm 연락처 정보 및 사용자 정보 기능 개선:
  - 연락처 정보 섹션의 "이름" 글자 깨짐 문제 수정: "이름" -> "담당자명"으로 변경
  - 담당자 정보를 현재 로그인한 사용자 정보로 자동 채우는 기능 추가
  - 사용자 인증 정보에 따른 폼 필드 자동 초기화 구현
  - 폼 설명 및 힌트 텍스트 개선으로 사용자 경험 향상
- GuideList 이미지 표시 문제 수정:
  - imageUrl과 imageUrls(배열) 필드 모두 지원하도록 개선
  - 가이드 목록에서 이미지가 표시되지 않는 문제 수정
  - 새로운 가이드와 기존 가이드 모두에서 이미지가 올바르게 표시되도록 조건문 추가
- GuideList 기능 확장 및 UI 개선:
  - 카드 뷰와 테이블 뷰 전환 기능 추가
  - 카드 사이즈를 일정하게 유지하도록 CSS 수정
  - 가이드 삭제 기능 추가 (권한 체크 및 확인 모달 포함)
  - 이미지 추가 기능 구현 (권한 체크 및 업로드 진행 상태 표시)
  - 가이드 수정 기능 및 링크 추가
  - 테이블 뷰에 정렬 기능 추가 (타이틀, 주소, 유형, 등록일 기준)
  - 반응형 디자인 적용으로 모바일 환경 지원 개선
- GuideList 이미지 로딩 문제 해결:
  - 이미지 디버깅 코드 추가 및 로딩 실패 처리
  - 이미지 경로는 있지만 URL이 없는 경우 직접 Storage에서 URL 가져오는 로직 추가
  - 이미지 로드 실패 시 대체 이미지 표시 기능 추가 
  - 이미지 URL 정보 표시 및 오류 콘솔 로깅 구현
  - Firebase Storage 버킷 설정 수정: `property-a148c.firebasestorage.app` → `property-a148c.appspot.com`
  - 이미지 업로드 로직 개선: 유효성 검사 및 URL 테스트 추가
  - 이미지 URL 관련 디버깅 정보 확장 (전체 URL 표시 및 이미지 속성 로깅)
  - 가이드에 이미지가 없는 경우 대체 이미지 표시 기능 구현 (고객명 기반 동적 생성)


## Tasks In Progress
- Task 2.4: Indexing Strategy Implementation (in progress)
- Task 17: Implement Codebase Refactoring System for Large Files (pending)

## Refactoring Guidelines
- Files exceeding 1000 lines should be refactored and a task added
- All changes should be documented in this context.md file

## Project Structure
- `/public/` - Static assets for the application
  - `/service-worker.js` - Service worker for offline support
  - `/js/serviceWorkerRegistration.js` - Service worker registration
- `/src/firebase/config.js` - Firebase initialization and service exports
- `/src/firebase/services/` - Firebase service implementations
  - `firestore.service.js` - Generic base service for Firestore operations
  - `property.service.js` - Property-specific database operations
  - `user.service.js` - User authentication and profile management
  - `client.service.js` - Client relationship management
  - `showcase.service.js` - Property showcase management
  - `storage.service.js` - Firebase Storage operations base service
  - `image.service.js` - Specialized services for images and files
  - `guide.service.js` - Property guide management service
  - `/analytics/analytics.service.js` - Analytics and performance monitoring service
- `/src/hooks/` - React hooks for data fetching and state management
  - `useAuth.js` - Authentication and user management hooks
  - `useProperty.js` - Property data access hooks
  - `useClient.js` - Client data access hooks
  - `useShowcase.js` - Showcase data access hooks
  - `useStorage.js` - File upload and management hooks
  - `useFunctions.js` - Cloud Functions interaction hooks
  - `useAnalytics.js` - Analytics and performance tracking hooks
- `/src/models/` - Type definitions and constants for data models
  - `guide.model.js` - Guide model definition and validation
- `/src/config/` - Configuration files
  - `environment.js` - Environment-specific configurations and API keys
- `/src/services/` - Utility services
  - `naverMap.service.js` - Naver Maps API integration service
- `/src/components/` - Reusable UI components
  - `/uploads/` - File upload components
    - `FileUploader.jsx` - Generic file upload component
    - `PropertyImageUploader.jsx` - Property image upload component
    - `ProfileImageUploader.jsx` - Profile image upload component
  - `/performance/` - Performance-optimized components
    - `LazyLoad.jsx` - Lazy loading component with error boundary
    - `OptimizedImage.jsx` - Optimized image component with lazy loading
    - `AnalyticsConsent.jsx` - Analytics consent management
  - `/guide/` - Guide-related components
    - `GuideForm.jsx` - Guide creation form component
    - `GuideView.jsx` - Guide display component
    - `GuideList.jsx` - List of guides component
    - `NaverMap.jsx` - Naver Map integration component
  - `/Layout/` - Layout and navigation components
  - `/ProtectedRoute/` - Authentication route protection
- `/src/pages/` - Page components
  - `/Home/` - Home page component
  - `/Guides/` - Guide page components and routing
  - `/NotFound/` - 404 page component
- `/storage.rules` - Firebase Storage security rules
- `/functions/` - Firebase Cloud Functions
  - `/src/auth/` - User authentication and management functions
  - `/src/properties/` - Property-related functions
  - `/src/showcases/` - Showcase-related functions
  - `/src/notifications/` - Notification and messaging functions
  - `/src/utils/` - Utility functions and helpers
- `/firebase.json` - Firebase project configuration
- `/.firebaserc` - Firebase project targets configuration
- `/.github/workflows/` - GitHub Actions CI/CD configuration
- `/scripts/` - Utility scripts for deployment and setup
- `/vite.config.js` - Vite build configuration with performance optimizations

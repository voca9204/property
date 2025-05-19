/**
 * 환경 변수 설정 및 관리
 * 
 * 이 파일은 애플리케이션 전반에서 사용되는 환경 변수를 관리합니다.
 * 배포 환경에 따라 다른 값을 사용할 수 있도록 설정되어 있습니다.
 */

// 현재 환경 (개발, 테스트, 프로덕션)
export const ENV = import.meta.env.MODE || 'development';

// Naver Maps API 설정
export const NAVER_MAPS_CONFIG = {
  // Naver Maps 클라이언트 ID - 실제 ID 사용
  CLIENT_ID: import.meta.env.VITE_NAVER_MAPS_CLIENT_ID || '7GuM2UHvxkWqlkYWl3Q5',
  
  // Naver Maps 클라이언트 시크릿
  CLIENT_SECRET: import.meta.env.VITE_NAVER_MAPS_CLIENT_SECRET || '5ncUw3N05g',
  
  // Naver Maps 기본 설정
  DEFAULT_CENTER: {
    LAT: 37.5665, // 서울시청 위도
    LNG: 126.9780 // 서울시청 경도
  },
  DEFAULT_ZOOM: 15,
  
  // Naver Maps 스크립트 URL
  SCRIPT_URL: 'https://openapi.map.naver.com/openapi/v3/maps.js',
  
  // Naver Maps 주소 검색 API URL
  GEOCODE_URL: 'https://naveropenapi.apigw.ntruss.com/map-geocode/v2/geocode'
};

// API 요청 시 타임아웃 (ms)
export const API_TIMEOUT = 10000;

// 데이터 캐싱 설정
export const CACHE_CONFIG = {
  // 캐시 만료 시간 (ms)
  TTL: 60 * 60 * 1000, // 1시간
  
  // 최대 캐시 항목 수
  MAX_ITEMS: 100
};

/**
 * 주어진 도메인의 환경 변수를 로드하는 함수
 * @param {string} domain - 환경 변수 도메인
 * @returns {Object} - 도메인 관련 환경 변수 객체
 */
export const getEnvConfig = (domain) => {
  switch (domain) {
    case 'maps':
      return NAVER_MAPS_CONFIG;
    default:
      return {};
  }
};

/**
 * 개발 환경인지 확인하는 함수
 * @returns {boolean} - 개발 환경 여부
 */
export const isDevelopment = () => ENV === 'development';

/**
 * 프로덕션 환경인지 확인하는 함수
 * @returns {boolean} - 프로덕션 환경 여부
 */
export const isProduction = () => ENV === 'production';

/**
 * 테스트 환경인지 확인하는 함수
 * @returns {boolean} - 테스트 환경 여부
 */
export const isTest = () => ENV === 'test';

export default {
  ENV,
  NAVER_MAPS_CONFIG,
  API_TIMEOUT,
  CACHE_CONFIG,
  getEnvConfig,
  isDevelopment,
  isProduction,
  isTest
};

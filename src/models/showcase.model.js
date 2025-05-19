/**
 * Showcase 모델 타입 정의
 * @typedef {Object} Showcase
 * @property {string} id - 쇼케이스 ID
 * @property {string} title - 쇼케이스 제목
 * @property {string} description - 쇼케이스 설명
 * @property {string[]} propertyIds - 포함된 속성 ID 목록
 * @property {string[]} clientIds - 쇼케이스가 공유된 클라이언트 ID 목록
 * @property {string} ownerId - 소유자(에이전트) ID
 * @property {string} status - 쇼케이스 상태
 * @property {string} uniqueUrl - 쇼케이스 고유 URL
 * @property {Object} branding - 브랜딩 정보
 * @property {string} branding.logo - 로고 URL
 * @property {string} branding.primaryColor - 주요 브랜드 색상
 * @property {string} branding.secondaryColor - 보조 브랜드 색상
 * @property {Object} stats - 쇼케이스 통계
 * @property {number} stats.views - 조회수
 * @property {number} stats.interested - 관심 표시 수
 * @property {Date} createdAt - 생성 날짜/시간
 * @property {Date} updatedAt - 업데이트 날짜/시간
 * @property {Date} expiresAt - 만료 날짜/시간
 */

/**
 * Showcase 객체의 기본값
 * @type {Showcase}
 */
export const DEFAULT_SHOWCASE = {
  title: '',
  description: '',
  propertyIds: [],
  clientIds: [],
  ownerId: '',
  status: 'active',
  uniqueUrl: '',
  branding: {
    logo: '',
    primaryColor: '#1a365d',
    secondaryColor: '#2c5282'
  },
  stats: {
    views: 0,
    interested: 0
  },
  createdAt: new Date(),
  updatedAt: new Date(),
  expiresAt: new Date(new Date().setDate(new Date().getDate() + 30)) // 기본 30일 만료
};

/**
 * Showcase 상태 목록
 */
export const SHOWCASE_STATUSES = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  EXPIRED: 'expired',
  DRAFT: 'draft'
};

/**
 * Showcase 필드 목록
 */
export const SHOWCASE_FIELDS = {
  ID: 'id',
  TITLE: 'title',
  DESCRIPTION: 'description',
  PROPERTY_IDS: 'propertyIds',
  CLIENT_IDS: 'clientIds',
  OWNER_ID: 'ownerId',
  STATUS: 'status',
  UNIQUE_URL: 'uniqueUrl',
  BRANDING: 'branding',
  STATS: 'stats',
  CREATED_AT: 'createdAt',
  UPDATED_AT: 'updatedAt',
  EXPIRES_AT: 'expiresAt'
};

/**
 * Showcase 컬렉션 이름
 */
export const SHOWCASE_COLLECTION = 'showcases';

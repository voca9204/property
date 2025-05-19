/**
 * Property 모델 타입 정의
 * @typedef {Object} Property
 * @property {string} id - 속성 ID
 * @property {string} title - 속성 제목
 * @property {string} address - 완전한 주소
 * @property {string} floor - 층/빌딩 내 위치
 * @property {number} deposit - 보증금 (원)
 * @property {number} monthlyRent - 월세 (원)
 * @property {number} maintenanceFee - 관리비 (원)
 * @property {number} area - 면적(제곱미터)
 * @property {string} notes - 추가 메모/비고
 * @property {string} status - 상태 (available, underContract, rented)
 * @property {string[]} images - 이미지 URL 목록
 * @property {string} ownerId - 소유자(에이전트) ID
 * @property {Date} createdAt - 생성 날짜/시간
 * @property {Date} updatedAt - 업데이트 날짜/시간
 * @property {Object} location - 위치 정보 (위도/경도)
 * @property {number} location.latitude - 위도
 * @property {number} location.longitude - 경도
 * @property {string[]} tags - 태그 목록
 * @property {Object} features - 속성 특징 목록
 */

/**
 * Property 객체의 기본값
 * @type {Property}
 */
export const DEFAULT_PROPERTY = {
  title: '',
  address: '',
  floor: '',
  deposit: 0,
  monthlyRent: 0,
  maintenanceFee: 0,
  area: 0,
  notes: '',
  status: 'available',
  images: [],
  ownerId: '',
  createdAt: new Date(),
  updatedAt: new Date(),
  location: {
    latitude: 0,
    longitude: 0
  },
  tags: [],
  features: {}
};

/**
 * Property 상태 목록
 */
export const PROPERTY_STATUSES = {
  AVAILABLE: 'available',
  UNDER_CONTRACT: 'underContract',
  RENTED: 'rented'
};

/**
 * Property 필드 목록
 */
export const PROPERTY_FIELDS = {
  ID: 'id',
  TITLE: 'title',
  ADDRESS: 'address',
  FLOOR: 'floor',
  DEPOSIT: 'deposit',
  MONTHLY_RENT: 'monthlyRent',
  MAINTENANCE_FEE: 'maintenanceFee',
  AREA: 'area',
  NOTES: 'notes',
  STATUS: 'status',
  IMAGES: 'images',
  OWNER_ID: 'ownerId',
  CREATED_AT: 'createdAt',
  UPDATED_AT: 'updatedAt',
  LOCATION: 'location',
  TAGS: 'tags',
  FEATURES: 'features'
};

/**
 * Property 컬렉션 이름
 */
export const PROPERTY_COLLECTION = 'properties';

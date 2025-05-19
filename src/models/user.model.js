/**
 * User 모델 타입 정의
 * @typedef {Object} User
 * @property {string} id - 사용자 ID
 * @property {string} email - 사용자 이메일
 * @property {string} displayName - 사용자 표시 이름
 * @property {string} photoUrl - 사용자 프로필 사진 URL
 * @property {string} phoneNumber - 사용자 전화번호
 * @property {string} role - 사용자 역할 (admin, agent)
 * @property {Object} agency - 에이전시 정보
 * @property {string} agency.name - 에이전시 이름
 * @property {string} agency.logo - 에이전시 로고 URL
 * @property {string} agency.address - 에이전시 주소
 * @property {string} agency.website - 에이전시 웹사이트
 * @property {Object} preferences - 사용자 설정
 * @property {Date} createdAt - 계정 생성 날짜/시간
 * @property {Date} lastLogin - 마지막 로그인 날짜/시간
 */

/**
 * User 객체의 기본값
 * @type {User}
 */
export const DEFAULT_USER = {
  email: '',
  displayName: '',
  photoUrl: '',
  phoneNumber: '',
  role: 'agent',
  agency: {
    name: '',
    logo: '',
    address: '',
    website: ''
  },
  preferences: {},
  createdAt: new Date(),
  lastLogin: new Date()
};

/**
 * User 역할 목록
 */
export const USER_ROLES = {
  ADMIN: 'admin',
  AGENT: 'agent'
};

/**
 * User 필드 목록
 */
export const USER_FIELDS = {
  ID: 'id',
  EMAIL: 'email',
  DISPLAY_NAME: 'displayName',
  PHOTO_URL: 'photoUrl',
  PHONE_NUMBER: 'phoneNumber',
  ROLE: 'role',
  AGENCY: 'agency',
  PREFERENCES: 'preferences',
  CREATED_AT: 'createdAt',
  LAST_LOGIN: 'lastLogin'
};

/**
 * User 컬렉션 이름
 */
export const USER_COLLECTION = 'users';

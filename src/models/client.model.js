/**
 * Client 모델 타입 정의
 * @typedef {Object} Client
 * @property {string} id - 클라이언트 ID
 * @property {string} name - 클라이언트 이름
 * @property {string} email - 클라이언트 이메일
 * @property {string} phone - 클라이언트 전화번호
 * @property {string} address - 클라이언트 주소 (선택 사항)
 * @property {string} notes - 클라이언트에 대한 메모
 * @property {Object} preferences - 클라이언트 속성 선호도
 * @property {string[]} preferences.areas - 선호 지역
 * @property {number} preferences.minBudget - 최소 예산
 * @property {number} preferences.maxBudget - 최대 예산
 * @property {number} preferences.minArea - 최소 면적
 * @property {string[]} showcases - 클라이언트와 공유된 쇼케이스 ID
 * @property {string} ownerId - 소유자(에이전트) ID
 * @property {Date} createdAt - 생성 날짜/시간
 * @property {Date} updatedAt - 업데이트 날짜/시간
 */

/**
 * Client 객체의 기본값
 * @type {Client}
 */
export const DEFAULT_CLIENT = {
  name: '',
  email: '',
  phone: '',
  address: '',
  notes: '',
  preferences: {
    areas: [],
    minBudget: 0,
    maxBudget: 0,
    minArea: 0
  },
  showcases: [],
  ownerId: '',
  createdAt: new Date(),
  updatedAt: new Date()
};

/**
 * Client 필드 목록
 */
export const CLIENT_FIELDS = {
  ID: 'id',
  NAME: 'name',
  EMAIL: 'email',
  PHONE: 'phone',
  ADDRESS: 'address',
  NOTES: 'notes',
  PREFERENCES: 'preferences',
  SHOWCASES: 'showcases',
  OWNER_ID: 'ownerId',
  CREATED_AT: 'createdAt',
  UPDATED_AT: 'updatedAt'
};

/**
 * Client 컬렉션 이름
 */
export const CLIENT_COLLECTION = 'clients';

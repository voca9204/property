/**
 * Appointment 모델 타입 정의
 * @typedef {Object} Appointment
 * @property {string} id - 약속 ID
 * @property {string} clientId - 클라이언트 ID
 * @property {string} propertyId - 속성 ID
 * @property {string} agentId - 에이전트 ID
 * @property {Date} startTime - 약속 시작 날짜/시간
 * @property {Date} endTime - 약속 종료 날짜/시간
 * @property {string} status - 약속 상태 (scheduled, completed, cancelled)
 * @property {string} notes - 약속에 대한 메모
 * @property {Object} feedback - 약속 후 피드백
 * @property {number} feedback.rating - 클라이언트 평가 (1-5)
 * @property {string} feedback.comments - 클라이언트 피드백 코멘트
 * @property {boolean} feedback.interested - 클라이언트가 속성에 관심이 있는지 여부
 * @property {Date} createdAt - 생성 날짜/시간
 * @property {Date} updatedAt - 업데이트 날짜/시간
 */

/**
 * Appointment 객체의 기본값
 * @type {Appointment}
 */
export const DEFAULT_APPOINTMENT = {
  clientId: '',
  propertyId: '',
  agentId: '',
  startTime: new Date(),
  endTime: new Date(new Date().setHours(new Date().getHours() + 1)), // 기본 1시간 약속
  status: 'scheduled',
  notes: '',
  feedback: {
    rating: 0,
    comments: '',
    interested: false
  },
  createdAt: new Date(),
  updatedAt: new Date()
};

/**
 * Appointment 상태 목록
 */
export const APPOINTMENT_STATUSES = {
  SCHEDULED: 'scheduled',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  RESCHEDULED: 'rescheduled',
  NO_SHOW: 'noShow'
};

/**
 * Appointment 필드 목록
 */
export const APPOINTMENT_FIELDS = {
  ID: 'id',
  CLIENT_ID: 'clientId',
  PROPERTY_ID: 'propertyId',
  AGENT_ID: 'agentId',
  START_TIME: 'startTime',
  END_TIME: 'endTime',
  STATUS: 'status',
  NOTES: 'notes',
  FEEDBACK: 'feedback',
  CREATED_AT: 'createdAt',
  UPDATED_AT: 'updatedAt'
};

/**
 * Appointment 컬렉션 이름
 */
export const APPOINTMENT_COLLECTION = 'appointments';

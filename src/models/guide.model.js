/**
 * Guide model for property guide functionality
 */

// Collection name
export const GUIDE_COLLECTION = 'guides';

// Guide fields
export const GUIDE_FIELDS = {
  TITLE: 'title', // 고객명으로 사용
  DESCRIPTION: 'description',
  ADDRESS: 'address',
  IMAGE_URL: 'imageUrl',
  IMAGE_PATH: 'imagePath',
  CREATED_BY: 'createdBy',
  CREATED_AT: 'createdAt',
  UPDATED_AT: 'updatedAt',
  PROPERTY_TYPE: 'propertyType',
  ADDITIONAL_INFO: 'additionalInfo',
  CONTACT_INFO: 'contactInfo',
  // 자연어 파싱을 위한 추가 필드
  FLOOR: 'floor',
  HAS_ELEVATOR: 'hasElevator',
  SIZE: 'size',
  DEPOSIT: 'deposit',
  MONTHLY_RENT: 'monthlyRent',
  MAINTENANCE_FEE: 'maintenanceFee',
  LOCATION_DETAIL: 'locationDetail'
};

// Property types
export const PROPERTY_TYPES = {
  APARTMENT: 'apartment',
  HOUSE: 'house',
  OFFICE: 'office',
  RETAIL: 'retail',
  INDUSTRIAL: 'industrial',
  OTHER: 'other'
};

/**
 * Create a default guide object with empty values
 * @param {string} userId - User ID of the creator
 * @returns {Object} - Default guide object
 */
export const createDefaultGuide = (userId = '') => ({
  [GUIDE_FIELDS.TITLE]: '', // 고객명
  [GUIDE_FIELDS.DESCRIPTION]: '',
  [GUIDE_FIELDS.ADDRESS]: '',
  [GUIDE_FIELDS.IMAGE_URL]: null,
  [GUIDE_FIELDS.IMAGE_PATH]: null,
  [GUIDE_FIELDS.CREATED_BY]: userId,
  [GUIDE_FIELDS.PROPERTY_TYPE]: PROPERTY_TYPES.APARTMENT,
  [GUIDE_FIELDS.ADDITIONAL_INFO]: {
    floor: '', // 층수
    hasElevator: false, // 엘리베이터 유무
    size: '', // 평수 정보
    deposit: '', // 보증금
    monthlyRent: '', // 월세
    maintenanceFee: '', // 관리비
    locationDetail: '' // 위치 상세 정보
  },
  [GUIDE_FIELDS.CONTACT_INFO]: {
    name: '',
    phone: '',
    email: ''
  }
});

/**
 * Validate a guide object
 * @param {Object} guide - Guide object to validate
 * @returns {Object} - Validation result { isValid, errors }
 */
export const validateGuide = (guide) => {
  const errors = {};
  
  // Required fields
  if (!guide[GUIDE_FIELDS.TITLE]) {
    errors[GUIDE_FIELDS.TITLE] = '고객명을 입력해주세요';
  }
  
  if (!guide[GUIDE_FIELDS.ADDRESS]) {
    errors[GUIDE_FIELDS.ADDRESS] = '주소를 입력해주세요';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * 자연어 설명에서 정보 추출
 * @param {string} description - 자연어 설명 텍스트
 * @returns {Object} - 추출된 정보
 */
export const parseDescription = (description) => {
  const result = {
    address: '',
    additionalInfo: {
      floor: '',
      hasElevator: false,
      size: '',
      deposit: '',
      monthlyRent: '',
      maintenanceFee: '',
      locationDetail: ''
    }
  };
  
  if (!description) return result;
  
  // 줄바꿈으로 분리
  const lines = description.split('\n').map(line => line.trim());
  
  // 첫 줄은 주소로 처리
  if (lines.length > 0) {
    result.address = lines[0];
  }
  
  // 각 줄 분석
  lines.forEach(line => {
    // 층수 및 엘리베이터 정보
    if (line.includes('층') || line.includes('엘리베이터') || line.includes('엘베')) {
      // 층수 추출
      const floorMatch = line.match(/(\d+(\.\d+)?)층/);
      if (floorMatch) {
        result.additionalInfo.floor = floorMatch[1];
      }
      
      // 엘리베이터 유무 확인
      if (line.includes('엘리베이터') || line.includes('엘베')) {
        if (line.includes('없음') || line.includes('X') || line.includes('x')) {
          result.additionalInfo.hasElevator = false;
        } else {
          result.additionalInfo.hasElevator = true;
        }
      }
    }
    
    // 평수 정보
    const sizeMatch = line.match(/(\d+(\.\d+)?)평/);
    if (sizeMatch) {
      result.additionalInfo.size = sizeMatch[1];
    }
    
    // 테라스 정보도 평수에 포함
    if (line.includes('테라스') || line.includes('발코니')) {
      result.additionalInfo.locationDetail += line + ' ';
    }
    
    // 보증금, 월세, 관리비 패턴 확인 (예: 3000만원/300만원/10만원)
    const rentPattern = line.match(/(\d+)만원\/(\d+)만원\/(\d+)만원/);
    if (rentPattern) {
      result.additionalInfo.deposit = rentPattern[1];
      result.additionalInfo.monthlyRent = rentPattern[2];
      result.additionalInfo.maintenanceFee = rentPattern[3];
    }
    
    // 위치 상세정보
    if (line.includes('위치') || line.includes('근처') || line.includes('도보') ||
        line.includes('거리') || line.includes('길')) {
      result.additionalInfo.locationDetail += line + ' ';
    }
  });
  
  return result;
};

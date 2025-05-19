/**
 * OpenAI API 서비스
 * 자연어 처리를 위한 OpenAI API 통합
 */

// 환경 변수에서 API 키를 불러옵니다
// VITE_ 접두사를 사용한 환경 변수는 Vite 빌드 시 클라이언트에서 접근 가능합니다
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';

// API 엔드포인트
const API_ENDPOINT = 'https://api.openai.com/v1/chat/completions';

/**
 * OpenAI API 호출 함수
 * @param {string} prompt - 프롬프트 텍스트
 * @param {string} model - 사용할 모델 (기본값: gpt-4-turbo)
 * @param {number} temperature - 온도 파라미터 (기본값: 0.3)
 * @param {number} maxTokens - 최대 토큰 수 (기본값: 1000)
 * @returns {Promise<Object>} - OpenAI API 응답
 */
export const callOpenAI = async (
  prompt,
  model = 'gpt-4-turbo',
  temperature = 0.3,
  maxTokens = 1000
) => {
  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'system',
            content: '당신은 부동산 정보 분석 전문가입니다. 사용자가 제공하는 자연어 텍스트에서 부동산 관련 정보를 추출하여 구조화된 형식으로 반환합니다.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: temperature,
        max_tokens: maxTokens,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API 오류: ${errorData.error?.message || '알 수 없는 오류'}`);
    }

    return await response.json();
  } catch (error) {
    console.error('OpenAI API 호출 중 오류 발생:', error);
    throw error;
  }
};

/**
 * 부동산 정보 파싱 함수
 * @param {string} description - 자연어 설명 텍스트
 * @returns {Promise<Object>} - 파싱된 부동산 정보
 */
export const parsePropertyDescription = async (description) => {
  if (!description) {
    return {
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
  }

  // 프롬프트 구성
  const prompt = `
다음 부동산 설명 텍스트에서 관련 정보를 추출하여 JSON 형식으로 반환해주세요:

"${description}"

다음 정보를 추출해주세요:
1. 주소 (address): 첫 줄이나 텍스트에서 확인되는 위치 정보
2. 층수 (floor): 몇 층인지 (예: 2층, 2.5층 등)
3. 엘리베이터 유무 (hasElevator): 엘리베이터 있음/없음 (true/false)
4. 평수 (size): 제곱미터나 평수 정보 (숫자만 추출)
5. 보증금 (deposit): 숫자만 추출 (단위: 만원)
6. 월세 (monthlyRent): 숫자만 추출 (단위: 만원)
7. 관리비 (maintenanceFee): 숫자만 추출 (단위: 만원)
8. 위치 상세 정보 (locationDetail): 주변 환경, 교통, 특이사항 등

JSON 형식으로만 답변해주세요:
{
  "address": "추출된 주소",
  "additionalInfo": {
    "floor": "추출된 층수",
    "hasElevator": true/false,
    "size": "추출된 평수",
    "deposit": "추출된 보증금",
    "monthlyRent": "추출된 월세",
    "maintenanceFee": "추출된 관리비",
    "locationDetail": "추출된 위치 상세 정보"
  }
}
`;

  try {
    // OpenAI API 호출
    const response = await callOpenAI(prompt);
    
    // 응답에서 JSON 추출
    const content = response.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('OpenAI API에서 유효한 응답을 받지 못했습니다.');
    }
    
    // JSON 형식 추출 (혹시 모를 추가 텍스트 제거)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('유효한 JSON 형식을 찾을 수 없습니다.');
    }
    
    const parsedData = JSON.parse(jsonMatch[0]);
    
    // 결과 반환
    return {
      address: parsedData.address || '',
      additionalInfo: {
        floor: parsedData.additionalInfo?.floor || '',
        hasElevator: parsedData.additionalInfo?.hasElevator || false,
        size: parsedData.additionalInfo?.size || '',
        deposit: parsedData.additionalInfo?.deposit || '',
        monthlyRent: parsedData.additionalInfo?.monthlyRent || '',
        maintenanceFee: parsedData.additionalInfo?.maintenanceFee || '',
        locationDetail: parsedData.additionalInfo?.locationDetail || ''
      }
    };
  } catch (error) {
    console.error('부동산 정보 파싱 중 오류 발생:', error);
    
    // 오류 발생 시 기본값 반환
    return {
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
  }
};

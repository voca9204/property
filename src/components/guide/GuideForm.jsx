import React, { useState, useCallback, useEffect } from 'react';
import { createDefaultGuide, validateGuide, GUIDE_FIELDS } from '../../models/guide.model';
import { guideService } from '../../firebase/services/guide.service';
import { parsePropertyDescription } from '../../services/openai.service';
import { auth } from '../../firebase/config';
import './GuideForm.css';

/**
 * GuideForm component for creating property guides
 */
const GuideForm = () => {
  const [guide, setGuide] = useState(createDefaultGuide(auth.currentUser?.uid || ''));
  const [errors, setErrors] = useState({});
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submissionResult, setSubmissionResult] = useState({ success: false, guideId: null });
  const [isParsing, setIsParsing] = useState(false);
  const [parsingStatus, setParsingStatus] = useState('');
  const [lastParsedText, setLastParsedText] = useState('');
  
  // 자연어 파싱 처리 함수
  const parseDescription = async (text) => {
    if (!text || text === lastParsedText || isParsing) return;
    
    setIsParsing(true);
    setParsingStatus('파싱 중...');
    
    try {
      // OpenAI API를 사용한 파싱
      const parsedData = await parsePropertyDescription(text);
      
      // 추출된 주소가 있고 기존 주소가 비어있으면 업데이트
      if (parsedData.address && !guide[GUIDE_FIELDS.ADDRESS]) {
        setGuide(prev => ({
          ...prev,
          [GUIDE_FIELDS.ADDRESS]: parsedData.address
        }));
      }
      
      // 추가 정보 업데이트
      setGuide(prev => ({
        ...prev,
        additionalInfo: {
          ...prev.additionalInfo,
          ...parsedData.additionalInfo
        }
      }));
      
      setParsingStatus('파싱 완료');
      setLastParsedText(text);
      
      // 3초 후 상태 메시지 제거
      setTimeout(() => {
        setParsingStatus('');
      }, 3000);
    } catch (error) {
      console.error('자연어 파싱 오류:', error);
      setParsingStatus('파싱 실패');
      
      // 3초 후 상태 메시지 제거
      setTimeout(() => {
        setParsingStatus('');
      }, 3000);
    } finally {
      setIsParsing(false);
    }
  };
  
  // 현재 로그인한 사용자의 정보로 연락처 정보 초기화
  useEffect(() => {
    if (auth.currentUser) {
      const currentUser = auth.currentUser;
      
      setGuide(prev => ({
        ...prev,
        contactInfo: {
          ...prev.contactInfo,
          name: currentUser.displayName || '',
          email: currentUser.email || '',
          // 전화번호는 사용자 프로필에 기본적으로 없으므로 별도 처리 필요
          phone: prev.contactInfo.phone
        }
      }));
    }
  }, [auth.currentUser]);
  
  // 설명 필드 변경 후 지연 시간을 두고 파싱 실행
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      const description = guide[GUIDE_FIELDS.DESCRIPTION];
      if (description && description !== lastParsedText) {
        parseDescription(description);
      }
    }, 1500); // 1.5초 지연
    
    return () => clearTimeout(delayDebounceFn);
  }, [guide[GUIDE_FIELDS.DESCRIPTION], lastParsedText]);

  // Handle text input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setGuide(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Handle additional info changes
  const handleAdditionalInfoChange = (e) => {
    const { name, value, type, checked } = e.target;
    const finalValue = type === 'checkbox' ? checked : value;
    
    setGuide(prev => ({
      ...prev,
      additionalInfo: {
        ...prev.additionalInfo,
        [name]: finalValue
      }
    }));
  };

  // Handle image file selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file is an image
    if (!file.type.startsWith('image/')) {
      setErrors(prev => ({
        ...prev,
        image: '이미지 파일만 업로드할 수 있습니다.'
      }));
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({
        ...prev,
        image: '이미지 크기는 5MB 이하여야 합니다.'
      }));
      return;
    }
    
    setImageFile(file);
    
    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
    
    // Clear any previous error
    if (errors.image) {
      setErrors(prev => ({
        ...prev,
        image: ''
      }));
    }
  };

  // Progress callback for image upload
  const handleUploadProgress = useCallback((progress) => {
    setUploadProgress(progress);
  }, []);

  // Form submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if user is authenticated
    if (!auth.currentUser) {
      setErrors(prev => ({
        ...prev,
        auth: '가이드를 생성하려면 로그인이 필요합니다.'
      }));
      return;
    }
    
    // Set the creator ID to the current user ID
    const updatedGuide = {
      ...guide,
      createdBy: auth.currentUser.uid
    };
    
    // Validate form
    const validation = validateGuide(updatedGuide);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }
    
    // Additional image validation
    if (!imageFile) {
      setErrors(prev => ({
        ...prev,
        image: '이미지를 선택해주세요.'
      }));
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Create the guide with transaction for better data consistency
      const result = await guideService.createGuideWithTransaction(
        updatedGuide, 
        imageFile, 
        handleUploadProgress
      );
      
      // Success
      setSubmissionResult({
        success: true,
        guideId: result.id
      });
      
      // Reset form
      setGuide(createDefaultGuide(auth.currentUser?.uid || ''));
      setImageFile(null);
      setImagePreview('');
      setUploadProgress(0);
      setLastParsedText('');
    } catch (error) {
      console.error('Error submitting guide:', error);
      setSubmissionResult({
        success: false,
        error: error.message
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset the form
  const handleReset = () => {
    setGuide(createDefaultGuide(auth.currentUser?.uid || ''));
    setImageFile(null);
    setImagePreview('');
    setErrors({});
    setUploadProgress(0);
    setSubmissionResult({ success: false, guideId: null });
    setLastParsedText('');
  };

  return (
    <div className="guide-form-container">
      <h2>새로운 가이드 생성</h2>
      
      {!auth.currentUser && (
        <div className="auth-warning">
          <p>가이드를 생성하려면 로그인이 필요합니다.</p>
          <a href="/login" className="login-link">로그인 하러 가기</a>
        </div>
      )}
      
      {submissionResult.success ? (
        <div className="success-message">
          <h3>가이드가 성공적으로 생성되었습니다!</h3>
          <p>
            <a href={`/guides/${submissionResult.guideId}`} target="_blank" rel="noopener noreferrer">
              가이드 보기
            </a>
          </p>
          <button type="button" onClick={handleReset}>새 가이드 만들기</button>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {/* Title Field (changed to Customer Name) */}
          <div className="form-group">
            <label htmlFor="title">고객명</label>
            <input
              type="text"
              id="title"
              name={GUIDE_FIELDS.TITLE}
              value={guide[GUIDE_FIELDS.TITLE]}
              onChange={handleInputChange}
              placeholder="고객 이름을 입력하세요"
              required
              disabled={!auth.currentUser}
            />
            {errors[GUIDE_FIELDS.TITLE] && (
              <div className="error">{errors[GUIDE_FIELDS.TITLE]}</div>
            )}
          </div>
          
          {/* Description Field - with parsing capability */}
          <div className="form-group">
            <label htmlFor="description">자연어 설명</label>
            <div className="parsing-status-container">
              {parsingStatus && (
                <div className={`parsing-status ${parsingStatus.includes('실패') ? 'error' : ''}`}>
                  {parsingStatus}
                </div>
              )}
            </div>
            <textarea
              id="description"
              name={GUIDE_FIELDS.DESCRIPTION}
              value={guide[GUIDE_FIELDS.DESCRIPTION]}
              onChange={handleInputChange}
              placeholder="자연어로 물건 정보를 입력하세요. 예시: 
연남동 239-44 
2.5층, 엘베있음, 
내부 36평+ 테라스
3000만원/300만원/10만원, 
연남동 메인 꽃화단길 위치"
              rows={6}
              disabled={!auth.currentUser || isParsing}
            />
            <div className="form-hint">
              자연어로 입력하면 인공지능이 분석하여 아래 필드에 자동으로 정보를 채웁니다. 또는 아래 필드에 직접 입력하세요.
            </div>
          </div>
          
          {/* Address Field */}
          <div className="form-group">
            <label htmlFor="address">주소</label>
            <input
              type="text"
              id="address"
              name={GUIDE_FIELDS.ADDRESS}
              value={guide[GUIDE_FIELDS.ADDRESS]}
              onChange={handleInputChange}
              placeholder="정확한 주소를 입력하세요"
              required
              disabled={!auth.currentUser}
            />
            {errors[GUIDE_FIELDS.ADDRESS] && (
              <div className="error">{errors[GUIDE_FIELDS.ADDRESS]}</div>
            )}
          </div>
          
          {/* Property Type Field */}
          <div className="form-group">
            <label htmlFor="propertyType">건물 유형</label>
            <select
              id="propertyType"
              name={GUIDE_FIELDS.PROPERTY_TYPE}
              value={guide[GUIDE_FIELDS.PROPERTY_TYPE]}
              onChange={handleInputChange}
              disabled={!auth.currentUser}
            >
              <option value="apartment">아파트</option>
              <option value="house">주택</option>
              <option value="office">사무실</option>
              <option value="retail">상가</option>
              <option value="industrial">공장/창고</option>
              <option value="other">기타</option>
            </select>
          </div>
          
          {/* Additional Info Fields - Auto-filled from the description */}
          <div className="form-group additional-info-group">
            <h3>추가 정보</h3>
            
            <div className="additional-info-grid">
              {/* Floor Info */}
              <div className="sub-form-group">
                <label htmlFor="floor">층수</label>
                <input
                  type="text"
                  id="floor"
                  name="floor"
                  value={guide.additionalInfo?.floor || ''}
                  onChange={handleAdditionalInfoChange}
                  placeholder="예: 2층, 2.5층"
                  disabled={!auth.currentUser}
                />
              </div>
              
              {/* Elevator */}
              <div className="sub-form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="hasElevator"
                    checked={guide.additionalInfo?.hasElevator || false}
                    onChange={handleAdditionalInfoChange}
                    disabled={!auth.currentUser}
                  />
                  엘리베이터 있음
                </label>
              </div>
              
              {/* Size */}
              <div className="sub-form-group">
                <label htmlFor="size">평수</label>
                <input
                  type="text"
                  id="size"
                  name="size"
                  value={guide.additionalInfo?.size || ''}
                  onChange={handleAdditionalInfoChange}
                  placeholder="예: 36평"
                  disabled={!auth.currentUser}
                />
              </div>
              
              {/* Deposit */}
              <div className="sub-form-group">
                <label htmlFor="deposit">보증금 (만원)</label>
                <input
                  type="text"
                  id="deposit"
                  name="deposit"
                  value={guide.additionalInfo?.deposit || ''}
                  onChange={handleAdditionalInfoChange}
                  placeholder="예: 3000"
                  disabled={!auth.currentUser}
                />
              </div>
              
              {/* Monthly Rent */}
              <div className="sub-form-group">
                <label htmlFor="monthlyRent">월세 (만원)</label>
                <input
                  type="text"
                  id="monthlyRent"
                  name="monthlyRent"
                  value={guide.additionalInfo?.monthlyRent || ''}
                  onChange={handleAdditionalInfoChange}
                  placeholder="예: 300"
                  disabled={!auth.currentUser}
                />
              </div>
              
              {/* Maintenance Fee */}
              <div className="sub-form-group">
                <label htmlFor="maintenanceFee">관리비 (만원)</label>
                <input
                  type="text"
                  id="maintenanceFee"
                  name="maintenanceFee"
                  value={guide.additionalInfo?.maintenanceFee || ''}
                  onChange={handleAdditionalInfoChange}
                  placeholder="예: 10"
                  disabled={!auth.currentUser}
                />
              </div>
            </div>
            
            {/* Location Detail */}
            <div className="sub-form-group full-width">
              <label htmlFor="locationDetail">위치 상세 정보</label>
              <textarea
                id="locationDetail"
                name="locationDetail"
                value={guide.additionalInfo?.locationDetail || ''}
                onChange={handleAdditionalInfoChange}
                placeholder="예: 연남동 메인 꽃화단길 위치, 주변 편의시설, 교통 등"
                rows={3}
                disabled={!auth.currentUser}
              />
            </div>
          </div>
          
          {/* Image Upload Field */}
          <div className="form-group">
            <label htmlFor="image">이미지 업로드</label>
            <input
              type="file"
              id="image"
              onChange={handleImageChange}
              accept="image/*"
              disabled={!auth.currentUser}
            />
            {errors.image && (
              <div className="error">{errors.image}</div>
            )}
            
            {/* Image Preview */}
            {imagePreview && (
              <div className="image-preview">
                <img src={imagePreview} alt="미리보기" />
              </div>
            )}
          </div>
          
          {/* Contact Information Fields */}
          <div className="form-group">
            <h3>담당자 정보</h3>
            <p className="form-hint">현재 로그인한 사용자 정보가 자동으로 설정됩니다.</p>
            
            <div className="sub-form-group">
              <label htmlFor="contactName">담당자명</label>
              <input
                type="text"
                id="contactName"
                name="contactInfo.name"
                value={guide.contactInfo.name}
                onChange={(e) => setGuide(prev => ({
                  ...prev,
                  contactInfo: {
                    ...prev.contactInfo,
                    name: e.target.value
                  }
                }))}
                placeholder="담당자 이름"
                disabled={!auth.currentUser}
              />
            </div>
            
            <div className="sub-form-group">
              <label htmlFor="contactPhone">연락처</label>
              <input
                type="tel"
                id="contactPhone"
                name="contactInfo.phone"
                value={guide.contactInfo.phone}
                onChange={(e) => setGuide(prev => ({
                  ...prev,
                  contactInfo: {
                    ...prev.contactInfo,
                    phone: e.target.value
                  }
                }))}
                placeholder="연락 가능한 전화번호"
                disabled={!auth.currentUser}
              />
            </div>
            
            <div className="sub-form-group">
              <label htmlFor="contactEmail">이메일</label>
              <input
                type="email"
                id="contactEmail"
                name="contactInfo.email"
                value={guide.contactInfo.email}
                onChange={(e) => setGuide(prev => ({
                  ...prev,
                  contactInfo: {
                    ...prev.contactInfo,
                    email: e.target.value
                  }
                }))}
                placeholder="연락 가능한 이메일"
                disabled={!auth.currentUser}
              />
            </div>
          </div>
          
          {/* Auth error */}
          {errors.auth && (
            <div className="error-message">
              <p>{errors.auth}</p>
            </div>
          )}
          
          {/* Submit Button */}
          <div className="form-actions">
            <button 
              type="submit" 
              disabled={isSubmitting || !auth.currentUser}
              className="submit-button"
            >
              {isSubmitting ? '제출 중...' : '가이드 생성'}
            </button>
            
            <button 
              type="button" 
              onClick={handleReset}
              disabled={isSubmitting || !auth.currentUser}
              className="reset-button"
            >
              초기화
            </button>
          </div>
          
          {/* Upload Progress Bar (when submitting) */}
          {isSubmitting && (
            <div className="progress-container">
              <div 
                className="progress-bar" 
                style={{ width: `${uploadProgress}%` }}
              >
                {Math.round(uploadProgress)}%
              </div>
            </div>
          )}
          
          {/* Submission Error */}
          {submissionResult.error && (
            <div className="error-message">
              <p>오류가 발생했습니다: {submissionResult.error}</p>
            </div>
          )}
        </form>
      )}
    </div>
  );
};

export default GuideForm;

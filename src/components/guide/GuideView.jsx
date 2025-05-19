import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { guideService } from '../../firebase/services/guide.service';
import { PROPERTY_TYPES } from '../../models/guide.model';
import NaverMap from './NaverMap';
import './GuideView.css';

/**
 * GuideView component for displaying property guides
 */
const GuideView = () => {
  const { id } = useParams();
  const [guide, setGuide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mapError, setMapError] = useState(null);

  // Fetch guide data
  useEffect(() => {
    const fetchGuide = async () => {
      try {
        // 위치 정보가 강화된 가이드 데이터 조회
        const guideData = await guideService.getGuideWithDetails(id);
        setGuide(guideData);
      } catch (err) {
        console.error('Error fetching guide:', err);
        setError('가이드를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchGuide();
    }
  }, [id]);
  
  // Set up real-time subscription to guide updates
  useEffect(() => {
    if (!id) return;
    
    // Subscribe to guide updates
    const unsubscribe = guideService.subscribeToGuide(id, (updatedGuide) => {
      if (updatedGuide) {
        // Add additional details to the guide data
        const enhancedGuide = {
          ...updatedGuide,
          formattedAddress: guideService.formatAddress(updatedGuide.address),
          naverMapUrl: guideService.generateNaverMapUrl(updatedGuide.address)
        };
        setGuide(enhancedGuide);
        setLoading(false);
      } else {
        // Guide was deleted or doesn't exist
        setGuide(null);
        setLoading(false);
      }
    });
    
    // Clean up subscription
    return () => unsubscribe();
  }, [id]);

  // Format date from timestamp
  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    
    // Convert Firebase timestamp to Date
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    
    // Format date in Korean locale
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Property type labels
  const propertyTypeLabels = {
    [PROPERTY_TYPES.APARTMENT]: '아파트',
    [PROPERTY_TYPES.HOUSE]: '주택',
    [PROPERTY_TYPES.OFFICE]: '사무실',
    [PROPERTY_TYPES.RETAIL]: '상가',
    [PROPERTY_TYPES.INDUSTRIAL]: '공장/창고',
    [PROPERTY_TYPES.OTHER]: '기타'
  };

  // Handle map error
  const handleMapError = (errorMsg) => {
    setMapError(errorMsg);
  };

  // Loading state
  if (loading) {
    return (
      <div className="guide-loading">
        <div className="loading-spinner"></div>
        <p>가이드 정보를 불러오는 중입니다...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="guide-error">
        <h2>오류가 발생했습니다</h2>
        <p>{error}</p>
        <Link to="/guides" className="back-link">가이드 목록으로 돌아가기</Link>
      </div>
    );
  }

  // Not found state
  if (!guide) {
    return (
      <div className="guide-not-found">
        <h2>가이드를 찾을 수 없습니다</h2>
        <p>요청하신 가이드가 존재하지 않거나 삭제되었을 수 있습니다.</p>
        <Link to="/guides" className="back-link">가이드 목록으로 돌아가기</Link>
      </div>
    );
  }

  return (
    <div className="guide-view-container">
      <div className="guide-header">
        <h1>{guide.title}</h1>
        <div className="guide-meta">
          <div className="property-type-badge">
            {propertyTypeLabels[guide.propertyType] || '정보 없음'}
          </div>
          {guide.createdAt && (
            <div className="created-date">
              등록일: {formatDate(guide.createdAt)}
            </div>
          )}
        </div>
      </div>

      {/* Main Image */}
      {guide.imageUrl && (
        <div className="guide-image-container">
          <img 
            src={guide.imageUrl} 
            alt={guide.title} 
            className="guide-main-image" 
          />
        </div>
      )}
      
      {/* Description */}
      {guide.description && (
        <div className="guide-section">
          <h2>소개</h2>
          <p className="guide-description">{guide.description}</p>
        </div>
      )}
      
      {/* Address and Map */}
      <div className="guide-section location-section">
        <h2>위치 정보</h2>
        <p className="guide-address">{guide.formattedAddress || guide.address}</p>
        
        {/* Location Actions */}
        <div className="location-actions">
          {/* Naver Map Link */}
          <a 
            href={guide.naverMapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="naver-map-link"
          >
            네이버 지도에서 열기
          </a>
          
          {/* Mobile App Link - Show on mobile devices */}
          <a 
            href={`nmap://search?query=${encodeURIComponent(guide.address)}&appname=property.a148c`}
            className="naver-app-link"
          >
            지도 앱에서 열기
          </a>
        </div>
        
        {/* Embedded Map */}
        <div className="map-container">
          {mapError ? (
            <div className="map-error">
              <p>{mapError}</p>
              <a 
                href={guide.naverMapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="map-link-button"
              >
                네이버 지도로 이동
              </a>
            </div>
          ) : (
            <NaverMap 
              address={guide.address} 
              onError={handleMapError}
              height="400px"
              mapOptions={{
                zoom: 16,
                mapTypeControl: true,
                mapTypeControlOptions: {
                  style: 2, // DROPDOWN style
                  position: 3 // TOP_RIGHT position
                }
              }}
              markerOptions={{
                icon: {
                  content: `
                    <div style="
                      background-color: #4a90e2;
                      width: 20px;
                      height: 20px;
                      border-radius: 50%;
                      border: 3px solid white;
                      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                    "></div>
                  `,
                  anchor: { x: 12, y: 12 }
                },
                animation: 1 // BOUNCE animation
              }}
            />
          )}
        </div>
        
        {/* Nearby Facilities - Only shown if available */}
        {guide.nearbyFacilities && guide.nearbyFacilities.length > 0 && (
          <div className="nearby-facilities">
            <h3>주변 시설</h3>
            <ul className="facilities-list">
              {guide.nearbyFacilities.map((facility, index) => (
                <li key={index} className="facility-item">
                  <span className="facility-name">{facility.name}</span>
                  {facility.distance && (
                    <span className="facility-distance">{facility.distance}m</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Public Transportation - Only shown if available */}
        {guide.publicTransportation && guide.publicTransportation.length > 0 && (
          <div className="public-transportation">
            <h3>대중교통</h3>
            <ul className="transport-list">
              {guide.publicTransportation.map((transport, index) => (
                <li key={index} className="transport-item">
                  <span className={`transport-type transport-${transport.type.toLowerCase()}`}>
                    {transport.type}
                  </span>
                  <span className="transport-name">{transport.name}</span>
                  {transport.distance && (
                    <span className="transport-distance">{transport.distance}m</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      
      {/* Contact Information */}
      {guide.contactInfo && (
        <div className="guide-section">
          <h2>연락처 정보</h2>
          <div className="contact-info">
            {guide.contactInfo.name && (
              <p><strong>담당자:</strong> {guide.contactInfo.name}</p>
            )}
            {guide.contactInfo.phone && (
              <p>
                <strong>전화번호:</strong> 
                <a href={`tel:${guide.contactInfo.phone}`} className="contact-link">
                  {guide.contactInfo.phone}
                </a>
              </p>
            )}
            {guide.contactInfo.email && (
              <p>
                <strong>이메일:</strong> 
                <a href={`mailto:${guide.contactInfo.email}`} className="contact-link">
                  {guide.contactInfo.email}
                </a>
              </p>
            )}
          </div>
        </div>
      )}
      
      {/* Additional Information */}
      {guide.additionalInfo && Object.keys(guide.additionalInfo).length > 0 && (
        <div className="guide-section">
          <h2>추가 정보</h2>
          <div className="additional-info">
            {Object.entries(guide.additionalInfo).map(([key, value]) => (
              <div key={key} className="info-item">
                <strong>{key}:</strong> {value}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Created By Information */}
      {guide.createdBy && (
        <div className="guide-footer-info">
          <p>등록자 ID: {guide.createdBy}</p>
          {guide.updatedAt && guide.updatedAt !== guide.createdAt && (
            <p>최종 수정일: {formatDate(guide.updatedAt)}</p>
          )}
        </div>
      )}
      
      {/* Back Link */}
      <div className="guide-footer">
        <Link to="/guides" className="back-link">가이드 목록으로 돌아가기</Link>
      </div>
    </div>
  );
};

export default GuideView;

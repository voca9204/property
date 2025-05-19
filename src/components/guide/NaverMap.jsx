import React, { useEffect, useRef, useState } from 'react';
import naverMapService from '../../services/naverMap.service';

/**
 * NaverMap component for integrating Naver Maps into the application
 * 
 * @param {Object} props - Component props
 * @param {string} props.address - The address to display on the map
 * @param {function} props.onError - Error callback function
 * @param {string} props.width - Map width (default: 100%)
 * @param {string} props.height - Map height (default: 400px)
 * @param {Object} props.mapOptions - Additional map options
 * @param {Object} props.markerOptions - Additional marker options
 * @param {string} props.className - Additional CSS class names
 * @param {boolean} props.responsive - Whether to make the map responsive to container size
 */
const NaverMap = ({ 
  address, 
  onError, 
  width = '100%', 
  height = '400px',
  mapOptions = {},
  markerOptions = {},
  className = '',
  responsive = true
}) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null); // 네이버 지도 인스턴스 참조
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [mapDimensions, setMapDimensions] = useState({ width, height });
  
  // 컨테이너 크기 변경 감지를 위한 리사이즈 옵저버 설정
  useEffect(() => {
    if (!responsive || !mapRef.current) return;
    
    const updateMapSize = () => {
      if (mapRef.current) {
        const containerWidth = mapRef.current.clientWidth;
        
        // 모바일 화면에서는 높이 조정
        let containerHeight = parseInt(height);
        if (window.innerWidth <= 768) {
          containerHeight = 300; // 모바일 화면에서 더 작은 높이
        } else if (window.innerWidth <= 1024) {
          containerHeight = 350; // 태블릿 화면에서 중간 높이
        }
        
        setMapDimensions({
          width: `${containerWidth}px`,
          height: `${containerHeight}px`
        });
        
        // 지도 인스턴스가 있는 경우 리사이즈 호출
        if (mapInstanceRef.current && window.naver && window.naver.maps) {
          window.naver.maps.Event.trigger(mapInstanceRef.current, 'resize');
        }
      }
    };
    
    // ResizeObserver 설정
    const resizeObserver = new ResizeObserver(updateMapSize);
    resizeObserver.observe(mapRef.current);
    
    // 초기 크기 설정
    updateMapSize();
    
    // 윈도우 리사이즈 이벤트에도 반응
    window.addEventListener('resize', updateMapSize);
    
    return () => {
      if (mapRef.current) {
        resizeObserver.unobserve(mapRef.current);
      }
      window.removeEventListener('resize', updateMapSize);
    };
  }, [responsive, height]);
  
  // Initialize map once component mounts and address is available
  useEffect(() => {
    let isMounted = true;
    
    const initializeMap = async () => {
      if (!address || !mapRef.current) return;
      
      setIsLoading(true);
      setIsError(false);
      
      try {
        // 네이버 맵 스크립트 로드
        await naverMapService.loadScript();
        
        // 스크립트가 로드되었는지 확인
        if (window.naver && window.naver.maps) {
          console.log('Naver Maps API loaded successfully');
        } else {
          console.warn('Naver Maps API script loaded but window.naver.maps not available');
        }
        
        // 실제 네이버 지도 생성
        const result = await naverMapService.createMapWithAddress(
          mapRef.current,
          address,
          mapOptions,
          markerOptions
        );
        
        if (!isMounted) return;
        
        if (result.success) {
          setIsLoaded(true);
          setIsLoading(false);
          
          // 지도 인스턴스 저장
          if (result.map) {
            mapInstanceRef.current = result.map;
            
            // 모바일에서 한 손가락 드래그 활성화
            if (window.matchMedia('(max-width: 768px)').matches) {
              result.map.setOptions({
                draggable: true,
                pinchZoom: true,
                scrollWheel: false,
                keyboardShortcuts: false,
                disableDoubleTapZoom: false,
                disableDoubleClickZoom: false,
                disableTwoFingerTapZoom: false
              });
            }
          }
        } else {
          throw new Error(result.error || '지도를 초기화하는 데 실패했습니다.');
        }
      } catch (error) {
        console.error('Error initializing Naver Map:', error);
        
        if (!isMounted) return;
        
        // 오류 발생 시 대체 지도 표시
        setIsError(true);
        setIsLoading(false);
        setErrorMessage(error.message);
        
        if (onError) {
          onError(error.message);
        }
        
        // 대체 지도 생성
        createPlaceholderMap();
      }
    };
    
    initializeMap();
    
    return () => {
      isMounted = false;
    };
  }, [address, mapOptions, markerOptions, onError]);
  
  // Create a placeholder map for fallback or when API is unavailable
  const createPlaceholderMap = () => {
    if (!mapRef.current || !address) return;
    
    // 네이버 지도 URL 생성 (실제 네이버 지도로 이동 가능)
    const mapUrl = naverMapService.generateMapUrl(address);
    
    // 모바일 앱 URL
    const mobileAppUrl = `nmap://search?query=${encodeURIComponent(address)}&appname=property.a148c`;
    
    // 정확한 에러 메시지 작성
    const displayError = errorMessage || '지도를 표시할 수 없습니다.';
    const errorDetail = errorMessage && errorMessage.includes('API') 
      ? '네이버 지도 API 키가 유효하지 않거나 초과되었을 수 있습니다.'
      : '주소를 찾을 수 없거나 일시적인 오류가 발생했습니다.';
    
    mapRef.current.innerHTML = `
      <div style="position: relative; width: 100%; height: 100%; background-color: #f5f7f9; border-radius: 8px; overflow: hidden; border: 1px solid #e1e4e8; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
        <!-- Mock Map Background with Grid -->
        <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-image: linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px); background-size: 30px 30px; background-color: #e9eef2; opacity: 0.7;"></div>
        
        <!-- Map Name -->
        <div style="position: absolute; bottom: 10px; left: 10px; font-family: Arial, sans-serif; font-size: 11px; color: #666; font-weight: bold; background-color: rgba(255,255,255,0.8); padding: 2px 5px; border-radius: 3px;">NAVER Maps</div>
        
        <!-- Address Content -->
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -60%); background-color: white; padding: 15px 20px; border-radius: 8px; box-shadow: 0 3px 10px rgba(0,0,0,0.1); text-align: center; max-width: 85%; width: 300px;">
          <div style="margin-bottom: 10px; color: #ff3a4c;">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <h3 style="margin: 0 0 5px 0; font-size: 16px; color: #333; font-weight: bold;">${displayError}</h3>
          <p style="margin: 0 0 15px 0; font-size: 13px; color: #666;">${errorDetail}</p>
          <div style="font-size: 14px; font-weight: bold; color: #333; margin-bottom: 5px;">해당 주소:</div>
          <div style="background-color: #f0f2f5; padding: 10px; border-radius: 4px; margin-bottom: 15px; font-size: 14px; word-break: break-all; color: #444;">${address}</div>
          
          <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
            <a href="${mapUrl}" target="_blank" rel="noopener noreferrer" style="text-decoration: none; display: inline-block; padding: 8px 16px; border-radius: 4px; background-color: #03c75a; color: white; font-weight: bold; font-size: 13px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">네이버 지도에서 보기</a>
            <a href="${mobileAppUrl}" style="text-decoration: none; display: inline-block; padding: 8px 16px; border-radius: 4px; background-color: #ffffff; color: #03c75a; border: 1px solid #03c75a; font-weight: bold; font-size: 13px;">모바일 앱으로 보기</a>
          </div>
        </div>
      </div>
    `;
  };
  
  return (
    <div 
      className={`naver-map-container ${className}`}
      style={{ 
        width: '100%',
        overflow: 'hidden',
        borderRadius: '8px',
      }}
    >
      <div
        ref={mapRef} 
        className="naver-map"
        style={{ 
          width: responsive ? mapDimensions.width : width, 
          height: responsive ? mapDimensions.height : height, 
          borderRadius: '8px',
          overflow: 'hidden'
        }}
      >
        {isLoading && !isError && (
          <div 
            className="map-loading"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              height: '100%',
              backgroundColor: '#f5f5f5',
              border: '1px solid #ddd',
              borderRadius: '8px'
            }}
          >
            <div style={{
              textAlign: 'center'
            }}>
              <div style={{
                border: '4px solid #f3f3f3',
                borderTop: '4px solid #4a90e2',
                borderRadius: '50%',
                width: '30px',
                height: '30px',
                animation: 'mapSpin 2s linear infinite',
                margin: '0 auto 10px auto'
              }}></div>
              <style>
                {`
                  @keyframes mapSpin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                  }
                  @media (max-width: 768px) {
                    .map-loading p {
                      font-size: 14px;
                    }
                  }
                `}
              </style>
              <p>지도를 로딩 중입니다...</p>
            </div>
          </div>
        )}
      </div>
      
      {/* 모바일용 컨트롤 */}
      {isLoaded && !isError && (
        <div className="map-mobile-controls" style={{
          display: window.innerWidth <= 768 ? 'flex' : 'none',
          justifyContent: 'center',
          gap: '10px',
          padding: '10px 0',
        }}>
          <button 
            onClick={() => {
              if (mapInstanceRef.current) {
                const currentZoom = mapInstanceRef.current.getZoom();
                mapInstanceRef.current.setZoom(currentZoom + 1);
              }
            }}
            style={{
              border: 'none',
              background: 'white',
              boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              fontSize: '18px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >+</button>
          <button 
            onClick={() => {
              if (mapInstanceRef.current) {
                const currentZoom = mapInstanceRef.current.getZoom();
                mapInstanceRef.current.setZoom(currentZoom - 1);
              }
            }}
            style={{
              border: 'none',
              background: 'white',
              boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              fontSize: '18px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >-</button>
        </div>
      )}
    </div>
  );
};

export default NaverMap;
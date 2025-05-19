import { NAVER_MAPS_CONFIG } from '../config/environment';

/**
 * 네이버 지도 API 관련 서비스
 */
class NaverMapService {
  /**
 * 클래스 생성자
 */
  constructor() {
    this.clientId = NAVER_MAPS_CONFIG.CLIENT_ID;
    this.clientSecret = NAVER_MAPS_CONFIG.CLIENT_SECRET;
    this.scriptUrl = NAVER_MAPS_CONFIG.SCRIPT_URL;
    this.defaultCenter = NAVER_MAPS_CONFIG.DEFAULT_CENTER;
    this.defaultZoom = NAVER_MAPS_CONFIG.DEFAULT_ZOOM;
    this.scriptLoaded = false;
    this.scriptLoading = false;
    this.scriptLoadPromise = null;
    
    console.log(`NaverMapService initialized with client ID: ${this.clientId.substring(0, 4)}***`);
  }

  /**
   * 네이버 지도 API 스크립트 로드
   * @returns {Promise<boolean>} - 스크립트 로드 성공 여부
   */
  loadScript() {
    // 이미 로드되었으면 바로 성공 반환
    if (this.scriptLoaded && window.naver && window.naver.maps) {
      console.log('Naver Maps API already loaded');
      return Promise.resolve(true);
    }

    // 로드 중이면 기존 Promise 반환
    if (this.scriptLoading && this.scriptLoadPromise) {
      console.log('Naver Maps API is loading...');
      return this.scriptLoadPromise;
    }

    // 새로운 스크립트 로드 시작
    console.log('Starting to load Naver Maps API with client ID:', 
      this.clientId.substring(0, 4) + '***' // 클라이언트 ID 부분적으로 가림
    );
    
    this.scriptLoading = true;
    this.scriptLoadPromise = new Promise((resolve, reject) => {
      try {
        // 이미 스크립트가 있는지 확인
        const existingScript = document.getElementById('naver-maps-script');
        if (existingScript) {
          console.log('Found existing Naver Maps script tag');
          if (window.naver && window.naver.maps) {
            console.log('Naver Maps API is already available on window.naver.maps');
            this.scriptLoaded = true;
            resolve(true);
            return;
          } else {
            console.log('Removing existing script tag and trying again');
            existingScript.remove();
          }
        }

        // 새 스크립트 생성
        const script = document.createElement('script');
        script.id = 'naver-maps-script';
        script.src = `${this.scriptUrl}?ncpClientId=${this.clientId}&submodules=geocoder`;
        script.async = true;
        script.defer = true;

        // 로드 완료 핸들러
        script.onload = () => {
          console.log('Naver Maps API script loaded');
          
          // API 객체가 제대로 초기화되었는지 확인
          if (window.naver && window.naver.maps) {
            console.log('Naver Maps API initialized successfully');
            this.scriptLoaded = true;
            this.scriptLoading = false;
            resolve(true);
          } else {
            console.error('Naver Maps API script loaded but window.naver.maps is not available');
            this.scriptLoading = false;
            
            // 잠시 기다린 후 다시 확인
            setTimeout(() => {
              if (window.naver && window.naver.maps) {
                console.log('Naver Maps API delayed initialization successful');
                this.scriptLoaded = true;
                resolve(true);
              } else {
                reject(new Error('네이버 지도 API가 올바르게 초기화되지 않았습니다.'));
              }
            }, 1000);
          }
        };

        // 로드 실패 핸들러
        script.onerror = (error) => {
          console.error('Failed to load Naver Maps API:', error);
          this.scriptLoading = false;
          reject(new Error('네이버 지도 API를 로드하는 데 실패했습니다. 클라이언트 ID를 확인해주세요.'));
        };

        // 문서에 스크립트 추가
        document.head.appendChild(script);
        console.log('Naver Maps API script added to document head');
        
        // 타임아웃 설정
        setTimeout(() => {
          if (this.scriptLoading) {
            console.error('Naver Maps API loading timed out');
            this.scriptLoading = false;
            reject(new Error('네이버 지도 API 로딩 시간이 초과되었습니다.'));
          }
        }, 10000); // 10초 타임아웃
      } catch (error) {
        console.error('Error in loadScript:', error);
        this.scriptLoading = false;
        reject(error);
      }
    });

    return this.scriptLoadPromise;
  }

  /**
   * 주소로 좌표 검색 (지오코딩)
   * @param {string} address - 검색할 주소
   * @returns {Promise<Object>} - 좌표 정보
   */
  async geocodeAddress(address) {
    // API 스크립트가 로드되었는지 확인
    await this.loadScript();

    // window.naver 객체 확인
    if (!window.naver || !window.naver.maps || !window.naver.maps.Service) {
      throw new Error('네이버 지도 API가 올바르게 로드되지 않았습니다.');
    }

    return new Promise((resolve, reject) => {
      window.naver.maps.Service.geocode({
        query: address
      }, (status, response) => {
        // 오류 발생
        if (status !== window.naver.maps.Service.Status.OK) {
          const errorMessage = 
            status === window.naver.maps.Service.Status.ZERO_RESULT 
              ? '검색 결과가 없습니다.'
              : '주소 검색 중 오류가 발생했습니다.';
          reject(new Error(errorMessage));
          return;
        }

        // 결과가 없음
        if (response.v2.meta.totalCount === 0) {
          reject(new Error('검색 결과가 없습니다.'));
          return;
        }

        // 첫 번째 결과 반환
        const firstItem = response.v2.addresses[0];
        resolve({
          x: parseFloat(firstItem.x), // 경도
          y: parseFloat(firstItem.y), // 위도
          roadAddress: firstItem.roadAddress, // 도로명 주소
          jibunAddress: firstItem.jibunAddress, // 지번 주소
          englishAddress: firstItem.englishAddress // 영문 주소
        });
      });
    });
  }

  /**
   * 네이버 지도 인스턴스 생성
   * @param {HTMLElement} element - 지도를 표시할 HTML 요소
   * @param {Object} options - 지도 옵션
   * @returns {Object} - 네이버 지도 인스턴스
   */
  createMap(element, options = {}) {
    if (!window.naver || !window.naver.maps) {
      throw new Error('네이버 지도 API가 로드되지 않았습니다.');
    }

    // 기본 옵션과 사용자 옵션 병합
    const defaultOptions = {
      center: new window.naver.maps.LatLng(
        this.defaultCenter.LAT,
        this.defaultCenter.LNG
      ),
      zoom: this.defaultZoom,
      zoomControl: true,
      zoomControlOptions: {
        position: window.naver.maps.Position.TOP_RIGHT
      }
    };

    const mergedOptions = { ...defaultOptions, ...options };
    return new window.naver.maps.Map(element, mergedOptions);
  }

  /**
   * 지도에 마커 추가
   * @param {Object} map - 네이버 지도 인스턴스
   * @param {Object} position - 마커 위치 (위도, 경도)
   * @param {Object} options - 마커 옵션
   * @returns {Object} - 네이버 지도 마커 인스턴스
   */
  addMarker(map, position, options = {}) {
    if (!window.naver || !window.naver.maps) {
      throw new Error('네이버 지도 API가 로드되지 않았습니다.');
    }

    // 위치 객체 생성
    const markerPosition = new window.naver.maps.LatLng(
      position.lat || position.y,
      position.lng || position.x
    );

    // 기본 옵션과 사용자 옵션 병합
    const defaultOptions = {
      position: markerPosition,
      map: map
    };

    const mergedOptions = { ...defaultOptions, ...options };
    return new window.naver.maps.Marker(mergedOptions);
  }

  /**
   * 주소로 지도 및 마커 생성
   * @param {HTMLElement} element - 지도를 표시할 HTML 요소
   * @param {string} address - 주소
   * @param {Object} mapOptions - 지도 옵션
   * @param {Object} markerOptions - 마커 옵션
   * @returns {Promise<Object>} - 지도 정보 객체
   */
  async createMapWithAddress(element, address, mapOptions = {}, markerOptions = {}) {
    try {
      // 스크립트 로드
      await this.loadScript();

      // 주소 검색
      const location = await this.geocodeAddress(address);

      // 지도 생성
      const map = this.createMap(element, {
        ...mapOptions,
        center: new window.naver.maps.LatLng(location.y, location.x)
      });

      // 마커 생성
      const marker = this.addMarker(map, { lat: location.y, lng: location.x }, markerOptions);

      // 결과 반환
      return {
        map,
        marker,
        location,
        success: true
      };
    } catch (error) {
      console.error('Error creating map with address:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 네이버 지도 URL 생성
   * @param {string} address - 주소
   * @param {boolean} useApp - 네이버 지도 앱 사용 여부
   * @returns {string} - 네이버 지도 URL
   */
  generateMapUrl(address, useApp = false) {
    const encodedAddress = encodeURIComponent(address);
    
    // 네이버 지도 앱 사용 시
    if (useApp) {
      // 모바일 환경 확인
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
      
      if (isMobile) {
        // 모바일인 경우 앱 스키마 URL 생성
        return `nmap://search?query=${encodedAddress}&appname=property.a148c`;
      }
    }
    
    // 웹 URL 생성
    return `https://map.naver.com/v5/search/${encodedAddress}`;
  }
}

// 싱글톤 인스턴스 생성 및 내보내기
export const naverMapService = new NaverMapService();

export default naverMapService;

import React, { useState, useEffect } from 'react';
import { useAnalyticsSettings } from '../../hooks/useAnalytics';

/**
 * Cookie consent banner for analytics tracking
 * @returns {JSX.Element} - Cookie consent component
 */
const AnalyticsConsent = () => {
  const { isAnalyticsEnabled, toggleAnalytics } = useAnalyticsSettings();
  const [showBanner, setShowBanner] = useState(false);
  
  useEffect(() => {
    // Check if user has made a choice before
    const hasConsented = localStorage.getItem('analytics_consent');
    
    // Show banner if no choice has been made
    if (hasConsented === null) {
      setShowBanner(true);
    }
  }, []);
  
  const acceptAnalytics = () => {
    toggleAnalytics(true);
    localStorage.setItem('analytics_consent', 'accepted');
    setShowBanner(false);
  };
  
  const declineAnalytics = () => {
    toggleAnalytics(false);
    localStorage.setItem('analytics_consent', 'declined');
    setShowBanner(false);
  };
  
  if (!showBanner) {
    return null;
  }
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg p-4 z-50">
      <div className="container mx-auto max-w-6xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex-1">
          <h3 className="text-lg font-medium text-gray-900">쿠키 및 데이터 수집 안내</h3>
          <p className="mt-1 text-sm text-gray-600">
            당사는 웹사이트 경험 개선과 서비스 최적화를 위해 분석 데이터를 수집합니다.
            이 데이터는 익명으로 처리되며 서비스 품질 향상에만 사용됩니다.
          </p>
        </div>
        <div className="flex flex-shrink-0 space-x-4">
          <button
            onClick={declineAnalytics}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            거부
          </button>
          <button
            onClick={acceptAnalytics}
            className="px-4 py-2 bg-indigo-600 rounded-md text-sm font-medium text-white hover:bg-indigo-700"
          >
            동의
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Analytics preferences component for settings page
 * @returns {JSX.Element} - Analytics preferences component
 */
export const AnalyticsPreferences = () => {
  const { isAnalyticsEnabled, toggleAnalytics } = useAnalyticsSettings();
  
  const handleToggle = () => {
    toggleAnalytics();
  };
  
  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">분석 데이터 수집</h3>
          <p className="mt-1 text-sm text-gray-600">
            사용자 경험 개선을 위한 익명 데이터 수집을 허용합니다.
            이 데이터는 서비스 품질 향상과 성능 최적화에 활용됩니다.
          </p>
        </div>
        <div className="flex items-center">
          <label className="inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={isAnalyticsEnabled}
              onChange={handleToggle}
            />
            <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsConsent;

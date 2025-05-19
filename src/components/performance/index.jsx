import React, { useState } from 'react';
import './performance.css';

// Loading spinner component
export const LoadingSpinner = ({ size = 'md' }) => {
  // Size variants
  const sizes = {
    sm: {
      width: '24px',
      height: '24px',
      borderWidth: '3px'
    },
    md: {
      width: '48px',
      height: '48px',
      borderWidth: '4px'
    },
    lg: {
      width: '64px',
      height: '64px',
      borderWidth: '5px'
    }
  };
  
  const currentSize = sizes[size] || sizes.md;
  
  const spinnerStyle = {
    width: currentSize.width,
    height: currentSize.height,
    border: `${currentSize.borderWidth} solid #f3f3f3`,
    borderTop: `${currentSize.borderWidth} solid #4a90e2`
  };
  
  return (
    <div className="spinner-container">
      <div className="spinner" style={spinnerStyle}></div>
    </div>
  );
};

// Error boundary component
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by error boundary:', error, errorInfo);
    
    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>오류가 발생했습니다</h2>
          <p>예상치 못한 문제가 발생했습니다. 다시 시도해주세요.</p>
          <button onClick={() => window.location.reload()}>
            페이지 새로고침
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Analytics consent component
export const AnalyticsConsent = () => {
  const [showBanner, setShowBanner] = useState(!localStorage.getItem('analytics_consent'));
  
  const handleAccept = () => {
    localStorage.setItem('analytics_consent', 'true');
    setShowBanner(false);
  };
  
  const handleDecline = () => {
    localStorage.setItem('analytics_consent', 'false');
    setShowBanner(false);
  };
  
  if (!showBanner) {
    return null;
  }
  
  return (
    <div className="consent-banner">
      <div className="consent-content">
        <p>
          이 웹사이트는 사용자 경험 개선을 위해 쿠키와 분석 도구를 사용합니다. 
          계속 진행하시면 이에 동의하는 것으로 간주됩니다.
        </p>
        <div className="consent-buttons">
          <button onClick={handleAccept} className="accept-button">
            동의
          </button>
          <button onClick={handleDecline} className="decline-button">
            거부
          </button>
        </div>
      </div>
    </div>
  );
};

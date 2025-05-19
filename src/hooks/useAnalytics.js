import { useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { analyticsService, ANALYTICS_EVENTS } from '../firebase/services/analytics/analytics.service';

/**
 * Hook for tracking page views
 */
export const usePageTracking = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Log page view event
    analyticsService.logEvent(ANALYTICS_EVENTS.PAGE_VIEW, {
      page_path: location.pathname,
      page_location: window.location.href,
      page_title: document.title || location.pathname
    });
  }, [location]);
  
  // Enhanced navigation with analytics
  const navigateWithTracking = useCallback((to, options) => {
    // Log navigation event
    analyticsService.logEvent('navigation', {
      from_path: location.pathname,
      to_path: typeof to === 'string' ? to : to.pathname,
      navigation_type: options?.replace ? 'replace' : 'push'
    });
    
    // Perform navigation
    navigate(to, options);
  }, [navigate, location.pathname]);
  
  return { navigateWithTracking };
};

/**
 * Hook for tracking user interactions
 * @returns {Object} - Tracking functions
 */
export const useTracking = () => {
  // Track button clicks
  const trackButtonClick = useCallback((buttonName, buttonProps = {}) => {
    analyticsService.logEvent(ANALYTICS_EVENTS.BUTTON_CLICK, {
      button_name: buttonName,
      ...buttonProps
    });
  }, []);
  
  // Track feature usage
  const trackFeatureUse = useCallback((featureName, featureProps = {}) => {
    analyticsService.logEvent('feature_use', {
      feature_name: featureName,
      ...featureProps
    });
  }, []);
  
  // Track form submissions
  const trackFormSubmit = useCallback((formName, formProps = {}) => {
    analyticsService.logEvent('form_submit', {
      form_name: formName,
      ...formProps
    });
  }, []);
  
  // Track search events
  const trackSearch = useCallback((searchTerm, searchProps = {}) => {
    analyticsService.logEvent(ANALYTICS_EVENTS.PROPERTY_SEARCH, {
      search_term: searchTerm,
      ...searchProps
    });
  }, []);
  
  // Track errors
  const trackError = useCallback((errorType, errorMessage, errorProps = {}) => {
    analyticsService.logEvent(ANALYTICS_EVENTS.ERROR, {
      error_type: errorType,
      error_message: errorMessage,
      ...errorProps
    });
  }, []);
  
  return {
    trackButtonClick,
    trackFeatureUse,
    trackFormSubmit,
    trackSearch,
    trackError,
    // Directly expose the analytics service for custom events
    logEvent: analyticsService.logEvent,
    EVENTS: ANALYTICS_EVENTS
  };
};

/**
 * Hook for tracking performance metrics
 * @returns {Object} - Performance tracking functions
 */
export const usePerformance = () => {
  // Start a performance trace
  const startTrace = useCallback((traceName) => {
    return analyticsService.startTrace(traceName);
  }, []);
  
  // Track data fetching performance
  const trackDataFetching = useCallback(async (fetchFn, options = {}) => {
    const { name = 'data_fetch', ...traceAttributes } = options;
    
    // Start a trace
    const traceObj = startTrace(name);
    
    if (traceObj) {
      // Set trace attributes
      Object.entries(traceAttributes).forEach(([key, value]) => {
        traceObj.putAttribute(key, String(value));
      });
      
      traceObj.start();
    }
    
    try {
      // Execute the fetch function
      const result = await fetchFn();
      
      // Stop trace on success
      if (traceObj) {
        traceObj.putAttribute('success', 'true');
        traceObj.stop();
      }
      
      return result;
    } catch (error) {
      // Stop trace on error
      if (traceObj) {
        traceObj.putAttribute('success', 'false');
        traceObj.putAttribute('error', error.message);
        traceObj.stop();
      }
      
      throw error;
    }
  }, [startTrace]);
  
  // Track component render time
  const trackRenderTime = useCallback((componentName) => {
    const traceObj = startTrace(`${componentName}_render`);
    
    if (traceObj) {
      traceObj.start();
      
      return () => {
        traceObj.stop();
      };
    }
    
    return () => {};
  }, [startTrace]);
  
  return {
    startTrace,
    trackDataFetching,
    trackRenderTime
  };
};

/**
 * Hook for managing analytics preferences
 * @returns {Object} - Functions for managing analytics settings
 */
export const useAnalyticsSettings = () => {
  // Get current analytics enabled state
  const isEnabled = analyticsService.isEnabled();
  
  // Toggle analytics status
  const toggleAnalytics = useCallback((enabled) => {
    if (enabled === undefined) {
      // Toggle current state
      const currentState = analyticsService.isEnabled();
      if (currentState) {
        analyticsService.disableAnalytics();
      } else {
        analyticsService.enableAnalytics();
      }
      return !currentState;
    } else {
      // Set to specific state
      if (enabled) {
        analyticsService.enableAnalytics();
      } else {
        analyticsService.disableAnalytics();
      }
      return enabled;
    }
  }, []);
  
  return {
    isAnalyticsEnabled: isEnabled,
    toggleAnalytics,
    enableAnalytics: analyticsService.enableAnalytics,
    disableAnalytics: analyticsService.disableAnalytics
  };
};

import { 
  getAnalytics, 
  logEvent, 
  setUserId, 
  setUserProperties, 
  setAnalyticsCollectionEnabled 
} from 'firebase/analytics';
import { getPerformance, trace } from 'firebase/performance';
import app from '../../config';

// Initialize Firebase Analytics
let analytics = null;
let performance = null;

/**
 * Initialize analytics based on user preferences and environment
 * @param {boolean} enabled - Whether analytics should be enabled
 */
export const initAnalytics = (enabled = true) => {
  try {
    // Only initialize in browser environment
    if (typeof window !== 'undefined') {
      analytics = getAnalytics(app);
      setAnalyticsCollectionEnabled(analytics, enabled);
      
      // Initialize performance monitoring
      performance = getPerformance(app);
      
      return true;
    }
  } catch (error) {
    console.error('Failed to initialize analytics:', error);
  }
  
  return false;
};

/**
 * Log an analytics event
 * @param {string} eventName - Name of the event
 * @param {Object} eventParams - Event parameters
 */
export const logAnalyticsEvent = (eventName, eventParams = {}) => {
  try {
    if (!analytics) {
      initAnalytics();
    }
    
    if (analytics) {
      logEvent(analytics, eventName, eventParams);
    }
  } catch (error) {
    console.error(`Failed to log event ${eventName}:`, error);
  }
};

/**
 * Set the user ID for analytics
 * @param {string} userId - User ID
 */
export const setAnalyticsUserId = (userId) => {
  try {
    if (!analytics) {
      initAnalytics();
    }
    
    if (analytics && userId) {
      setUserId(analytics, userId);
    }
  } catch (error) {
    console.error(`Failed to set user ID ${userId}:`, error);
  }
};

/**
 * Set user properties for analytics
 * @param {Object} properties - User properties
 */
export const setAnalyticsUserProperties = (properties) => {
  try {
    if (!analytics) {
      initAnalytics();
    }
    
    if (analytics && properties) {
      setUserProperties(analytics, properties);
    }
  } catch (error) {
    console.error('Failed to set user properties:', error);
  }
};

/**
 * Start a performance trace
 * @param {string} traceName - Name of the trace
 * @returns {Object} - Trace object
 */
export const startPerformanceTrace = (traceName) => {
  try {
    if (!performance) {
      initAnalytics();
    }
    
    if (performance && traceName) {
      return trace(performance, traceName);
    }
  } catch (error) {
    console.error(`Failed to start trace ${traceName}:`, error);
  }
  
  return null;
};

// Pre-defined event names for consistency
export const ANALYTICS_EVENTS = {
  // User events
  LOGIN: 'login',
  SIGNUP: 'sign_up',
  PROFILE_UPDATE: 'profile_update',
  
  // Property events
  PROPERTY_VIEW: 'property_view',
  PROPERTY_CREATE: 'property_create',
  PROPERTY_UPDATE: 'property_update',
  PROPERTY_DELETE: 'property_delete',
  PROPERTY_SEARCH: 'property_search',
  
  // Showcase events
  SHOWCASE_CREATE: 'showcase_create',
  SHOWCASE_VIEW: 'showcase_view',
  SHOWCASE_SHARE: 'showcase_share',
  
  // Client events
  CLIENT_ADD: 'client_add',
  CLIENT_UPDATE: 'client_update',
  
  // Appointment events
  APPOINTMENT_CREATE: 'appointment_create',
  APPOINTMENT_UPDATE: 'appointment_update',
  APPOINTMENT_CANCEL: 'appointment_cancel',
  
  // Image events
  IMAGE_UPLOAD: 'image_upload',
  IMAGE_DELETE: 'image_delete',
  
  // Error events
  ERROR: 'app_error',
  
  // Navigation events
  PAGE_VIEW: 'page_view',
  BUTTON_CLICK: 'button_click',
  
  // Custom events
  CUSTOM: 'custom_event'
};

// Performance trace names
export const PERFORMANCE_TRACES = {
  PAGE_LOAD: 'page_load',
  DATA_FETCH: 'data_fetch',
  IMAGE_UPLOAD: 'image_upload',
  RENDER_TIME: 'render_time',
  FUNCTION_CALL: 'function_call',
  QUERY_EXECUTION: 'query_execution'
};

// Initialize analytics on import if in browser environment
if (typeof window !== 'undefined') {
  // Check for user preference before initializing
  const analyticsEnabled = localStorage.getItem('analytics_enabled') !== 'false';
  initAnalytics(analyticsEnabled);
}

export const analyticsService = {
  logEvent: logAnalyticsEvent,
  setUserId: setAnalyticsUserId,
  setUserProperties: setAnalyticsUserProperties,
  startTrace: startPerformanceTrace,
  EVENTS: ANALYTICS_EVENTS,
  TRACES: PERFORMANCE_TRACES,
  
  // Enable/disable analytics collection
  enableAnalytics: () => {
    localStorage.setItem('analytics_enabled', 'true');
    if (analytics) {
      setAnalyticsCollectionEnabled(analytics, true);
    } else {
      initAnalytics(true);
    }
  },
  
  disableAnalytics: () => {
    localStorage.setItem('analytics_enabled', 'false');
    if (analytics) {
      setAnalyticsCollectionEnabled(analytics, false);
    }
  },
  
  isEnabled: () => {
    return localStorage.getItem('analytics_enabled') !== 'false';
  }
};

export default analyticsService;

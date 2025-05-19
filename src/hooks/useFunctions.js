import { useState, useCallback } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';

/**
 * Hook for using Firebase Cloud Functions
 * @returns {Object} - Functions and state
 */
const useFunctions = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  
  const functions = getFunctions();
  
  /**
   * Call a Cloud Function
   * @param {string} functionName - Name of the function to call
   * @param {Object} data - Data to pass to the function
   * @returns {Promise<Object>} - Function result
   */
  const callFunction = useCallback(async (functionName, data = {}) => {
    try {
      setLoading(true);
      setError(null);
      setResult(null);
      
      const functionRef = httpsCallable(functions, functionName);
      const response = await functionRef(data);
      
      setResult(response.data);
      return response.data;
    } catch (err) {
      console.error(`Error calling function ${functionName}:`, err);
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [functions]);
  
  /**
   * Reset the state
   */
  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setResult(null);
  }, []);
  
  // Create function-specific methods
  const setUserRole = useCallback((userId, role) => {
    return callFunction('setUserRole', { userId, role });
  }, [callFunction]);
  
  const generateShowcaseUrl = useCallback((showcaseId) => {
    return callFunction('generateShowcaseUrl', { showcaseId });
  }, [callFunction]);
  
  const trackShowcaseView = useCallback((urlId, clientInfo = {}) => {
    return callFunction('trackShowcaseView', { urlId, clientInfo });
  }, [callFunction]);
  
  const sendShowcaseInvitation = useCallback((showcaseId, clientEmail, message) => {
    return callFunction('sendShowcaseInvitation', { 
      showcaseId, 
      clientEmail, 
      message,
    });
  }, [callFunction]);
  
  const markNotificationsRead = useCallback((notificationIds) => {
    return callFunction('markNotificationsRead', { notificationIds });
  }, [callFunction]);
  
  return {
    callFunction,
    reset,
    loading,
    error,
    result,
    // Predefined function calls
    setUserRole,
    generateShowcaseUrl,
    trackShowcaseView,
    sendShowcaseInvitation,
    markNotificationsRead,
  };
};

export default useFunctions;

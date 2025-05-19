/**
 * Firebase Cloud Functions for Property Management Application
 */

// Initialize Firebase Admin
require('./src/utils/admin');

// Import function modules
const userFunctions = require('./src/auth/users');
const propertyFunctions = require('./src/properties/properties');
const showcaseFunctions = require('./src/showcases/showcases');
const notificationFunctions = require('./src/notifications/notifications');

// Export all functions
module.exports = {
  // User management functions
  onUserCreate: userFunctions.onUserCreate,
  onUserDelete: userFunctions.onUserDelete,
  setUserRole: userFunctions.setUserRole,
  
  // Property management functions
  onPropertyWrite: propertyFunctions.onPropertyWrite,
  processPropertyImage: propertyFunctions.processPropertyImage,
  syncPropertyStats: propertyFunctions.syncPropertyStats,
  
  // Showcase functions
  generateShowcaseUrl: showcaseFunctions.generateShowcaseUrl,
  trackShowcaseView: showcaseFunctions.trackShowcaseView,
  sendShowcaseInvitation: showcaseFunctions.sendShowcaseInvitation,
  
  // Notification functions
  onMessageCreate: notificationFunctions.onMessageCreate,
  markNotificationsRead: notificationFunctions.markNotificationsRead,
  cleanupOldNotifications: notificationFunctions.cleanupOldNotifications,
};

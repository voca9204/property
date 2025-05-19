const functions = require('firebase-functions');
const { db, auth } = require('../utils/admin');
const { handleError, validateData } = require('../utils/helpers');
const emailService = require('../utils/email');

/**
 * Function triggered when a new user is created
 * Creates a corresponding user document in Firestore
 */
const onUserCreate = functions.auth.user().onCreate(async (user) => {
  try {
    // Create a user document in Firestore
    const userDoc = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || '',
      photoURL: user.photoURL || '',
      phoneNumber: user.phoneNumber || '',
      emailVerified: user.emailVerified,
      role: 'agent', // Default role
      createdAt: new Date(),
    };
    
    // Save user to Firestore
    await db.collection('users').doc(user.uid).set(userDoc);
    
    // Set custom claims for role-based access control
    await auth.setCustomUserClaims(user.uid, { agent: true });
    
    // Send welcome email
    await emailService.sendWelcomeEmail(userDoc);
    
    return { success: true, userId: user.uid };
  } catch (error) {
    return handleError(error, { userId: user.uid });
  }
});

/**
 * Function triggered when a user is deleted
 * Cleans up user data from Firestore
 */
const onUserDelete = functions.auth.user().onDelete(async (user) => {
  try {
    // Delete user document from Firestore
    await db.collection('users').doc(user.uid).delete();
    
    // For a complete cleanup, you might want to:
    // 1. Delete user's properties or transfer them
    // 2. Delete user's uploads in storage
    // 3. Delete user's showcases
    // 4. Handle user's appointments
    
    return { success: true, userId: user.uid };
  } catch (error) {
    return handleError(error, { userId: user.uid });
  }
});

/**
 * HTTPS function to set a user's role
 * Requires admin privileges
 */
const setUserRole = functions.https.onCall(async (data, context) => {
  try {
    // Check authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
          'unauthenticated',
          'Authentication required'
      );
    }
    
    // Validate admin privilege
    const adminUser = await auth.getUser(context.auth.uid);
    const isAdmin = adminUser.customClaims && adminUser.customClaims.admin;
    
    if (!isAdmin) {
      throw new functions.https.HttpsError(
          'permission-denied',
          'Admin privileges required'
      );
    }
    
    // Validate data
    const { valid, errors } = validateData(data, {
      userId: { required: true, type: 'string' },
      role: { required: true, type: 'string', enum: ['admin', 'agent', 'viewer'] },
    });
    
    if (!valid) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid data', errors);
    }
    
    // Get the user
    const user = await auth.getUser(data.userId);
    
    // Set custom claims based on role
    let customClaims = {};
    
    if (data.role === 'admin') {
      customClaims = { admin: true };
    } else if (data.role === 'agent') {
      customClaims = { agent: true };
    } else if (data.role === 'viewer') {
      customClaims = { viewer: true };
    }
    
    // Update custom claims
    await auth.setCustomUserClaims(user.uid, customClaims);
    
    // Update Firestore user document
    await db.collection('users').doc(user.uid).update({
      role: data.role,
      updatedAt: new Date(),
    });
    
    return {
      success: true,
      userId: user.uid,
      role: data.role,
    };
  } catch (error) {
    return handleError(error, { 
      userId: data?.userId, 
      role: data?.role,
    });
  }
});

module.exports = {
  onUserCreate,
  onUserDelete,
  setUserRole,
};

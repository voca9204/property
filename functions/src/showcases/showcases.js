const functions = require('firebase-functions');
const { db, timestamp } = require('../utils/admin');
const { handleError, validateData } = require('../utils/helpers');
const emailService = require('../utils/email');

/**
 * Function to generate a unique URL for a new showcase
 */
const generateShowcaseUrl = functions.https.onCall(async (data, context) => {
  try {
    // Check authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
          'unauthenticated',
          'Authentication required'
      );
    }
    
    // Validate data
    const { valid, errors } = validateData(data, {
      showcaseId: { required: true, type: 'string' },
    });
    
    if (!valid) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid data', errors);
    }
    
    // Get the showcase document
    const showcaseRef = db.collection('showcases').doc(data.showcaseId);
    const showcaseSnap = await showcaseRef.get();
    
    if (!showcaseSnap.exists) {
      throw new functions.https.HttpsError(
          'not-found',
          'Showcase not found'
      );
    }
    
    const showcase = showcaseSnap.data();
    
    // Check if user has permission to update this showcase
    if (showcase.creatorId !== context.auth.uid) {
      const userSnap = await db.collection('users').doc(context.auth.uid).get();
      const user = userSnap.exists ? userSnap.data() : null;
      
      if (!user || user.role !== 'admin') {
        throw new functions.https.HttpsError(
            'permission-denied',
            'Only the creator or an admin can generate a URL for this showcase'
        );
      }
    }
    
    // Generate a random 8-character alphanumeric string
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let uniqueId = '';
    for (let i = 0; i < 8; i++) {
      uniqueId += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    // Check if URL already exists
    const existingShowcases = await db.collection('showcases')
        .where('urlId', '==', uniqueId)
        .limit(1)
        .get();
        
    if (!existingShowcases.empty) {
      // If exists, try again with a different ID
      throw new functions.https.HttpsError(
          'already-exists',
          'URL already exists, please try again'
      );
    }
    
    // Update the showcase with the unique URL ID
    await showcaseRef.update({
      urlId: uniqueId,
      updatedAt: timestamp(),
    });
    
    // Construct the full URL
    const baseUrl = process.env.SHOWCASE_BASE_URL || 'https://property-a148c.web.app/showcase/';
    const fullUrl = `${baseUrl}${uniqueId}`;
    
    return {
      success: true,
      showcaseId: data.showcaseId,
      urlId: uniqueId,
      fullUrl,
    };
  } catch (error) {
    return handleError(error, {
      showcaseId: data?.showcaseId,
    });
  }
});

/**
 * Function to track showcase views
 */
const trackShowcaseView = functions.https.onCall(async (data, context) => {
  try {
    // Validate data
    const { valid, errors } = validateData(data, {
      urlId: { required: true, type: 'string' },
      clientInfo: { type: 'object' },
    });
    
    if (!valid) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid data', errors);
    }
    
    // Find the showcase by URL ID
    const showcasesSnapshot = await db.collection('showcases')
        .where('urlId', '==', data.urlId)
        .limit(1)
        .get();
        
    if (showcasesSnapshot.empty) {
      throw new functions.https.HttpsError(
          'not-found',
          'Showcase not found'
      );
    }
    
    const showcaseDoc = showcasesSnapshot.docs[0];
    const showcaseId = showcaseDoc.id;
    const showcase = showcaseDoc.data();
    
    // Increment view count
    const viewCount = (showcase.viewCount || 0) + 1;
    
    // Record the view details
    const viewData = {
      timestamp: timestamp(),
      ipAddress: context.rawRequest.ip || null,
      userAgent: data.clientInfo?.userAgent || null,
      referrer: data.clientInfo?.referrer || null,
      device: data.clientInfo?.device || null,
      location: data.clientInfo?.location || null,
      userId: context.auth ? context.auth.uid : null,
    };
    
    // Add view to views subcollection
    await db.collection('showcases').doc(showcaseId)
        .collection('views')
        .add(viewData);
        
    // Update showcase with new view count
    await db.collection('showcases').doc(showcaseId).update({
      viewCount,
      lastViewed: timestamp(),
    });
    
    // If viewer is authenticated, record client interaction
    if (context.auth && showcase.clientId) {
      // Get client document
      const clientDoc = await db.collection('clients').doc(showcase.clientId).get();
      
      if (clientDoc.exists) {
        // Add interaction to client's history
        await db.collection('clients').doc(showcase.clientId)
            .collection('interactions')
            .add({
              type: 'showcase_view',
              showcaseId,
              timestamp: timestamp(),
              userId: context.auth.uid,
            });
      }
    }
    
    return {
      success: true,
      showcaseId,
      viewCount,
    };
  } catch (error) {
    return handleError(error, {
      urlId: data?.urlId,
    });
  }
});

/**
 * Function to send showcase invitation emails
 */
const sendShowcaseInvitation = functions.https.onCall(async (data, context) => {
  try {
    // Check authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
          'unauthenticated',
          'Authentication required'
      );
    }
    
    // Validate data
    const { valid, errors } = validateData(data, {
      showcaseId: { required: true, type: 'string' },
      clientEmail: { required: true, type: 'string' },
      message: { type: 'string' },
    });
    
    if (!valid) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid data', errors);
    }
    
    // Get the showcase document
    const showcaseRef = db.collection('showcases').doc(data.showcaseId);
    const showcaseSnap = await showcaseRef.get();
    
    if (!showcaseSnap.exists) {
      throw new functions.https.HttpsError(
          'not-found',
          'Showcase not found'
      );
    }
    
    const showcase = showcaseSnap.data();
    
    // Check if user has permission to share this showcase
    if (showcase.creatorId !== context.auth.uid) {
      const userSnap = await db.collection('users').doc(context.auth.uid).get();
      const user = userSnap.exists ? userSnap.data() : null;
      
      if (!user || user.role !== 'admin') {
        throw new functions.https.HttpsError(
            'permission-denied',
            'Only the creator or an admin can share this showcase'
        );
      }
    }
    
    // Check if showcase has a URL ID
    if (!showcase.urlId) {
      throw new functions.https.HttpsError(
          'failed-precondition',
          'Showcase does not have a URL ID yet'
      );
    }
    
    // Get property information
    let propertyTitle = 'Property Showcase';
    
    if (showcase.propertyId) {
      const propertySnap = await db.collection('properties')
          .doc(showcase.propertyId).get();
      
      if (propertySnap.exists) {
        const property = propertySnap.data();
        propertyTitle = property.title || 'Property Showcase';
      }
    }
    
    // Get agent information
    const agentSnap = await db.collection('users').doc(context.auth.uid).get();
    const agent = agentSnap.exists ? agentSnap.data() : null;
    
    if (!agent) {
      throw new functions.https.HttpsError(
          'not-found',
          'Agent information not found'
      );
    }
    
    // Construct the showcase URL
    const baseUrl = process.env.SHOWCASE_BASE_URL || 'https://property-a148c.web.app/showcase/';
    const showcaseUrl = `${baseUrl}${showcase.urlId}`;
    
    // Send email invitation
    await emailService.sendShowcaseNotification({
      clientEmail: data.clientEmail,
      propertyTitle,
      message: data.message,
      showcaseUrl,
      agent: {
        name: agent.displayName || agent.email,
        email: agent.email,
        phone: agent.phoneNumber || 'N/A',
      },
    });
    
    // Record the invitation
    await showcaseRef.collection('invitations').add({
      clientEmail: data.clientEmail,
      sentAt: timestamp(),
      sentBy: context.auth.uid,
      message: data.message || null,
    });
    
    // Update showcase with invitation count
    const invitationCount = (showcase.invitationCount || 0) + 1;
    await showcaseRef.update({
      invitationCount,
      lastInvitationSent: timestamp(),
    });
    
    return {
      success: true,
      showcaseId: data.showcaseId,
      clientEmail: data.clientEmail,
    };
  } catch (error) {
    return handleError(error, {
      showcaseId: data?.showcaseId,
      clientEmail: data?.clientEmail,
    });
  }
});

module.exports = {
  generateShowcaseUrl,
  trackShowcaseView,
  sendShowcaseInvitation,
};

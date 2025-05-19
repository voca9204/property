const functions = require('firebase-functions');
const { db, timestamp } = require('../utils/admin');
const { handleError } = require('../utils/helpers');
const emailService = require('../utils/email');

/**
 * Function triggered when a new message is created
 * Sends notification to the recipient
 */
const onMessageCreate = functions.firestore
    .document('messages/{messageId}')
    .onCreate(async (snapshot, context) => {
      try {
        const message = snapshot.data();
        const messageId = context.params.messageId;
        
        // Skip if no recipient
        if (!message.recipientId) {
          console.log('Message has no recipient, skipping notification');
          return null;
        }
        
        // Get recipient information
        const recipientSnap = await db.collection('users')
            .doc(message.recipientId).get();
            
        if (!recipientSnap.exists) {
          console.log(`Recipient ${message.recipientId} not found`);
          return null;
        }
        
        const recipient = recipientSnap.data();
        
        // Get sender information
        let sender = { displayName: 'System', email: 'noreply@property-app.com' };
        
        if (message.senderId) {
          const senderSnap = await db.collection('users')
              .doc(message.senderId).get();
              
          if (senderSnap.exists) {
            const senderData = senderSnap.data();
            sender = {
              displayName: senderData.displayName || senderData.email,
              email: senderData.email,
            };
          }
        }
        
        // Create notification
        const notification = {
          type: 'message',
          title: `New message from ${sender.displayName}`,
          body: message.content,
          recipientId: message.recipientId,
          senderId: message.senderId,
          read: false,
          referenceId: messageId,
          referenceType: 'message',
          createdAt: timestamp(),
        };
        
        // Save notification to Firestore
        await db.collection('notifications').add(notification);
        
        // Send email notification if recipient has email notifications enabled
        if (recipient.emailNotifications !== false && recipient.email) {
          const emailSubject = `New message from ${sender.displayName}`;
          const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>You have a new message</h2>
              <p><strong>From:</strong> ${sender.displayName}</p>
              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
                <p>${message.content}</p>
              </div>
              <div style="margin-top: 30px;">
                <a href="${process.env.APP_URL || 'https://property-a148c.web.app'}/messages" 
                  style="background-color: #4CAF50; color: white; padding: 12px 20px; 
                  text-decoration: none; border-radius: 4px; display: inline-block;">
                  Reply to Message
                </a>
              </div>
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                <p style="font-size: 12px; color: #666;">
                  This email was sent automatically. Please do not reply to this email.
                </p>
              </div>
            </div>
          `;
          
          await emailService.sendEmail({
            to: recipient.email,
            subject: emailSubject,
            html: emailHtml,
          });
        }
        
        return { success: true, messageId, notificationSent: true };
      } catch (error) {
        return handleError(error, { 
          messageId: context.params.messageId,
        });
      }
    });

/**
 * Function to mark notifications as read
 */
const markNotificationsRead = functions.https.onCall(async (data, context) => {
  try {
    // Check authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
          'unauthenticated',
          'Authentication required'
      );
    }
    
    // Validate data
    if (!data.notificationIds || !Array.isArray(data.notificationIds)) {
      throw new functions.https.HttpsError(
          'invalid-argument',
          'notificationIds must be an array'
      );
    }
    
    const batch = db.batch();
    let updateCount = 0;
    
    // Get notifications and check permissions
    for (const notificationId of data.notificationIds) {
      const notificationRef = db.collection('notifications').doc(notificationId);
      const notificationSnap = await notificationRef.get();
      
      if (notificationSnap.exists) {
        const notification = notificationSnap.data();
        
        // Only allow updating own notifications
        if (notification.recipientId === context.auth.uid) {
          batch.update(notificationRef, {
            read: true,
            readAt: timestamp(),
          });
          updateCount++;
        }
      }
    }
    
    // Commit the batch
    await batch.commit();
    
    return {
      success: true,
      updatedCount: updateCount,
    };
  } catch (error) {
    return handleError(error, {
      notificationIds: data?.notificationIds,
    });
  }
});

/**
 * Function to clear old notifications
 * Runs weekly to clean up old read notifications
 */
const cleanupOldNotifications = functions.pubsub
    .schedule('every week')
    .onRun(async (context) => {
      try {
        // Calculate date 30 days ago
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        // Get old read notifications
        const oldNotificationsQuery = db.collection('notifications')
            .where('read', '==', true)
            .where('createdAt', '<', thirtyDaysAgo);
            
        const oldNotificationsSnapshot = await oldNotificationsQuery.get();
        
        // Delete old notifications in batches
        const batchSize = 500; // Firestore batch limit
        const batches = [];
        let batch = db.batch();
        let operationCount = 0;
        
        oldNotificationsSnapshot.forEach((doc) => {
          batch.delete(doc.ref);
          operationCount++;
          
          if (operationCount >= batchSize) {
            batches.push(batch.commit());
            batch = db.batch();
            operationCount = 0;
          }
        });
        
        // Commit any remaining operations
        if (operationCount > 0) {
          batches.push(batch.commit());
        }
        
        await Promise.all(batches);
        
        return {
          success: true,
          deletedCount: oldNotificationsSnapshot.size,
        };
      } catch (error) {
        return handleError(error);
      }
    });

module.exports = {
  onMessageCreate,
  markNotificationsRead,
  cleanupOldNotifications,
};

const functions = require('firebase-functions');
const { db, storage, timestamp } = require('../utils/admin');
const { handleError, validateData } = require('../utils/helpers');
const sharp = require('sharp');

/**
 * Function triggered when a property is created or updated
 * Updates search indices and performs data validation
 */
const onPropertyWrite = functions.firestore
    .document('properties/{propertyId}')
    .onWrite(async (change, context) => {
      try {
        const propertyId = context.params.propertyId;
        const propertyBefore = change.before.exists ? change.before.data() : null;
        const propertyAfter = change.after.exists ? change.after.data() : null;
        
        // If property was deleted, clean up associated data
        if (!propertyAfter) {
          if (propertyBefore) {
            // Delete property images from storage (optional)
            try {
              const imageFiles = await storage.bucket()
                  .getFiles({ prefix: `properties/${propertyId}/` });
                  
              if (imageFiles && imageFiles[0]) {
                const deletePromises = imageFiles[0].map(
                    (file) => file.delete()
                );
                await Promise.all(deletePromises);
              }
            } catch (storageError) {
              console.error('Error deleting property images:', storageError);
              // Continue with other cleanup even if image deletion fails
            }
          }
          return { success: true, message: 'Property deleted and cleaned up' };
        }
        
        // If property is new or modified
        // Parse numeric fields to ensure they're stored as numbers
        const updates = {};
        
        // Handle numeric fields
        ['deposit', 'monthlyRent', 'maintenanceFee', 'area'].forEach((field) => {
          if (propertyAfter[field] && typeof propertyAfter[field] === 'string') {
            updates[field] = parseFloat(propertyAfter[field]) || 0;
          }
        });
        
        // Ensure status is valid
        const validStatuses = ['available', 'underContract', 'rented'];
        if (propertyAfter.status && !validStatuses.includes(propertyAfter.status)) {
          updates.status = 'available'; // Default to available if invalid
        }
        
        // If it's a new property, add creation timestamp
        if (!propertyBefore) {
          updates.createdAt = timestamp();
        }
        
        // Always update the updatedAt timestamp
        updates.updatedAt = timestamp();
        
        // Only update if there are fields to update
        if (Object.keys(updates).length > 0) {
          await db.collection('properties')
              .doc(propertyId)
              .update(updates);
        }
        
        return { success: true, propertyId };
      } catch (error) {
        return handleError(error, { 
          propertyId: context.params.propertyId,
        });
      }
    });

/**
 * Function to process uploaded property images
 * Generates optimized versions and thumbnails
 */
const processPropertyImage = functions.storage
    .object()
    .onFinalize(async (object) => {
      try {
        // Only process images in the properties folder
        const filePath = object.name;
        if (!filePath.startsWith('properties/') || !filePath.match(/\.(jpe?g|png|webp)$/i)) {
          return { success: false, message: 'Not a property image or unsupported format' };
        }
        
        // Skip if this is already a processed image
        if (filePath.includes('_optimized') || filePath.includes('_thumbnail')) {
          return { success: false, message: 'Already processed' };
        }
        
        // Get the original file
        const bucket = storage.bucket(object.bucket);
        const file = bucket.file(filePath);
        
        // Create a temporary local path for the file
        const tempLocalPath = `/tmp/${filePath.split('/').pop()}`;
        
        // Download the file
        await file.download({ destination: tempLocalPath });
        
        // Extract property ID from path (assuming format: properties/{propertyId}/{imageName})
        const pathParts = filePath.split('/');
        if (pathParts.length < 3) {
          throw new Error('Invalid file path format');
        }
        
        const propertyId = pathParts[1];
        const fileName = pathParts[pathParts.length - 1];
        const fileNameWithoutExt = fileName.split('.').slice(0, -1).join('.');
        const fileExt = fileName.split('.').pop();
        
        // Create optimized version (max 1200px wide, 80% quality)
        const optimizedName = `${fileNameWithoutExt}_optimized.${fileExt}`;
        const optimizedPath = `properties/${propertyId}/${optimizedName}`;
        const optimizedLocalPath = `/tmp/${optimizedName}`;
        
        await sharp(tempLocalPath)
            .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 80 })
            .toFile(optimizedLocalPath);
            
        // Upload optimized version
        await bucket.upload(optimizedLocalPath, {
          destination: optimizedPath,
          metadata: {
            contentType: `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`,
            metadata: {
              propertyId,
              processed: true,
            },
          },
        });
        
        // Create thumbnail (300px wide)
        const thumbnailName = `${fileNameWithoutExt}_thumbnail.${fileExt}`;
        const thumbnailPath = `properties/${propertyId}/${thumbnailName}`;
        const thumbnailLocalPath = `/tmp/${thumbnailName}`;
        
        await sharp(tempLocalPath)
            .resize({ width: 300, height: 300, fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 70 })
            .toFile(thumbnailLocalPath);
            
        // Upload thumbnail
        await bucket.upload(thumbnailLocalPath, {
          destination: thumbnailPath,
          metadata: {
            contentType: `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`,
            metadata: {
              propertyId,
              thumbnail: true,
            },
          },
        });
        
        // Add the image URLs to the property document
        const optimizedUrl = `https://storage.googleapis.com/${bucket.name}/${optimizedPath}`;
        const thumbnailUrl = `https://storage.googleapis.com/${bucket.name}/${thumbnailPath}`;
        
        // Update property document with the new image URLs
        const propertyRef = db.collection('properties').doc(propertyId);
        const propertySnap = await propertyRef.get();
        
        if (propertySnap.exists) {
          const property = propertySnap.data();
          const images = property.images || [];
          const imageUrls = property.imageUrls || {};
          
          // Add URLs if not already present
          if (!images.includes(optimizedUrl)) {
            images.push(optimizedUrl);
          }
          
          // Store thumbnail URLs in a separate object for easy lookup
          imageUrls[optimizedUrl] = thumbnailUrl;
          
          await propertyRef.update({
            images,
            imageUrls,
            updatedAt: timestamp(),
          });
        }
        
        return {
          success: true,
          message: 'Image processed successfully',
          optimizedUrl,
          thumbnailUrl,
        };
      } catch (error) {
        return handleError(error, { filePath: object.name });
      }
    });

/**
 * Function to sync property stats and counts
 * Runs daily to generate statistics
 */
const syncPropertyStats = functions.pubsub
    .schedule('every 24 hours')
    .onRun(async (context) => {
      try {
        // Get counts by status
        const propertiesRef = db.collection('properties');
        const availableSnapshot = await propertiesRef.where('status', '==', 'available').get();
        const underContractSnapshot = await propertiesRef.where('status', '==', 'underContract').get();
        const rentedSnapshot = await propertiesRef.where('status', '==', 'rented').get();
        
        // Get counts by owner
        const ownerCounts = {};
        const allPropertiesSnapshot = await propertiesRef.get();
        
        allPropertiesSnapshot.forEach((doc) => {
          const property = doc.data();
          if (property.ownerId) {
            ownerCounts[property.ownerId] = (ownerCounts[property.ownerId] || 0) + 1;
          }
        });
        
        // Save global stats
        const statsData = {
          totalProperties: allPropertiesSnapshot.size,
          availableCount: availableSnapshot.size,
          underContractCount: underContractSnapshot.size,
          rentedCount: rentedSnapshot.size,
          ownerCounts,
          lastUpdated: timestamp(),
        };
        
        await db.collection('stats').doc('properties').set(statsData);
        
        // Update individual owner stats
        for (const [ownerId, count] of Object.entries(ownerCounts)) {
          await db.collection('users').doc(ownerId).update({
            propertyCount: count,
          });
        }
        
        return { success: true, stats: statsData };
      } catch (error) {
        return handleError(error);
      }
    });

module.exports = {
  onPropertyWrite,
  processPropertyImage,
  syncPropertyStats,
};

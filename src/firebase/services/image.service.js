import { StorageService } from './storage.service';
import { auth } from '../config';

/**
 * PropertyImageService for handling property images in Firebase Storage
 */
export class PropertyImageService extends StorageService {
  constructor() {
    super('properties');
  }

  /**
   * Upload a property image
   * @param {File} file - Image file
   * @param {string} propertyId - Property ID
   * @param {Object} metadata - Additional metadata
   * @param {function} progressCallback - Progress callback
   * @returns {Promise<Object>} - Upload result
   */
  async uploadPropertyImage(file, propertyId, metadata = {}, progressCallback = null) {
    if (!propertyId) {
      throw new Error('Property ID is required');
    }
    
    // Import authService to ensure authentication
    const { authService } = await import('./auth.service');
    
    // Ensure user is authenticated (anonymously if necessary)
    await authService.ensureAuthenticated();
    
    // Verify file is an image
    if (!file.type.startsWith('image/')) {
      throw new Error('File must be an image');
    }
    
    // Verify file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('File size exceeds 5MB limit');
    }
    
    // Check file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      throw new Error('Unsupported file type. Please use JPEG, PNG, GIF or WebP');
    }
    
    console.log(`Uploading property image for propertyId: ${propertyId}, file: ${file.name}, size: ${file.size} bytes`);
    
    const path = `${propertyId}/${this.generateUniqueFilename(file.name)}`;
    
    // Add property ID to metadata
    const imageMetadata = {
      customMetadata: {
        propertyId,
        uploadedBy: auth.currentUser?.uid || 'anonymous',
        ...metadata.customMetadata
      },
      ...metadata
    };
    
    return this.uploadFile(file, path, imageMetadata, progressCallback);
  }

  /**
   * Upload multiple property images
   * @param {Array<File>} files - Image files
   * @param {string} propertyId - Property ID
   * @param {Object} metadata - Additional metadata
   * @param {function} progressCallback - Progress callback
   * @param {function} fileCompleteCallback - File complete callback
   * @returns {Promise<Array>} - Array of upload results
   */
  async uploadPropertyImages(
    files, 
    propertyId, 
    metadata = {}, 
    progressCallback = null,
    fileCompleteCallback = null
  ) {
    if (!propertyId) {
      throw new Error('Property ID is required');
    }
    
    // Verify all files are images
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        throw new Error(`File ${file.name} is not an image`);
      }
    }
    
    // Add property ID to metadata
    const imageMetadata = {
      customMetadata: {
        propertyId,
        ...metadata.customMetadata
      },
      ...metadata
    };
    
    return this.uploadMultipleFiles(
      files, 
      propertyId, 
      imageMetadata, 
      progressCallback,
      fileCompleteCallback
    );
  }

  /**
   * Get all images for a property
   * @param {string} propertyId - Property ID
   * @returns {Promise<Array>} - Array of image objects
   */
  async getPropertyImages(propertyId) {
    if (!propertyId) {
      throw new Error('Property ID is required');
    }
    
    return this.listFiles(propertyId);
  }

  /**
   * Delete a property image
   * @param {string} path - Image path
   * @returns {Promise<void>}
   */
  async deletePropertyImage(path) {
    return this.deleteFile(path);
  }

  /**
   * Delete all images for a property
   * @param {string} propertyId - Property ID
   * @returns {Promise<Array>} - Array of results
   */
  async deleteAllPropertyImages(propertyId) {
    if (!propertyId) {
      throw new Error('Property ID is required');
    }
    
    const { items } = await this.listFiles(propertyId);
    const paths = items.map(item => item.fullPath);
    
    return this.deleteMultipleFiles(paths);
  }
}

/**
 * ProfileImageService for handling user profile images in Firebase Storage
 */
export class ProfileImageService extends StorageService {
  constructor() {
    super('profiles');
  }

  /**
   * Upload a profile image
   * @param {File} file - Image file
   * @param {string} userId - User ID
   * @param {function} progressCallback - Progress callback
   * @returns {Promise<Object>} - Upload result
   */
  async uploadProfileImage(file, userId, progressCallback = null) {
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    // Verify file is an image
    if (!file.type.startsWith('image/')) {
      throw new Error('File must be an image');
    }
    
    const path = `${userId}/profile`;
    
    const metadata = {
      contentType: file.type,
      customMetadata: {
        userId,
        purpose: 'profile'
      }
    };
    
    return this.uploadFile(file, path, metadata, progressCallback);
  }

  /**
   * Get profile image URL
   * @param {string} userId - User ID
   * @returns {Promise<string>} - Profile image URL
   */
  async getProfileImageURL(userId) {
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    try {
      return await this.getFileURL(`${userId}/profile`);
    } catch (error) {
      // Return null if profile image doesn't exist
      return null;
    }
  }

  /**
   * Delete profile image
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  async deleteProfileImage(userId) {
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    try {
      return await this.deleteFile(`${userId}/profile`);
    } catch (error) {
      // Ignore error if file doesn't exist
      if (error.code === 'storage/object-not-found') {
        return;
      }
      throw error;
    }
  }
}

/**
 * DocumentService for handling document uploads in Firebase Storage
 */
export class DocumentService extends StorageService {
  constructor() {
    super('documents');
  }

  /**
   * Upload a document
   * @param {File} file - Document file
   * @param {string} category - Document category
   * @param {string} ownerId - Owner ID
   * @param {Object} metadata - Additional metadata
   * @param {function} progressCallback - Progress callback
   * @returns {Promise<Object>} - Upload result
   */
  async uploadDocument(
    file, 
    category = 'general', 
    ownerId = '', 
    metadata = {}, 
    progressCallback = null
  ) {
    const path = ownerId 
      ? `${category}/${ownerId}/${this.generateUniqueFilename(file.name)}`
      : `${category}/${this.generateUniqueFilename(file.name)}`;
    
    const docMetadata = {
      contentType: file.type,
      customMetadata: {
        category,
        ownerId,
        ...metadata.customMetadata
      },
      ...metadata
    };
    
    return this.uploadFile(file, path, docMetadata, progressCallback);
  }

  /**
   * List documents by category and owner
   * @param {string} category - Document category
   * @param {string} ownerId - Owner ID (optional)
   * @returns {Promise<Array>} - Array of document objects
   */
  async listDocuments(category, ownerId = '') {
    const path = ownerId ? `${category}/${ownerId}` : category;
    return this.listFiles(path);
  }
}

// Export services
export const propertyImageService = new PropertyImageService();
export const profileImageService = new ProfileImageService();
export const documentService = new DocumentService();

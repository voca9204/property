import { useState, useCallback } from 'react';
import { 
  storageService, 
  propertyImageService, 
  profileImageService,
  documentService
} from '../firebase/services';

/**
 * Hook for uploading files to Firebase Storage
 * @returns {Object} - Upload functions and state
 */
export const useFileUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  /**
   * Upload a single file
   * @param {File} file - File to upload
   * @param {string} path - Storage path
   * @param {Object} metadata - File metadata
   * @returns {Promise<Object>} - Upload result
   */
  const uploadFile = useCallback(async (file, path = '', metadata = {}) => {
    if (!file) {
      setError(new Error('No file provided'));
      return null;
    }

    try {
      setUploading(true);
      setProgress(0);
      setError(null);

      const uploadResult = await storageService.uploadFile(
        file,
        path,
        metadata,
        (progress) => {
          setProgress(progress);
        }
      );

      setResult(uploadResult);
      return uploadResult;
    } catch (err) {
      console.error('Error uploading file:', err);
      setError(err);
      return null;
    } finally {
      setUploading(false);
    }
  }, []);

  /**
   * Upload multiple files
   * @param {Array<File>} files - Files to upload
   * @param {string} basePath - Base path for uploads
   * @param {Object} metadata - File metadata
   * @returns {Promise<Array>} - Array of upload results
   */
  const uploadMultipleFiles = useCallback(async (files, basePath = '', metadata = {}) => {
    if (!files || files.length === 0) {
      setError(new Error('No files provided'));
      return [];
    }

    try {
      setUploading(true);
      setProgress(0);
      setError(null);

      // Track overall progress across all files
      let totalProgress = 0;
      
      const results = await storageService.uploadMultipleFiles(
        files,
        basePath,
        metadata,
        (fileProgress, snapshot, index, total) => {
          // Calculate overall progress as average of all files
          totalProgress = (index * 100 + fileProgress) / total;
          setProgress(totalProgress);
        },
        (result, index, total) => {
          // Update when each file completes
          setProgress((index + 1) / total * 100);
        }
      );

      setResult(results);
      return results;
    } catch (err) {
      console.error('Error uploading files:', err);
      setError(err);
      return [];
    } finally {
      setUploading(false);
    }
  }, []);

  /**
   * Reset upload state
   */
  const resetUpload = useCallback(() => {
    setUploading(false);
    setProgress(0);
    setError(null);
    setResult(null);
  }, []);

  return {
    uploadFile,
    uploadMultipleFiles,
    resetUpload,
    uploading,
    progress,
    error,
    result
  };
};

/**
 * Hook for property image uploads
 * @returns {Object} - Upload functions and state
 */
export const usePropertyImageUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [images, setImages] = useState([]);

  /**
   * Upload a property image
   * @param {File} file - Image file
   * @param {string} propertyId - Property ID
   * @returns {Promise<Object>} - Upload result
   */
  const uploadImage = useCallback(async (file, propertyId) => {
    if (!file) {
      setError(new Error('No file provided'));
      return null;
    }

    if (!propertyId) {
      setError(new Error('Property ID is required'));
      return null;
    }

    try {
      setUploading(true);
      setProgress(0);
      setError(null);

      const result = await propertyImageService.uploadPropertyImage(
        file,
        propertyId,
        {},
        (progress) => {
          setProgress(progress);
        }
      );

      setImages(prev => [...prev, result]);
      return result;
    } catch (err) {
      console.error('Error uploading property image:', err);
      setError(err);
      return null;
    } finally {
      setUploading(false);
    }
  }, []);

  /**
   * Upload multiple property images
   * @param {Array<File>} files - Image files
   * @param {string} propertyId - Property ID
   * @returns {Promise<Array>} - Array of upload results
   */
  const uploadImages = useCallback(async (files, propertyId) => {
    if (!files || files.length === 0) {
      setError(new Error('No files provided'));
      return [];
    }

    if (!propertyId) {
      setError(new Error('Property ID is required'));
      return [];
    }

    try {
      setUploading(true);
      setProgress(0);
      setError(null);

      const results = await propertyImageService.uploadPropertyImages(
        files,
        propertyId,
        {},
        (fileProgress, snapshot, index, total) => {
          // Calculate overall progress
          const totalProgress = (index * 100 + fileProgress) / total;
          setProgress(totalProgress);
        },
        (result, index, total) => {
          // Update when each file completes
          setProgress((index + 1) / total * 100);
        }
      );

      setImages(prev => [...prev, ...results]);
      return results;
    } catch (err) {
      console.error('Error uploading property images:', err);
      setError(err);
      return [];
    } finally {
      setUploading(false);
    }
  }, []);

  /**
   * Get all images for a property
   * @param {string} propertyId - Property ID
   * @returns {Promise<Array>} - Array of image objects
   */
  const getPropertyImages = useCallback(async (propertyId) => {
    if (!propertyId) {
      setError(new Error('Property ID is required'));
      return { items: [] };
    }

    try {
      setError(null);
      const result = await propertyImageService.getPropertyImages(propertyId);
      setImages(result.items || []);
      return result;
    } catch (err) {
      console.error('Error getting property images:', err);
      setError(err);
      return { items: [] };
    }
  }, []);

  /**
   * Delete a property image
   * @param {string} path - Image path
   * @returns {Promise<boolean>} - Success status
   */
  const deleteImage = useCallback(async (path) => {
    if (!path) {
      setError(new Error('Image path is required'));
      return false;
    }

    try {
      setError(null);
      await propertyImageService.deletePropertyImage(path);
      setImages(prev => prev.filter(img => img.fullPath !== path));
      return true;
    } catch (err) {
      console.error('Error deleting property image:', err);
      setError(err);
      return false;
    }
  }, []);

  /**
   * Reset image upload state
   */
  const resetUpload = useCallback(() => {
    setUploading(false);
    setProgress(0);
    setError(null);
  }, []);

  /**
   * Clear images array
   */
  const clearImages = useCallback(() => {
    setImages([]);
  }, []);

  return {
    uploadImage,
    uploadImages,
    getPropertyImages,
    deleteImage,
    resetUpload,
    clearImages,
    uploading,
    progress,
    error,
    images
  };
};

/**
 * Hook for profile image uploads
 * @returns {Object} - Upload functions and state
 */
export const useProfileImageUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [profileUrl, setProfileUrl] = useState(null);

  /**
   * Upload a profile image
   * @param {File} file - Image file
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Upload result
   */
  const uploadProfileImage = useCallback(async (file, userId) => {
    if (!file) {
      setError(new Error('No file provided'));
      return null;
    }

    if (!userId) {
      setError(new Error('User ID is required'));
      return null;
    }

    try {
      setUploading(true);
      setProgress(0);
      setError(null);

      const result = await profileImageService.uploadProfileImage(
        file,
        userId,
        (progress) => {
          setProgress(progress);
        }
      );

      setProfileUrl(result.url);
      return result;
    } catch (err) {
      console.error('Error uploading profile image:', err);
      setError(err);
      return null;
    } finally {
      setUploading(false);
    }
  }, []);

  /**
   * Get profile image URL
   * @param {string} userId - User ID
   * @returns {Promise<string>} - Profile image URL
   */
  const getProfileImageURL = useCallback(async (userId) => {
    if (!userId) {
      setError(new Error('User ID is required'));
      return null;
    }

    try {
      setError(null);
      const url = await profileImageService.getProfileImageURL(userId);
      setProfileUrl(url);
      return url;
    } catch (err) {
      console.error('Error getting profile image URL:', err);
      setError(err);
      return null;
    }
  }, []);

  /**
   * Delete profile image
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} - Success status
   */
  const deleteProfileImage = useCallback(async (userId) => {
    if (!userId) {
      setError(new Error('User ID is required'));
      return false;
    }

    try {
      setError(null);
      await profileImageService.deleteProfileImage(userId);
      setProfileUrl(null);
      return true;
    } catch (err) {
      console.error('Error deleting profile image:', err);
      setError(err);
      return false;
    }
  }, []);

  /**
   * Reset upload state
   */
  const resetUpload = useCallback(() => {
    setUploading(false);
    setProgress(0);
    setError(null);
  }, []);

  return {
    uploadProfileImage,
    getProfileImageURL,
    deleteProfileImage,
    resetUpload,
    uploading,
    progress,
    error,
    profileUrl
  };
};

/**
 * Hook for document uploads
 * @returns {Object} - Upload functions and state
 */
export const useDocumentUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [documents, setDocuments] = useState([]);

  /**
   * Upload a document
   * @param {File} file - Document file
   * @param {string} category - Document category
   * @param {string} ownerId - Owner ID
   * @returns {Promise<Object>} - Upload result
   */
  const uploadDocument = useCallback(async (file, category = 'general', ownerId = '') => {
    if (!file) {
      setError(new Error('No file provided'));
      return null;
    }

    try {
      setUploading(true);
      setProgress(0);
      setError(null);

      const result = await documentService.uploadDocument(
        file,
        category,
        ownerId,
        {},
        (progress) => {
          setProgress(progress);
        }
      );

      setDocuments(prev => [...prev, result]);
      return result;
    } catch (err) {
      console.error('Error uploading document:', err);
      setError(err);
      return null;
    } finally {
      setUploading(false);
    }
  }, []);

  /**
   * List documents by category and owner
   * @param {string} category - Document category
   * @param {string} ownerId - Owner ID (optional)
   * @returns {Promise<Array>} - Array of document objects
   */
  const listDocuments = useCallback(async (category, ownerId = '') => {
    try {
      setError(null);
      const result = await documentService.listDocuments(category, ownerId);
      setDocuments(result.items || []);
      return result;
    } catch (err) {
      console.error('Error listing documents:', err);
      setError(err);
      return { items: [] };
    }
  }, []);

  /**
   * Delete a document
   * @param {string} path - Document path
   * @returns {Promise<boolean>} - Success status
   */
  const deleteDocument = useCallback(async (path) => {
    if (!path) {
      setError(new Error('Document path is required'));
      return false;
    }

    try {
      setError(null);
      await storageService.deleteFile(path);
      setDocuments(prev => prev.filter(doc => doc.fullPath !== path));
      return true;
    } catch (err) {
      console.error('Error deleting document:', err);
      setError(err);
      return false;
    }
  }, []);

  /**
   * Reset upload state
   */
  const resetUpload = useCallback(() => {
    setUploading(false);
    setProgress(0);
    setError(null);
  }, []);

  /**
   * Clear documents array
   */
  const clearDocuments = useCallback(() => {
    setDocuments([]);
  }, []);

  return {
    uploadDocument,
    listDocuments,
    deleteDocument,
    resetUpload,
    clearDocuments,
    uploading,
    progress,
    error,
    documents
  };
};

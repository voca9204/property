import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  listAll,
  updateMetadata,
  getMetadata
} from 'firebase/storage';
import { storage, auth } from '../config';
import { nanoid } from 'nanoid';

/**
 * Firebase Storage service for file operations
 */
export class StorageService {
  /**
   * @param {string} basePath - Base storage path for this service
   */
  constructor(basePath = '') {
    this.basePath = basePath;
  }

  /**
   * Get a storage reference
   * @param {string} path - File path
   * @returns {Object} - Storage reference
   */
  getRef(path) {
    return ref(storage, `${this.basePath}/${path}`);
  }

  /**
   * Generate a unique filename
   * @param {string} originalName - Original filename
   * @returns {string} - Unique filename
   */
  generateUniqueFilename(originalName = '') {
    const timestamp = Date.now();
    const uniqueId = nanoid(8);
    const extension = originalName.includes('.') 
      ? originalName.split('.').pop()
      : '';
    
    return extension 
      ? `${timestamp}-${uniqueId}.${extension}` 
      : `${timestamp}-${uniqueId}`;
  }

  /**
   * Upload a file to storage
   * @param {File} file - File to upload
   * @param {string} path - Storage path (optional, will use generated name if not provided)
   * @param {Object} metadata - File metadata
   * @param {function} progressCallback - Progress callback function
   * @returns {Promise<Object>} - Upload result with download URL and metadata
   */
  async uploadFile(file, path = '', metadata = {}, progressCallback = null) {
    // Import authService to ensure authentication
    const { authService } = await import('./auth.service');
    
    // Ensure user is authenticated (anonymously if necessary)
    await authService.ensureAuthenticated();
    
    console.log("Authenticated user:", auth.currentUser?.uid);
    
    const filePath = path || this.generateUniqueFilename(file.name);
    const fileRef = this.getRef(filePath);
    
    // Set up the file metadata
    const fileMetadata = {
      contentType: file.type,
      customMetadata: {
        originalName: file.name,
        size: file.size.toString(),
        userId: auth.currentUser?.uid || 'anonymous',
        ...metadata.customMetadata
      },
      ...metadata
    };
    
    console.log(`Uploading file to path: ${filePath}`);
    
    return new Promise((resolve, reject) => {
      const uploadTask = uploadBytesResumable(fileRef, file, fileMetadata);
      
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log(`Upload progress: ${progress}%`);
          if (progressCallback) {
            progressCallback(progress, snapshot);
          }
        },
        (error) => {
          console.error('Upload error:', error.code, error.message);
          reject(error);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            const metadata = await getMetadata(uploadTask.snapshot.ref);
            
            console.log(`Upload successful: ${downloadURL}`);
            
            resolve({
              url: downloadURL,
              path: filePath,
              fullPath: uploadTask.snapshot.ref.fullPath,
              name: uploadTask.snapshot.ref.name,
              metadata
            });
          } catch (error) {
            console.error('Error getting download URL:', error);
            reject(error);
          }
        }
      );
    });
  }

  /**
   * Upload multiple files
   * @param {Array<File>} files - Files to upload
   * @param {string} basePath - Base path for uploads
   * @param {Object} metadata - File metadata
   * @param {function} progressCallback - Progress callback function
   * @param {function} fileCompleteCallback - Callback when each file completes
   * @returns {Promise<Array>} - Array of upload results
   */
  async uploadMultipleFiles(
    files, 
    basePath = '', 
    metadata = {}, 
    progressCallback = null,
    fileCompleteCallback = null
  ) {
    const results = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const filePath = basePath 
        ? `${basePath}/${this.generateUniqueFilename(file.name)}`
        : this.generateUniqueFilename(file.name);
      
      try {
        // Track individual file progress
        const fileProgressCallback = progressCallback 
          ? (progress, snapshot) => progressCallback(progress, snapshot, i, files.length)
          : null;
        
        const result = await this.uploadFile(
          file, 
          filePath, 
          metadata, 
          fileProgressCallback
        );
        
        results.push(result);
        
        // Call the file complete callback if provided
        if (fileCompleteCallback) {
          fileCompleteCallback(result, i, files.length);
        }
      } catch (error) {
        console.error(`Error uploading file ${i}:`, error);
        
        // Add error to results but continue with other files
        results.push({
          error,
          file: file.name,
          index: i
        });
      }
    }
    
    return results;
  }

  /**
   * Delete a file from storage
   * @param {string} path - File path
   * @returns {Promise<void>}
   */
  async deleteFile(path) {
    const fileRef = this.getRef(path);
    return deleteObject(fileRef);
  }

  /**
   * Delete multiple files from storage
   * @param {Array<string>} paths - File paths
   * @returns {Promise<Array>} - Array of results
   */
  async deleteMultipleFiles(paths) {
    const results = [];
    
    for (const path of paths) {
      try {
        await this.deleteFile(path);
        results.push({
          path,
          success: true
        });
      } catch (error) {
        console.error(`Error deleting file ${path}:`, error);
        results.push({
          path,
          success: false,
          error
        });
      }
    }
    
    return results;
  }

  /**
   * Get the download URL for a file
   * @param {string} path - File path
   * @returns {Promise<string>} - Download URL
   */
  async getFileURL(path) {
    const fileRef = this.getRef(path);
    return getDownloadURL(fileRef);
  }

  /**
   * List all files in a directory
   * @param {string} path - Directory path
   * @returns {Promise<Array>} - Array of file objects
   */
  async listFiles(path = '') {
    const dirRef = this.getRef(path);
    const res = await listAll(dirRef);
    
    // Get URLs and metadata for all items
    const items = await Promise.all(
      res.items.map(async (itemRef) => {
        try {
          const url = await getDownloadURL(itemRef);
          const metadata = await getMetadata(itemRef);
          
          return {
            name: itemRef.name,
            fullPath: itemRef.fullPath,
            url,
            metadata
          };
        } catch (error) {
          console.error(`Error getting file info for ${itemRef.fullPath}:`, error);
          return {
            name: itemRef.name,
            fullPath: itemRef.fullPath,
            error
          };
        }
      })
    );
    
    return {
      items,
      prefixes: res.prefixes.map(prefixRef => ({
        name: prefixRef.name,
        fullPath: prefixRef.fullPath
      }))
    };
  }

  /**
   * Update file metadata
   * @param {string} path - File path
   * @param {Object} metadata - New metadata
   * @returns {Promise<Object>} - Updated metadata
   */
  async updateFileMetadata(path, metadata) {
    const fileRef = this.getRef(path);
    return updateMetadata(fileRef, metadata);
  }

  /**
   * Get file metadata
   * @param {string} path - File path
   * @returns {Promise<Object>} - File metadata
   */
  async getFileMetadata(path) {
    const fileRef = this.getRef(path);
    return getMetadata(fileRef);
  }
}

// Export single instance
export const storageService = new StorageService();

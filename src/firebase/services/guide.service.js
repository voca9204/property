import { FirestoreService } from './firestore.service';
import { propertyImageService } from './image.service';
import { serverTimestamp, runTransaction, doc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../config';
import naverMapService from '../../services/naverMap.service';

/**
 * GuideService for managing property guides in Firestore
 */
export class GuideService extends FirestoreService {
  constructor() {
    super('guides');
  }

  /**
   * Create a new property guide
   * @param {Object} data - Guide data
   * @param {File} imageFile - Property image file
   * @param {Function} progressCallback - Upload progress callback
   * @returns {Promise<Object>} - Created guide data with ID
   */
  async createGuide(data, imageFile, progressCallback = null) {
    try {
      // Generate a temporary ID for the guide (will be replaced with Firestore ID)
      const tempId = `temp_${Date.now()}`;
      
      // Upload the image first
      let imageUrl = null;
      let imagePath = null;
      
      if (imageFile) {
        const uploadResult = await propertyImageService.uploadPropertyImage(
          imageFile,
          tempId,
          {},
          progressCallback
        );
        
        imageUrl = uploadResult.url;
        imagePath = uploadResult.path;
      }
      
      // Create the guide document
      const guideData = {
        ...data,
        imageUrl,
        imagePath,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const guideId = await this.create(guideData);
      
      // If we uploaded an image with the temp ID, we might want to update its metadata
      // or move it to a folder with the actual guide ID
      if (imageUrl && imagePath) {
        await propertyImageService.updateFileMetadata(imagePath, {
          customMetadata: {
            guideId
          }
        });
      }
      
      return {
        id: guideId,
        ...guideData,
        imageUrl
      };
    } catch (error) {
      console.error('Error creating guide:', error);
      throw error;
    }
  }

  /**
   * Create a guide with transaction support for better data consistency
   * @param {Object} data - Guide data
   * @param {Array<File>} imageFiles - Property image files (array)
   * @param {Function} progressCallback - Upload progress callback
   * @returns {Promise<Object>} - Created guide data with ID
   */
  async createGuideWithTransaction(data, imageFiles = [], progressCallback = null) {
    try {
      // Import authService to ensure authentication
      const { authService } = await import('./auth.service');
      
      // Ensure user is authenticated (anonymously if necessary)
      await authService.ensureAuthenticated();
      
      console.log("Creating guide with images:", imageFiles ? imageFiles.length : 0);
      
      // Upload the images first
      let imageUrls = [];
      let imagePaths = [];
      
      if (imageFiles && imageFiles.length > 0) {
        // Process as an array of files
        const uploadPromises = [];
        const tempId = `temp_${Date.now()}`;
        
        // Convert to array if it's a single file
        const filesArray = Array.isArray(imageFiles) ? imageFiles : [imageFiles];
        
        for (const imageFile of filesArray) {
          try {
            console.log(`Processing image: ${imageFile.name}, size: ${imageFile.size} bytes, type: ${imageFile.type}`);
            
            const uploadPromise = propertyImageService.uploadPropertyImage(
              imageFile,
              tempId,
              {
                customMetadata: {
                  tempId,
                  timestamp: Date.now().toString()
                }
              },
              progressCallback
            );
            
            uploadPromises.push(uploadPromise);
          } catch (error) {
            console.error(`Error preparing image upload: ${error.message}`);
            throw error;
          }
        }
        
        try {
          const uploadResults = await Promise.all(uploadPromises);
          
          for (const result of uploadResults) {
            imageUrls.push(result.url);
            imagePaths.push(result.path);
          }
          
          console.log("All images uploaded successfully:", imageUrls.length);
        } catch (error) {
          console.error("Error during image uploads:", error);
          throw error;
        }
      }
      
      // Prepare guide data
      const guideData = {
        ...data,
        imageUrls,
        imagePaths,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: auth.currentUser?.uid || 'anonymous'
      };
      
      // Create document with transaction for better consistency
      let guideId = '';
      
      await runTransaction(db, async (transaction) => {
        // Create a new document reference with auto-generated ID
        const docRef = doc(this.collectionRef);
        guideId = docRef.id;
        
        // Set the document data
        transaction.set(docRef, guideData);
      });
      
      console.log("Guide created successfully with ID:", guideId);
      
      // After transaction completes, update the image metadata if needed
      if (imagePaths.length > 0) {
        const metadataPromises = imagePaths.map(path => 
          propertyImageService.updateFileMetadata(path, {
            customMetadata: {
              guideId
            }
          })
        );
        
        try {
          await Promise.all(metadataPromises);
          console.log("Updated metadata for all images");
        } catch (metadataError) {
          console.error("Error updating image metadata:", metadataError);
          // Continue even if metadata update fails
        }
      }
      
      return {
        id: guideId,
        ...guideData,
        imageUrls
      };
    } catch (error) {
      console.error('Error creating guide with transaction:', error);
      
      // Add more detailed error handling
      if (error.code === 'storage/unauthorized') {
        throw new Error('Storage 권한 오류: 이미지 업로드에 필요한 권한이 없습니다. 로그인 상태를 확인해주세요.');
      } else if (error.code === 'aborted') {
        throw new Error('가이드 생성이 중단되었습니다. 다시 시도해주세요.');
      } else if (error.code === 'unavailable') {
        throw new Error('서버 연결에 실패했습니다. 인터넷 연결을 확인하고 다시 시도해주세요.');
      } else {
        throw error;
      }
    }
  }

  /**
   * Get a guide with additional processing
   * @param {string} id - Guide ID
   * @returns {Promise<Object>} - Processed guide data
   */
  async getGuideWithDetails(id) {
    const guide = await this.getById(id);
    
    if (!guide) {
      return null;
    }
    
    // 추가 위치 정보로 가이드 데이터 보강
    const enrichedGuide = await this.enrichWithLocationData(id);
    
    return {
      ...enrichedGuide,
      // Add any additional fields as needed
      formattedAddress: this.formatAddress(enrichedGuide.address),
      naverMapUrl: this.generateNaverMapUrl(enrichedGuide.address)
    };
  }
  
  /**
   * Generate a Naver Map URL for an address
   * @param {string} address - Property address
   * @returns {string} - Naver Map URL
   */
  generateNaverMapUrl(address) {
    if (!address) return '';
    
    // 네이버 맵 서비스 활용
    return naverMapService.generateMapUrl(address);
  }
  
  /**
   * Format an address for display
   * @param {string} address - Property address
   * @returns {string} - Formatted address
   */
  formatAddress(address) {
    if (!address) return '';
    
    // Add any address formatting logic here
    // For now, just return the original address
    return address;
  }
  
  /**
   * Get all guides created by a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} - Array of guide data
   */
  async getGuidesByUser(userId) {
    return this.query({
      conditions: [['createdBy', '==', userId]],
      orderByField: 'createdAt',
      orderDirection: 'desc'
    });
  }
  
  /**
   * Delete a guide and its associated resources
   * @param {string} id - Guide ID
   * @returns {Promise<void>}
   */
  async deleteGuide(id) {
    const guide = await this.getById(id);
    
    if (!guide) {
      throw new Error(`Guide not found: ${id}`);
    }
    
    // Delete associated image if exists
    if (guide.imagePath) {
      try {
        await propertyImageService.deletePropertyImage(guide.imagePath);
      } catch (error) {
        console.error(`Error deleting guide image: ${error.message}`);
        // Continue with deletion even if image deletion fails
      }
    }
    
    // Delete the guide document
    await this.delete(id);
  }
  
  /**
   * Delete a guide and its associated resources with transaction
   * @param {string} id - Guide ID
   * @returns {Promise<void>}
   */
  async deleteGuideWithTransaction(id) {
    const guide = await this.getById(id);
    
    if (!guide) {
      throw new Error(`Guide not found: ${id}`);
    }
    
    try {
      // Can't delete Storage items in a Firestore transaction,
      // so we'll do this in two steps
      await runTransaction(db, async (transaction) => {
        const docRef = doc(db, this.collectionName, id);
        transaction.delete(docRef);
      });
      
      // After transaction completes, delete the image if exists
      if (guide.imagePath) {
        await propertyImageService.deletePropertyImage(guide.imagePath);
      }
    } catch (error) {
      console.error(`Error deleting guide with transaction: ${error.message}`);
      
      // Add more detailed error handling
      if (error.code === 'aborted') {
        throw new Error('가이드 삭제가 중단되었습니다. 다시 시도해주세요.');
      } else if (error.code === 'unavailable') {
        throw new Error('서버 연결에 실패했습니다. 인터넷 연결을 확인하고 다시 시도해주세요.');
      } else {
        throw error;
      }
    }
  }
  
  /**
   * Update a guide's information
   * @param {string} id - Guide ID
   * @param {Object} data - Updated guide data
   * @param {File} newImageFile - New image file (optional)
   * @param {Function} progressCallback - Upload progress callback
   * @returns {Promise<Object>} - Updated guide data
   */
  async updateGuide(id, data, newImageFile = null, progressCallback = null) {
    const guide = await this.getById(id);
    
    if (!guide) {
      throw new Error(`Guide not found: ${id}`);
    }
    
    try {
      let imageUrl = guide.imageUrl;
      let imagePath = guide.imagePath;
      
      // If a new image is provided, upload it and delete the old one
      if (newImageFile) {
        // Upload the new image
        const uploadResult = await propertyImageService.uploadPropertyImage(
          newImageFile,
          id, // Use the actual guide ID
          {
            customMetadata: {
              guideId: id
            }
          },
          progressCallback
        );
        
        imageUrl = uploadResult.url;
        imagePath = uploadResult.path;
        
        // Delete the old image if it exists
        if (guide.imagePath && guide.imagePath !== imagePath) {
          try {
            await propertyImageService.deletePropertyImage(guide.imagePath);
          } catch (error) {
            console.error(`Error deleting old guide image: ${error.message}`);
            // Continue even if old image deletion fails
          }
        }
      }
      
      // Update the guide document
      const updateData = {
        ...data,
        imageUrl,
        imagePath,
        updatedAt: serverTimestamp()
      };
      
      await this.update(id, updateData);
      
      return {
        id,
        ...updateData
      };
    } catch (error) {
      console.error('Error updating guide:', error);
      throw error;
    }
  }
  
  /**
   * Subscribe to real-time updates for a specific guide
   * @param {string} id - Guide ID
   * @param {Function} callback - Callback function with guide data
   * @returns {Function} - Unsubscribe function
   */
  subscribeToGuide(id, callback) {
    // 특정 문서에 대한 변경 사항을 subscribe하려면 해당 문서 참조를 직접 만들어서 사용
    const docRef = doc(db, this.collectionName, id);
    
    // 문서에 대한 실시간 리스너 추가
    return onSnapshot(docRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const guideData = { id: docSnapshot.id, ...docSnapshot.data() };
        callback(guideData);
      } else {
        callback(null); // 문서가 없거나 삭제된 경우
      }
    }, (error) => {
      console.error(`Error subscribing to guide ${id}:`, error);
      callback(null);
    });
  }
  
  /**
   * Subscribe to real-time updates for all guides
   * @param {Function} callback - Callback function with array of guides
   * @returns {Function} - Unsubscribe function
   */
  subscribeToAllGuides(callback) {
    return this.subscribeToChanges(callback);
  }
  
  /**
   * Enriches a guide with location data such as nearby facilities and transportation
   * @param {string} id - Guide ID
   * @returns {Promise<Object>} - Enriched guide data
   */
  async enrichWithLocationData(id) {
    const guide = await this.getById(id);
    
    if (!guide || !guide.address) {
      return guide;
    }
    
    try {
      // 이 부분은 실제로 네이버 지도 API나 다른 API를 사용하여
      // 주변 시설 정보를 가져오는 로직을 구현해야 합니다.
      // 예시를 위해 가상의 데이터를 반환합니다.
      
      // 예시: 주변 시설 정보
      const nearbyFacilities = [
        { name: '스타벅스 강남역점', distance: 120, type: 'cafe' },
        { name: '이마트 역삼점', distance: 350, type: 'shopping' },
        { name: '강남역 공원', distance: 200, type: 'park' }
      ];
      
      // 예시: 대중교통 정보
      const publicTransportation = [
        { type: 'Subway', name: '강남역 2호선', distance: 180 },
        { type: 'Bus', name: '146번 버스', distance: 100 }
      ];
      
      return {
        ...guide,
        nearbyFacilities,
        publicTransportation
      };
    } catch (error) {
      console.error('Error enriching guide with location data:', error);
      return guide; // 오류가 발생해도 기본 가이드 데이터 반환
    }
  }
}

// Export single instance
export const guideService = new GuideService();

import { FirestoreService } from './firestore.service';
import { 
  PROPERTY_COLLECTION, 
  PROPERTY_FIELDS, 
  PROPERTY_STATUSES 
} from '../../models/property.model';
import { where, query, collection, limit, orderBy, startAfter, getDocs } from 'firebase/firestore';
import { db } from '../config';

/**
 * PropertyService for managing property documents in Firestore
 */
export class PropertyService extends FirestoreService {
  constructor() {
    super(PROPERTY_COLLECTION);
  }

  /**
   * Get properties by status
   * @param {string} status - Property status
   * @param {number} limitCount - Max number of properties to return
   * @returns {Promise<Array>} - Array of property data
   */
  async getByStatus(status, limitCount = 50) {
    return this.query({
      conditions: [[PROPERTY_FIELDS.STATUS, '==', status]],
      limitCount
    });
  }

  /**
   * Get properties by owner ID
   * @param {string} ownerId - Owner ID
   * @returns {Promise<Array>} - Array of property data
   */
  async getByOwnerId(ownerId) {
    return this.query({
      conditions: [[PROPERTY_FIELDS.OWNER_ID, '==', ownerId]],
      orderByField: PROPERTY_FIELDS.UPDATED_AT,
      orderDirection: 'desc'
    });
  }

  /**
   * Get available properties
   * @returns {Promise<Array>} - Array of available property data
   */
  async getAvailableProperties() {
    return this.getByStatus(PROPERTY_STATUSES.AVAILABLE);
  }

  /**
   * Advanced search for properties
   * @param {Object} filters - Search filters
   * @param {number} page - Page number
   * @param {number} pageSize - Page size
   * @returns {Promise<Object>} - Properties and pagination info
   */
  async searchProperties(filters = {}, page = 1, pageSize = 10) {
    const {
      minDeposit,
      maxDeposit,
      minMonthlyRent,
      maxMonthlyRent,
      minArea,
      maxArea,
      status,
      tags,
      features
    } = filters;

    let conditions = [];

    // Add filters if provided
    if (minDeposit) {
      conditions.push([PROPERTY_FIELDS.DEPOSIT, '>=', minDeposit]);
    }
    if (maxDeposit) {
      conditions.push([PROPERTY_FIELDS.DEPOSIT, '<=', maxDeposit]);
    }
    if (minMonthlyRent) {
      conditions.push([PROPERTY_FIELDS.MONTHLY_RENT, '>=', minMonthlyRent]);
    }
    if (maxMonthlyRent) {
      conditions.push([PROPERTY_FIELDS.MONTHLY_RENT, '<=', maxMonthlyRent]);
    }
    if (minArea) {
      conditions.push([PROPERTY_FIELDS.AREA, '>=', minArea]);
    }
    if (maxArea) {
      conditions.push([PROPERTY_FIELDS.AREA, '<=', maxArea]);
    }
    if (status) {
      conditions.push([PROPERTY_FIELDS.STATUS, '==', status]);
    }

    // Note: For tags and features, we need to use array-contains or array-contains-any
    // which can be limited in combination with other conditions
    if (tags && tags.length > 0) {
      // We can only use one array-contains-any in a query
      conditions.push([PROPERTY_FIELDS.TAGS, 'array-contains-any', tags]);
    }

    // For advanced feature filtering, we might need to use multiple queries and combine results
    // This is a simplified version that may need refinement based on actual requirements
    const properties = await this.query({
      conditions,
      orderByField: PROPERTY_FIELDS.UPDATED_AT,
      orderDirection: 'desc',
      limitCount: pageSize
    });

    // For pagination
    let lastVisible = properties.length > 0 ? properties[properties.length - 1] : null;
    
    return {
      properties,
      pagination: {
        hasMore: properties.length === pageSize,
        lastVisible,
        page,
        pageSize
      }
    };
  }

  /**
   * Get properties within geographical distance
   * @param {Object} location - Center location {latitude, longitude}
   * @param {number} radiusKm - Search radius in kilometers
   * @returns {Promise<Array>} - Array of property data
   */
  async getNearbyProperties(location, radiusKm = 5) {
    // Note: Firestore doesn't directly support geospatial queries
    // This is a simplified implementation that would need to be enhanced
    // with a proper geospatial solution like geohashes or a specialized service
    
    // For now, we'll fetch properties and filter in memory
    // This is NOT efficient for large datasets
    const properties = await this.getAll();
    
    return properties.filter(property => {
      if (!property.location || !property.location.latitude || !property.location.longitude) {
        return false;
      }
      
      // Calculate distance using Haversine formula
      const distance = this.calculateDistance(
        location.latitude, 
        location.longitude,
        property.location.latitude,
        property.location.longitude
      );
      
      return distance <= radiusKm;
    });
  }
  
  /**
   * Calculate distance between two coordinates using Haversine formula
   * @param {number} lat1 - Latitude 1
   * @param {number} lon1 - Longitude 1
   * @param {number} lat2 - Latitude 2
   * @param {number} lon2 - Longitude 2
   * @returns {number} - Distance in kilometers
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth radius in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const d = R * c; // Distance in kilometers
    return d;
  }
  
  /**
   * Convert degrees to radians
   * @param {number} deg - Degrees
   * @returns {number} - Radians
   */
  deg2rad(deg) {
    return deg * (Math.PI/180);
  }

  /**
   * Get next page of properties for pagination
   * @param {Object} lastVisible - Last visible property document
   * @param {Array} conditions - Query conditions
   * @param {number} pageSize - Page size
   * @returns {Promise<Array>} - Next page of properties
   */
  async getNextPage(lastVisible, conditions = [], pageSize = 10) {
    if (!lastVisible) {
      throw new Error('Last visible document is required for pagination');
    }

    let q = collection(db, PROPERTY_COLLECTION);
    
    // Apply conditions
    if (conditions.length > 0) {
      conditions.forEach(([field, operator, value]) => {
        q = query(q, where(field, operator, value));
      });
    }
    
    // Apply orderBy, startAfter and limit
    q = query(
      q,
      orderBy(PROPERTY_FIELDS.UPDATED_AT, 'desc'),
      startAfter(lastVisible),
      limit(pageSize)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }

  /**
   * Subscribe to properties by owner
   * @param {string} ownerId - Owner ID
   * @param {function} callback - Callback function
   * @returns {function} - Unsubscribe function
   */
  subscribeToOwnerProperties(ownerId, callback) {
    return this.subscribeToChanges(callback, [
      [PROPERTY_FIELDS.OWNER_ID, '==', ownerId]
    ]);
  }

  /**
   * Update property status
   * @param {string} id - Property ID
   * @param {string} status - New status
   * @returns {Promise<void>}
   */
  async updateStatus(id, status) {
    if (!Object.values(PROPERTY_STATUSES).includes(status)) {
      throw new Error(`Invalid status: ${status}`);
    }
    
    await this.update(id, { status });
  }

  /**
   * Add images to property
   * @param {string} id - Property ID
   * @param {Array} imageUrls - Array of image URLs
   * @returns {Promise<void>}
   */
  async addImages(id, imageUrls) {
    const property = await this.getById(id);
    
    if (!property) {
      throw new Error(`Property not found: ${id}`);
    }
    
    const currentImages = property.images || [];
    const updatedImages = [...currentImages, ...imageUrls];
    
    await this.update(id, { images: updatedImages });
  }

  /**
   * Remove image from property
   * @param {string} id - Property ID
   * @param {string} imageUrl - Image URL to remove
   * @returns {Promise<void>}
   */
  async removeImage(id, imageUrl) {
    const property = await this.getById(id);
    
    if (!property) {
      throw new Error(`Property not found: ${id}`);
    }
    
    const currentImages = property.images || [];
    const updatedImages = currentImages.filter(url => url !== imageUrl);
    
    await this.update(id, { images: updatedImages });
  }
}

// Export single instance
export const propertyService = new PropertyService();

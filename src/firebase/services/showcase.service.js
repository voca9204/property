import { FirestoreService } from './firestore.service';
import { nanoid } from 'nanoid';

/**
 * ShowcaseService for managing showcase documents in Firestore
 */
export class ShowcaseService extends FirestoreService {
  constructor() {
    super('showcases');
  }

  /**
   * Create a new showcase
   * @param {Object} showcaseData - Showcase data
   * @returns {Promise<string>} - Showcase ID
   */
  async createShowcase(showcaseData) {
    // Generate a unique URL identifier
    const uniqueId = nanoid(10);
    
    const data = {
      ...showcaseData,
      urlId: uniqueId,
      viewCount: 0,
      active: true
    };
    
    return this.create(data);
  }

  /**
   * Get showcases by creator
   * @param {string} creatorId - Creator ID
   * @returns {Promise<Array>} - Array of showcase data
   */
  async getByCreator(creatorId) {
    return this.query({
      conditions: [['creatorId', '==', creatorId]],
      orderByField: 'createdAt',
      orderDirection: 'desc'
    });
  }

  /**
   * Get showcase by URL ID
   * @param {string} urlId - URL identifier
   * @returns {Promise<Object|null>} - Showcase data or null
   */
  async getByUrlId(urlId) {
    const showcases = await this.query({
      conditions: [['urlId', '==', urlId]],
      limitCount: 1
    });
    
    return showcases.length > 0 ? showcases[0] : null;
  }

  /**
   * Add property to showcase
   * @param {string} showcaseId - Showcase ID
   * @param {string} propertyId - Property ID
   * @param {number} displayOrder - Display order
   * @returns {Promise<void>}
   */
  async addPropertyToShowcase(showcaseId, propertyId, displayOrder = 0) {
    const showcase = await this.getById(showcaseId);
    
    if (!showcase) {
      throw new Error(`Showcase not found: ${showcaseId}`);
    }
    
    const properties = showcase.properties || [];
    
    // Remove property if it already exists
    const filteredProperties = properties.filter(p => p.id !== propertyId);
    
    // Add property with display order
    await this.update(showcaseId, {
      properties: [
        ...filteredProperties,
        { id: propertyId, displayOrder }
      ].sort((a, b) => a.displayOrder - b.displayOrder)
    });
  }

  /**
   * Remove property from showcase
   * @param {string} showcaseId - Showcase ID
   * @param {string} propertyId - Property ID
   * @returns {Promise<void>}
   */
  async removePropertyFromShowcase(showcaseId, propertyId) {
    const showcase = await this.getById(showcaseId);
    
    if (!showcase) {
      throw new Error(`Showcase not found: ${showcaseId}`);
    }
    
    const properties = showcase.properties || [];
    
    await this.update(showcaseId, {
      properties: properties.filter(p => p.id !== propertyId)
    });
  }

  /**
   * Update property display order
   * @param {string} showcaseId - Showcase ID
   * @param {Array} propertyOrders - Array of {id, displayOrder} objects
   * @returns {Promise<void>}
   */
  async updatePropertyOrder(showcaseId, propertyOrders) {
    const showcase = await this.getById(showcaseId);
    
    if (!showcase) {
      throw new Error(`Showcase not found: ${showcaseId}`);
    }
    
    const properties = showcase.properties || [];
    
    // Update display orders and keep properties not in the update list
    const updatedProperties = properties.map(property => {
      const update = propertyOrders.find(p => p.id === property.id);
      
      if (update) {
        return {
          ...property,
          displayOrder: update.displayOrder
        };
      }
      
      return property;
    });
    
    await this.update(showcaseId, {
      properties: updatedProperties.sort((a, b) => a.displayOrder - b.displayOrder)
    });
  }

  /**
   * Update showcase branding
   * @param {string} showcaseId - Showcase ID
   * @param {Object} branding - Branding data
   * @returns {Promise<void>}
   */
  async updateBranding(showcaseId, branding) {
    await this.update(showcaseId, { branding });
  }

  /**
   * Toggle showcase active status
   * @param {string} showcaseId - Showcase ID
   * @param {boolean} active - Active status
   * @returns {Promise<void>}
   */
  async setActiveStatus(showcaseId, active) {
    await this.update(showcaseId, { active });
  }

  /**
   * Increment showcase view count
   * @param {string} showcaseId - Showcase ID
   * @returns {Promise<number>} - New view count
   */
  async incrementViewCount(showcaseId) {
    const showcase = await this.getById(showcaseId);
    
    if (!showcase) {
      throw new Error(`Showcase not found: ${showcaseId}`);
    }
    
    const newViewCount = (showcase.viewCount || 0) + 1;
    
    await this.update(showcaseId, { viewCount: newViewCount });
    
    return newViewCount;
  }

  /**
   * Record showcase interaction
   * @param {string} showcaseId - Showcase ID
   * @param {Object} interaction - Interaction data
   * @returns {Promise<void>}
   */
  async recordInteraction(showcaseId, interaction) {
    const showcase = await this.getById(showcaseId);
    
    if (!showcase) {
      throw new Error(`Showcase not found: ${showcaseId}`);
    }
    
    const interactions = showcase.interactions || [];
    
    await this.update(showcaseId, {
      interactions: [
        {
          ...interaction,
          timestamp: new Date()
        },
        ...interactions
      ]
    });
  }

  /**
   * Get popular showcases
   * @param {string} creatorId - Creator ID
   * @param {number} limit - Limit
   * @returns {Promise<Array>} - Array of showcase data
   */
  async getPopularShowcases(creatorId, limit = 5) {
    // Note: This requires a custom index on creatorId and viewCount
    return this.query({
      conditions: [['creatorId', '==', creatorId]],
      orderByField: 'viewCount',
      orderDirection: 'desc',
      limitCount: limit
    });
  }

  /**
   * Subscribe to showcase interactions
   * @param {string} showcaseId - Showcase ID
   * @param {function} callback - Callback function
   * @returns {function} - Unsubscribe function
   */
  subscribeToShowcaseInteractions(showcaseId, callback) {
    return this.subscribeToChanges(
      (showcases) => {
        if (showcases.length > 0) {
          callback(showcases[0]);
        }
      },
      [['id', '==', showcaseId]]
    );
  }
}

// Export single instance
export const showcaseService = new ShowcaseService();

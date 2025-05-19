import { FirestoreService } from './firestore.service';
import { where, query, collection, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../config';

/**
 * ClientService for managing client documents in Firestore
 */
export class ClientService extends FirestoreService {
  constructor() {
    super('clients');
  }

  /**
   * Get clients by agent ID
   * @param {string} agentId - Agent ID
   * @returns {Promise<Array>} - Array of client data
   */
  async getByAgentId(agentId) {
    return this.query({
      conditions: [['agentId', '==', agentId]],
      orderByField: 'updatedAt',
      orderDirection: 'desc'
    });
  }

  /**
   * Search clients by name or email
   * @param {string} searchText - Search text
   * @param {string} agentId - Agent ID
   * @returns {Promise<Array>} - Array of client data
   */
  async searchClients(searchText, agentId) {
    // Note: Firestore doesn't support text search out of the box
    // This is a simplified implementation that fetches clients 
    // and filters them in memory
    
    if (!searchText || !agentId) {
      return [];
    }
    
    const clients = await this.getByAgentId(agentId);
    const lowerSearchText = searchText.toLowerCase();
    
    return clients.filter(client => 
      (client.name && client.name.toLowerCase().includes(lowerSearchText)) ||
      (client.email && client.email.toLowerCase().includes(lowerSearchText)) ||
      (client.phone && client.phone.includes(searchText))
    );
  }

  /**
   * Add showcase to client
   * @param {string} clientId - Client ID
   * @param {string} showcaseId - Showcase ID
   * @returns {Promise<void>}
   */
  async addShowcaseToClient(clientId, showcaseId) {
    const client = await this.getById(clientId);
    
    if (!client) {
      throw new Error(`Client not found: ${clientId}`);
    }
    
    const showcases = client.showcases || [];
    
    // Check if showcase already exists
    if (showcases.includes(showcaseId)) {
      return; // Already added
    }
    
    await this.update(clientId, {
      showcases: [...showcases, showcaseId]
    });
  }

  /**
   * Remove showcase from client
   * @param {string} clientId - Client ID
   * @param {string} showcaseId - Showcase ID
   * @returns {Promise<void>}
   */
  async removeShowcaseFromClient(clientId, showcaseId) {
    const client = await this.getById(clientId);
    
    if (!client) {
      throw new Error(`Client not found: ${clientId}`);
    }
    
    const showcases = client.showcases || [];
    
    await this.update(clientId, {
      showcases: showcases.filter(id => id !== showcaseId)
    });
  }

  /**
   * Get clients with specific preferences
   * @param {Array} preferences - Array of preference tags
   * @param {string} agentId - Agent ID
   * @returns {Promise<Array>} - Array of client data
   */
  async getClientsByPreferences(preferences, agentId) {
    if (!preferences || preferences.length === 0 || !agentId) {
      return [];
    }
    
    // Create a query to find clients with matching preferences
    const clientsRef = collection(db, 'clients');
    const q = query(
      clientsRef,
      where('agentId', '==', agentId),
      where('preferences', 'array-contains-any', preferences),
      orderBy('updatedAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }

  /**
   * Update client preferences
   * @param {string} clientId - Client ID
   * @param {Array} preferences - New preferences
   * @returns {Promise<void>}
   */
  async updateClientPreferences(clientId, preferences) {
    await this.update(clientId, { preferences });
  }

  /**
   * Add interaction to client history
   * @param {string} clientId - Client ID
   * @param {Object} interaction - Interaction data
   * @returns {Promise<void>}
   */
  async addClientInteraction(clientId, interaction) {
    const client = await this.getById(clientId);
    
    if (!client) {
      throw new Error(`Client not found: ${clientId}`);
    }
    
    const interactions = client.interactions || [];
    
    await this.update(clientId, {
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
   * Get clients with recent interactions
   * @param {string} agentId - Agent ID
   * @param {number} days - Number of days to look back
   * @returns {Promise<Array>} - Array of client data
   */
  async getClientsWithRecentInteractions(agentId, days = 30) {
    const clients = await this.getByAgentId(agentId);
    const now = new Date();
    const cutoff = new Date(now.setDate(now.getDate() - days));
    
    return clients.filter(client => {
      if (!client.interactions || client.interactions.length === 0) {
        return false;
      }
      
      const latestInteraction = client.interactions[0];
      const interactionDate = latestInteraction.timestamp instanceof Date 
        ? latestInteraction.timestamp 
        : new Date(latestInteraction.timestamp);
      
      return interactionDate >= cutoff;
    });
  }

  /**
   * Subscribe to client changes
   * @param {string} agentId - Agent ID
   * @param {function} callback - Callback function
   * @returns {function} - Unsubscribe function
   */
  subscribeToClientChanges(agentId, callback) {
    return this.subscribeToChanges(callback, [
      ['agentId', '==', agentId]
    ]);
  }
}

// Export single instance
export const clientService = new ClientService();

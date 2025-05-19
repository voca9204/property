import { useState, useEffect } from 'react';
import { clientService } from '../firebase/services';

/**
 * Hook to fetch a client by ID
 * @param {string} clientId - Client ID
 * @returns {Object} - Client data, loading state, and error
 */
export const useClient = (clientId) => {
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchClient = async () => {
      if (!clientId) {
        setClient(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const clientData = await clientService.getById(clientId);
        setClient(clientData);
        setError(null);
      } catch (err) {
        console.error('Error fetching client:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchClient();
  }, [clientId]);

  return { client, loading, error };
};

/**
 * Hook to fetch clients by agent
 * @param {string} agentId - Agent ID
 * @returns {Object} - Clients data, loading state, and error
 */
export const useAgentClients = (agentId) => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchClients = async () => {
      if (!agentId) {
        setClients([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const clientsData = await clientService.getByAgentId(agentId);
        setClients(clientsData);
        setError(null);
      } catch (err) {
        console.error('Error fetching clients:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, [agentId]);

  return { clients, loading, error };
};

/**
 * Hook to fetch clients with real-time updates
 * @param {string} agentId - Agent ID
 * @returns {Object} - Clients data, loading state, and error
 */
export const useRealTimeClients = (agentId) => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!agentId) {
      setClients([]);
      setLoading(false);
      return () => {};
    }

    setLoading(true);

    // Subscribe to real-time updates
    const unsubscribe = clientService.subscribeToClientChanges(
      agentId,
      (clientsData) => {
        setClients(clientsData);
        setLoading(false);
        setError(null);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [agentId]);

  return { clients, loading, error };
};

/**
 * Hook for client search
 * @param {string} agentId - Agent ID
 * @returns {Object} - Search functions and state
 */
export const useClientSearch = (agentId) => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Search clients by text
   * @param {string} searchText - Search text
   */
  const searchClients = async (searchText) => {
    if (!agentId) {
      setResults([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const clientsData = await clientService.searchClients(searchText, agentId);
      setResults(clientsData);
    } catch (err) {
      console.error('Error searching clients:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    results,
    loading,
    error,
    searchClients
  };
};

/**
 * Hook to fetch clients with recent interactions
 * @param {string} agentId - Agent ID
 * @param {number} days - Number of days to look back
 * @returns {Object} - Clients data, loading state, and error
 */
export const useClientsWithRecentInteractions = (agentId, days = 30) => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchClients = async () => {
      if (!agentId) {
        setClients([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const clientsData = await clientService.getClientsWithRecentInteractions(agentId, days);
        setClients(clientsData);
        setError(null);
      } catch (err) {
        console.error('Error fetching clients with recent interactions:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, [agentId, days]);

  return { clients, loading, error };
};

/**
 * Hook to fetch clients by preferences
 * @param {Array} preferences - Preference tags
 * @param {string} agentId - Agent ID
 * @returns {Object} - Clients data, loading state, and error
 */
export const useClientsByPreferences = (preferences, agentId) => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchClients = async () => {
      if (!preferences || preferences.length === 0 || !agentId) {
        setClients([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const clientsData = await clientService.getClientsByPreferences(preferences, agentId);
        setClients(clientsData);
        setError(null);
      } catch (err) {
        console.error('Error fetching clients by preferences:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, [preferences, agentId]);

  return { clients, loading, error };
};

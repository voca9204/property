import { useState, useEffect } from 'react';
import { propertyService } from '../firebase/services';

/**
 * Hook to fetch a property by ID
 * @param {string} propertyId - Property ID
 * @returns {Object} - Property data, loading state, and error
 */
export const useProperty = (propertyId) => {
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProperty = async () => {
      if (!propertyId) {
        setProperty(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const propertyData = await propertyService.getById(propertyId);
        setProperty(propertyData);
        setError(null);
      } catch (err) {
        console.error('Error fetching property:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [propertyId]);

  return { property, loading, error };
};

/**
 * Hook to fetch properties by owner
 * @param {string} ownerId - Owner ID
 * @returns {Object} - Properties data, loading state, and error
 */
export const useOwnerProperties = (ownerId) => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProperties = async () => {
      if (!ownerId) {
        setProperties([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const propertiesData = await propertyService.getByOwnerId(ownerId);
        setProperties(propertiesData);
        setError(null);
      } catch (err) {
        console.error('Error fetching properties:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, [ownerId]);

  return { properties, loading, error };
};

/**
 * Hook to fetch properties with real-time updates
 * @param {string} ownerId - Owner ID
 * @returns {Object} - Properties data, loading state, and error
 */
export const useRealTimeProperties = (ownerId) => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!ownerId) {
      setProperties([]);
      setLoading(false);
      return () => {};
    }

    setLoading(true);

    // Subscribe to real-time updates
    const unsubscribe = propertyService.subscribeToOwnerProperties(
      ownerId,
      (propertiesData) => {
        setProperties(propertiesData);
        setLoading(false);
        setError(null);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [ownerId]);

  return { properties, loading, error };
};

/**
 * Hook to fetch properties by status
 * @param {string} status - Property status
 * @returns {Object} - Properties data, loading state, and error
 */
export const usePropertiesByStatus = (status) => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setLoading(true);
        const propertiesData = await propertyService.getByStatus(status);
        setProperties(propertiesData);
        setError(null);
      } catch (err) {
        console.error('Error fetching properties by status:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, [status]);

  return { properties, loading, error };
};

/**
 * Hook for property search with filters
 * @returns {Object} - Search functions and state
 */
export const usePropertySearch = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    hasMore: false,
    lastVisible: null
  });

  /**
   * Search properties with filters
   * @param {Object} filters - Search filters
   */
  const searchProperties = async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const { properties, pagination: paginationData } = await propertyService.searchProperties(
        filters,
        1,
        pagination.pageSize
      );
      
      setResults(properties);
      setPagination({
        ...pagination,
        page: 1,
        hasMore: paginationData.hasMore,
        lastVisible: paginationData.lastVisible
      });
    } catch (err) {
      console.error('Error searching properties:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load next page of results
   */
  const loadMore = async () => {
    if (!pagination.hasMore || loading) {
      return;
    }

    try {
      setLoading(true);
      
      const nextPage = await propertyService.getNextPage(
        pagination.lastVisible,
        [],
        pagination.pageSize
      );
      
      setResults([...results, ...nextPage]);
      setPagination({
        ...pagination,
        page: pagination.page + 1,
        hasMore: nextPage.length === pagination.pageSize,
        lastVisible: nextPage.length > 0 ? nextPage[nextPage.length - 1] : pagination.lastVisible
      });
    } catch (err) {
      console.error('Error loading more properties:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    results,
    loading,
    error,
    pagination,
    searchProperties,
    loadMore
  };
};

/**
 * Hook to fetch nearby properties
 * @param {Object} location - Location {latitude, longitude}
 * @param {number} radius - Search radius in kilometers
 * @returns {Object} - Properties data, loading state, and error
 */
export const useNearbyProperties = (location, radius = 5) => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNearbyProperties = async () => {
      if (!location || !location.latitude || !location.longitude) {
        setProperties([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const propertiesData = await propertyService.getNearbyProperties(location, radius);
        setProperties(propertiesData);
        setError(null);
      } catch (err) {
        console.error('Error fetching nearby properties:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchNearbyProperties();
  }, [location, radius]);

  return { properties, loading, error };
};

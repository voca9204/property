import { useState, useEffect } from 'react';
import { showcaseService } from '../firebase/services';

/**
 * Hook to fetch a showcase by ID
 * @param {string} showcaseId - Showcase ID
 * @returns {Object} - Showcase data, loading state, and error
 */
export const useShowcase = (showcaseId) => {
  const [showcase, setShowcase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchShowcase = async () => {
      if (!showcaseId) {
        setShowcase(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const showcaseData = await showcaseService.getById(showcaseId);
        setShowcase(showcaseData);
        setError(null);
      } catch (err) {
        console.error('Error fetching showcase:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchShowcase();
  }, [showcaseId]);

  return { showcase, loading, error };
};

/**
 * Hook to fetch a showcase by URL ID
 * @param {string} urlId - Showcase URL ID
 * @returns {Object} - Showcase data, loading state, and error
 */
export const useShowcaseByUrl = (urlId) => {
  const [showcase, setShowcase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchShowcase = async () => {
      if (!urlId) {
        setShowcase(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const showcaseData = await showcaseService.getByUrlId(urlId);
        setShowcase(showcaseData);
        setError(null);
      } catch (err) {
        console.error('Error fetching showcase by URL:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchShowcase();
  }, [urlId]);

  return { showcase, loading, error };
};

/**
 * Hook to fetch showcases by creator
 * @param {string} creatorId - Creator ID
 * @returns {Object} - Showcases data, loading state, and error
 */
export const useCreatorShowcases = (creatorId) => {
  const [showcases, setShowcases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchShowcases = async () => {
      if (!creatorId) {
        setShowcases([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const showcasesData = await showcaseService.getByCreator(creatorId);
        setShowcases(showcasesData);
        setError(null);
      } catch (err) {
        console.error('Error fetching showcases:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchShowcases();
  }, [creatorId]);

  return { showcases, loading, error };
};

/**
 * Hook to fetch popular showcases
 * @param {string} creatorId - Creator ID
 * @param {number} limit - Number of showcases to fetch
 * @returns {Object} - Showcases data, loading state, and error
 */
export const usePopularShowcases = (creatorId, limit = 5) => {
  const [showcases, setShowcases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchShowcases = async () => {
      if (!creatorId) {
        setShowcases([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const showcasesData = await showcaseService.getPopularShowcases(creatorId, limit);
        setShowcases(showcasesData);
        setError(null);
      } catch (err) {
        console.error('Error fetching popular showcases:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchShowcases();
  }, [creatorId, limit]);

  return { showcases, loading, error };
};

/**
 * Hook to subscribe to showcase interactions
 * @param {string} showcaseId - Showcase ID
 * @returns {Object} - Showcase data and loading state
 */
export const useShowcaseInteractions = (showcaseId) => {
  const [showcase, setShowcase] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!showcaseId) {
      setShowcase(null);
      setLoading(false);
      return () => {};
    }

    setLoading(true);

    // Subscribe to real-time updates
    const unsubscribe = showcaseService.subscribeToShowcaseInteractions(
      showcaseId,
      (showcaseData) => {
        setShowcase(showcaseData);
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [showcaseId]);

  return { showcase, loading };
};

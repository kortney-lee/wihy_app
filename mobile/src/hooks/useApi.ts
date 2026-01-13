import { useState, useCallback, useEffect } from 'react';
import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from '../services/api';

/**
 * Custom hook for managing API requests with loading and error states
 * Provides automatic authentication and error handling
 */
export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (fn) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fn();
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    execute,
    get: (endpoint, options) => execute(() => apiGet(endpoint, options)),
    post: (endpoint, body, options) => execute(() => apiPost(endpoint, body, options)),
    put: (endpoint, body, options) => execute(() => apiPut(endpoint, body, options)),
    patch: (endpoint, body, options) => execute(() => apiPatch(endpoint, body, options)),
    delete: (endpoint, options) => execute(() => apiDelete(endpoint, options))
  };
};

/**
 * Custom hook for fetching data from an endpoint
 * Automatically handles authentication and caching
 */
export const useFetch = (endpoint, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiGet(endpoint, options);
      setData(result);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [endpoint, options]);

  // Fetch on mount
  useEffect(() => {
    if (endpoint) {
      fetch();
    }
  }, [endpoint, fetch]);

  const refetch = useCallback(() => {
    return fetch();
  }, [fetch]);

  return {
    data,
    loading,
    error,
    refetch
  };
};

import { authService } from './authService';

const API_BASE_URL = __DEV__ 
  ? 'http://localhost:3000' 
  : 'https://api.wihy.ai';

/**
 * Make an authenticated API request with the user's session token
 * Automatically includes the Authorization header
 */
export const makeAuthenticatedRequest = async (
  endpoint,
  options = {}
) => {
  const token = await authService.getSessionToken();
  
  if (!token) {
    throw new Error('No authentication token found. Please log in first.');
  }

  const url = endpoint.startsWith('http') 
    ? endpoint 
    : `${API_BASE_URL}${endpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    const data = await response.json();

    // If token is invalid/expired, clear it and throw error
    if (response.status === 401) {
      await authService.clearTokens();
      throw new Error('Session expired. Please log in again.');
    }

    if (!response.ok) {
      throw new Error(data.error || `API error: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`API request failed to ${endpoint}:`, error);
    throw error;
  }
};

/**
 * Convenience method for GET requests
 */
export const apiGet = (endpoint, options = {}) => {
  return makeAuthenticatedRequest(endpoint, {
    ...options,
    method: 'GET'
  });
};

/**
 * Convenience method for POST requests
 */
export const apiPost = (endpoint, body, options = {}) => {
  return makeAuthenticatedRequest(endpoint, {
    ...options,
    method: 'POST',
    body: JSON.stringify(body)
  });
};

/**
 * Convenience method for PUT requests
 */
export const apiPut = (endpoint, body, options = {}) => {
  return makeAuthenticatedRequest(endpoint, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(body)
  });
};

/**
 * Convenience method for PATCH requests
 */
export const apiPatch = (endpoint, body, options = {}) => {
  return makeAuthenticatedRequest(endpoint, {
    ...options,
    method: 'PATCH',
    body: JSON.stringify(body)
  });
};

/**
 * Convenience method for DELETE requests
 */
export const apiDelete = (endpoint, options = {}) => {
  return makeAuthenticatedRequest(endpoint, {
    ...options,
    method: 'DELETE'
  });
};

// Example of the clean flow: User Question → Loading → WiHy API → Response
import React, { useState } from 'react';
import { wihyAPI } from '../../services/wihyAPI';

interface HealthSearchProps {
  onResponse?: (response: any) => void;
}

const CleanHealthSearch: React.FC<HealthSearchProps> = ({ onResponse }) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);
    setResponse(null);

    try {
      console.log('🔍 User asked:', query);
      
      // Direct call to WiHy API - no intermediate services
      const result = await wihyAPI.searchHealth(query.trim());
      
      if (result.success) {
        console.log('✅ WiHy API response received');
        setResponse(result);
        setShowChat(true);
        
        // Optional callback for parent components
        if (onResponse) {
          onResponse(result);
        }
      } else {
        setError('Sorry, I could not process your request. Please try again.');
      }
    } catch (err) {
      console.error('❌ Search error:', err);
      setError('An error occurred while processing your request.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleSearch();
    }
  };

  return (
    <div className="clean-health-search">
      {/* Search Input */}
      <div className="search-container">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask any health or nutrition question..."
          disabled={isLoading}
          className="search-input"
        />
        <button 
          onClick={handleSearch} 
          disabled={isLoading || !query.trim()}
          className="search-button"
        >
          {isLoading ? 'Searching...' : 'Ask WiHy'}
        </button>
      </div>

      {/* Loading Screen */}
      {isLoading && (
        <div className="loading-screen">
          <div className="loading-spinner"></div>
          <p>Getting your answer from WiHy AI...</p>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}

      {/* Response Display */}
      {showChat && response && (
        <div style={{ 
          border: '1px solid #e5e7eb', 
          borderRadius: '8px', 
          padding: '16px', 
          marginTop: '16px',
          backgroundColor: '#f9fafb'
        }}>
          <h3>Response:</h3>
          <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
            {(() => {
              // Extract response from WiHy API response
              if (response?.data?.ai_response?.response) {
                return response.data.ai_response.response;
              } else if (response?.data?.response) {
                // Handle JSON string responses
                let responseText = response.data.response;
                if (typeof responseText === 'string') {
                  try {
                    const parsed = JSON.parse(responseText.replace(/'/g, '"'));
                    return parsed.core_principle || parsed.message || responseText;
                  } catch {
                    return responseText;
                  }
                }
                return responseText;
              } else if (response?.wihy_response) {
                return response.wihy_response.core_principle || response.wihy_response.message || 'Health information provided';
              } else if (response?.message) {
                return response.message;
              } else {
                return 'Health information received from WiHy API';
              }
            })()}
          </div>
          <button 
            onClick={() => setShowChat(false)}
            style={{
              marginTop: '12px',
              padding: '8px 16px',
              backgroundColor: '#f3f4f6',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>
      )}

      {/* Debug Info (remove in production) */}
      {response && (
        <div className="debug-info" style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
          <details>
            <summary>Debug: WiHy API Response</summary>
            <pre>{JSON.stringify(response, null, 2)}</pre>
          </details>
        </div>
      )}
    </div>
  );
};

export default CleanHealthSearch;
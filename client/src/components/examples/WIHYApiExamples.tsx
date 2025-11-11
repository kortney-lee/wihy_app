/**
 * WIHY API Usage Examples - React integration examples
 * 
 * These examples show how to integrate the updated WIHY API services
 * into React components following the API documentation structure.
 */

import React, { useState } from 'react';
import { wihyApiClient } from '../../services/wihyApiClient';
import { healthStatusService } from '../../services/healthStatusService';

// Example 1: Basic Health Question Component
export const HealthQuestionExample: React.FC = () => {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const askQuestion = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    try {
      const response = await wihyApiClient.askHealthQuestion(query);
      setResult(response);
      console.log('Health Question Result:', {
        response: response?.response,
        source: response?.source,
        confidence: response?.confidence,
        type: response?.type
      });
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="health-question-example">
      <h3>Ask a Health Question</h3>
      <textarea
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Is quinoa good for weight loss?"
        rows={3}
        style={{ width: '100%', marginBottom: '10px' }}
      />
      <button onClick={askQuestion} disabled={loading}>
        {loading ? 'Asking...' : 'Ask Question'}
      </button>

      {result && (
        <div style={{ marginTop: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '5px' }}>
          <h4>Response:</h4>
          <p>{result.response}</p>
          
          <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
            <strong>Source:</strong> {result.source} | 
            <strong> Confidence:</strong> {(result.confidence * 100).toFixed(1)}% | 
            <strong> Type:</strong> {result.type} |
            <strong> Processing Time:</strong> {result.processing_time}s
          </div>
        </div>
      )}
    </div>
  );
};

// Example 2: Simple Health Query with Metadata Display
export const HealthQueryWithMetadata: React.FC = () => {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const askQuestion = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    try {
      const response = await wihyApiClient.askHealthQuestion(query);
      setResult(response);
      console.log('Health Question with Metadata:', {
        response: response?.response,
        source: response?.source,
        confidence: response?.confidence,
        type: response?.type,
        processingTime: response?.processing_time
      });
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="health-query-metadata-example">
      <h3>Health Question with Detailed Metadata</h3>
      <p>Shows confidence scores, source information, and processing details</p>
      
      <textarea
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="What supplements help with sleep?"
        rows={3}
        style={{ width: '100%', marginBottom: '10px' }}
      />
      <button onClick={askQuestion} disabled={loading}>
        {loading ? 'Asking...' : 'Ask Question'}
      </button>

      {result && (
        <div style={{ marginTop: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '5px' }}>
          <h4>Response:</h4>
          <p style={{ lineHeight: '1.6', marginBottom: '15px' }}>{result.response}</p>
          
          <div style={{ 
            padding: '10px', 
            backgroundColor: '#f8f9fa', 
            borderRadius: '5px',
            fontSize: '14px'
          }}>
            <h5 style={{ margin: '0 0 10px 0', color: '#495057' }}>Response Metadata:</h5>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
              <div>
                <strong>Source:</strong> {result.source}
              </div>
              <div>
                <strong>Confidence:</strong> {(result.confidence * 100).toFixed(1)}%
              </div>
              <div>
                <strong>Type:</strong> {result.type}
              </div>
              <div>
                <strong>Processing Time:</strong> {result.processing_time.toFixed(2)}s
              </div>
            </div>
            <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
              <strong>Timestamp:</strong> {new Date(result.timestamp).toLocaleString()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Example 3: System Health Status Component
export const HealthStatusExample: React.FC = () => {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const checkSystemHealth = async () => {
    setLoading(true);
    try {
      const response = await healthStatusService.getHealthCheck();
      setStatus(response);
      console.log('Health Status Result:', {
        status: response?.status,
        services: response?.services,
        message: response?.message
      });
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return '#28a745';
      case 'degraded': return '#ffc107';
      case 'unhealthy': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getServiceStatusIcon = (serviceStatus: string) => {
    return serviceStatus === 'available' ? '✅' : '❌';
  };

  return (
    <div className="health-status-example">
      <h3>System Health Status</h3>
      <button onClick={checkSystemHealth} disabled={loading}>
        {loading ? 'Checking...' : 'Check System Health'}
      </button>

      {status && (
        <div style={{ marginTop: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '5px' }}>
          <h4 style={{ color: getStatusColor(status.status) }}>
            System Status: {status.status.toUpperCase()}
          </h4>
          <p>{status.message}</p>
          
          <h5>Services:</h5>
          <ul style={{ margin: '10px 0', paddingLeft: '20px' }}>
            {Object.entries(status.services).map(([service, serviceStatus]) => (
              <li key={service} style={{ marginBottom: '5px' }}>
                {getServiceStatusIcon(serviceStatus as string)} {service.replace('_', ' ')}: {serviceStatus as string}
              </li>
            ))}
          </ul>
          
          <div style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
            Last checked: {new Date(status.timestamp).toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
};

// Example 4: Multiple Questions Demo
export const MultipleQuestionsDemo: React.FC = () => {
  const [queries] = useState([
    "Is quinoa good for weight loss?",
    "What supplements help with sleep?",
    "How much protein do I need daily?",
    "What are the benefits of omega-3?"
  ]);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const askAllQuestions = async () => {
    setLoading(true);
    setResults([]);
    
    try {
      for (let i = 0; i < queries.length; i++) {
        setCurrentIndex(i);
        const response = await wihyApiClient.askHealthQuestion(queries[i]);
        setResults(prev => [...prev, { query: queries[i], response }]);
        
        // Small delay between requests to be respectful to the API
        if (i < queries.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
      setCurrentIndex(0);
    }
  };

  return (
    <div className="multiple-questions-demo">
      <h3>Multiple Health Questions Demo</h3>
      <p>Demonstrates asking multiple questions and comparing responses</p>
      
      <div style={{ marginBottom: '15px' }}>
        <h4>Questions to Ask:</h4>
        <ul>
          {queries.map((query, index) => (
            <li key={index} style={{ 
              padding: '5px 0',
              fontWeight: loading && currentIndex === index ? 'bold' : 'normal',
              color: loading && currentIndex === index ? '#007bff' : 'inherit'
            }}>
              {query} {loading && currentIndex === index && '(asking...)'}
            </li>
          ))}
        </ul>
      </div>

      <button onClick={askAllQuestions} disabled={loading}>
        {loading ? `Asking question ${currentIndex + 1}...` : 'Ask All Questions'}
      </button>

      {results.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h4>Results ({results.length}/{queries.length}):</h4>
          
          {results.map((result, index) => (
            <div key={index} style={{ 
              marginBottom: '20px', 
              padding: '15px', 
              border: '1px solid #ddd', 
              borderRadius: '5px' 
            }}>
              <h5 style={{ margin: '0 0 10px 0', color: '#495057' }}>
                Q{index + 1}: {result.query}
              </h5>
              
              {result.response ? (
                <>
                  <p style={{ lineHeight: '1.6', marginBottom: '10px' }}>
                    {result.response.response}
                  </p>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    <span style={{ marginRight: '15px' }}>
                      <strong>Source:</strong> {result.response.source}
                    </span>
                    <span style={{ marginRight: '15px' }}>
                      <strong>Confidence:</strong> {(result.response.confidence * 100).toFixed(1)}%
                    </span>
                    <span>
                      <strong>Type:</strong> {result.response.type}
                    </span>
                  </div>
                </>
              ) : (
                <p style={{ color: '#dc3545', fontStyle: 'italic' }}>
                  Failed to get response
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Example usage in a main component
export const WIHYApiExamplesPage: React.FC = () => {
  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>WIHY API Integration Examples</h1>
      <p>
        These examples demonstrate the core WIHY API functionality using the `/ask` endpoint.
        The API automatically incorporates research when relevant, so no separate research endpoints are needed.
      </p>
      
      <div style={{ marginBottom: '40px' }}>
        <HealthQuestionExample />
      </div>
      
      <div style={{ marginBottom: '40px' }}>
        <HealthQueryWithMetadata />
      </div>
      
      <div style={{ marginBottom: '40px' }}>
        <HealthStatusExample />
      </div>
      
      <div style={{ marginBottom: '40px' }}>
        <MultipleQuestionsDemo />
      </div>
    </div>
  );
};
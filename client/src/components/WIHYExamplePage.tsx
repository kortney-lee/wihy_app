/**
 * WIHY Integration Example Page
 * Demonstrates all WIHY API functionality in a simple page
 */

import React, { useState } from 'react';
import { WIHYChat, WIHYQuestion } from './WIHYChat';
import { useWIHYChat } from '../hooks/useWIHYChat';
import { wihyAPI, QUICK_HEALTH_QUESTIONS } from '../services/wihyClientPure';

const WIHYExamplePage: React.FC = () => {
  const [singleResponse, setSingleResponse] = useState<any>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  // Example content for analysis
  const sampleArticle = `
    New Study: Mediterranean Diet Reduces Heart Disease Risk by 30%
    
    Researchers from Harvard Medical School followed 7,500 participants over 5 years 
    and found that those following a Mediterranean diet rich in olive oil, nuts, fish, 
    and vegetables had significantly lower rates of cardiovascular events.
    
    The study, published in the New England Journal of Medicine, suggests that 
    the anti-inflammatory properties of Mediterranean foods may be the key factor 
    in reducing heart disease risk.
  `;

  const handleAnalyzeContent = async () => {
    try {
      const response = await wihyAPI.analyze(sampleArticle);
      setAnalysisResult(response);
    } catch (error) {
      console.error('Analysis failed:', error);
    }
  };

  const handleQuickQuestion = async (question: string) => {
    try {
      const response = await wihyAPI.ask(question);
      setSingleResponse(response);
    } catch (error) {
      console.error('Question failed:', error);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>🤖 WIHY API Integration Examples</h1>
      
      {/* Full Chat Interface */}
      <section style={{ marginBottom: '40px' }}>
        <h2>1. Full Chat Interface</h2>
        <p>Complete chat experience with conversation history and quick questions:</p>
        <div style={{ 
          border: '1px solid #ddd', 
          borderRadius: '8px', 
          padding: '20px',
          height: '600px',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <WIHYChat 
            showQuickQuestions={true}
            onResponse={(response) => console.log('Chat response:', response)}
          />
        </div>
      </section>

      {/* Quick Questions */}
      <section style={{ marginBottom: '40px' }}>
        <h2>2. Quick Questions</h2>
        <p>Pre-defined health questions for quick answers:</p>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '10px',
          marginBottom: '20px'
        }}>
          {QUICK_HEALTH_QUESTIONS.slice(0, 6).map((question, index) => (
            <button
              key={index}
              onClick={() => handleQuickQuestion(question)}
              style={{
                padding: '10px',
                border: '1px solid #007bff',
                borderRadius: '4px',
                background: 'white',
                color: '#007bff',
                cursor: 'pointer'
              }}
            >
              {question}
            </button>
          ))}
        </div>
        
        {singleResponse && (
          <div style={{ 
            background: '#f8f9fa', 
            padding: '15px', 
            borderRadius: '4px',
            border: '1px solid #dee2e6'
          }}>
            <h4>WIHY Response:</h4>
            <p>{singleResponse.response}</p>
            <small>
              Source: {singleResponse.source} | 
              Confidence: {Math.round(singleResponse.confidence * 100)}% |
              Type: {singleResponse.type}
            </small>
            
            {singleResponse.chart_data?.chart_metadata && (
              <div style={{ marginTop: '10px', padding: '10px', background: '#e8f4fd' }}>
                <strong>📊 Research Data:</strong>
                <div>Quality Score: {singleResponse.chart_data.chart_metadata.research_quality_score}/100</div>
                <div>Evidence Grade: {singleResponse.chart_data.chart_metadata.evidence_grade}</div>
                <div>Studies: {singleResponse.chart_data.chart_metadata.study_count}</div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Research Questions */}
      <section style={{ marginBottom: '40px' }}>
        <h2>3. Research Questions</h2>
        <p>Ask research questions - automatically routed via /ask:</p>
        
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', marginBottom: '15px' }}>
          <button
            onClick={() => handleQuickQuestion("What is the evidence for Mediterranean diet benefits?")}
            style={{
              background: '#17a2b8',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Mediterranean Diet Evidence
          </button>
          
          <button
            onClick={() => handleQuickQuestion("What does research say about intermittent fasting?")}
            style={{
              background: '#17a2b8',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Intermittent Fasting Research
          </button>
        </div>
        
        <p><em>Note: Research questions are automatically routed to the knowledge base via /ask endpoint.</em></p>
      </section>

      {/* Content Analysis */}
      <section style={{ marginBottom: '40px' }}>
        <h2>4. "Analyze with WIHY" Content Analysis</h2>
        <p>Analyze health-related content with WIHY:</p>
        
        <div style={{ 
          background: '#f8f9fa', 
          padding: '15px', 
          borderRadius: '4px',
          border: '1px solid #dee2e6',
          marginBottom: '15px'
        }}>
          <h4>Sample Health Article:</h4>
          <div style={{ whiteSpace: 'pre-line', fontSize: '14px' }}>
            {sampleArticle}
          </div>
        </div>
        
        <button
          onClick={handleAnalyzeContent}
          style={{
            background: '#28a745',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '4px',
            cursor: 'pointer',
            marginBottom: '15px'
          }}
        >
          Analyze with WIHY
        </button>
        
        {analysisResult && (
          <div style={{ 
            background: '#f8f9fa', 
            padding: '15px', 
            borderRadius: '4px',
            border: '1px solid #dee2e6'
          }}>
            <h4>WIHY Analysis:</h4>
            <p>{analysisResult.response}</p>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
              Source: {analysisResult.source} | 
              Confidence: {Math.round(analysisResult.confidence * 100)}% |
              Type: {analysisResult.type}
            </div>
            
            {analysisResult.chart_data?.chart_metadata && (
              <div style={{ marginTop: '10px', padding: '10px', background: '#e8f4fd' }}>
                <strong>📊 Research Analysis:</strong>
                <div>Quality Score: {analysisResult.chart_data.chart_metadata.research_quality_score}/100</div>
                <div>Evidence Grade: {analysisResult.chart_data.chart_metadata.evidence_grade}</div>
                <div>Studies: {analysisResult.chart_data.chart_metadata.study_count}</div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Single Question Component */}
      <section style={{ marginBottom: '40px' }}>
        <h2>5. Single Question Component</h2>
        <p>Individual question components for specific use cases:</p>
        
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          <WIHYQuestion
            question="Is coffee healthy?"
            onResponse={(response) => alert(`WIHY says: ${response.response}`)}
            buttonText="Ask about Coffee"
          />
          
          <WIHYQuestion
            question="What are the benefits of meditation?"
            onResponse={(response) => alert(`WIHY says: ${response.response}`)}
            buttonText="Ask about Meditation"
          />
          
          <WIHYQuestion
            question="How much sleep do I need?"
            onResponse={(response) => alert(`WIHY says: ${response.response}`)}
            buttonText="Ask about Sleep"
          />
        </div>
      </section>

      {/* API Usage Examples */}
      <section>
        <h2>6. Direct API Usage</h2>
        <p>Example code for direct WIHY API integration:</p>
        
        <div style={{ 
          background: '#f8f9fa', 
          padding: '15px', 
          borderRadius: '4px',
          border: '1px solid #dee2e6',
          fontFamily: 'monospace',
          fontSize: '12px',
          whiteSpace: 'pre-wrap'
        }}>
{`// Simple question
import { wihyAPI } from '../services/wihyClientPure';

const response = await wihyAPI.ask("Is quinoa healthy?");
console.log(response.response);

// Analyze content
const analysis = await wihyAPI.analyze("Your health content here");
console.log(analysis.response);

// Research questions (routed via /ask)
const research = await wihyAPI.research("What is the evidence for Mediterranean diet?");
console.log(research.response);

// Get bulk research data for visualizations
const researchData = await wihyAPI.getResearchData("Mediterranean diet");
console.log(researchData.articles);

// Chat with context
const chatResponse = await wihyAPI.chat("Tell me more about protein", "conversation_id");

// One-liner analysis button
import { wihy } from '../utils/analyzeWithWihy';
wihy.addButton(document.getElementById('content'), "Content to analyze");`}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ 
        marginTop: '40px', 
        paddingTop: '20px', 
        borderTop: '1px solid #dee2e6',
        textAlign: 'center',
        color: '#666',
        fontSize: '14px'
      }}>
        <p>
          WIHY API Base URL: <code>https://ml.wihy.ai</code> | 
          Rate Limit: 60 requests per minute per IP | 
          <a href="https://ml.wihy.ai" target="_blank" rel="noopener noreferrer">API Documentation</a>
        </p>
      </footer>
    </div>
  );
};

export default WIHYExamplePage;
/**
 * WIHY API Usage Examples
 * 
 * This file demonstrates how to use the updated WIHY API service
 * with the new comprehensive endpoints and response formats.
 */

import { wihyAPI, AskHealthRequest, CreateChatSessionRequest } from './wihyAPI';

// ============================================================================
// Example 1: Basic Health Question
// ============================================================================

export async function basicHealthQuestion() {
  try {
    const request: AskHealthRequest = {
      query: "Is quinoa good for weight loss?",
      analyse: false
    };

    const response = await wihyAPI.askHealthQuestionV2(request);
    
    console.log('Basic Health Question Response:');
    console.log('Summary:', response.analysis.summary);
    console.log('Recommendations:', response.analysis.recommendations);
    console.log('Confidence:', response.analysis.confidence_score);
    console.log('Processor:', response.analysis.metadata.processor);
    
    return response;
  } catch (error) {
    console.error('Basic health question error:', error);
    throw error;
  }
}

// ============================================================================
// Example 2: Enhanced Analysis with User Context
// ============================================================================

export async function enhancedHealthAnalysis() {
  try {
    const request: AskHealthRequest = {
      query: "What does recent research say about omega-3 supplements for heart health?",
      analyse: true, // Enable enhanced analysis
      user_context: {
        age: 45,
        health_goals: ["heart_health", "longevity"],
        dietary_restrictions: [],
        medical_conditions: ["high_cholesterol"]
      }
    };

    const response = await wihyAPI.askHealthQuestionV2(request);
    
    console.log('Enhanced Health Analysis Response:');
    console.log('Summary:', response.analysis.summary);
    console.log('Recommendations:', response.analysis.recommendations);
    console.log('Research Intent Detected:', response.analysis.metadata.research_intent?.detected);
    
    if (response.analysis.openai_analysis) {
      console.log('Enhanced Summary:', response.analysis.openai_analysis.summary);
      console.log('Related Topics:', response.analysis.openai_analysis.related_topics);
      console.log('Sources:', response.analysis.openai_analysis.sources);
    }
    
    if (response.analysis.charts.nutrition_breakdown) {
      console.log('Nutrition Chart:', response.analysis.charts.nutrition_breakdown);
    }
    
    return response;
  } catch (error) {
    console.error('Enhanced analysis error:', error);
    throw error;
  }
}

// ============================================================================
// Example 3: Chat Session Management
// ============================================================================

export async function chatSessionExample() {
  try {
    // Step 1: Create a chat session
    const sessionRequest: CreateChatSessionRequest = {
      user_id: "user_demo_123",
      session_name: "Weight Loss Journey",
      context: {
        topic: "weight_management",
        user_goals: ["lose_20_pounds", "build_muscle", "improve_energy"],
        priority: "high"
      }
    };

    const session = await wihyAPI.createChatSession(sessionRequest);
    console.log('Chat Session Created:', session);

    // Step 2: Send a message
    const messageResponse = await wihyAPI.sendChatMessage({
      session_id: session.session_id,
      message: "I want to lose weight but I keep craving sugar. What should I do?",
      message_type: "health_chat"
    });

    console.log('Chat Message Response:');
    console.log('Response:', messageResponse.response);
    console.log('Model Used:', messageResponse.model_used);
    console.log('Confidence:', messageResponse.confidence_score);
    console.log('Response Time:', messageResponse.response_time_ms, 'ms');

    return { session, messageResponse };
  } catch (error) {
    console.error('Chat session error:', error);
    throw error;
  }
}

// ============================================================================
// Example 4: System Health Monitoring
// ============================================================================

export async function systemHealthCheck() {
  try {
    // Check API status
    const apiStatus = await wihyAPI.getApiStatus();
    console.log('API Status:', apiStatus);
    console.log('System Status:', apiStatus.status);
    console.log('Available Services:', apiStatus.services);
    console.log('Capabilities:', apiStatus.capabilities);

    // Check detailed health
    const healthCheck = await wihyAPI.getHealthCheck();
    console.log('Health Check:', healthCheck);
    console.log('Overall Health:', healthCheck.status);
    console.log('Service Details:', healthCheck.services);

    return { apiStatus, healthCheck };
  } catch (error) {
    console.error('System health check error:', error);
    throw error;
  }
}

// ============================================================================
// Example 5: Legacy Compatibility
// ============================================================================

export async function legacyApiExample() {
  try {
    // Using the legacy askAnything method (still works)
    const legacyResponse = await wihyAPI.askAnything({
      query: "What are the benefits of green tea?",
      user_context: {
        age: 30,
        dietary_restrictions: ["caffeine_sensitive"]
      }
    });

    console.log('Legacy API Response:');
    const wihyResp = legacyResponse as any; // Type assertion for legacy compatibility
    console.log('Core Principle:', wihyResp.wihy_response?.core_principle || 'Response received');
    console.log('Action Items:', wihyResp.wihy_response?.personalized_analysis?.action_items || []);

    // Format the response for display
    const formattedResponse = wihyAPI.formatWihyResponse(legacyResponse);
    console.log('Formatted Response:', formattedResponse);

    return legacyResponse;
  } catch (error) {
    console.error('Legacy API error:', error);
    throw error;
  }
}

// ============================================================================
// Example 6: Response Formatting and Data Extraction
// ============================================================================

export async function responseFormattingExample() {
  try {
    const response = await wihyAPI.askHealthQuestionV2({
      query: "What are the health benefits of Mediterranean diet?",
      analyse: true
    });

    // Format for display
    const formatted = wihyAPI.formatWihyResponse(response);
    console.log('Formatted Response:', formatted);

    // Extract specific data
    const recommendations = wihyAPI.extractRecommendations(response);
    console.log('Extracted Recommendations:', recommendations);

    const citations = wihyAPI.extractCitations(response);
    console.log('Extracted Citations:', citations);

    return { response, formatted, recommendations, citations };
  } catch (error) {
    console.error('Response formatting error:', error);
    throw error;
  }
}

// ============================================================================
// Comprehensive Test Function
// ============================================================================

export async function runAllExamples() {
  console.log('[ROCKET] Starting WIHY API Examples...\n');

  try {
    console.log('1. Basic Health Question:');
    await basicHealthQuestion();
    console.log('[OK] Basic health question completed\n');

    console.log('2. Enhanced Health Analysis:');
    await enhancedHealthAnalysis();
    console.log('[OK] Enhanced analysis completed\n');

    console.log('3. Chat Session Example:');
    await chatSessionExample();
    console.log('[OK] Chat session completed\n');

    console.log('4. System Health Check:');
    await systemHealthCheck();
    console.log('[OK] System health check completed\n');

    console.log('5. Legacy API Example:');
    await legacyApiExample();
    console.log('[OK] Legacy API example completed\n');

    console.log('6. Response Formatting Example:');
    await responseFormattingExample();
    console.log('[OK] Response formatting completed\n');

    console.log('[PARTY] All WIHY API examples completed successfully!');
  } catch (error) {
    console.error('[X] Error running examples:', error);
  }
}

// Export for individual use
export default {
  basicHealthQuestion,
  enhancedHealthAnalysis,
  chatSessionExample,
  systemHealthCheck,
  legacyApiExample,
  responseFormattingExample,
  runAllExamples
};
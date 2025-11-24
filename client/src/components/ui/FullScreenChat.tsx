import React, { useState, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { chatService } from '../../services/chatService';
import { wihyScanningService } from '../../services/wihyScanningService';
import { visionAnalysisService } from '../../services/visionAnalysisService';
import '../../styles/mobile-fixes.css';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  message: string;
  timestamp: Date;
  imageUrl?: string; // Optional image URL for displaying uploaded images
}

interface FullScreenChatProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
  initialResponse?: string | any; // Allow both string and structured barcode scan data
  onViewCharts?: () => void; // Optional callback for "View Charts" button
  apiResponseData?: any; // Universal Search API response data for chart generation
  onGenerateCharts?: (apiData: any) => void; // Callback to generate charts from API data
}

// Add interface for ref methods
export interface FullScreenChatRef {
  addMessage: (userMessage: string, assistantMessage: string | any) => void;
}

const FullScreenChat = forwardRef<FullScreenChatRef, FullScreenChatProps>(({
  isOpen,
  onClose,
  initialQuery,
  initialResponse,
  onViewCharts,
  apiResponseData,
  onGenerateCharts
}, ref) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showMobileHistory, setShowMobileHistory] = useState(false);
  const [showDesktopHistory, setShowDesktopHistory] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [hasActiveSession, setHasActiveSession] = useState(false);
  const [hasChartData, setHasChartData] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Check for mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Check for active session when component opens
  useEffect(() => {
    if (isOpen) {
      const sessionId = chatService.getCurrentSessionId();
      const conversationId = chatService.getConversationId();
      // Only consider it an active session if there's a session ID or conversation ID
      // indicating there's been previous chat interaction
      setHasActiveSession(Boolean(sessionId || conversationId));
      
      // Check if we have chart data from API response or initial response
      setHasChartData(Boolean(apiResponseData || (
        typeof initialResponse === 'object' && 
        initialResponse && 
        (initialResponse.success || initialResponse.type === 'barcode_analysis')
      )));
      
      console.log('🔍 FULL SCREEN CHAT: Session check:', {
        hasSessionId: Boolean(sessionId),
        hasConversationId: Boolean(conversationId),
        hasActiveSession: Boolean(sessionId || conversationId),
        hasChartData: Boolean(apiResponseData || (typeof initialResponse === 'object' && initialResponse))
      });
    }
  }, [isOpen, apiResponseData, initialResponse]);

  // Handle paste for images
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          e.preventDefault();
          const blob = items[i].getAsFile();
          if (blob && !isLoading) {
            await processImageFile(blob);
          }
          break;
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [isOpen, isLoading]);

  // Handle drag and drop for images
  useEffect(() => {
    if (!isOpen) return;

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDrop = async (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      const files = e.dataTransfer?.files;
      if (!files?.length) return;
      
      const imageFile = Array.from(files).find(f => f.type.startsWith('image/'));
      if (imageFile && !isLoading) {
        await processImageFile(imageFile);
      }
    };

    document.addEventListener('dragover', handleDragOver);
    document.addEventListener('drop', handleDrop);
    
    return () => {
      document.removeEventListener('dragover', handleDragOver);
      document.removeEventListener('drop', handleDrop);
    };
  }, [isOpen, isLoading]);

  // Process uploaded/pasted image file
  const processImageFile = async (file: File) => {
    setIsLoading(true);
    
    try {
      // Create object URL for display
      const imageUrl = URL.createObjectURL(file);
      
      // Add user message with image
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'user',
        message: `Uploaded image: ${file.name}`,
        timestamp: new Date(),
        imageUrl: imageUrl
      };
      setMessages(prev => [...prev, userMessage]);
      
      // Try API analysis first
      const connectionTest = await wihyScanningService.testConnection();
      let analysisResult;
      
      if (connectionTest.available) {
        analysisResult = await wihyScanningService.scanImage(file, {
          health_goals: ['nutrition_analysis', 'health_insights'],
          dietary_restrictions: []
        });
      } else {
        // Fallback to vision analysis
        analysisResult = await visionAnalysisService.analyzeImage(file);
      }
      
      // Format response
      let responseMessage = '';
      if (analysisResult.success) {
        if (analysisResult.analysis) {
          responseMessage = wihyScanningService.formatScanResult(analysisResult);
        } else if (analysisResult.data) {
          responseMessage = visionAnalysisService.formatForDisplay(analysisResult);
          responseMessage += '\n\n⚠️ Note: Using basic vision analysis.';
        }
      } else {
        responseMessage = 'Unable to analyze the image. Please try again.';
      }
      
      // Add assistant message
      const assistantMessage: ChatMessage = {
        id: Date.now().toString() + '-assistant',
        type: 'assistant',
        message: responseMessage,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
      
    } catch (error) {
      console.error('Image processing error:', error);
      const errorMessage: ChatMessage = {
        id: Date.now().toString() + '-assistant',
        type: 'assistant',
        message: 'Failed to process the image. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    addMessage: (userMessage: string, assistantMessage: string | any) => {
      // Extract image URL if present in the response
      let userImageUrl: string | undefined;
      if (typeof assistantMessage === 'object' && assistantMessage !== null) {
        userImageUrl = assistantMessage.imageUrl || assistantMessage.data?.imageUrl;
      }
      
      const userMsg: ChatMessage = {
        id: Date.now().toString(),
        type: 'user',
        message: userMessage,
        timestamp: new Date(),
        imageUrl: userImageUrl
      };
      
      // Handle both simple strings and Universal Search response objects
      let formattedMessage: string;
      
      if (typeof assistantMessage === 'string') {
        formattedMessage = assistantMessage;
      } else if (assistantMessage && typeof assistantMessage === 'object') {
        // Handle different response types based on type field
        if (assistantMessage.type === 'universal_search' && assistantMessage.summary) {
          // Format Universal Search response for chat display
          formattedMessage = assistantMessage.summary;
          
          // Add key findings if available
          if (assistantMessage.key_findings && assistantMessage.key_findings.length > 0) {
            formattedMessage += '\n\n**Key Findings:**\n';
            assistantMessage.key_findings.forEach((finding: string) => {
              formattedMessage += `• ${finding}\n`;
            });
          }
          
          // Add recommendations if available
          if (assistantMessage.recommendations && assistantMessage.recommendations.length > 0) {
            formattedMessage += '\n\n**Recommendations:**\n';
            assistantMessage.recommendations.forEach((rec: string) => {
              formattedMessage += `• ${rec}\n`;
            });
          }
          
          // Add evidence quality if available
          if (assistantMessage.evidence_strength) {
            formattedMessage += `\n\n**Evidence Quality:** ${assistantMessage.evidence_strength.overall_quality}`;
          }
          
          // Add confidence score if available
          if (assistantMessage.confidence) {
            formattedMessage += `\n**Confidence:** ${Math.round(assistantMessage.confidence * 100)}%`;
          }

          // Store API response data for chart generation
          if (onGenerateCharts && assistantMessage.results) {
            onGenerateCharts(assistantMessage);
          }
        } else if (assistantMessage.type === 'legacy_search' || assistantMessage.type === 'cached_search') {
          // Handle legacy/cached search responses
          formattedMessage = assistantMessage.summary || 'Search results received';
          
          // Add recommendations if available
          if (assistantMessage.recommendations && assistantMessage.recommendations.length > 0) {
            formattedMessage += '\n\n**Recommendations:**\n';
            assistantMessage.recommendations.forEach((rec: string) => {
              formattedMessage += `• ${rec}\n`;
            });
          }
          
          // Add sources if available
          if (assistantMessage.sources && assistantMessage.sources.length > 0) {
            formattedMessage += '\n\n**Sources:**\n';
            assistantMessage.sources.forEach((source: string) => {
              formattedMessage += `• ${source}\n`;
            });
          }
          
          // Add data source indicator
          if (assistantMessage.type === 'cached_search') {
            formattedMessage += '\n\n*Results from cache*';
          }
        } else if (
          assistantMessage.type === 'image_analysis' ||
          assistantMessage.type === 'vision_analysis' ||
          assistantMessage.type === 'barcode_scan' ||
          assistantMessage.type === 'product_search'
        ) {
          // Handle image/vision analysis types
          formattedMessage = assistantMessage.summary || 'Analysis completed';
        } else {
          // Fallback for other object types
          formattedMessage = JSON.stringify(assistantMessage, null, 2);
        }
      } else {
        formattedMessage = 'Response received';
      }
      
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        message: formattedMessage,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, userMsg, assistantMsg]);
      console.log('🔍 FULL SCREEN CHAT: Added messages via ref:', {
        userMessage: userMessage.substring(0, 50) + '...',
        assistantMessage: formattedMessage.substring(0, 50) + '...',
        messageType: typeof assistantMessage
      });
    }
  }), []);

  // Initialize with provided query/response
  useEffect(() => {
    if (initialQuery && initialResponse) {
      let responseMessage: string;
      let userQueryMessage = initialQuery;
      let userImageUrl: string | undefined;
      
      // Extract userQuery and image data from response if available (check ALL object types)
      if (typeof initialResponse === 'object') {
        if (initialResponse.userQuery) {
          userQueryMessage = initialResponse.userQuery;
          console.log('🔍 FULL SCREEN CHAT: Extracted userQuery:', userQueryMessage);
        }
        
        // Extract image URL if available (from vision analysis or image analysis)
        if (initialResponse.data?.imageUrl) {
          userImageUrl = initialResponse.data.imageUrl;
        } else if (initialResponse.imageUrl) {
          userImageUrl = initialResponse.imageUrl;
        }
      }
      
      // Handle Universal Search API response format or structured barcode scan data
      if (typeof initialResponse === 'object' && (
          initialResponse.type === 'barcode_analysis' || 
          initialResponse.type === 'vision_analysis' ||
          initialResponse.type === 'image_analysis' ||
          initialResponse.type === 'barcode_scan' ||
          initialResponse.type === 'product_search' ||
          initialResponse.detected_type === 'barcode' ||
          (initialResponse.success && initialResponse.results)
      )) {
        
        // Handle vision_analysis, image_analysis, barcode_scan, product_search types FIRST
        // (prioritize these simple types before complex parsing)
        if ((initialResponse.type === 'vision_analysis' || 
             initialResponse.type === 'image_analysis' ||
             initialResponse.type === 'barcode_scan' ||
             initialResponse.type === 'product_search') && 
            initialResponse.summary) {
          // Use the summary directly from these response types
          responseMessage = initialResponse.summary;
        }
        // Handle legacy barcode analysis format
        else if (initialResponse.type === 'barcode_analysis') {
          const barcodeData = initialResponse.data;
          
          // Format the comprehensive analysis for display
          responseMessage = `**${barcodeData.product_info?.name || 'Product'} Analysis**\n\n`;
          
          if (barcodeData.analysis?.summary) {
            responseMessage += `${barcodeData.analysis.summary}\n\n`;
          }
          
          if (barcodeData.health_score) {
            responseMessage += `**Health Score:** ${barcodeData.health_score}/100\n`;
          }
          
          if (barcodeData.nova_group) {
            responseMessage += `**Processing Level:** NOVA Group ${barcodeData.nova_group}\n\n`;
          }
          
          if (barcodeData.analysis?.recommendations?.length > 0) {
            responseMessage += `**Recommendations:**\n`;
            barcodeData.analysis.recommendations.forEach((rec: string) => {
              responseMessage += `• ${rec}\n`;
            });
            responseMessage += '\n';
          }
          
          if (barcodeData.nutrition_facts) {
            const nutrition = barcodeData.nutrition_facts;
            responseMessage += `**Nutrition Facts (per ${nutrition.serving_size || '100g'}):**\n`;
            responseMessage += `• Calories: ${nutrition.calories}\n`;
            responseMessage += `• Protein: ${nutrition.protein_g}g\n`;
            responseMessage += `• Carbohydrates: ${nutrition.carbohydrates_g}g\n`;
            responseMessage += `• Fat: ${nutrition.fat_g}g\n`;
            if (nutrition.fiber_g > 0) responseMessage += `• Fiber: ${nutrition.fiber_g}g\n`;
            if (nutrition.sugar_g > 0) responseMessage += `• Sugar: ${nutrition.sugar_g}g\n`;
            if (nutrition.sodium_mg > 0) responseMessage += `• Sodium: ${nutrition.sodium_mg}mg\n`;
          }
        } 
        // Handle Universal Search API format
        else if (initialResponse.success && initialResponse.results) {
          const results = initialResponse.results;
          const metadata = results.metadata;
          
          responseMessage = `**${metadata?.product_name || 'Product'} Analysis**\n\n`;
          
          if (results.summary) {
            responseMessage += `${results.summary}\n\n`;
          }
          
          if (metadata?.health_score) {
            responseMessage += `**Health Score:** ${metadata.health_score}/100 (${metadata.grade})\n`;
          }
          
          if (metadata?.nova_group) {
            responseMessage += `**Processing Level:** NOVA Group ${metadata.nova_group} - ${metadata.processing_level}\n\n`;
          }
          
          if (initialResponse.recommendations?.length > 0) {
            responseMessage += `**Recommendations:**\n`;
            initialResponse.recommendations.forEach((rec: string) => {
              responseMessage += `• ${rec}\n`;
            });
            responseMessage += '\n';
          }
          
          if (metadata?.nutrition_facts) {
            const nutrition = metadata.nutrition_facts;
            responseMessage += `**Nutrition Facts (per 100g):**\n`;
            responseMessage += `• Calories: ${nutrition.calories}\n`;
            responseMessage += `• Protein: ${nutrition.protein}g\n`;
            responseMessage += `• Carbohydrates: ${nutrition.carbohydrates}g\n`;
            responseMessage += `• Fat: ${nutrition.fat}g\n`;
            if (nutrition.fiber > 0) responseMessage += `• Fiber: ${nutrition.fiber}g\n`;
            if (nutrition.sugars > 0) responseMessage += `• Sugars: ${nutrition.sugars}g\n`;
            if (nutrition.sodium > 0) responseMessage += `• Sodium: ${nutrition.sodium}mg\n`;
          }

          // Store the Universal Search API response for chart generation
          if (onGenerateCharts) {
            onGenerateCharts(initialResponse);
          }
          
          // Update chart availability indicator
          setHasChartData(true);
        }
        // Fallback for any other type with summary
        else if (initialResponse.summary) {
          responseMessage = initialResponse.summary;
        } else {
          // No recognizable format, stringify
          responseMessage = JSON.stringify(initialResponse, null, 2);
        }
      } else {
        // Handle traditional string response
        responseMessage = typeof initialResponse === 'string' ? initialResponse : JSON.stringify(initialResponse);
      }
      
      const initialMessages: ChatMessage[] = [
        {
          id: '1',
          type: 'user',
          message: userQueryMessage,
          timestamp: new Date(),
          imageUrl: userImageUrl
        },
        {
          id: '2',
          type: 'assistant',
          message: responseMessage,
          timestamp: new Date()
        }
      ];
      setMessages(initialMessages);
      console.log('🔍 FULL SCREEN CHAT: Initialized messages:', {
        userQuery: userQueryMessage,
        responseType: typeof initialResponse === 'object' ? initialResponse.type : 'string',
        hasUserQuery: Boolean(typeof initialResponse === 'object' && initialResponse.userQuery),
        messageCount: initialMessages.length
      });
    }
  }, [initialQuery, initialResponse]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const messageText = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      message: messageText,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      // Get AI response using the updated API
      const response = await chatService.sendMessage(messageText);
      
      let aiResponse: string;
      let metadata: any = {};
      
      // Handle the new API response structure
      if (response && typeof response === 'object') {
        // Check if it's Universal Search API response
        if ('success' in response && 'results' in response && response.success) {
          const universalResp = response as any;
          aiResponse = universalResp.results?.summary || 'Analysis completed successfully.';
          
          // Add rich formatting for Universal Search responses
          if (universalResp.results?.metadata) {
            const meta = universalResp.results.metadata;
            aiResponse += `\n\n**Product:** ${meta.product_name || 'Unknown'}`;
            if (meta.health_score) {
              aiResponse += `\n**Health Score:** ${meta.health_score}/100 (${meta.grade})`;
            }
            if (meta.nova_group) {
              aiResponse += `\n**Processing Level:** NOVA ${meta.nova_group} - ${meta.processing_level}`;
            }
          }
          
          if (universalResp.recommendations?.length > 0) {
            aiResponse += '\n\n**Recommendations:**\n';
            universalResp.recommendations.forEach((rec: string) => {
              aiResponse += `• ${rec}\n`;
            });
          }
          
          // Trigger chart generation if callback is available
          if (onGenerateCharts) {
            onGenerateCharts(universalResp);
          }
          
          // Update chart data availability
          setHasChartData(true);
          
          metadata = {
            type: universalResp.detected_type || 'universal_search',
            source: 'universal_search_api',
            confidence: universalResp.results?.confidence_score || 0,
            processing_time: universalResp.processing_time_ms || 0
          };
        }
        // Check if it's the /ask endpoint ChatResponse format
        else if ('response' in response && 'type' in response && 'source' in response) {
          const chatResp = response as any;
          aiResponse = chatResp.response;
          
          // Check if the /ask response contains Universal Search data
          if (chatResp.data && typeof chatResp.data === 'object' && chatResp.data.success) {
            // The /ask endpoint returned Universal Search data
            const universalData = chatResp.data;
            
            // Enhance the response with structured data if available
            if (universalData.results?.metadata) {
              const meta = universalData.results.metadata;
              if (meta.product_name && !aiResponse.includes(meta.product_name)) {
                aiResponse += `\n\n**Product:** ${meta.product_name}`;
              }
              if (meta.health_score && !aiResponse.includes('Health Score')) {
                aiResponse += `\n**Health Score:** ${meta.health_score}/100 (${meta.grade})`;
              }
              if (meta.nova_group && !aiResponse.includes('NOVA')) {
                aiResponse += `\n**Processing Level:** NOVA ${meta.nova_group} - ${meta.processing_level}`;
              }
            }
            
            if (universalData.recommendations?.length > 0 && !aiResponse.includes('Recommendations:')) {
              aiResponse += '\n\n**Recommendations:**\n';
              universalData.recommendations.forEach((rec: string) => {
                aiResponse += `• ${rec}\n`;
              });
            }
            
            // Trigger chart generation with the embedded Universal Search data
            if (onGenerateCharts) {
              onGenerateCharts(universalData);
            }
            
            // Update chart availability
            setHasChartData(true);
          }
          // Check if response contains chartable information (keywords that suggest data)
          else if (aiResponse && (
            aiResponse.toLowerCase().includes('nutrition') ||
            aiResponse.toLowerCase().includes('health score') ||
            aiResponse.toLowerCase().includes('calories') ||
            aiResponse.toLowerCase().includes('protein') ||
            aiResponse.toLowerCase().includes('research') ||
            aiResponse.toLowerCase().includes('study')
          )) {
            // Response contains health/nutrition content but no structured data
            // Set minimal chart availability for text-based responses
            setHasChartData(false); // No structured data for charts
          }
          
          metadata = {
            type: chatResp.type || 'ask_endpoint',
            source: chatResp.source || 'ask_api',
            confidence: chatResp.confidence || 0,
            processing_time: chatResp.processing_time || 0
          };
          console.log('🔍 FULL SCREEN CHAT: Ask endpoint response:', {
            hasUniversalData: Boolean(chatResp.data?.success),
            responseLength: aiResponse.length,
            metadata
          });
        } else if ('data' in response && typeof response.data === 'string') {
          aiResponse = response.data;
        } else if ('analysis' in response && typeof response.analysis === 'string') {
          aiResponse = response.analysis;
        } else if ('message' in response && typeof response.message === 'string') {
          aiResponse = response.message;
        } else if ('response' in response && typeof response.response === 'string') {
          aiResponse = response.response;
        } else {
          aiResponse = 'I received your message but had trouble formatting the response. Could you try asking in a different way?';
        }
      } else if (typeof response === 'string') {
        aiResponse = response;
      } else {
        aiResponse = 'I apologize, but I encountered an issue processing your request. Could you please try again?';
      }

      // Provide helpful health responses for demo
      if (aiResponse.length < 20 || aiResponse.includes('There is no cure')) {
        const userQuery = messageText.toLowerCase();
        if (userQuery.includes('healthy') || userQuery.includes('health')) {
          aiResponse = "Great question about health! Being healthy generally involves maintaining a balanced diet, regular exercise, adequate sleep, and managing stress. What specific aspect of health would you like to explore?";
        } else if (userQuery.includes('diet') || userQuery.includes('nutrition') || userQuery.includes('eat')) {
          aiResponse = "Nutrition is key to good health! A balanced diet with plenty of fruits, vegetables, whole grains, and lean proteins is important. Would you like tips on any specific dietary concerns?";
        } else if (userQuery.includes('exercise') || userQuery.includes('fitness')) {
          aiResponse = "Regular physical activity is essential for health! Aim for at least 150 minutes of moderate exercise per week. What type of activities interest you?";
        } else {
          aiResponse = "I'm here to help with your health questions! What would you like to know about nutrition, exercise, or wellness?";
        }
      }

      const aiMessage: ChatMessage = {
        id: Date.now().toString() + '-assistant',
        type: 'assistant',
        message: aiResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);

      // After first successful message exchange, we now have an active session
      if (!hasActiveSession) {
        setHasActiveSession(true);
        console.log('🔍 FULL SCREEN CHAT: Session now active after first message exchange');
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: ChatMessage = {
        id: Date.now().toString() + '-assistant',
        type: 'assistant',
        message: "I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  // Determine if we should show chat history (only if there's an active session with history)
  const shouldShowHistory = hasActiveSession && (messages.length > 0 || (initialQuery && initialResponse));

  return (
    <>
      {/* Backdrop overlay for both mobile and desktop */}
      <div 
        className={`fixed inset-0 bg-black/50 z-[9999] transition-opacity duration-300 ease-in-out ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose} 
      />

      <div 
        className={`fullscreen-chat-container fixed inset-0 ${
          isMobile ? 'w-screen h-screen' : 'w-auto h-auto'
        } bg-white z-[10000] flex flex-col font-sans overflow-hidden transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >

      {/* Chat History Sidebar - show when explicitly toggled */}
      {((isMobile && showMobileHistory) || (!isMobile && showDesktopHistory)) && (
        <div className={`${
          isMobile ? 'w-full' : 'w-70'
        } h-full bg-slate-50 border-r border-gray-200 flex flex-col overflow-hidden absolute top-0 left-0 ${
          isMobile ? 'z-[100]' : 'z-[105]'
        }`}>
        {/* Sidebar Header */}
        <div className="p-5 px-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="m-0 text-base font-semibold text-gray-800">
            Chat History
          </h2>
          <button
            onClick={() => {
              if (isMobile) {
                setShowMobileHistory(false);
              } else {
                setShowDesktopHistory(false);
              }
            }}
            className="bg-transparent border-none cursor-pointer p-2 text-base text-gray-500 hover:text-gray-700"
            title="Close History"
          >
            ✕
          </button>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-hidden">
          <div className="p-2 h-full overflow-y-auto overflow-x-hidden">
            {/* Current Chat */}
            {shouldShowHistory ? (
              <div className="p-3 mb-2 bg-white rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors duration-200">
                <div className="text-sm font-medium text-gray-800 mb-1 overflow-hidden text-ellipsis whitespace-nowrap">
                  {initialQuery || 'Current Chat'}
                </div>
                <div className="text-xs text-gray-500">
                  Active now
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-5">
                <div className="text-base font-medium text-gray-700 mb-2">
                  No Chat History
                </div>
                <div className="text-sm text-gray-500 leading-6">
                  Create an account or login to start tracking your chat history
                </div>
              </div>
            )}

            {/* Previous Chats */}
            {shouldShowHistory && ['Health and nutrition basics', 'Exercise routine planning', 'Sleep optimization tips', 'Stress management techniques'].map((chat, index) => (
              <div 
                key={index} 
                className="p-3 mb-2 rounded-lg cursor-pointer transition-colors duration-200 hover:bg-gray-100"
              >
                <div className="text-sm text-gray-700 mb-1 overflow-hidden text-ellipsis whitespace-nowrap">
                  {chat}
                </div>
                <div className="text-xs text-gray-400">
                  {index + 1} days ago
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">

        {/* Top Navigation Bar with Toggle History and View Charts */}
        <div className="flex items-center justify-between px-3 py-2 bg-slate-50 min-h-[40px]">
          {/* Left side - Toggle History Button */}
          <button
            onClick={() => {
              if (isMobile) {
                setShowMobileHistory(!showMobileHistory);
              } else {
                setShowDesktopHistory(!showDesktopHistory);
              }
            }}
            className="bg-transparent border-none cursor-pointer p-1 text-2xl hover:text-gray-600 transition-colors duration-200"
            title="Toggle History"
          >
            ☰
          </button>

          {/* Right side - View Charts Button */}
          {onViewCharts && (
            <div className="relative">
              <button
                onClick={() => {
                  if (hasChartData) {
                    onViewCharts();
                  } else {
                    onClose(); // Navigate back to search screen when no chart data
                  }
                }}
                title={hasChartData ? "View Interactive Charts" : "Back to Search Screen"}
                className={`chat-icon-button bg-transparent border-none cursor-pointer p-1 rounded transition-all duration-200 flex items-center justify-center ${
                  hasChartData ? 'opacity-100' : 'opacity-70'
                } hover:opacity-90`}
              >
                <img 
                  src="/assets/Chartlogo.png" 
                  alt="View Charts"
                  className="w-16 h-16 object-contain"
                />
              </button>
              
              {/* Chart availability indicator */}
              {hasChartData && (
                <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white shadow-sm" />
              )}
              
              {/* Back indicator - clickable to return to search */}
              {!hasChartData && (
                <div className="absolute -bottom-0.5 right-2 text-[9px] text-gray-500 font-medium text-center">
                  ← Back
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Header */}
        <div className={`flex items-center justify-between ${
          isMobile ? 'px-4 py-2' : 'px-6 py-3'
        } border-b border-gray-200 bg-white flex-shrink-0`}>
          <div className="flex items-center gap-3 w-fit">
            <h1 className={`m-0 ${
              isMobile ? 'text-base' : 'text-lg'
            } font-semibold text-gray-800 whitespace-nowrap`}>
              Ask WiHY{' '}
              <span className={`${
                isMobile ? 'text-xs' : 'text-sm'
              } font-medium text-gray-500`}>
                (pro·nounced why)
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Header actions can be added here if needed */}
          </div>
        </div>

        {/* Messages Container - Single scroll area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className={`flex-1 overflow-y-auto overflow-x-hidden ${
            isMobile ? 'p-4' : 'p-6'
          } max-w-full ${isMobile ? '' : 'md:max-w-3xl'} mx-auto w-full scroll-smooth`}>
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[60vh] text-center text-gray-500">
                <div className={`${
                  isMobile ? 'w-12 h-12 text-xl' : 'w-16 h-16 text-2xl'
                } rounded-2xl bg-gray-100 flex items-center justify-center mb-4`}>
                  💬
                </div>
                <h3 className={`${
                  isMobile ? 'text-lg' : 'text-xl'
                } font-semibold text-gray-800 m-0 mb-2`}>
                  How can I help you today?
                </h3>
                <p className={`${
                  isMobile ? 'text-sm max-w-[300px]' : 'text-base max-w-sm'
                } m-0`}>
                  Ask me anything about health, nutrition, exercise, or wellness. I'm here to provide evidence-based guidance.
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    isMobile ? 'gap-3 mb-4' : 'gap-4 mb-6'
                  } items-start`}
                >
                  <div className={`${
                    isMobile ? 'w-7 h-7 text-xs' : 'w-8 h-8 text-sm'
                  } rounded-full ${
                    message.type === 'user' ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-500'
                  } flex items-center justify-center font-bold flex-shrink-0`}>
                    {message.type === 'user' ? 'U' : (
                      <img
                        src="/assets/wihyfavicon.png"
                        alt="WiHy"
                        className={`${
                          isMobile ? 'w-4 h-4' : 'w-5 h-5'
                        } rounded`}
                      />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    {/* Display image if available (for uploaded images) */}
                    {message.imageUrl && (
                      <div className={`${
                        isMobile ? 'mb-3' : 'mb-4'
                      }`}>
                        <img
                          src={message.imageUrl}
                          alt="Uploaded"
                          className="w-full max-w-md h-auto object-cover rounded-lg"
                          style={{ maxHeight: isMobile ? '200px' : '300px' }}
                        />
                      </div>
                    )}
                    
                    <div className={`${
                      isMobile ? 'text-sm' : 'text-base'
                    } leading-relaxed text-gray-800 whitespace-pre-wrap break-words`}>
                      {message.message}
                    </div>
                    <div className="text-xs text-gray-400 mt-2">
                      {formatTime(message.timestamp)}
                    </div>
                  </div>
                </div>
              ))
            )}

            {isLoading && (
              <div className={`flex ${
                isMobile ? 'gap-3 mb-4' : 'gap-4 mb-6'
              } items-start`}>
                <div className={`${
                  isMobile ? 'w-7 h-7' : 'w-8 h-8'
                } rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0`}>
                  <img
                    src="/assets/wihyfavicon.png"
                    alt="WiHy"
                    className={`${
                      isMobile ? 'w-4 h-4' : 'w-5 h-5'
                    } rounded`}
                  />
                </div>
                
                <div className={`flex gap-1 items-center ${
                  isMobile ? 'px-3 py-2' : 'px-4 py-3'
                } bg-gray-50 rounded-xl`}>
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-typing" />
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-typing [animation-delay:0.2s]" />
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-typing [animation-delay:0.4s]" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input */}
        <div className={`border-t border-gray-200 bg-white flex-shrink-0 ${
          isMobile ? 'px-4 py-3' : 'px-6 py-4'
        }`}>
          <div className={`${
            isMobile ? 'max-w-full' : 'max-w-3xl'
          } mx-auto`}>
            <div className="relative flex items-center gap-2">
              <div className="search-input-container chat-input-container">
                <textarea
                  ref={inputRef}
                  className="search-input"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={isLoading ? "Processing..." : "Ask about your health data..."}
                  rows={1}
                  disabled={isLoading}
                />
              </div>
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className={`send-button ${(!inputMessage.trim() || isLoading) ? 'disabled' : 'active'}`}
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg 
                    width="20" 
                    height="20" 
                    viewBox="0 0 24 24" 
                    fill="currentColor"
                  >
                    <path d="M8.59 16.59L13.17 12L8.59 7.41L10 6l6 6-6 6-1.41-1.41z"/>
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        /* Hide scrollbars completely for a cleaner look */
        div::-webkit-scrollbar {
          width: 0px;
          background: transparent;
        }

        div::-webkit-scrollbar-thumb {
          background: transparent;
        }

        /* For Firefox */
        div {
          scrollbar-width: none;
        }



        /* Chat input container - Simple solid styling for chat */
        .chat-input-container {
          width: 100% !important; /* Override the 80% width for chat context */
          margin: 0 !important; /* Override auto margins for flexbox */
          flex: 1; /* Allow it to grow in flexbox */
          /* Override animated styles with solid styling */
          background: #ffffff !important;
          border: 2px solid #fa5f06 !important;
          border-radius: 28px !important;
          box-shadow: 0 2px 8px rgba(250, 95, 6, 0.1) !important;
          animation: none !important;
          padding: 4px;
        }

        .chat-input-container:focus-within {
          box-shadow: 0 4px 16px rgba(250, 95, 6, 0.25);
          border-color: #fa5f06;
        }

        /* Chat input overrides */
        .chat-input-container .search-input {
          width: 100%;
          min-height: ${isMobile ? '52px' : '60px'};
          max-height: ${isMobile ? '120px' : '140px'};
          padding: ${isMobile ? '16px 20px' : '18px 24px'};
          border: none;
          border-radius: 24px;
          font-size: ${isMobile ? '16px' : '18px'};
          line-height: 1.4;
          resize: none;
          outline: none;
          font-family: inherit;
          background-color: #ffffff !important; /* Ensure pure white background */
          color: #1f2937;
        }

        .chat-input-container .search-input:disabled {
          background-color: #f9fafb;
          color: #9ca3af;
        }

        /* Send button styling - positioned outside input, matching ChatWidget exactly */
        .send-button {
          position: relative;
          right: auto;
          top: auto;
          transform: none;
          color: #374151;
          border: none;
          border-radius: 16px;
          padding: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          flex-shrink: 0;
          min-width: 44px;
          height: 44px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .send-button.active {
          background-color: #d1d5db;
          color: #374151;
          cursor: pointer;
        }

        .send-button.active:hover {
          background-color: #9ca3af;
          color: white;
        }

        .send-button.disabled {
          background-color: #e5e7eb;
          color: #9ca3af;
          cursor: not-allowed;
          box-shadow: none;
        }
      `}</style>
    </div>
    </>
  );
});

export default FullScreenChat;
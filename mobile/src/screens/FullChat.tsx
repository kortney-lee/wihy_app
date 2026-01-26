import React, { useState, useRef, useEffect, useCallback, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Platform,
  KeyboardAvoidingView,
  Alert,
  Animated,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '../components/shared';
import type { CompositeNavigationProp, RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { TabParamList, RootStackParamList } from '../types/navigation';
import { GradientDashboardHeader, DASHBOARD_GRADIENTS, WebPageWrapper } from '../components/shared';
import { chatService } from '../services/chatService';
import { AuthContext } from '../context/AuthContext';
import type { CreatedResource, SuggestedAction } from '../services/types';

const isWeb = Platform.OS === 'web';

type NavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Chat'>,
  StackNavigationProp<RootStackParamList>
>;

type RouteProps = RouteProp<TabParamList, 'Chat'>;

// Helper function to clean AI response text
const cleanResponseText = (text: string): string => {
  if (!text) return '';
  
  // Remove "Source:" lines and everything after
  let cleaned = text.replace(/\n*Source:.*$/s, '').trim();
  
  // Also remove standalone source references
  cleaned = cleaned.replace(/\s*Source:.*$/gm, '').trim();
  
  return cleaned;
};

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  imageUri?: string;
  createdResources?: CreatedResource[];
  suggestedActions?: SuggestedAction[];
  followUpSuggestions?: string[];
  clarifyingQuestions?: string[];
  suggestedSearches?: string[];
}

export default function FullChat() {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProp>();
  const scrollViewRef = useRef<ScrollView>(null);
  const messagesEndRef = useRef<View>(null);
  const insets = useSafeAreaInsets();
  const { user } = useContext(AuthContext);

  // Get user ID for session management
  const userId = user?.id || `guest_${Date.now()}`;

  // Safely extract route params
  const routeParams = route?.params || {};
  const { context, initialMessage } = routeParams;

  const bottomInset = insets.bottom || 0;

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [initialMessageSent, setInitialMessageSent] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isInitializingSession, setIsInitializingSession] = useState(false);
  
  // Track the last processed initialMessage to detect new ones
  const lastProcessedMessage = useRef<string | null>(null);
  
  // Reset initialMessageSent when a new initialMessage comes in
  useEffect(() => {
    if (initialMessage && initialMessage !== lastProcessedMessage.current) {
      setInitialMessageSent(false);
    }
  }, [initialMessage]);
  
  // Determine if this is a guided flow (from Home screen) or conversation flow (from Chat tab)
  // Guided flow uses /api/chat/public/ask endpoint, conversation flow uses /api/chat/send-message
  const isGuidedFlow = context?.type === 'search' || context?.type === 'verify';

  // Check if nutrition facts are available in context
  const hasNutritionFacts = !!(context?.product || context?.nutrition || context?.foodItem || context?.nutritionData);

  // Get dynamic header title based on context
  const getHeaderTitle = () => {
    if (!context?.type) return 'Ask WiHY';
    switch (context.type) {
      case 'search':
      case 'verify':
        return 'Ask WiHY';
      case 'nutrition-analysis':
        return 'Nutrition Analysis';
      case 'workout':
        return 'Workout Coach';
      case 'hydration':
        return 'Hydration Tracker';
      case 'education':
        return 'Health Education';
      case 'analysis':
        return 'Health Analysis';
      default:
        return 'Ask WiHY';
    }
  };

  // Typing animation refs
  const dot1Anim = useRef(new Animated.Value(0.3)).current;
  const dot2Anim = useRef(new Animated.Value(0.3)).current;
  const dot3Anim = useRef(new Animated.Value(0.3)).current;

  // Initialize chat session - only for conversation flow (Chat tab)
  // Guided flow (Home screen) uses public/ask which is stateless
  const initializeSession = useCallback(async () => {
    if (sessionId || isInitializingSession || isGuidedFlow) return;
    
    setIsInitializingSession(true);
    try {
      const session = await chatService.startSession(userId);
      if (session) {
        setSessionId(session.session_id);
        console.log('Chat session initialized:', session.session_id);
      }
    } catch (error) {
      console.error('Failed to create chat session:', error);
    } finally {
      setIsInitializingSession(false);
    }
  }, [sessionId, isInitializingSession, isGuidedFlow]);

  // Initialize messages and session on mount
  useEffect(() => {
    // For guided flow (Home screen), don't show a fake initial message
    // The initialMessage will trigger an API call and show the real response
    if (!isGuidedFlow) {
      // Extract first name from user.name (e.g., "John Doe" -> "John")
      const firstName = user?.name?.split(' ')[0] || '';
      const greeting = firstName 
        ? `Hello ${firstName}! I am your Wihy Nutrition Expert. How can I help you today?`
        : 'Hello! I am your Wihy Nutrition Expert. How can I help you today?';
      
      const initialAIMessage: Message = {
        id: '1',
        type: 'ai',
        content: greeting,
        timestamp: new Date(),
      };
      setMessages([initialAIMessage]);
      initializeSession();
    } else {
      // Guided flow: Start with empty messages, API response will be first message
      setMessages([]);
    }
  }, [context, isGuidedFlow, user?.name]);

  /**
   * Parse backend URL-style routes to React Navigation screen names
   * Backend returns: /fitness/programs/prog_123
   * Mobile needs: { screen: 'FitnessProgramDetails', params: { programId: 'prog_123' } }
   */
  const parseRouteToNavigation = useCallback((route: string): { screen: string; params?: any } | null => {
    if (!route) return null;
    
    // Remove leading slash
    const cleanRoute = route.startsWith('/') ? route.slice(1) : route;
    const parts = cleanRoute.split('/');
    
    // /fitness/programs/{id}
    if (parts[0] === 'fitness' && parts[1] === 'programs' && parts[2]) {
      return { screen: 'FitnessProgramDetails', params: { programId: parts[2] } };
    }
    
    // /fitness/programs (list view)
    if (parts[0] === 'fitness' && parts[1] === 'programs') {
      return { screen: 'FitnessProgramDetails', params: {} };
    }
    
    // /fitness/workout/start
    if (parts[0] === 'fitness' && parts[1] === 'workout') {
      return { screen: 'FitnessProgramDetails', params: { autoStart: true } };
    }
    
    // /fitness/meals/{id} or /meals/programs/{id}
    if ((parts[0] === 'fitness' && parts[1] === 'meals') || 
        (parts[0] === 'meals' && parts[1] === 'programs')) {
      const mealId = parts[2] || undefined;
      return { screen: 'MealPlanDetails', params: { planId: mealId } };
    }
    
    // /meals/programs/{id}/shopping-list
    if (parts[0] === 'meals' && parts[3] === 'shopping-list') {
      return { screen: 'CreateMeals', params: { showShoppingList: true, shoppingListId: parts[2] } };
    }
    
    // Fallback: try to use route as screen name
    return null;
  }, []);

  // Handle navigation to created resources
  const handleNavigateToResource = useCallback((resource: CreatedResource) => {
    console.log('Navigating to resource:', resource);
    
    // First try parsing the navigate_to route from backend
    const parsedRoute = parseRouteToNavigation(resource.navigate_to);
    if (parsedRoute) {
      // Add resource name to params for display
      const params = {
        ...parsedRoute.params,
        ...(resource.type === 'fitness_program' && { programName: resource.name }),
        ...(resource.type === 'meal_program' && { planName: resource.name }),
      };
      navigation.navigate(parsedRoute.screen as any, params);
      return;
    }
    
    // Fallback: use resource type to determine screen
    switch (resource.type) {
      case 'fitness_program':
        navigation.navigate('FitnessProgramDetails', { 
          programId: resource.id,
          programName: resource.name,
        });
        break;
      case 'meal_program':
        navigation.navigate('MealPlanDetails', {
          planId: resource.id,
          planName: resource.name,
        });
        break;
      case 'shopping_list':
        navigation.navigate('CreateMeals', {
          showShoppingList: true,
          shoppingListId: resource.id,
        });
        break;
      default:
        console.warn('Unknown resource type:', resource.type);
    }
  }, [navigation, parseRouteToNavigation]);

  // Handle suggested action
  const handleSuggestedAction = useCallback((action: SuggestedAction) => {
    console.log('Handling suggested action:', action);
    
    // Parse the route from backend to React Navigation
    const parsedRoute = parseRouteToNavigation(action.route);
    if (parsedRoute) {
      navigation.navigate(parsedRoute.screen as any, parsedRoute.params);
      return;
    }
    
    // Fallback: try action type mapping
    switch (action.action) {
      case 'view_program':
        navigation.navigate('FitnessProgramDetails', {});
        break;
      case 'start_workout':
        navigation.navigate('FitnessProgramDetails', { autoStart: true });
        break;
      case 'view_meals':
        navigation.navigate('MealPlanDetails', {});
        break;
      case 'shopping_list':
        navigation.navigate('CreateMeals', { showShoppingList: true });
        break;
      default:
        console.warn('Unknown action type:', action.action);
    }
  }, [navigation, parseRouteToNavigation]);

  // Auto-scroll to bottom when new messages are added
  const scrollToBottom = () => {
    if (isWeb) {
      // Use native DOM scrolling on web
      // The actual scrollable container is .web-page-content (created by WebPageWrapper)
      setTimeout(() => {
        // Target the .web-page-content container which is the actual scrollable element
        const scrollContainer = document.querySelector('.web-chat-page .web-page-content');
        if (scrollContainer) {
          scrollContainer.scrollTop = scrollContainer.scrollHeight;
          console.log('Scrolled to bottom:', scrollContainer.scrollHeight);
        }
      }, 100);
      
      // Second scroll attempt after render settles (for long messages/content)
      setTimeout(() => {
        const scrollContainer = document.querySelector('.web-chat-page .web-page-content');
        if (scrollContainer) {
          scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }
      }, 300);
    } else if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Send initial message if provided
  useEffect(() => {
    if (initialMessage && initialMessage.trim() && !initialMessageSent) {
      setInitialMessageSent(true);
      lastProcessedMessage.current = initialMessage;
      setTimeout(() => {
        handleSendMessage(initialMessage);
      }, 500);
    }
  }, [initialMessage, initialMessageSent]);

  // Typing dots animation
  useEffect(() => {
    if (isTyping) {
      const animateTyping = () => {
        const duration = 600;

        Animated.loop(
          Animated.stagger(200, [
            Animated.sequence([
              Animated.timing(dot1Anim, {
                toValue: 1,
                duration: duration,
                useNativeDriver: true,
              }),
              Animated.timing(dot1Anim, {
                toValue: 0.3,
                duration: duration,
                useNativeDriver: true,
              }),
            ]),
            Animated.sequence([
              Animated.timing(dot2Anim, {
                toValue: 1,
                duration: duration,
                useNativeDriver: true,
              }),
              Animated.timing(dot2Anim, {
                toValue: 0.3,
                duration: duration,
                useNativeDriver: true,
              }),
            ]),
            Animated.sequence([
              Animated.timing(dot3Anim, {
                toValue: 1,
                duration: duration,
                useNativeDriver: true,
              }),
              Animated.timing(dot3Anim, {
                toValue: 0.3,
                duration: duration,
                useNativeDriver: true,
              }),
            ]),
          ])
        ).start();
      };

      animateTyping();
    } else {
      // Reset animation values
      dot1Anim.setValue(0.3);
      dot2Anim.setValue(0.3);
      dot3Anim.setValue(0.3);
    }
  }, [isTyping]);

  const handleSendMessage = async (messageText?: string) => {
    const text = messageText || inputText.trim();
    if (!text) {return;}

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    if (!messageText) {
      setInputText('');
    }
    setIsTyping(true);

    try {
      let response;
      
      // Route based on flow type:
      // - Guided flow (Home screen): Use /api/chat/public/ask (stateless)
      // - Conversation flow (Chat tab): Use /api/chat/send-message with session
      
      if (isGuidedFlow) {
        // Guided flow: Use public ask endpoint (stateless, no session needed)
        console.log('=== GUIDED FLOW (/api/chat/public/ask) ===');
        
        response = await chatService.ask(text);
      } else if (sessionId) {
        // Conversation flow with session: Use /api/chat/send-message
        console.log('=== CONVERSATION FLOW (/api/chat/send-message) ===');
        console.log('Session ID:', sessionId);
        console.log('User ID:', userId);
        
        response = await chatService.sendMessage(text, sessionId, userId, {
          ...(context?.userGoals && { user_goals: context.userGoals }),
          ...(context?.fitnessLevel && { fitness_level: context.fitnessLevel }),
          ...(context?.dietaryRestrictions && { dietary_restrictions: context.dietaryRestrictions }),
        });
      } else {
        // Conversation flow without session yet: Start session first
        console.log('=== CONVERSATION FLOW - STARTING SESSION ===');
        
        const session = await chatService.startSession(userId);
        if (session) {
          setSessionId(session.session_id);
          response = await chatService.sendMessage(text, session.session_id, userId);
        } else {
          // Fallback to public ask if session creation fails
          response = await chatService.ask(text);
        }
      }

      if (response.success) {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: response.message || response.response || '', // v3.0: use 'message' field
          timestamp: new Date(),
          createdResources: response.created_resources,
          suggestedActions: response.suggested_actions,
          followUpSuggestions: response.follow_up_suggestions,
          clarifyingQuestions: response.clarifying_questions,
          suggestedSearches: response.suggested_searches,
        };

        setMessages(prev => [...prev, aiMessage]);
      } else {
        // Show error as AI message
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: response.error || 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error: any) {
      console.error('Chat API error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: 'Sorry, I\'m having trouble connecting. Please check your connection and try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  // Fallback response generator (used when API fails or for offline mode)
  const generateFallbackResponse = (userMessage: string, context?: any): string => {
    const lowerMessage = userMessage.toLowerCase();

    if (lowerMessage.includes('symptom') || lowerMessage.includes('pain') || lowerMessage.includes('hurt')) {
      return 'I understand you\'re experiencing symptoms. Can you tell me more about:\n\n• When did the symptoms start?\n• How severe are they on a scale of 1-10?\n• Have you noticed any patterns or triggers?\n\nThis information will help me provide better guidance.';
    }

    if (lowerMessage.includes('food') || lowerMessage.includes('nutrition') || lowerMessage.includes('eat')) {
      return 'Great question about nutrition! I can help you analyze:\n\n• Nutritional content of foods\n• Calorie and macro breakdowns\n• Healthy meal suggestions\n• Dietary restrictions and allergies\n\nWould you like me to analyze a specific food, or are you looking for general nutrition advice?';
    }

    if (lowerMessage.includes('medication') || lowerMessage.includes('medicine') || lowerMessage.includes('drug')) {
      return 'I can help with general medication information, but please remember:\n\n⚠️ Always consult your healthcare provider for medical advice\n\n• I can explain how medications generally work\n• Check for common drug interactions\n• Provide information about side effects\n• Suggest questions to ask your doctor\n\nWhat specific medication information are you looking for?';
    }

    if (lowerMessage.includes('exercise') || lowerMessage.includes('workout') || lowerMessage.includes('fitness')) {
      return 'Exercise is fantastic for your health! I can help with:\n\n• Workout routines for different fitness levels\n• Exercise recommendations for specific goals\n• Recovery and rest day guidance\n• Injury prevention tips\n\nWhat\'s your current fitness level and what are your goals?';
    }

    // Default response
    return 'That\'s a great question! I\'m here to help with your health concerns. I can assist with:\n\n• Symptom analysis and guidance\n• Nutrition and diet advice\n• Exercise and fitness recommendations\n• Medication information\n• General health questions\n\nCould you provide a bit more detail about what you\'d like to know?';
  };

  // Default fallback quick replies
  const defaultQuickReplies = [
    'Tell me more',
    'What should I do next?',
    'Are there any risks?',
    'How long should I wait?',
  ];

  // Get dynamic quick replies from the last AI message
  const getQuickReplies = (): string[] => {
    // Find the last AI message
    const lastAIMessage = [...messages].reverse().find(m => m.type === 'ai');
    if (!lastAIMessage) return defaultQuickReplies;

    // Prioritize clarifying questions from API
    if (lastAIMessage.clarifyingQuestions && lastAIMessage.clarifyingQuestions.length > 0) {
      return lastAIMessage.clarifyingQuestions;
    }

    // Fall back to suggested searches
    if (lastAIMessage.suggestedSearches && lastAIMessage.suggestedSearches.length > 0) {
      return lastAIMessage.suggestedSearches;
    }

    // Fall back to follow-up suggestions
    if (lastAIMessage.followUpSuggestions && lastAIMessage.followUpSuggestions.length > 0) {
      return lastAIMessage.followUpSuggestions;
    }

    return defaultQuickReplies;
  };

  const handleQuickReply = (reply: string) => {
    handleSendMessage(reply);
  };

  const handleImageUpload = () => {};

  const handleViewNutritionFacts = () => {
    if (!hasNutritionFacts) return;
    
    // Extract nutrition data from context - use cached data, don't make API call again
    const cachedFoodData = context?.foodItem || context?.nutritionData || context?.product;
    
    // Navigate to NutritionFacts screen with cached data marked as analyzed
    navigation.navigate('NutritionFacts', {
      foodItem: {
        ...cachedFoodData,
        analyzed: true, // Mark as analyzed to prevent re-fetching
      },
      context: context
    });
  };

  const mainContent = (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 80}
      >
        {/* Chat Header - Using GradientDashboardHeader with custom children - Hidden on web */}
        {!isWeb && (
          <GradientDashboardHeader
            title={getHeaderTitle()}
            gradient="chat"
            style={styles.header}
          >
            <View style={styles.chatHeaderContent}>
              <View style={styles.aiAvatarContainer}>
                <View style={styles.aiAvatar}>
                  <Image
                    source={require('../../assets/whatishealthyspinner.gif')}
                    style={styles.avatarImage}
                    resizeMode="cover"
                  />
                </View>
              </View>

              {/* History button */}
              <Pressable
                style={styles.historyButton}
                onPress={() => navigation.navigate('ChatHistory')}
              >
                <Ionicons name="time-outline" size={20} color="#ffffff" />
              </Pressable>

              <Pressable
                style={[
                  styles.factsButton,
                  !hasNutritionFacts && styles.factsButtonDisabled
                ]}
                onPress={handleViewNutritionFacts}
                disabled={!hasNutritionFacts}
              >
                <Ionicons 
                  name="nutrition" 
                  size={20} 
                  color={hasNutritionFacts ? '#ffffff' : 'rgba(255, 255, 255, 0.5)'} 
                />
                <Text style={[
                  styles.factsButtonText,
                  !hasNutritionFacts && styles.factsButtonTextDisabled
                ]}>
                  Facts
                </Text>
              </Pressable>

              {/* Hide close button on web - nav bar handles navigation */}
              {!isWeb && (
                <Pressable
                  style={styles.closeButton}
                  onPress={() => {
                    if (navigation.canGoBack()) {
                      navigation.goBack();
                    } else {
                      navigation.navigate('Home');
                    }
                  }}
                >
                  <Ionicons name="close" size={24} color="#3b82f6" />
                </Pressable>
              )}
            </View>
          </GradientDashboardHeader>
        )}

        {/* Messages Container */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={[
            styles.messagesContent, 
            { paddingBottom: isWeb ? 20 : 12 + bottomInset / 2 }
          ]}
          showsVerticalScrollIndicator={false}
          {...(isWeb ? { nativeID: 'chat-scroll-view' } : {})}
        >
          {messages.map((message, messageIndex) => (
            <View
              key={message.id}
              style={[
                styles.messageContainer,
                message.type === 'user' ? styles.userMessage : styles.aiMessage,
              ]}
            >
              <Text
                style={[
                  styles.messageText,
                  message.type === 'user' ? styles.userMessageText : styles.aiMessageText,
                ]}
              >
                {message.type === 'ai' ? cleanResponseText(message.content) : message.content}
              </Text>
            
            {/* Created Resources - Action Cards */}
            {message.createdResources && message.createdResources.length > 0 && (
              <View style={styles.resourceCardsContainer}>
                {message.createdResources.map((resource, index) => (
                  <Pressable
                    key={`resource-${index}`}
                    style={styles.resourceCard}
                    onPress={() => handleNavigateToResource(resource)}
                  >
                    <View style={styles.resourceCardIcon}>
                      <Ionicons
                        name={
                          resource.type === 'fitness_program' ? 'fitness' :
                          resource.type === 'meal_program' ? 'restaurant' :
                          resource.type === 'shopping_list' ? 'cart' : 'document'
                        }
                        size={20}
                        color="#3b82f6"
                      />
                    </View>
                    <View style={styles.resourceCardContent}>
                      <Text style={styles.resourceCardTitle}>{resource.name}</Text>
                      <Text style={styles.resourceCardType}>
                        {resource.type === 'fitness_program' ? 'Fitness Program' :
                         resource.type === 'meal_program' ? 'Meal Plan' :
                         resource.type === 'shopping_list' ? 'Shopping List' : 'Resource'}
                      </Text>
                      {resource.metadata && (
                        <Text style={styles.resourceCardMeta}>
                          {resource.metadata.duration_weeks && `${resource.metadata.duration_weeks} weeks`}
                          {resource.metadata.days_per_week && ` • ${resource.metadata.days_per_week} days/week`}
                          {resource.metadata.calories && ` • ${resource.metadata.calories} cal`}
                        </Text>
                      )}
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                  </Pressable>
                ))}
              </View>
            )}
            
            {/* Suggested Actions */}
            {message.suggestedActions && message.suggestedActions.length > 0 && (
              <View style={styles.suggestedActionsContainer}>
                {message.suggestedActions.map((action, index) => (
                  <Pressable
                    key={`action-${index}`}
                    style={styles.suggestedActionButton}
                    onPress={() => handleSuggestedAction(action)}
                  >
                    <Text style={styles.suggestedActionText}>{action.label}</Text>
                  </Pressable>
                ))}
              </View>
            )}
            
            {/* Follow-up Suggestions - Only show on the last AI message */}
            {message.followUpSuggestions && message.followUpSuggestions.length > 0 && messageIndex === messages.length - 1 && message.type === 'ai' && (
              <View style={styles.followUpContainer}>
                <Text style={styles.followUpLabel}>Try asking:</Text>
                {message.followUpSuggestions.map((suggestion, index) => (
                  <Pressable
                    key={`followup-${index}`}
                    style={styles.followUpButton}
                    onPress={() => handleSendMessage(suggestion)}
                  >
                    <Text style={styles.followUpText}>{suggestion}</Text>
                  </Pressable>
                ))}
              </View>
            )}
            
            <Text
              style={[
                styles.timestamp,
                message.type === 'user' ? styles.userTimestamp : styles.aiTimestamp,
              ]}
            >
              {message.timestamp.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
        ))}

        {isTyping && (
          <View style={[styles.messageContainer, styles.aiMessage]}>
            <View style={styles.typingIndicator}>
              <Animated.View style={[styles.typingDot, { opacity: dot1Anim }]} />
              <Animated.View style={[styles.typingDot, { opacity: dot2Anim }]} />
              <Animated.View style={[styles.typingDot, { opacity: dot3Anim }]} />
            </View>
          </View>
        )}

        {/* Quick Replies - Dynamic from API or fallback */}
        {!isTyping && messages.length >= 1 && (
          <View style={styles.quickRepliesContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.quickReplies}>
                {getQuickReplies().map((reply, index) => (
                  <Pressable
                    key={index}
                    style={styles.quickReplyButton}
                    onPress={() => handleQuickReply(reply)}
                  >
                    <Text style={styles.quickReplyText}>{reply}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>
        )}
        
        {/* Scroll anchor for web - with extra padding to clear fixed input */}
        {isWeb ? (
          <div id="messages-end" style={{ height: 70 }} />
        ) : (
          <View nativeID="messages-end" ref={messagesEndRef} style={{ height: 1 }} />
        )}
      </ScrollView>

      {/* Input Container - Mobile only, web uses fixed input below */}
      {!isWeb && (
        <View
          style={[
            styles.inputContainer,
            {
              paddingBottom: bottomInset + 4,
              paddingTop: 12,
              marginBottom: bottomInset ? -bottomInset / 2 : -6,
            },
          ]}
        >
          <View style={styles.textInputContainer}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type your health question..."
              placeholderTextColor="#9ca3af"
              multiline
              maxLength={500}
              autoCorrect={false}
              spellCheck={false}
            />
          </View>

          <Pressable
            style={[
              styles.sendButton,
              inputText.trim() ? styles.sendButtonActive : styles.sendButtonInactive,
            ]}
            onPress={() => handleSendMessage()}
            disabled={!inputText.trim() || isTyping}
          >
            <Ionicons
              name="send"
              size={20}
              color={inputText.trim() ? '#ffffff' : '#9ca3af'}
            />
          </Pressable>
        </View>
      )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );

  const webChatInput = isWeb ? (
    <div className="web-chat-input-fixed">
      <div className="web-search-container">
        <div className="web-search-input-container">
          <input
            type="text"
            className="web-search-input"
            value={inputText}
            onChange={(e: any) => setInputText(e.target.value)}
            placeholder="Type your health question..."
            onFocus={() => {
              scrollToBottom();
            }}
            onKeyDown={(e: any) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (inputText.trim() && !isTyping) {
                  handleSendMessage();
                }
              }
            }}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />
          
          {/* Icons Container - same as home */}
          <div className="web-search-icons">
            {/* Clear Button */}
            {inputText.length > 0 && (
              <button
                onClick={() => setInputText('')}
                className="web-icon-button clear-btn"
                type="button"
              >
                <svg viewBox="0 0 24 24" width="24" height="24" fill="#5f6368">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            )}
            
            {/* Send Button */}
            <button
              onClick={() => handleSendMessage()}
              className={`web-icon-button ${inputText.trim() && !isTyping ? 'send-active' : ''}`}
              disabled={!inputText.trim() || isTyping}
              type="button"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill={inputText.trim() && !isTyping ? '#1a73e8' : '#9ca3af'}>
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <WebPageWrapper activeTab="chat" className="web-chat-page">
      {mainContent}
      {webChatInput}
    </WebPageWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  flex: {
    flex: 1,
  },
  header: {
    borderBottomWidth: 0,
  },
  chatHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 0,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
    justifyContent: 'space-between',
  },
  aiAvatarContainer: {
    width: 50,
  },
  aiAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarImage: {
    width: 46,
    height: 46,
  },
  statusIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusOnline: {
    backgroundColor: '#10b981',
  },
  statusThinking: {
    backgroundColor: '#f59e0b',
  },
  headerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  historyButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  factsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    position: 'absolute',
    left: '50%',
    marginLeft: -45,
  },
  factsButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
    opacity: 0.5,
  },
  factsButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
  factsButtonTextDisabled: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
  aiName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiStatus: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  statusOnlineText: {
    color: '#10b981',
  },
  statusThinkingText: {
    color: '#f59e0b',
  },
  closeButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  messagesContent: {
    padding: 16,
    paddingTop: 20,
    paddingBottom: 20,
  },
  messageContainer: {
    marginBottom: 12,
    maxWidth: '85%',
  },
  userMessage: {
    alignSelf: 'flex-end',
  },
  aiMessage: {
    alignSelf: 'flex-start',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
    padding: 14,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  userMessageText: {
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    borderBottomRightRadius: 6,
  },
  aiMessageText: {
    backgroundColor: '#ffffff',
    color: '#1f2937',
    borderBottomLeftRadius: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
    marginHorizontal: 16,
  },
  userTimestamp: {
    color: '#9ca3af',
    textAlign: 'right',
  },
  aiTimestamp: {
    color: '#9ca3af',
    textAlign: 'left',
  },
  typingIndicator: {
    flexDirection: 'row',
    gap: 5,
    padding: 14,
    paddingHorizontal: 18,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderBottomLeftRadius: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3b82f6',
  },
  quickRepliesContainer: {
    marginTop: 12,
    marginBottom: 8,
  },
  quickReplies: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
  },
  quickReplyButton: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: '#3b82f6',
  },
  quickReplyText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    gap: 8,
  },
  textInputContainer: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
    minHeight: 40,
    justifyContent: 'center',
  },
  textInput: {
    fontSize: 15,
    color: '#1f2937',
    minHeight: 22,
    textAlignVertical: 'center',
    paddingTop: 0,
    paddingBottom: 0,
  },
  sendButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  sendButtonActive: {
    backgroundColor: '#3b82f6',
  },
  sendButtonInactive: {
    backgroundColor: '#e2e8f0',
  },
  
  // Created Resources Styles
  resourceCardsContainer: {
    marginTop: 12,
    gap: 10,
  },
  resourceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  resourceCardIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  resourceCardContent: {
    flex: 1,
  },
  resourceCardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  resourceCardType: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '600',
  },
  resourceCardMeta: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 3,
  },
  
  // Suggested Actions Styles
  suggestedActionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 8,
  },
  suggestedActionButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  suggestedActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
  
  // Follow-up Suggestions Styles
  followUpContainer: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  followUpLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  followUpButton: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  followUpText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
});

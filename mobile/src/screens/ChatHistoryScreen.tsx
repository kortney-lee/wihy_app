import React, { useState, useEffect, useCallback, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '../components/shared';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../types/navigation';
import { GradientDashboardHeader, WebPageWrapper } from '../components/shared';
import { chatService, ChatSession } from '../services/chatService';
import { AuthContext } from '../context/AuthContext';
import { colors, spacing, borderRadius } from '../theme/design-tokens';

const isWeb = Platform.OS === 'web';

type NavigationProp = StackNavigationProp<RootStackParamList>;

/**
 * ChatHistoryScreen - View and resume previous chat sessions
 * Uses /api/chat/user/{user_id}/sessions to list sessions
 * Uses /api/chat/session/{session_id}/history to load messages
 */
export default function ChatHistoryScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useContext(AuthContext);
  const userId = user?.id || 'guest';

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load user's chat sessions
  const loadSessions = useCallback(async () => {
    try {
      setError(null);
      const userSessions = await chatService.getUserSessions(userId);
      setSessions(userSessions);
    } catch (err: any) {
      console.error('Failed to load sessions:', err);
      setError('Failed to load chat history');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  // Load on mount
  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // Pull to refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadSessions();
  }, [loadSessions]);

  // Resume a chat session
  const handleResumeSession = async (session: ChatSession) => {
    // Load history and navigate to FullChat
    try {
      const messages = await chatService.getHistory(session.session_id);
      navigation.navigate('FullChat', {
        context: {
          type: 'resumed',
          sessionId: session.session_id,
          resumedMessages: messages,
        },
      });
    } catch (err) {
      console.error('Failed to load session:', err);
      // Navigate anyway with just session ID
      navigation.navigate('FullChat', {
        context: {
          type: 'resumed',
          sessionId: session.session_id,
        },
      });
    }
  };

  // Start a new chat
  const handleNewChat = () => {
    navigation.navigate('FullChat', {
      context: {
        type: 'new',
      },
    });
  };

  // Format date for display
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Render a session item
  const renderSessionItem = ({ item }: { item: ChatSession }) => (
    <Pressable
      style={({ pressed }) => [
        styles.sessionCard,
        pressed && styles.sessionCardPressed,
      ]}
      onPress={() => handleResumeSession(item)}
    >
      <View style={styles.sessionIcon}>
        <Ionicons name="chatbubbles" size={24} color={colors.primary} />
      </View>
      <View style={styles.sessionContent}>
        <Text style={styles.sessionTitle} numberOfLines={1}>
          {item.title || 'Chat Session'}
        </Text>
        <View style={styles.sessionMeta}>
          <Text style={styles.sessionDate}>
            {formatDate(item.last_message_at || item.last_activity || item.created_at)}
          </Text>
          <Text style={styles.sessionMessages}>
            {item.message_count} message{item.message_count !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
    </Pressable>
  );

  // Empty state
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="chatbubbles-outline" size={64} color={colors.textMuted} />
      <Text style={styles.emptyTitle}>No Chat History</Text>
      <Text style={styles.emptySubtitle}>
        Start a conversation with WiHY to see your chat history here
      </Text>
      <Pressable style={styles.newChatButton} onPress={handleNewChat}>
        <Ionicons name="add" size={20} color="#fff" />
        <Text style={styles.newChatButtonText}>Start New Chat</Text>
      </Pressable>
    </View>
  );

  // Error state
  const renderError = () => (
    <View style={styles.emptyState}>
      <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
      <Text style={styles.emptyTitle}>Failed to Load</Text>
      <Text style={styles.emptySubtitle}>{error}</Text>
      <Pressable style={styles.newChatButton} onPress={loadSessions}>
        <Ionicons name="refresh" size={20} color="#fff" />
        <Text style={styles.newChatButtonText}>Try Again</Text>
      </Pressable>
    </View>
  );

  const mainContent = (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <GradientDashboardHeader
        title="Chat History"
        gradient="chat"
        showBackButton
        onBackPress={() => navigation.goBack()}
      >
        <Pressable style={styles.headerButton} onPress={handleNewChat}>
          <Ionicons name="add-circle-outline" size={24} color="#fff" />
        </Pressable>
      </GradientDashboardHeader>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading chat history...</Text>
        </View>
      ) : error ? (
        renderError()
      ) : sessions.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={sessions}
          renderItem={renderSessionItem}
          keyExtractor={(item) => item.session_id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </SafeAreaView>
  );

  if (isWeb) {
    return <WebPageWrapper>{mainContent}</WebPageWrapper>;
  }

  return mainContent;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  headerButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textMuted,
  },
  listContent: {
    padding: spacing.md,
  },
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  sessionCardPressed: {
    opacity: 0.7,
  },
  sessionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  sessionContent: {
    flex: 1,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  sessionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sessionDate: {
    fontSize: 13,
    color: colors.textMuted,
  },
  sessionMessages: {
    fontSize: 13,
    color: colors.textMuted,
    opacity: 0.7,
  },
  separator: {
    height: spacing.sm,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  newChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
  },
  newChatButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

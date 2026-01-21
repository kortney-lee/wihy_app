import React, { useState, useContext, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
  Share,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SvgIcon from '../components/shared/SvgIcon';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthContext } from '../context/AuthContext';
import { userService, Coach, CoachClient } from '../services/userService';
import { familyService, FamilyMember as FamilyServiceMember, FamilyRole } from '../services/familyService';
import { coachService, Client, ClientDashboard } from '../services/coachService';
import { RootStackParamList } from '../types/navigation';
import { colors } from '../theme/design-tokens';

// Family types from userService
interface Family {
  id: string;
  ownerId: string;
  name: string;
  plan: string;
  memberLimit: number;
  memberCount: number;
  guardianCode: string;
  createdAt: string;
  updatedAt?: string;
}

interface FamilyMember {
  userId: string;
  name?: string;
  email?: string;
  role: string;
  healthScore?: number;
  streakDays?: number;
  joinedAt?: string;
}

// WiHY Light theme colors (matching Profile screen)
const theme = {
  background: '#e0f2fe',       // Light blue background
  card: '#ffffff',             // White cards
  cardBorder: '#e5e7eb',       // Light gray borders
  text: '#1f2937',             // Dark text
  textSecondary: '#6b7280',    // Muted text
  accent: '#3b82f6',           // WiHY blue
  success: '#22c55e',          // Green for success
  headerGradient: ['#3b82f6', '#1e3a8a'], // Blue gradient for header
  iconBg: '#f0f9ff',           // Light blue icon background
};

type EnrollmentMode = 'coach' | 'parent';

// Helper to normalize API responses (handles both camelCase and snake_case)
const normalizeFamily = (data: any): Family | null => {
  if (!data) return null;
  return {
    id: data.id || data.family_id,
    ownerId: data.ownerId || data.owner_id || data.created_by,
    name: data.name,
    plan: data.plan || data.subscription_plan || 'family',
    memberLimit: data.memberLimit || data.max_members || data.member_limit || 6,
    memberCount: data.memberCount || data.member_count || data.members?.length || 0,
    guardianCode: data.guardianCode || data.guardian_code || '',
    createdAt: data.createdAt || data.created_at || new Date().toISOString(),
    updatedAt: data.updatedAt || data.updated_at,
  };
};

const normalizeFamilyMember = (data: any): FamilyMember => ({
  userId: data.userId || data.user_id || data.id,
  name: data.name,
  email: data.email,
  role: (data.role || 'member').toLowerCase(),
  healthScore: data.healthScore || data.health_score,
  streakDays: data.streakDays || data.streak_days,
  joinedAt: data.joinedAt || data.joined_at || new Date().toISOString(),
});

export default function EnrollmentScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'Enrollment'>>();
  const { user } = useContext(AuthContext);
  
  // Get initial tab from navigation params, default to 'parent'
  const initialTab = route.params?.tab || 'parent';
  const [mode, setMode] = useState<EnrollmentMode>(initialTab);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Parent/Family state
  const [familyName, setFamilyName] = useState('');
  const [guardianCode, setGuardianCode] = useState('');
  const [family, setFamily] = useState<Family | null>(null);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [joinCode, setJoinCode] = useState('');
  
  // Coach state - supports both authService and coachService types
  const [clients, setClients] = useState<Client[]>([]);
  const [clientEmail, setClientEmail] = useState('');
  const [coachId, setCoachId] = useState<string | null>(null);
  const [coachStats, setCoachStats] = useState<{
    totalClients: number;
    activeClients: number;
    pendingInvitations: number;
    totalRevenue?: number;
  } | null>(null);

  // Get refreshUserContext from AuthContext
  const { refreshUserContext } = useContext(AuthContext);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = useCallback(async () => {
    setRefreshing(true);
    try {
      const profile = await userService.getUserProfile();
      if (profile) {
        // Check if user is part of a family
        if (profile.familyId) {
          try {
            const familyData = await userService.getFamilyById(profile.familyId);
            if (familyData) {
              const normalized = normalizeFamily(familyData);
              if (normalized) {
                setFamily(normalized);
                setGuardianCode(normalized.guardianCode);
              }
              
              // Load family members using familyService for richer data
              try {
                const membersData = await familyService.getMembers(profile.familyId);
                if (membersData && membersData.length > 0) {
                  setFamilyMembers(membersData.map(normalizeFamilyMember));
                }
              } catch {
                // Fallback to userService
                const membersData = await userService.listFamilyMembers(profile.familyId);
                if (membersData?.members) {
                  setFamilyMembers(membersData.members.map(normalizeFamilyMember));
                }
              }
            }
          } catch (error) {
            console.error('[Enrollment] Error loading family:', error);
          }
        }
        
        // Check if user is a coach
        if (profile.coachId) {
          setCoachId(profile.coachId);
          
          // Try coachService for richer data first
          try {
            const overview = await coachService.getCoachOverview(profile.coachId);
            if (overview) {
              setCoachStats({
                totalClients: overview.total_clients,
                activeClients: overview.active_clients,
                pendingInvitations: overview.pending_invitations,
              });
              setClients(overview.clients);
            }
          } catch {
            // Fallback to userService
            const clientsData = await userService.listCoachClients(profile.coachId);
            if (clientsData) {
              // Map userService clients to coachService Client type
              const mapped: Client[] = clientsData.clients.map(c => ({
                id: c.clientId,
                name: c.name || 'Unknown',
                email: c.email || '',
                status: c.isActive ? 'active' : 'inactive',
                joined_date: c.startedAt,
                active_meal_programs: 0,
                active_fitness_programs: 0,
              }));
              setClients(mapped);
              setCoachStats({
                totalClients: clientsData.clients.length,
                activeClients: clientsData.clients.filter(c => c.isActive).length,
                pendingInvitations: 0,
              });
            }
          }
        }
      }
    } catch (error) {
      console.error('[Enrollment] Error loading user data:', error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  // ========== PARENT FUNCTIONS ==========
  
  const handleCreateFamily = async () => {
    if (!familyName.trim()) {
      Alert.alert('Error', 'Please enter a family name');
      return;
    }
    
    setLoading(true);
    try {
      const result = await userService.createFamily(familyName.trim());
      if (result.success && result.data) {
        const normalized = normalizeFamily(result.data);
        if (normalized) {
          setFamily(normalized);
          setGuardianCode(normalized.guardianCode);
          
          // ✅ CRITICAL: Refresh user context to update familyId and capabilities
          await refreshUserContext();
          
          Alert.alert(
            'Family Created! 🎉',
            `Share this code with your children to join:\n\n${normalized.guardianCode}`,
            [{ text: 'Copy Code', onPress: () => shareGuardianCode(normalized.guardianCode) }]
          );
        }
        setFamilyName('');
      } else {
        Alert.alert('Error', result.error || 'Failed to create family');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create family');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinFamily = async () => {
    if (!joinCode.trim()) {
      Alert.alert('Error', 'Please enter a guardian code');
      return;
    }
    
    setLoading(true);
    try {
      const result = await userService.joinFamily(joinCode.trim().toUpperCase());
      if (result.success && result.data) {
        const normalized = normalizeFamily(result.data);
        if (normalized) {
          setFamily(normalized);
          
          // ✅ CRITICAL: Refresh user context to update familyId and capabilities
          await refreshUserContext();
          
          Alert.alert('Success! 🎉', `You've joined ${normalized.name}`);
        }
        setJoinCode('');
        loadUserData(); // Refresh data
      } else {
        Alert.alert('Error', result.error || 'Invalid guardian code');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to join family');
    } finally {
      setLoading(false);
    }
  };

  const shareGuardianCode = async (code: string) => {
    try {
      await Share.share({
        message: `Join our family on WIHY AI! Use this code: ${code}\n\nDownload WIHY: https://wihy.ai`,
        title: 'Join My Family on WIHY',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleRegenerateCode = async () => {
    if (!family?.id) return;
    
    Alert.alert(
      'Regenerate Code?',
      'This will invalidate the old code. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Regenerate',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const result = await userService.regenerateGuardianCode(family.id);
              if (result.success && result.data) {
                // Handle both camelCase and snake_case responses
                const newCode = result.data.guardianCode || result.data.guardian_code;
                if (newCode) {
                  setGuardianCode(newCode);
                  Alert.alert('Success', 'New guardian code generated');
                }
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to regenerate code');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleRemoveMember = async (memberId: string, memberName?: string) => {
    if (!family?.id) return;
    
    Alert.alert(
      'Remove Member?',
      `Are you sure you want to remove ${memberName || 'this member'} from the family?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const result = await userService.removeFamilyMemberById(family.id, memberId);
              if (result.success) {
                setFamilyMembers(prev => prev.filter(m => m.userId !== memberId));
                Alert.alert('Success', 'Member removed');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to remove member');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // ========== COACH FUNCTIONS ==========
  
  const handleBecomeCoach = async () => {
    setLoading(true);
    try {
      const result = await userService.createCoach('coach_basic', 0.1); // 10% commission
      if (result.success && result.data) {
        setCoachId(result.data.id);
        Alert.alert('Success! 🎉', 'You are now a WiHY Coach! Start adding clients.');
      } else {
        Alert.alert('Error', result.error || 'Failed to create coach profile');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create coach profile');
    } finally {
      setLoading(false);
    }
  };

  const handleInviteClient = async () => {
    if (!clientEmail.trim()) {
      Alert.alert('Error', 'Please enter a client email');
      return;
    }

    if (!coachId) {
      Alert.alert('Error', 'Coach profile not found');
      return;
    }
    
    setLoading(true);
    try {
      // Try using coachService.sendInvitation first for proper invitation tracking
      const invitation = await coachService.sendInvitation({
        coachId,
        clientEmail: clientEmail.trim(),
        message: `I'd like to help you reach your health goals with personalized nutrition and fitness guidance.`,
      });
      
      if (invitation.success) {
        Alert.alert('Invitation Sent! 📧', `An invitation has been sent to ${clientEmail}`);
        setClientEmail('');
        loadUserData(); // Refresh to show pending invitation
      } else {
        // Fallback to share invite link
        await Share.share({
          message: `Join me on WIHY AI as my coaching client!\n\nSign up here: https://wihy.ai/coach-invite?coach=${coachId}\n\nI'll help you reach your health goals with personalized nutrition and fitness guidance.`,
          title: 'Coach Invitation',
        });
        setClientEmail('');
      }
    } catch (error) {
      // Fallback to share invite link if invitation endpoint fails
      try {
        await Share.share({
          message: `Join me on WIHY AI as my coaching client!\n\nSign up here: https://wihy.ai/coach-invite?coach=${coachId}\n\nI'll help you reach your health goals with personalized nutrition and fitness guidance.`,
          title: 'Coach Invitation',
        });
        setClientEmail('');
      } catch (shareError) {
        console.error('Error sharing:', shareError);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveClient = async (clientId: string, clientName?: string) => {
    if (!coachId) return;
    
    Alert.alert(
      'Remove Client?',
      `Are you sure you want to remove ${clientName || 'this client'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              // Try coachService first
              const result = await coachService.removeClient(coachId, clientId);
              if (result.success) {
                setClients(prev => prev.filter(c => c.id !== clientId));
                Alert.alert('Success', 'Client removed');
              } else {
                // Fallback to userService
                const userResult = await userService.removeCoachClient(coachId, clientId);
                if (userResult.success) {
                  setClients(prev => prev.filter(c => c.id !== clientId));
                  Alert.alert('Success', 'Client removed');
                }
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to remove client');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleViewClientProgress = async (client: Client) => {
    if (!coachId) return;
    
    // Navigate to client progress screen with data
    navigation.navigate('ClientProgress', {
      clientId: client.id,
      clientName: client.name,
    });
  };

  // ========== RENDER HELPERS ==========
  
  const renderParentSection = () => (
    <View style={styles.section}>
      {family ? (
        <>
          {/* Family Info Card */}
          <View style={styles.familyCard}>
            <View style={styles.familyHeader}>
              <SvgIcon name="home" size={32} color={theme.accent} />
              <View style={styles.familyInfo}>
                <Text style={styles.familyName}>{family.name}</Text>
                <Text style={styles.familyMeta}>
                  {familyMembers.length} / {family.memberLimit} members
                </Text>
              </View>
            </View>
            
            {/* Guardian Code */}
            <View style={styles.codeContainer}>
              <Text style={styles.codeLabel}>Guardian Code</Text>
              <View style={styles.codeRow}>
                <Text style={styles.codeText}>{guardianCode}</Text>
                <Pressable
                  style={styles.codeAction}
                  onPress={() => shareGuardianCode(guardianCode)}
                >
                  <SvgIcon name="share-outline" size={20} color={theme.accent} />
                </Pressable>
                <Pressable
                  style={styles.codeAction}
                  onPress={handleRegenerateCode}
                >
                  <SvgIcon name="refresh-outline" size={20} color={theme.textSecondary} />
                </Pressable>
              </View>
              <Text style={styles.codeHint}>Share this code with your children to join</Text>
            </View>
          </View>

          {/* Family Members */}
          <Text style={styles.sectionTitle}>Family Members</Text>
          {familyMembers.length > 0 ? (
            familyMembers.map((member) => (
              <View key={member.userId} style={styles.memberCard}>
                <View style={styles.memberAvatar}>
                  <SvgIcon
                    name={member.role === 'guardian' ? 'shield-checkmark' : 'person'}
                    size={24}
                    color={member.role === 'guardian' ? theme.accent : theme.textSecondary}
                  />
                </View>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>{member.name || member.email || 'Family Member'}</Text>
                  <Text style={styles.memberRole}>
                    {member.role === 'guardian' ? '👑 Guardian' : '👤 Member'}
                    {member.healthScore && ` • Health: ${member.healthScore}`}
                    {member.streakDays && ` • 🔥 ${member.streakDays} days`}
                  </Text>
                </View>
                {member.role !== 'guardian' && (
                  <Pressable
                    style={styles.removeButton}
                    onPress={() => handleRemoveMember(member.userId, member.name)}
                  >
                    <SvgIcon name="close-circle" size={24} color="#FF6B6B" />
                  </Pressable>
                )}
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <SvgIcon name="people-outline" size={48} color={theme.textSecondary} />
              <Text style={styles.emptyText}>No family members yet</Text>
              <Text style={styles.emptyHint}>Share your guardian code to invite family</Text>
            </View>
          )}
        </>
      ) : (
        <>
          {/* Create Family */}
          <View style={styles.actionCard}>
            <SvgIcon name="home-outline" size={40} color={theme.accent} />
            <Text style={styles.actionTitle}>Create a Family</Text>
            <Text style={styles.actionSubtitle}>
              Set up your family and get a code to share with your children
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Family Name (e.g., The Smiths)"
              placeholderTextColor={theme.textSecondary}
              value={familyName}
              onChangeText={setFamilyName}
            />
            <Pressable
              style={[styles.primaryButton, loading && styles.buttonDisabled]}
              onPress={handleCreateFamily}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <SvgIcon name="add-circle" size={20} color="#fff" />
                  <Text style={styles.primaryButtonText}>Create Family</Text>
                </>
              )}
            </Pressable>
          </View>

          {/* Or Join */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Join Family */}
          <View style={styles.actionCard}>
            <SvgIcon name="enter-outline" size={40} color={theme.success} />
            <Text style={styles.actionTitle}>Join a Family</Text>
            <Text style={styles.actionSubtitle}>
              Enter the guardian code shared by your parent
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Enter Guardian Code"
              placeholderTextColor={theme.textSecondary}
              value={joinCode}
              onChangeText={(text) => setJoinCode(text.toUpperCase())}
              autoCapitalize="characters"
              maxLength={8}
            />
            <Pressable
              style={[styles.secondaryButton, loading && styles.buttonDisabled]}
              onPress={handleJoinFamily}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={theme.accent} />
              ) : (
                <>
                  <SvgIcon name="enter" size={20} color={theme.accent} />
                  <Text style={styles.secondaryButtonText}>Join Family</Text>
                </>
              )}
            </Pressable>
          </View>
        </>
      )}
    </View>
  );

  const renderCoachSection = () => (
    <View style={styles.section}>
      {coachId ? (
        <>
          {/* Coach Stats Card */}
          <View style={styles.coachCard}>
            <View style={styles.coachHeader}>
              <SvgIcon name="fitness" size={32} color={theme.accent} />
              <View style={styles.coachInfo}>
                <Text style={styles.coachTitle}>Coach Dashboard</Text>
                <Text style={styles.coachMeta}>
                  {coachStats?.activeClients || clients.filter(c => c.status === 'active').length} active clients
                </Text>
              </View>
            </View>
            
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>
                  {coachStats?.activeClients || clients.filter(c => c.status === 'active').length}
                </Text>
                <Text style={styles.statLabel}>Active</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>
                  {coachStats?.totalClients || clients.length}
                </Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>
              <View style={styles.statBox}>
                {coachStats?.pendingInvitations ? (
                  <>
                    <Text style={styles.statNumber}>{coachStats.pendingInvitations}</Text>
                    <Text style={styles.statLabel}>Pending</Text>
                  </>
                ) : (
                  <>
                    <SvgIcon name="trending-up" size={24} color={theme.success} />
                    <Text style={styles.statLabel}>Revenue</Text>
                  </>
                )}
              </View>
            </View>
          </View>

          {/* Invite Client */}
          <View style={styles.inviteSection}>
            <Text style={styles.sectionTitle}>Invite New Client</Text>
            <View style={styles.inviteRow}>
              <TextInput
                style={[styles.input, styles.inviteInput]}
                placeholder="Client's email"
                placeholderTextColor={theme.textSecondary}
                value={clientEmail}
                onChangeText={setClientEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <Pressable style={styles.inviteButton} onPress={handleInviteClient}>
                <SvgIcon name="send" size={20} color="#fff" />
              </Pressable>
            </View>
          </View>

          {/* Clients List */}
          <Text style={styles.sectionTitle}>Your Clients</Text>
          {clients.length > 0 ? (
            clients.map((client) => (
              <Pressable
                key={client.id}
                style={styles.clientCard}
                onPress={() => handleViewClientProgress(client)}
              >
                <View style={styles.clientAvatar}>
                  <SvgIcon name="person" size={24} color={theme.accent} />
                </View>
                <View style={styles.clientInfo}>
                  <Text style={styles.clientName}>{client.name || client.email || 'Client'}</Text>
                  <View style={styles.clientMetaRow}>
                    <Text style={[
                      styles.clientStatus,
                      client.status === 'active' ? styles.clientStatusActive : styles.clientStatusInactive
                    ]}>
                      {client.status === 'active' ? '● Active' : '○ Inactive'}
                    </Text>
                    {client.active_meal_programs > 0 && (
                      <Text style={styles.clientPrograms}>
                        🍽️ {client.active_meal_programs} meal plans
                      </Text>
                    )}
                    {client.active_fitness_programs > 0 && (
                      <Text style={styles.clientPrograms}>
                        💪 {client.active_fitness_programs} workouts
                      </Text>
                    )}
                  </View>
                  {client.joined_date && (
                    <Text style={styles.clientJoined}>
                      Joined {new Date(client.joined_date).toLocaleDateString()}
                    </Text>
                  )}
                </View>
                <SvgIcon name="chevron-forward" size={20} color={theme.textSecondary} />
              </Pressable>
            ))
          ) : (
            <View style={styles.emptyState}>
              <SvgIcon name="people-outline" size={48} color={theme.textSecondary} />
              <Text style={styles.emptyText}>No clients yet</Text>
              <Text style={styles.emptyHint}>Invite clients using the form above</Text>
            </View>
          )}
        </>
      ) : (
        /* Become a Coach */
        <View style={styles.actionCard}>
          <SvgIcon name="ribbon-outline" size={48} color={theme.accent} />
          <Text style={styles.actionTitle}>Become a WiHY Coach</Text>
          <Text style={styles.actionSubtitle}>
            Help your clients achieve their health goals with personalized nutrition and fitness plans
          </Text>
          
          <View style={styles.benefitsList}>
            <View style={styles.benefitItem}>
              <SvgIcon name="checkmark-circle" size={20} color={theme.success} />
              <Text style={styles.benefitText}>Manage unlimited clients</Text>
            </View>
            <View style={styles.benefitItem}>
              <SvgIcon name="checkmark-circle" size={20} color={theme.success} />
              <Text style={styles.benefitText}>Track client progress</Text>
            </View>
            <View style={styles.benefitItem}>
              <SvgIcon name="checkmark-circle" size={20} color={theme.success} />
              <Text style={styles.benefitText}>Earn commission on referrals</Text>
            </View>
            <View style={styles.benefitItem}>
              <SvgIcon name="checkmark-circle" size={20} color={theme.success} />
              <Text style={styles.benefitText}>Access coach analytics</Text>
            </View>
          </View>
          
          <Pressable
            style={[styles.primaryButton, loading && styles.buttonDisabled]}
            onPress={handleBecomeCoach}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <SvgIcon name="rocket" size={20} color="#fff" />
                <Text style={styles.primaryButtonText}>Start Coaching</Text>
              </>
            )}
          </Pressable>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <SvgIcon name="arrow-back" size={24} color={theme.text} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>
            {mode === 'parent' ? 'Family Management' : 'Coach Dashboard'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {mode === 'parent' ? 'Manage your family members' : 'Manage your coaching clients'}
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={loadUserData}
              tintColor={theme.accent}
              colors={[theme.accent]}
            />
          }
        >
          {mode === 'parent' ? renderParentSection() : renderCoachSection()}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  flex: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  refreshIndicator: {
    marginBottom: 16,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.background,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.card,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  headerText: {
    marginLeft: 12,
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: theme.textSecondary,
    marginTop: 2,
  },

  // Section
  section: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.text,
    marginTop: 8,
  },

  // Family Card
  familyCard: {
    backgroundColor: theme.card,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  familyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  familyInfo: {
    flex: 1,
  },
  familyName: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.text,
  },
  familyMeta: {
    fontSize: 14,
    color: theme.textSecondary,
    marginTop: 2,
  },

  // Guardian Code
  codeContainer: {
    backgroundColor: theme.iconBg,
    borderRadius: 12,
    padding: 16,
  },
  codeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  codeText: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: theme.accent,
    letterSpacing: 4,
  },
  codeAction: {
    padding: 8,
  },
  codeHint: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 8,
  },

  // Member Card
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.card,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.iconBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberInfo: {
    flex: 1,
    marginLeft: 12,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
  },
  memberRole: {
    fontSize: 13,
    color: theme.textSecondary,
    marginTop: 2,
  },
  removeButton: {
    padding: 4,
  },

  // Coach Card
  coachCard: {
    backgroundColor: theme.card,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  coachHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  coachInfo: {
    flex: 1,
  },
  coachTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.text,
  },
  coachMeta: {
    fontSize: 14,
    color: theme.textSecondary,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.cardBorder,
  },
  statBox: {
    alignItems: 'center',
    gap: 4,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.accent,
  },
  statLabel: {
    fontSize: 12,
    color: theme.textSecondary,
  },

  // Invite Section
  inviteSection: {
    marginTop: 8,
  },
  inviteRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  inviteInput: {
    flex: 1,
    marginTop: 0,
  },
  inviteButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: theme.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Client Card
  clientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.card,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  clientAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.iconBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clientInfo: {
    flex: 1,
    marginLeft: 12,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
  },
  clientMeta: {
    fontSize: 13,
    color: theme.textSecondary,
    marginTop: 2,
  },
  clientMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  clientStatus: {
    fontSize: 12,
    fontWeight: '600',
  },
  clientStatusActive: {
    color: theme.success,
  },
  clientStatusInactive: {
    color: theme.textSecondary,
  },
  clientPrograms: {
    fontSize: 12,
    color: theme.textSecondary,
  },
  clientJoined: {
    fontSize: 11,
    color: theme.textSecondary,
    marginTop: 2,
  },

  // Action Card
  actionCard: {
    backgroundColor: theme.card,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.text,
    marginTop: 16,
    textAlign: 'center',
  },
  actionSubtitle: {
    fontSize: 14,
    color: theme.textSecondary,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Input
  input: {
    width: '100%',
    height: 48,
    backgroundColor: theme.card,
    borderRadius: 24,
    paddingHorizontal: 20,
    fontSize: 16,
    color: theme.text,
    marginTop: 16,
    borderWidth: 1,
    borderColor: theme.cardBorder,
  },

  // Buttons
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    height: 48,
    backgroundColor: theme.accent,
    borderRadius: 24,
    marginTop: 16,
    shadowColor: theme.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    height: 48,
    backgroundColor: 'transparent',
    borderRadius: 24,
    marginTop: 16,
    borderWidth: 2,
    borderColor: theme.accent,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.accent,
  },
  buttonDisabled: {
    opacity: 0.6,
  },

  // Benefits List
  benefitsList: {
    width: '100%',
    marginTop: 20,
    gap: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  benefitText: {
    fontSize: 14,
    color: theme.text,
  },

  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.cardBorder,
  },
  dividerText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.textSecondary,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: theme.card,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginTop: 12,
  },
  emptyHint: {
    fontSize: 14,
    color: theme.textSecondary,
    marginTop: 4,
  },
});

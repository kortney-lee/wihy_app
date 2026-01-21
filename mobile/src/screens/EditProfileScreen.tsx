import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';
import { userService } from '../services/userService';
import { WebNavHeader } from '../components/web/WebNavHeader';
import SvgIcon from '../components/shared/SvgIcon';

const isWeb = Platform.OS === 'web';

// WiHY Light theme
const theme = {
  background: '#f0f9ff',
  card: '#ffffff',
  cardBorder: '#e5e7eb',
  text: '#1f2937',
  textSecondary: '#6b7280',
  accent: '#3b82f6',
  success: '#22c55e',
  error: '#ef4444',
  inputBg: '#f9fafb',
};

export default function EditProfileScreen() {
  const navigation = useNavigation();
  const { user, updateUser } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');

  // Load user data
  useEffect(() => {
    if (user) {
      // Parse name into first/last
      const nameParts = (user.name || '').split(' ');
      setFirstName(nameParts[0] || '');
      setLastName(nameParts.slice(1).join(' ') || '');
      setEmail(user.email || '');
      // Load other fields from user object or fetch from API
      loadUserProfile();
    }
  }, [user]);

  const loadUserProfile = async () => {
    if (!user?.email) return;
    
    setLoading(true);
    try {
      const profile = await userService.getUserByEmail(user.email);
      if (profile) {
        if (profile.firstName) setFirstName(profile.firstName);
        if (profile.lastName) setLastName(profile.lastName);
        if ((profile as any).phone) setPhone((profile as any).phone);
        if ((profile as any).dateOfBirth) setDateOfBirth((profile as any).dateOfBirth);
        if ((profile as any).gender) setGender((profile as any).gender);
        if ((profile as any).height) setHeight(String((profile as any).height));
        if ((profile as any).weight) setWeight(String((profile as any).weight));
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'Please log in to update your profile');
      return;
    }

    setSaving(true);
    try {
      const updates = {
        firstName,
        lastName,
        name: `${firstName} ${lastName}`.trim(),
        phone,
        dateOfBirth,
        gender,
        height: height ? parseFloat(height) : undefined,
        weight: weight ? parseFloat(weight) : undefined,
      };

      const result = await userService.updateUserProfile(user.id, updates);
      
      if (result.success) {
        // Update local context
        if (updateUser) {
          await updateUser({ name: updates.name });
        }
        Alert.alert('Success', 'Profile updated successfully', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert('Error', result.error || 'Failed to update profile');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const genderOptions = ['Male', 'Female', 'Other', 'Prefer not to say'];

  const content = (
    <ScrollView 
      style={styles.scrollView}
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header - only show on mobile */}
      {!isWeb && (
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
            <SvgIcon name="arrow-back" size={24} color={theme.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <View style={styles.headerSpacer} />
        </View>
      )}
      
      {/* Web header with back button */}
      {isWeb && (
        <View style={styles.webHeader}>
          <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
            <SvgIcon name="arrow-back" size={24} color={theme.text} />
          </Pressable>
          <Text style={styles.webPageTitle}>Edit Profile</Text>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.accent} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      ) : (
        <View style={styles.formContainer}>
          {/* Personal Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>First Name</Text>
              <TextInput
                style={styles.input}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Enter first name"
                placeholderTextColor={theme.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Last Name</Text>
              <TextInput
                style={styles.input}
                value={lastName}
                onChangeText={setLastName}
                placeholder="Enter last name"
                placeholderTextColor={theme.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={[styles.input, styles.inputDisabled]}
                value={email}
                editable={false}
                placeholder="Email address"
                placeholderTextColor={theme.textSecondary}
              />
              <Text style={styles.inputHint}>Email cannot be changed</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="(555) 123-4567"
                placeholderTextColor={theme.textSecondary}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Date of Birth</Text>
              <TextInput
                style={styles.input}
                value={dateOfBirth}
                onChangeText={setDateOfBirth}
                placeholder="MM/DD/YYYY"
                placeholderTextColor={theme.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Gender</Text>
              <View style={styles.optionsRow}>
                {genderOptions.map((option) => (
                  <Pressable
                    key={option}
                    style={[
                      styles.optionChip,
                      gender === option.toLowerCase() && styles.optionChipSelected,
                    ]}
                    onPress={() => setGender(option.toLowerCase())}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        gender === option.toLowerCase() && styles.optionTextSelected,
                      ]}
                    >
                      {option}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>

          {/* Physical Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Physical Information</Text>
            
            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>Height (inches)</Text>
                <TextInput
                  style={styles.input}
                  value={height}
                  onChangeText={setHeight}
                  placeholder="e.g., 68"
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="numeric"
                />
              </View>

              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>Weight (lbs)</Text>
                <TextInput
                  style={styles.input}
                  value={weight}
                  onChangeText={setWeight}
                  placeholder="e.g., 150"
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>

          {/* Save Button */}
          <Pressable
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <SvgIcon name="checkmark" size={20} color="#fff" />
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </>
            )}
          </Pressable>

          <View style={{ height: 40 }} />
        </View>
      )}
    </ScrollView>
  );

  if (isWeb) {
    return (
      <View style={[styles.container, { minHeight: '100vh' } as any]}>
        <WebNavHeader 
          activePage="profile" 
          showLoginModal={showLoginModal}
          setShowLoginModal={setShowLoginModal}
        />
        <View style={[styles.webContent, { height: 'calc(100vh - 70px)', overflow: 'auto' } as any]}>
          {content}
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {content}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  } as any,
  webContent: {
    flex: 1,
    maxWidth: 800,
    width: '100%',
    alignSelf: 'center',
  } as any,
  scrollView: {
    flex: 1,
  } as any,
  contentContainer: {
    padding: 16,
    paddingBottom: isWeb ? 100 : 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    marginBottom: 8,
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.text,
  },
  headerSpacer: {
    width: 40,
  },
  webPageTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 24,
    marginTop: 0,
  },
  webHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
    marginTop: 8,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: theme.textSecondary,
  },
  formContainer: {
    flex: 1,
  },
  section: {
    backgroundColor: theme.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.cardBorder,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: theme.inputBg,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: theme.text,
    borderWidth: 1,
    borderColor: theme.cardBorder,
  },
  inputDisabled: {
    backgroundColor: '#e5e7eb',
    color: theme.textSecondary,
  },
  inputHint: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: theme.inputBg,
    borderWidth: 1,
    borderColor: theme.cardBorder,
  },
  optionChipSelected: {
    backgroundColor: theme.accent,
    borderColor: theme.accent,
  },
  optionText: {
    fontSize: 14,
    color: theme.text,
  },
  optionTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.accent,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});

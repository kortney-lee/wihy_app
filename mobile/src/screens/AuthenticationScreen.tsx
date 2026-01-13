import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { useAuth } from '../context/AuthContext';

const AuthenticationScreen = ({ navigation }: { navigation: any }) => {
  const { signIn, loading } = useAuth();
  const [showLocalAuth, setShowLocalAuth] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLocalLogin = async () => {
    if (!email || !password) {
      Alert.alert('Required', 'Please enter email and password');
      return;
    }

    try {
      setError(null);
      await signIn('email', { email, password });
      Alert.alert('Success', 'Logged in successfully');
    } catch (err: any) {
      const errorMessage = err?.message || 'Login failed';
      setError(errorMessage);
      Alert.alert('Login Failed', errorMessage);
    }
  };

  const handleLocalRegister = async () => {
    if (!email || !password || !name) {
      Alert.alert('Required', 'Please fill in all fields');
      return;
    }

    try {
      setError(null);
      await signIn('email', { email, password, name, isRegister: true });
      Alert.alert('Success', 'Account created successfully');
    } catch (err: any) {
      const errorMessage = err?.message || 'Registration failed';
      setError(errorMessage);
      Alert.alert('Registration Failed', errorMessage);
    }
  };

  const handleOAuthLogin = async (provider: string) => {
    try {
      setError(null);
      await signIn(provider);
      // User will be redirected back via deep linking
    } catch (err: any) {
      const errorMessage = err?.message || `${provider} login failed`;
      setError(errorMessage);
      Alert.alert(`${provider} Login Failed`, errorMessage);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>WIHY</Text>
          <Text style={styles.subtitle}>Health & Wellness</Text>
        </View>

        {!showLocalAuth ? (
          <View style={styles.oauthContainer}>
            <Text style={styles.sectionTitle}>Sign In With</Text>

            <TouchableOpacity
              style={[styles.button, styles.googleButton]}
              onPress={() => handleOAuthLogin('google')}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Google</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.facebookButton]}
              onPress={() => handleOAuthLogin('facebook')}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Facebook</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.microsoftButton]}
              onPress={() => handleOAuthLogin('microsoft')}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Microsoft</Text>
              )}
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.line} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.line} />
            </View>

            <TouchableOpacity
              style={[styles.button, styles.emailButton]}
              onPress={() => setShowLocalAuth(true)}
            >
              <Text style={styles.buttonText}>Sign In With Email</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.localAuthContainer}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                setShowLocalAuth(false);
                setIsRegistering(false);
              }}
            >
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>

            <Text style={styles.sectionTitle}>
              {isRegistering ? 'Create Account' : 'Sign In'}
            </Text>

            {isRegistering && (
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                placeholderTextColor="#999"
                value={name}
                onChangeText={setName}
                editable={!loading}
              />
            )}

            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
            />

            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!loading}
            />

            <TouchableOpacity
              style={styles.button}
              onPress={isRegistering ? handleLocalRegister : handleLocalLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>
                  {isRegistering ? 'Create Account' : 'Sign In'}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setIsRegistering(!isRegistering)}
            >
              <Text style={styles.switchAuthText}>
                {isRegistering
                  ? 'Already have an account? Sign In'
                  : "Don't have an account? Sign Up"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  oauthContainer: {
    gap: 12,
  },
  localAuthContainer: {
    gap: 12,
  },
  button: {
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleButton: {
    backgroundColor: '#4285F4',
  },
  facebookButton: {
    backgroundColor: '#1877F2',
  },
  microsoftButton: {
    backgroundColor: '#0078D4',
  },
  emailButton: {
    backgroundColor: '#666',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  dividerText: {
    marginHorizontal: 12,
    color: '#999',
    fontSize: 14,
  },
  input: {
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#333',
  },
  backButton: {
    padding: 8,
    marginBottom: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#0066cc',
    fontWeight: '600',
  },
  switchAuthText: {
    textAlign: 'center',
    color: '#0066cc',
    fontSize: 14,
    marginTop: 8,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default AuthenticationScreen;

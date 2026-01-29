import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import MultiAuthLogin from '../components/auth/MultiAuthLogin';
import { colors } from '../theme/design-tokens';

export default function Login() {
  const { user } = useContext(AuthContext);
  const { theme } = useTheme();
  const [showAuth, setShowAuth] = useState(false);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome to WIHY</Text>
        <Text style={styles.subtitle}>
          Sign in to continue your health journey.
        </Text>

        {user ? (
          <Text style={styles.signedInText}>You are already signed in as {user.email}</Text>
        ) : (
          <Pressable style={styles.cta} onPress={() => setShowAuth(true)}>
            <Text style={styles.ctaText}>Continue</Text>
          </Pressable>
        )}
      </View>

      <MultiAuthLogin
        visible={showAuth}
        onClose={() => setShowAuth(false)}
        onSignIn={() => setShowAuth(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 20,
  },
  signedInText: {
    fontSize: 16,
    color: colors.text,
  },
  cta: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 28,
    paddingVertical: 14,
  },
  ctaText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});

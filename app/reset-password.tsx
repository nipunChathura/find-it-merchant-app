import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AppInput } from '@/components/ui/AppInput';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    setError('');
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      // TODO: call authService.resetPassword({ token, newPassword, confirmPassword })
      await new Promise((r) => setTimeout(r, 800));
      router.replace('/login');
    } catch {
      setError('Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ThemedView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboard}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <ThemedText type="title" style={styles.title}>
              Reset password
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              Enter your new password below.
            </ThemedText>

            <AppInput
              placeholder="New Password"
              value={newPassword}
              onChangeText={(t) => { setNewPassword(t); setError(''); }}
              secureTextEntry
              editable={!loading}
              style={styles.input}
            />
            <AppInput
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChangeText={(t) => { setConfirmPassword(t); setError(''); }}
              secureTextEntry
              editable={!loading}
              style={styles.input}
            />

            {error ? (
              <Text style={styles.error}>{error}</Text>
            ) : null}

            <PrimaryButton
              title="Reset Password"
              onPress={handleReset}
              loading={loading}
              disabled={loading}
            />

            <Text
              style={styles.link}
              onPress={() => router.replace('/login')}
            >
              Back to Sign in
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1 },
  keyboard: { flex: 1 },
  scroll: {
    padding: spacing.page,
    paddingBottom: spacing.xxxl,
  },
  title: { marginBottom: spacing.xs },
  subtitle: {
    marginBottom: spacing.xl,
    color: colors.textSecondary,
  },
  input: { marginBottom: spacing.md },
  error: {
    color: colors.error,
    marginBottom: spacing.sm,
    fontSize: 14,
  },
  link: {
    color: colors.primary,
    marginTop: spacing.lg,
    textAlign: 'center',
    fontSize: 14,
  },
});

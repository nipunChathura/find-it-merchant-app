import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { ScreenContainer } from '@/components/dashboard';
import { ThemedText } from '@/components/themed-text';
import { AppInput } from '@/components/ui/AppInput';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export default function ChangePasswordScreen() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setError('');
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 500));
      router.back();
    } catch {
      setError('Update failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <ThemedText type="title" style={styles.title}>
        Change Password
      </ThemedText>
      <AppInput
        placeholder="Current Password"
        value={currentPassword}
        onChangeText={setCurrentPassword}
        secureTextEntry
        editable={!loading}
        style={styles.input}
      />
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
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <PrimaryButton title="Update Password" onPress={handleSave} loading={loading} disabled={loading} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { marginBottom: spacing.xl },
  input: { marginBottom: spacing.md },
  error: {
    color: colors.error,
    marginBottom: spacing.sm,
    fontSize: 14,
  },
});

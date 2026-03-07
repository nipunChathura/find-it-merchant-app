import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';

import { ScreenContainer } from '@/components/dashboard';
import { ThemedText } from '@/components/themed-text';
import { AppInput } from '@/components/ui/AppInput';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { useAuth } from '@/context/auth-context';
import { colors } from '@/theme/colors';
import { layout, spacing } from '@/theme/spacing';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState(user?.username ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setError('');
    if (!name.trim()) {
      setError('Enter name');
      return;
    }
    setLoading(true);
    try {
      await updateProfile({ username: name.trim(), email: email.trim() || undefined, phone: phone.trim() || undefined });
      router.back();
    } catch {
      setError('Update failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <ThemedText type="title" style={styles.title}>
          Edit Profile
        </ThemedText>
        <AppInput
          placeholder="Name"
          value={name}
          onChangeText={(t) => { setName(t); setError(''); }}
          editable={!loading}
          style={styles.input}
        />
        <AppInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!loading}
          style={styles.input}
        />
        <AppInput
          placeholder="Phone number"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          editable={!loading}
          style={styles.input}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <PrimaryButton title="Save" onPress={handleSave} loading={loading} disabled={loading} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: layout.contentPaddingHorizontal,
    paddingTop: spacing.page,
    paddingBottom: spacing.xxxl,
  },
  title: { marginBottom: spacing.xl },
  input: { marginBottom: spacing.md },
  error: {
    color: colors.error,
    marginBottom: spacing.sm,
    fontSize: 14,
  },
});

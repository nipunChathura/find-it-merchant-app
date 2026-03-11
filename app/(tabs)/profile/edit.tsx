import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';

import { ScreenContainer } from '@/components/dashboard';
import { ThemedText } from '@/components/themed-text';
import { AppInput } from '@/components/ui/AppInput';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { useAuth } from '@/context/auth-context';
import { authService } from '@/services/authService';
import { colors } from '@/theme/colors';
import { layout, spacing } from '@/theme/spacing';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, updateProfile } = useAuth();
  const merchant = user?.role === 'SUBMERCHANT' ? user.subMerchantInfo : user?.mainMerchantInfo;

  const [merchantName, setMerchantName] = useState(merchant?.merchantName ?? user?.username ?? '');
  const [merchantEmail, setMerchantEmail] = useState(merchant?.merchantEmail ?? user?.email ?? '');
  const [merchantPhone, setMerchantPhone] = useState(merchant?.merchantPhoneNumber ?? user?.phone ?? '');
  const [merchantNic, setMerchantNic] = useState(merchant?.merchantNic ?? '');
  const [merchantAddress, setMerchantAddress] = useState(merchant?.merchantAddress ?? '');
  const [merchantType, setMerchantType] = useState(merchant?.merchantType ?? 'SILVER');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setError('');
    if (!merchantName.trim()) {
      setError('Enter merchant name');
      return;
    }
    if (!merchantEmail.trim()) {
      setError('Enter email');
      return;
    }
    setLoading(true);
    try {
      await authService.updateMerchantProfile({
        merchantName: merchantName.trim(),
        merchantEmail: merchantEmail.trim(),
        merchantNic: merchantNic.trim() || '',
        merchantProfileImage: user?.profileImage ?? null,
        merchantAddress: merchantAddress.trim() || '',
        merchantPhoneNumber: merchantPhone.trim() || '',
        merchantType: merchantType.trim() || 'SILVER',
      });
      const merchantUpdate = {
        merchantName: merchantName.trim(),
        merchantEmail: merchantEmail.trim(),
        merchantNic: merchantNic.trim() || undefined,
        merchantAddress: merchantAddress.trim() || undefined,
        merchantPhoneNumber: merchantPhone.trim() || undefined,
        merchantType: merchantType.trim() || 'SILVER',
      };
      updateProfile({
        email: merchantEmail.trim(),
        phone: merchantPhone.trim() || undefined,
        mainMerchantInfo: user?.role === 'MERCHANT' ? merchantUpdate : undefined,
        subMerchantInfo: user?.role === 'SUBMERCHANT' ? merchantUpdate : undefined,
      });
      router.back();
    } catch (err: unknown) {
      const data = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { responseMessage?: string } } }).response?.data
        : undefined;
      setError(typeof data?.responseMessage === 'string' ? data.responseMessage : 'Update failed');
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
          placeholder="Merchant name"
          value={merchantName}
          onChangeText={(t) => { setMerchantName(t); setError(''); }}
          editable={!loading}
          style={styles.input}
        />
        <AppInput
          placeholder="Email"
          value={merchantEmail}
          onChangeText={(t) => { setMerchantEmail(t); setError(''); }}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!loading}
          style={styles.input}
        />
        <AppInput
          placeholder="Phone number"
          value={merchantPhone}
          onChangeText={(t) => { setMerchantPhone(t); setError(''); }}
          keyboardType="phone-pad"
          editable={!loading}
          style={styles.input}
        />
        <AppInput
          placeholder="NIC"
          value={merchantNic}
          onChangeText={(t) => { setMerchantNic(t); setError(''); }}
          editable={!loading}
          style={styles.input}
        />
        <AppInput
          placeholder="Address"
          value={merchantAddress}
          onChangeText={(t) => { setMerchantAddress(t); setError(''); }}
          editable={!loading}
          style={styles.input}
        />
        <AppInput
          placeholder="Merchant type (e.g. SILVER, GOLD, PLATINUM)"
          value={merchantType}
          onChangeText={(t) => { setMerchantType(t); setError(''); }}
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

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AppInput } from '@/components/ui/AppInput';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { authService } from '@/services/authService';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

const MERCHANT_TYPES = ['SILVER', 'GOLD', 'PLATINUM'] as const;

export default function RegisterScreen() {
  const router = useRouter();
  const [merchantName, setMerchantName] = useState('');
  const [merchantEmail, setMerchantEmail] = useState('');
  const [merchantNic, setMerchantNic] = useState('');
  const [merchantAddress, setMerchantAddress] = useState('');
  const [merchantPhoneNumber, setMerchantPhoneNumber] = useState('');
  const [merchantType, setMerchantType] = useState<string>('SILVER');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setError('');
    if (!merchantName.trim()) {
      setError('Enter merchant name');
      return;
    }
    if (!merchantEmail.trim()) {
      setError('Enter email');
      return;
    }
    if (!merchantNic.trim()) {
      setError('Enter NIC');
      return;
    }
    if (!merchantAddress.trim()) {
      setError('Enter address');
      return;
    }
    if (!merchantPhoneNumber.trim()) {
      setError('Enter phone number');
      return;
    }
    if (!username.trim()) {
      setError('Enter username');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const { data } = await authService.merchantOnboarding({
        merchantName: merchantName.trim(),
        merchantEmail: merchantEmail.trim(),
        merchantNic: merchantNic.trim(),
        merchantProfileImage: null,
        merchantAddress: merchantAddress.trim(),
        merchantPhoneNumber: merchantPhoneNumber.trim(),
        merchantType,
        username: username.trim(),
        password,
      });
      if (data.status === 'success') {
        router.replace('/login');
      } else {
        setError(data.responseMessage ?? 'Registration failed');
      }
    } catch (e: unknown) {
      let msg = 'Registration failed';
      if (e && typeof e === 'object' && 'response' in e) {
        const res = (e as { response?: { data?: { responseMessage?: string } } }).response;
        if (res?.data?.responseMessage) msg = res.data.responseMessage;
      } else if (e instanceof Error) msg = e.message;
      setError(msg);
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
              Create account
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              Register as Main Merchant
            </ThemedText>

            <View style={styles.noteBox}>
              <MaterialIcons name="info-outline" size={20} color={colors.primary} style={styles.noteIcon} />
              <Text style={styles.noteText}>
                This registration is for main merchants only. Sub-merchant onboarding option is not available.
              </Text>
            </View>

            <AppInput
              placeholder="Merchant Name *"
              value={merchantName}
              onChangeText={(t) => { setMerchantName(t); setError(''); }}
              autoCapitalize="words"
              editable={!loading}
              style={styles.input}
            />
            <AppInput
              placeholder="Merchant Email *"
              value={merchantEmail}
              onChangeText={(t) => { setMerchantEmail(t); setError(''); }}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
              style={styles.input}
            />
            <AppInput
              placeholder="NIC *"
              value={merchantNic}
              onChangeText={(t) => { setMerchantNic(t); setError(''); }}
              editable={!loading}
              style={styles.input}
            />
            <AppInput
              placeholder="Address *"
              value={merchantAddress}
              onChangeText={(t) => { setMerchantAddress(t); setError(''); }}
              editable={!loading}
              style={styles.input}
            />
            <AppInput
              placeholder="Phone Number *"
              value={merchantPhoneNumber}
              onChangeText={(t) => { setMerchantPhoneNumber(t); setError(''); }}
              keyboardType="phone-pad"
              editable={!loading}
              style={styles.input}
            />

            <ThemedText style={styles.label}>Merchant Type</ThemedText>
            <View style={styles.typeRow}>
              {MERCHANT_TYPES.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.typeBtn, merchantType === type && styles.typeBtnActive]}
                  onPress={() => setMerchantType(type)}
                  disabled={loading}
                >
                  <Text style={[styles.typeBtnText, merchantType === type && styles.typeBtnTextActive]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <AppInput
              placeholder="Username *"
              value={username}
              onChangeText={(t) => { setUsername(t); setError(''); }}
              autoCapitalize="none"
              editable={!loading}
              style={styles.input}
            />
            <AppInput
              placeholder="Password * (min 6 characters)"
              value={password}
              onChangeText={(t) => { setPassword(t); setError(''); }}
              secureTextEntry
              editable={!loading}
              style={styles.input}
            />
            <AppInput
              placeholder="Confirm Password *"
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
              title="Register"
              onPress={handleRegister}
              loading={loading}
              disabled={loading}
            />

            <Text
              style={styles.link}
              onPress={() => router.replace('/login')}
            >
              Already have an account? Sign in
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
    marginBottom: spacing.sm,
    color: colors.textSecondary,
  },
  noteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.primary + '14',
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.xl,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  noteIcon: {
    marginRight: spacing.sm,
    marginTop: 2,
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  label: {
    marginBottom: spacing.xs,
    fontSize: 14,
  },
  typeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.border,
    alignItems: 'center',
  },
  typeBtnActive: {
    backgroundColor: colors.primary,
  },
  typeBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  typeBtnTextActive: {
    color: colors.white,
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

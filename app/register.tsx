import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
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

const DEFAULT_MERCHANT_TYPE = 'FREE';

export default function RegisterScreen() {
  const router = useRouter();
  const [merchantName, setMerchantName] = useState('');
  const [merchantEmail, setMerchantEmail] = useState('');
  const [merchantNic, setMerchantNic] = useState('');
  const [merchantAddress, setMerchantAddress] = useState('');
  const [merchantPhoneNumber, setMerchantPhoneNumber] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
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
        merchantType: DEFAULT_MERCHANT_TYPE,
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

            <AppInput
              placeholder="Username *"
              value={username}
              onChangeText={(t) => { setUsername(t); setError(''); }}
              autoCapitalize="none"
              editable={!loading}
              style={styles.input}
            />
            <View style={styles.passwordField}>
              <AppInput
                placeholder="Password * (min 6 characters)"
                value={password}
                onChangeText={(t) => { setPassword(t); setError(''); }}
                secureTextEntry={!passwordVisible}
                editable={!loading}
                style={[styles.input, styles.passwordInput]}
                autoCapitalize="none"
              />
              <Pressable
                style={({ pressed }) => [styles.passwordToggle, pressed && styles.passwordTogglePressed]}
                onPress={() => setPasswordVisible((v) => !v)}
                disabled={loading}
                hitSlop={8}
                accessibilityLabel={passwordVisible ? 'Hide password' : 'Show password'}
              >
                <MaterialIcons
                  name={passwordVisible ? 'visibility-off' : 'visibility'}
                  size={22}
                  color={colors.textSecondary}
                />
              </Pressable>
            </View>
            <View style={styles.passwordField}>
              <AppInput
                placeholder="Confirm Password *"
                value={confirmPassword}
                onChangeText={(t) => { setConfirmPassword(t); setError(''); }}
                secureTextEntry={!confirmPasswordVisible}
                editable={!loading}
                style={[styles.input, styles.passwordInput]}
                autoCapitalize="none"
              />
              <Pressable
                style={({ pressed }) => [styles.passwordToggle, pressed && styles.passwordTogglePressed]}
                onPress={() => setConfirmPasswordVisible((v) => !v)}
                disabled={loading}
                hitSlop={8}
                accessibilityLabel={confirmPasswordVisible ? 'Hide confirm password' : 'Show confirm password'}
              >
                <MaterialIcons
                  name={confirmPasswordVisible ? 'visibility-off' : 'visibility'}
                  size={22}
                  color={colors.textSecondary}
                />
              </Pressable>
            </View>

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
  input: { marginBottom: spacing.md },
  passwordField: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  passwordInput: {
    marginBottom: 0,
    paddingRight: 46,
  },
  passwordToggle: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 44,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  passwordTogglePressed: {
    opacity: 0.65,
  },
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

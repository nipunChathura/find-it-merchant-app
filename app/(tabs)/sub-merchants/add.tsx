import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppInput } from '@/components/ui/AppInput';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { useAuth } from '@/context/auth-context';
import {
    createSubMerchant,
    type CreateSubMerchantPayload,
} from '@/services/subMerchantService';
import { colors } from '@/theme/colors';
import { borderRadius, cardRadius, spacing } from '@/theme/spacing';
import { fontSizes, fontWeights } from '@/theme/typography';

export default function AddSubMerchantScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const merchantId = user?.merchantId ?? 0;

  const [merchantName, setMerchantName] = useState('');
  const [merchantEmail, setMerchantEmail] = useState('');
  const [merchantAddress, setMerchantAddress] = useState('');
  const [merchantPhoneNumber, setMerchantPhoneNumber] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError('');
    const name = merchantName.trim();
    const email = merchantEmail.trim();
    const address = merchantAddress.trim();
    const phone = merchantPhoneNumber.trim();
    const user = username.trim();
    const pass = password;

    if (!name) {
      setError('Merchant name is required');
      return;
    }
    if (!email) {
      setError('Email is required');
      return;
    }
    if (!address) {
      setError('Address is required');
      return;
    }
    if (!phone) {
      setError('Phone number is required');
      return;
    }
    if (!user) {
      setError('Username is required');
      return;
    }
    if (!pass) {
      setError('Password is required');
      return;
    }
    if (pass.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (!merchantId) {
      setError('Merchant not found. Please sign in again.');
      return;
    }

    setLoading(true);
    try {
      const payload: CreateSubMerchantPayload = {
        merchantName: name,
        merchantEmail: email,
        merchantNic: null,
        merchantProfileImage: null,
        merchantAddress: address,
        merchantPhoneNumber: phone,
        merchantType: 'SILVER',
        parentMerchantId: merchantId,
        username: user,
        password: pass,
      };
      await createSubMerchant(payload);
      router.back();
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'response' in e
          ? (e as { response?: { data?: { responseMessage?: string } } }).response?.data
              ?.responseMessage
          : null;
      setError(msg || 'Failed to add sub merchant');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backRow}
          hitSlop={12}
        >
          <MaterialIcons name="arrow-back" size={24} color={colors.primary} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <View style={styles.headerTitles}>
          <Text style={styles.headerTitle}>Add Sub Merchant</Text>
          <Text style={styles.headerSubtitle}>
            Register a new sub merchant for your outlets
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboard}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <View style={styles.cardAccent} />
            <View style={styles.cardInner}>
              <View style={styles.sectionLabel}>
                <MaterialIcons name="person-outline" size={20} color={colors.primary} />
                <Text style={styles.sectionLabelText}>Details</Text>
              </View>

              <Text style={styles.label}>Merchant name *</Text>
              <AppInput
                placeholder="e.g. Branch A"
                value={merchantName}
                onChangeText={(t) => {
                  setMerchantName(t);
                  setError('');
                }}
                editable={!loading}
                style={styles.input}
              />

              <Text style={styles.label}>Email *</Text>
              <AppInput
                placeholder="e.g. brancha@example.com"
                value={merchantEmail}
                onChangeText={(t) => {
                  setMerchantEmail(t);
                  setError('');
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
                style={styles.input}
              />

              <Text style={styles.label}>Phone number *</Text>
              <AppInput
                placeholder="e.g. 0779876543"
                value={merchantPhoneNumber}
                onChangeText={(t) => {
                  setMerchantPhoneNumber(t);
                  setError('');
                }}
                keyboardType="phone-pad"
                editable={!loading}
                style={styles.input}
              />

              <Text style={styles.label}>Address *</Text>
              <AppInput
                placeholder="e.g. 50 Branch Rd"
                value={merchantAddress}
                onChangeText={(t) => {
                  setMerchantAddress(t);
                  setError('');
                }}
                editable={!loading}
                style={styles.input}
              />

              <View style={[styles.sectionLabel, styles.sectionLabelTop]}>
                <MaterialIcons name="lock-outline" size={20} color={colors.primary} />
                <Text style={styles.sectionLabelText}>Login credentials</Text>
              </View>
              <Text style={styles.label}>Username *</Text>
              <AppInput
                placeholder="e.g. branch_user"
                value={username}
                onChangeText={(t) => {
                  setUsername(t);
                  setError('');
                }}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
                style={styles.input}
              />
              <Text style={styles.label}>Password *</Text>
              <AppInput
                placeholder="Min 6 characters"
                value={password}
                onChangeText={(t) => {
                  setPassword(t);
                  setError('');
                }}
                secureTextEntry
                editable={!loading}
                style={styles.input}
              />
            </View>
          </View>

          {error ? (
            <View style={styles.errorWrap}>
              <MaterialIcons name="error-outline" size={18} color={colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <PrimaryButton
            title={loading ? 'Adding…' : 'Add Sub Merchant'}
            onPress={handleSubmit}
            loading={loading}
            disabled={loading}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: spacing.page,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  backText: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.medium,
    color: colors.primary,
  },
  headerTitles: {
    gap: spacing.xs,
  },
  headerTitle: {
    fontSize: fontSizes.xxl,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
  keyboard: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.page,
    paddingBottom: spacing.xxxl,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: cardRadius,
    marginBottom: spacing.xl,
    overflow: 'hidden',
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardAccent: {
    width: 4,
    backgroundColor: colors.primary,
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
  },
  cardInner: {
    flex: 1,
    padding: spacing.lg,
  },
  sectionLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  sectionLabelText: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.semibold,
    color: colors.textPrimary,
  },
  sectionLabelTop: {
    marginTop: spacing.lg,
  },
  label: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  input: {
    marginBottom: spacing.md,
  },
  errorWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.errorBg,
    borderRadius: borderRadius.md,
  },
  errorText: {
    flex: 1,
    fontSize: fontSizes.sm,
    color: colors.error,
    fontWeight: fontWeights.medium,
  },
});

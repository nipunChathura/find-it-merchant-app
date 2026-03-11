import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
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
import { useDashboardData } from '@/hooks/useDashboardData';
import { useRole } from '@/hooks/useRole';
import { updateSubMerchant } from '@/services/subMerchantService';
import { colors } from '@/theme/colors';
import { borderRadius, cardRadius, layout, spacing } from '@/theme/spacing';
import { fontSizes, fontWeights } from '@/theme/typography';

export default function EditSubMerchantScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const role = useRole();
  const { subMerchants, refresh } = useDashboardData();

  const subMerchantId = id != null ? parseInt(id, 10) : NaN;
  const existing = Number.isNaN(subMerchantId)
    ? undefined
    : subMerchants.find((sm) => sm.subMerchantId === subMerchantId);

  const [merchantName, setMerchantName] = useState('');
  const [merchantEmail, setMerchantEmail] = useState('');
  const [merchantAddress, setMerchantAddress] = useState('');
  const [merchantPhoneNumber, setMerchantPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (existing) {
      setMerchantName(existing.merchantName ?? '');
      setMerchantEmail(existing.merchantEmail ?? '');
      setMerchantAddress(existing.merchantAddress ?? '');
      setMerchantPhoneNumber(existing.merchantPhoneNumber ?? '');
    }
  }, [existing?.subMerchantId, existing?.merchantName, existing?.merchantEmail, existing?.merchantAddress, existing?.merchantPhoneNumber]);

  if (role !== 'MERCHANT') {
    return (
      <View style={styles.screen}>
        <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
          <Pressable onPress={() => router.back()} style={styles.backRow} hitSlop={12}>
            <MaterialIcons name="arrow-back" size={24} color={colors.primary} />
            <Text style={styles.backText}>Back</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Edit Sub Merchant</Text>
        </View>
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Only main merchants can edit sub merchant details.</Text>
        </View>
      </View>
    );
  }

  if (!existing) {
    return (
      <View style={styles.screen}>
        <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
          <Pressable onPress={() => router.back()} style={styles.backRow} hitSlop={12}>
            <MaterialIcons name="arrow-back" size={24} color={colors.primary} />
            <Text style={styles.backText}>Back</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Edit Sub Merchant</Text>
        </View>
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Sub merchant not found.</Text>
        </View>
      </View>
    );
  }

  const handleSubmit = async () => {
    setError('');
    const name = merchantName.trim();
    const email = merchantEmail.trim();
    const address = merchantAddress.trim();
    const phone = merchantPhoneNumber.trim();
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
    setLoading(true);
    try {
      await updateSubMerchant(existing.subMerchantId, {
        merchantName: name,
        merchantEmail: email,
        merchantAddress: address,
        merchantPhoneNumber: phone,
      });
      refresh();
      router.back();
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'response' in e
          ? (e as { response?: { data?: { responseMessage?: string } } }).response?.data
              ?.responseMessage
          : null;
      setError(msg || 'Failed to update sub merchant.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Pressable onPress={() => router.back()} style={styles.backRow} hitSlop={12}>
          <MaterialIcons name="arrow-back" size={24} color={colors.primary} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <View style={styles.headerTitles}>
          <Text style={styles.headerTitle}>Change details</Text>
          <Text style={styles.headerSubtitle}>Update sub merchant information</Text>
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
                onChangeText={(t) => { setMerchantName(t); setError(''); }}
                editable={!loading}
                style={styles.input}
              />
              <Text style={styles.label}>Email *</Text>
              <AppInput
                placeholder="e.g. branch@example.com"
                value={merchantEmail}
                onChangeText={(t) => { setMerchantEmail(t); setError(''); }}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
                style={styles.input}
              />
              <Text style={styles.label}>Phone number *</Text>
              <AppInput
                placeholder="e.g. 0779876543"
                value={merchantPhoneNumber}
                onChangeText={(t) => { setMerchantPhoneNumber(t); setError(''); }}
                keyboardType="phone-pad"
                editable={!loading}
                style={styles.input}
              />
              <Text style={styles.label}>Address *</Text>
              <AppInput
                placeholder="e.g. 50 Branch Rd"
                value={merchantAddress}
                onChangeText={(t) => { setMerchantAddress(t); setError(''); }}
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
            title={loading ? 'Saving…' : 'Save changes'}
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
  screen: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: spacing.page,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  backText: { fontSize: fontSizes.base, fontWeight: fontWeights.medium, color: colors.primary },
  headerTitle: {
    fontSize: fontSizes.xxl,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  headerSubtitle: { fontSize: fontSizes.sm, color: colors.textSecondary, marginTop: spacing.xs },
  headerTitles: { gap: spacing.xs },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xxl },
  emptyText: { fontSize: fontSizes.base, color: colors.textSecondary, textAlign: 'center' },
  keyboard: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: layout.contentPaddingHorizontal,
    paddingTop: spacing.page,
    paddingBottom: spacing.xxxl,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: cardRadius,
    marginBottom: spacing.lg,
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
  cardInner: { flex: 1, padding: spacing.lg },
  sectionLabel: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.lg },
  sectionLabelText: { fontSize: fontSizes.lg, fontWeight: fontWeights.semibold, color: colors.textPrimary },
  label: { fontSize: fontSizes.sm, fontWeight: fontWeights.medium, color: colors.textSecondary, marginBottom: spacing.xs },
  input: { marginBottom: spacing.md },
  errorWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.errorBg,
    borderRadius: borderRadius.md,
  },
  errorText: { flex: 1, fontSize: fontSizes.sm, color: colors.error, fontWeight: fontWeights.medium },
});

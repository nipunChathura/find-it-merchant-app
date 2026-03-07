import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    Alert,
    Image,
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
import { SearchableDropdown, type DropdownOption } from '@/components/ui/SearchableDropdown';
import { useAuth } from '@/context/auth-context';
import { useRole } from '@/hooks/useRole';
import { fetchAssignedOutlets } from '@/services/outletService';
import { submitPayment, uploadImage } from '@/services/paymentService';
import { colors } from '@/theme/colors';
import { borderRadius, cardRadius, layout, spacing } from '@/theme/spacing';
import { fontSizes, fontWeights } from '@/theme/typography';
import type { Outlet } from '@/types';

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function formatMonth(date: Date): string {
  return date.toISOString().slice(0, 7);
}

export default function SubmitPaymentScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const role = useRole();
  const merchantId = user?.merchantId;
  const subMerchantId = user?.subMerchantId;

  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [outletsLoading, setOutletsLoading] = useState(true);
  const [selectedOutlet, setSelectedOutlet] = useState<DropdownOption | null>(null);
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(() => formatDate(new Date()));
  const [paidMonth, setPaidMonth] = useState(() => formatMonth(new Date()));
  const [receiptUri, setReceiptUri] = useState<string | null>(null);
  const [receiptImageName, setReceiptImageName] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const outletOptions: DropdownOption[] = outlets.map((o) => ({
    id: parseInt(o.id, 10),
    name: o.name,
  }));

  const loadOutlets = useCallback(async () => {
    setOutletsLoading(true);
    try {
      if (role === 'MERCHANT' && merchantId != null) {
        const list = await fetchAssignedOutlets({ merchantId });
        setOutlets(list);
      } else if (role === 'SUBMERCHANT' && subMerchantId != null) {
        const list = await fetchAssignedOutlets({ subMerchantId });
        setOutlets(list);
      } else {
        setOutlets([]);
      }
    } catch {
      setOutlets([]);
    } finally {
      setOutletsLoading(false);
    }
  }, [role, merchantId, subMerchantId]);

  useEffect(() => {
    loadOutlets();
  }, [loadOutlets]);

  const pickAndUploadImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow access to photos to upload receipt.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;
    const uri = result.assets[0].uri;
    setReceiptUri(uri);
    setError('');
    setUploadingImage(true);
    try {
      const name = await uploadImage(uri, 'receipt');
      setReceiptImageName(name);
    } catch {
      setError('Failed to upload image.');
      setReceiptImageName(null);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async () => {
    setError('');
    if (!selectedOutlet) {
      setError('Select an outlet.');
      return;
    }
    const num = parseFloat(amount.replace(/,/g, ''));
    if (isNaN(num) || num < 0) {
      setError('Enter a valid amount.');
      return;
    }
    setLoading(true);
    try {
      await submitPayment({
        outletId: selectedOutlet.id as number,
        paymentType: 'SUBSCRIPTION',
        amount: num,
        paymentDate,
        paidMonth,
        receiptImage: receiptImageName ?? null,
        status: 'ACTIVE',
      });
      router.back();
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'response' in e
          ? (e as { response?: { data?: { responseMessage?: string } } }).response?.data
              ?.responseMessage
          : null;
      setError(msg || 'Failed to submit payment.');
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
          <Text style={styles.headerTitle}>Submit Payment</Text>
          <Text style={styles.headerSubtitle}>Record a new payment for an outlet</Text>
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
                <MaterialIcons name="store" size={20} color={colors.primary} />
                <Text style={styles.sectionLabelText}>Outlet</Text>
              </View>
              <Text style={styles.label}>Outlet *</Text>
              <SearchableDropdown
                options={outletOptions}
                selected={selectedOutlet}
                onSelect={setSelectedOutlet}
                placeholder={outletsLoading ? 'Loading…' : 'Select outlet'}
                searchPlaceholder="Search outlet"
                disabled={loading}
                loading={outletsLoading}
              />
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.cardAccent} />
            <View style={styles.cardInner}>
              <View style={styles.sectionLabel}>
                <MaterialIcons name="payment" size={20} color={colors.primary} />
                <Text style={styles.sectionLabelText}>Amount & dates</Text>
              </View>
              <Text style={styles.label}>Amount (LKR) *</Text>
              <AppInput
                placeholder="0.00"
                value={amount}
                onChangeText={(t) => { setAmount(t); setError(''); }}
                keyboardType="decimal-pad"
                editable={!loading}
                style={styles.input}
              />
              <Text style={styles.label}>Payment date</Text>
              <AppInput
                placeholder="YYYY-MM-DD"
                value={paymentDate}
                onChangeText={setPaymentDate}
                editable={!loading}
                style={styles.input}
              />
              <Text style={styles.label}>Paid month</Text>
              <AppInput
                placeholder="YYYY-MM"
                value={paidMonth}
                onChangeText={setPaidMonth}
                editable={!loading}
                style={styles.input}
              />
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.cardAccent} />
            <View style={styles.cardInner}>
              <View style={styles.sectionLabel}>
                <MaterialIcons name="receipt-long" size={20} color={colors.primary} />
                <Text style={styles.sectionLabelText}>Receipt (optional)</Text>
              </View>
              {receiptUri ? (
                <View style={styles.imageWrap}>
                  <Image source={{ uri: receiptUri }} style={styles.image} resizeMode="cover" />
                  {receiptImageName ? (
                    <Text style={styles.imageName} numberOfLines={1}>{receiptImageName}</Text>
                  ) : null}
                  <PrimaryButton
                    title={uploadingImage ? 'Uploading…' : 'Change image'}
                    onPress={pickAndUploadImage}
                    disabled={uploadingImage || loading}
                  />
                </View>
              ) : (
                <PrimaryButton
                  title={uploadingImage ? 'Uploading…' : 'Upload receipt'}
                  onPress={pickAndUploadImage}
                  disabled={uploadingImage || loading}
                />
              )}
            </View>
          </View>

          {error ? (
            <View style={styles.errorWrap}>
              <MaterialIcons name="error-outline" size={18} color={colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <PrimaryButton
            title={loading ? 'Submitting…' : 'Submit Payment'}
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
  headerTitles: { gap: spacing.xs },
  headerTitle: {
    fontSize: fontSizes.xxl,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  headerSubtitle: { fontSize: fontSizes.sm, color: colors.textSecondary },
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
  sectionLabel: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  sectionLabelText: { fontSize: fontSizes.lg, fontWeight: fontWeights.semibold, color: colors.textPrimary },
  label: { fontSize: fontSizes.sm, fontWeight: fontWeights.medium, color: colors.textSecondary, marginBottom: spacing.xs },
  input: { marginBottom: spacing.md },
  imageWrap: { marginTop: spacing.xs },
  image: { width: '100%', height: 180, borderRadius: borderRadius.md, marginBottom: spacing.sm },
  imageName: { fontSize: fontSizes.xs, color: colors.textSecondary, marginBottom: spacing.sm },
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

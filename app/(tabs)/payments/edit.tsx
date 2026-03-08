import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
import { AuthImage } from '@/components/ui/AuthImage';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SearchableDropdown, type DropdownOption } from '@/components/ui/SearchableDropdown';
import { useAuth } from '@/context/auth-context';
import { useRole } from '@/hooks/useRole';
import { fetchAssignedOutlets } from '@/services/outletService';
import {
    deletePayment,
    updatePayment,
    uploadImage,
    type OutletPaymentDetail,
    type UpdatePaymentPayload,
} from '@/services/paymentService';
import { colors } from '@/theme/colors';
import { borderRadius, cardRadius, layout, spacing } from '@/theme/spacing';
import { fontSizes, fontWeights } from '@/theme/typography';
import type { Outlet } from '@/types';

function parsePaymentFromParams(data?: string | null): OutletPaymentDetail | null {
  if (!data || typeof data !== 'string') return null;
  try {
    const parsed = JSON.parse(data) as OutletPaymentDetail;
    return parsed && typeof parsed.paymentId === 'number' ? parsed : null;
  } catch {
    return null;
  }
}

export default function EditPaymentScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ paymentData?: string }>();
  const payment = parsePaymentFromParams(params.paymentData);
  const { user, token } = useAuth();
  const role = useRole();
  const merchantId = user?.merchantId;
  const subMerchantId = user?.subMerchantId;

  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [outletsLoading, setOutletsLoading] = useState(true);
  const [selectedOutlet, setSelectedOutlet] = useState<DropdownOption | null>(null);
  const [paymentType, setPaymentType] = useState(payment?.paymentType ?? 'SUBSCRIPTION');
  const [amount, setAmount] = useState(payment?.amount != null ? String(payment.amount) : '');
  const [paymentDate, setPaymentDate] = useState(payment?.paymentDate ?? '');
  const [paidMonth, setPaidMonth] = useState(payment?.paidMonth ?? '');
  const [status, setStatus] = useState(payment?.paymentStatus ?? 'PENDING');
  const [receiptUri, setReceiptUri] = useState<string | null>(null);
  const [receiptImageName, setReceiptImageName] = useState<string | null>(payment?.receiptImage ?? null);
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

  useEffect(() => {
    if (!payment || outlets.length === 0) return;
    const found = outlets.find(
      (o) => o.id === String(payment.outletId) || parseInt(o.id, 10) === payment.outletId
    );
    if (found) {
      setSelectedOutlet((prev) =>
        prev ? prev : { id: payment.outletId, name: found.name }
      );
    }
  }, [payment, outlets]);

  const pickAndUploadImage = async () => {
    const { status: perm } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm !== 'granted') {
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

  const handleSave = async () => {
    if (!payment) return;
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
      const payload: UpdatePaymentPayload = {
        outletId: selectedOutlet.id as number,
        paymentType: paymentType.trim() || 'SUBSCRIPTION',
        amount: num,
        paymentDate: paymentDate.trim(),
        paidMonth: paidMonth.trim(),
        receiptImage: receiptImageName ?? null,
        status: status.trim() || 'PENDING',
      };
      await updatePayment(payment.paymentId, payload);
      router.back();
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'response' in e
          ? (e as { response?: { data?: { responseMessage?: string } } }).response?.data
              ?.responseMessage
          : null;
      setError(msg || 'Failed to update payment.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (!payment) return;
    Alert.alert(
      'Delete payment',
      'Are you sure you want to delete this payment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await deletePayment(payment.paymentId);
              router.back();
            } catch {
              setError('Failed to delete payment.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  if (!payment) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top + spacing.md }]}>
        <Pressable onPress={() => router.back()} style={styles.backRow}>
          <MaterialIcons name="arrow-back" size={24} color={colors.primary} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <Text style={styles.errorText}>Payment not found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Pressable onPress={() => router.back()} style={styles.backRow} hitSlop={12}>
          <MaterialIcons name="arrow-back" size={24} color={colors.primary} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <View style={styles.headerTitles}>
          <Text style={styles.headerTitle}>Edit Payment</Text>
          <Text style={styles.headerSubtitle}>Update or remove this payment</Text>
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
              <Text style={styles.sectionLabelText}>Outlet</Text>
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
              <Text style={styles.sectionLabelText}>Payment type</Text>
              <AppInput
                placeholder="e.g. SUBSCRIPTION"
                value={paymentType}
                onChangeText={(t) => { setPaymentType(t); setError(''); }}
                editable={!loading}
                style={styles.input}
              />
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
              <Text style={styles.label}>Status</Text>
              <AppInput
                placeholder="e.g. PENDING, PAID"
                value={status}
                onChangeText={setStatus}
                editable={!loading}
                style={styles.input}
              />
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.cardAccent} />
            <View style={styles.cardInner}>
              <Text style={styles.sectionLabelText}>Receipt</Text>
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
                <>
                  {receiptImageName && token ? (
                    <View style={styles.imageWrap}>
                      <AuthImage
                        type="receipt"
                        fileName={receiptImageName}
                        token={token}
                        style={styles.image}
                        resizeMode="cover"
                        placeholder={
                          <View style={styles.imagePlaceholder}>
                            <MaterialIcons name="receipt" size={48} color={colors.textSecondary} />
                            <Text style={styles.imageName}>Current: {receiptImageName}</Text>
                          </View>
                        }
                      />
                    </View>
                  ) : receiptImageName ? (
                    <Text style={styles.imageName}>Current: {receiptImageName}</Text>
                  ) : null}
                  <PrimaryButton
                    title={uploadingImage ? 'Uploading…' : receiptImageName ? 'Change receipt' : 'Upload receipt'}
                    onPress={pickAndUploadImage}
                    disabled={uploadingImage || loading}
                  />
                </>
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
            title={loading ? 'Saving…' : 'Save changes'}
            onPress={handleSave}
            loading={loading}
            disabled={loading}
          />
          <Pressable
            onPress={handleDelete}
            disabled={loading}
            style={[styles.deleteBtn, loading && styles.deleteBtnDisabled]}
          >
            <MaterialIcons name="delete-outline" size={22} color={colors.error} />
            <Text style={styles.deleteBtnText}>Delete payment</Text>
          </Pressable>
          <View style={{ height: spacing.xxl }} />
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
  sectionLabelText: { fontSize: fontSizes.lg, fontWeight: fontWeights.semibold, color: colors.textPrimary, marginBottom: spacing.sm },
  label: { fontSize: fontSizes.sm, fontWeight: fontWeights.medium, color: colors.textSecondary, marginBottom: spacing.xs },
  input: { marginBottom: spacing.md },
  imageWrap: { marginTop: spacing.xs, marginBottom: spacing.sm },
  image: { width: '100%', height: 180, borderRadius: borderRadius.md },
  imagePlaceholder: { width: '100%', height: 180, borderRadius: borderRadius.md, backgroundColor: colors.border + '88', justifyContent: 'center', alignItems: 'center' },
  imageName: { fontSize: fontSizes.xs, color: colors.textSecondary, marginTop: spacing.xs, marginBottom: spacing.sm },
  errorWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.error + '18',
    borderRadius: borderRadius.md,
  },
  errorText: { flex: 1, fontSize: fontSizes.sm, color: colors.error, fontWeight: fontWeights.medium },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    marginTop: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.error + '88',
  },
  deleteBtnDisabled: { opacity: 0.5 },
  deleteBtnText: { fontSize: fontSizes.base, fontWeight: '600', color: colors.error },
});

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppInput } from '@/components/ui/AppInput';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import {
    createDiscount,
    type CreateOrUpdateDiscountPayload,
} from '@/services/discountService';
import { fetchItems, type ItemApiDto } from '@/services/itemService';
import { colors } from '@/theme/colors';
import { borderRadius, layout, spacing } from '@/theme/spacing';
import { fontSizes, fontWeights } from '@/theme/typography';

const DISCOUNT_TYPES: Array<'PERCENTAGE' | 'FIXED_AMOUNT'> = ['PERCENTAGE', 'FIXED_AMOUNT'];
const DISCOUNT_STATUSES = ['ACTIVE', 'INACTIVE'] as const;
const ITEM_SEARCH_RESULT_SIZE = 5;
const SEARCH_DEBOUNCE_MS = 350;

function toYYYYMMDD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const TODAY = toYYYYMMDD(new Date());

type SelectedItem = { itemId: number; itemName: string };

export default function AddDiscountScreen() {
  const insets = useSafeAreaInsets();
  const { outletId } = useLocalSearchParams<{ outletId: string }>();
  const router = useRouter();

  const [discountName, setDiscountName] = useState('');
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FIXED_AMOUNT'>('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState('');
  const [startDate, setStartDate] = useState(TODAY);
  const [endDate, setEndDate] = useState(TODAY);
  const [status, setStatus] = useState('ACTIVE');
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);

  const [itemSearchOpen, setItemSearchOpen] = useState(false);
  const [itemSearchQuery, setItemSearchQuery] = useState('');
  const [itemSearchResults, setItemSearchResults] = useState<ItemApiDto[]>([]);
  const [itemSearchLoading, setItemSearchLoading] = useState(false);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const searchItems = useCallback(
    async (query: string) => {
      if (!outletId) return;
      setItemSearchLoading(true);
      try {
        const list = await fetchItems({
          outletId,
          search: query.trim() || undefined,
          size: ITEM_SEARCH_RESULT_SIZE,
        });
        setItemSearchResults(list);
      } catch {
        setItemSearchResults([]);
      } finally {
        setItemSearchLoading(false);
      }
    },
    [outletId]
  );

  useEffect(() => {
    if (!itemSearchOpen) return;
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      searchItems(itemSearchQuery);
      searchDebounceRef.current = null;
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [itemSearchOpen, itemSearchQuery, searchItems]);

  const openItemSearch = useCallback(() => {
    setItemSearchQuery('');
    setItemSearchResults([]);
    setItemSearchOpen(true);
  }, []);

  const addSelectedItem = useCallback((item: ItemApiDto) => {
    setSelectedItems((prev) => {
      if (prev.some((s) => s.itemId === item.itemId)) return prev;
      return [...prev, { itemId: item.itemId, itemName: item.itemName }];
    });
  }, []);

  const removeSelectedItem = useCallback((itemId: number) => {
    setSelectedItems((prev) => prev.filter((s) => s.itemId !== itemId));
  }, []);

  const handleSave = async () => {
    setError('');
    if (!discountName.trim()) {
      setError('Enter discount name');
      return;
    }
    const valueNum = parseFloat(discountValue.replace(/,/g, ''));
    if (isNaN(valueNum) || valueNum < 0) {
      setError('Enter a valid discount value');
      return;
    }
    if (discountType === 'PERCENTAGE' && valueNum > 100) {
      setError('Percentage cannot exceed 100');
      return;
    }
    if (!startDate.trim() || !endDate.trim()) {
      setError('Start date and end date are required');
      return;
    }
    if (startDate > endDate) {
      setError('Start date must be on or before end date');
      return;
    }
    setLoading(true);
    try {
      const payload: CreateOrUpdateDiscountPayload = {
        discountName: discountName.trim(),
        discountType,
        discountValue: valueNum,
        startDate: startDate.trim(),
        endDate: endDate.trim(),
        status: status.trim() || 'ACTIVE',
        itemIds: selectedItems.map((s) => s.itemId),
      };
      await createDiscount(payload);
      router.back();
    } catch (err: unknown) {
      const data =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { responseMessage?: string } } }).response?.data
          : undefined;
      setError(
        typeof data?.responseMessage === 'string' ? data.responseMessage : 'Failed to create discount'
      );
    } finally {
      setLoading(false);
    }
  };

  if (!outletId) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + spacing.md }]}>
        <Text style={styles.errorText}>Missing outlet.</Text>
        <PrimaryButton title="Back" onPress={() => router.back()} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, spacing.sm) }]}>
        <Pressable onPress={() => router.back()} style={styles.backRow} hitSlop={12}>
          <MaterialIcons name="arrow-back" size={24} color={colors.primary} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Add Discount</Text>

        <AppInput
          placeholder="Discount name"
          value={discountName}
          onChangeText={(t) => { setDiscountName(t); setError(''); }}
          editable={!loading}
          style={styles.input}
        />

        <Text style={styles.label}>Discount type</Text>
        <View style={styles.typeRow}>
          {DISCOUNT_TYPES.map((type) => (
            <Pressable
              key={type}
              onPress={() => { setDiscountType(type); setError(''); }}
              style={[
                styles.typeBtn,
                discountType === type && styles.typeBtnActive,
              ]}
            >
              <Text
                style={[
                  styles.typeBtnText,
                  discountType === type && styles.typeBtnTextActive,
                ]}
              >
                {type === 'PERCENTAGE' ? 'Percentage' : 'Fixed amount'}
              </Text>
            </Pressable>
          ))}
        </View>

        <AppInput
          placeholder={discountType === 'PERCENTAGE' ? 'Value (e.g. 15)' : 'Value in LKR (e.g. 100)'}
          value={discountValue}
          onChangeText={(t) => { setDiscountValue(t); setError(''); }}
          keyboardType="decimal-pad"
          editable={!loading}
          style={styles.input}
        />

        <AppInput
          placeholder="Start date (YYYY-MM-DD)"
          value={startDate}
          onChangeText={(t) => { setStartDate(t); setError(''); }}
          editable={!loading}
          style={styles.input}
        />
        <AppInput
          placeholder="End date (YYYY-MM-DD)"
          value={endDate}
          onChangeText={(t) => { setEndDate(t); setError(''); }}
          editable={!loading}
          style={styles.input}
        />

        <Text style={styles.label}>Status</Text>
        <View style={styles.typeRow}>
          {DISCOUNT_STATUSES.map((s) => (
            <Pressable
              key={s}
              onPress={() => setStatus(s)}
              disabled={loading}
              style={[
                styles.typeBtn,
                status === s && styles.typeBtnActive,
              ]}
            >
              <Text
                style={[
                  styles.typeBtnText,
                  status === s && styles.typeBtnTextActive,
                ]}
              >
                {s}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Items (search and add items for this discount)</Text>
        <Pressable
          onPress={openItemSearch}
          style={({ pressed }) => [styles.itemDropdownTrigger, pressed && styles.itemDropdownTriggerPressed]}
        >
          <MaterialIcons name="search" size={22} color={colors.textSecondary} />
          <Text style={styles.itemDropdownTriggerText}>
            Search item by name (up to 5 results)…
          </Text>
          <MaterialIcons name="arrow-drop-down" size={24} color={colors.textSecondary} />
        </Pressable>
        {selectedItems.length > 0 ? (
          <View style={styles.selectedChips}>
            {selectedItems.map((s) => (
              <View key={s.itemId} style={styles.chip}>
                <Text style={styles.chipText} numberOfLines={1}>{s.itemName}</Text>
                <Pressable
                  onPress={() => removeSelectedItem(s.itemId)}
                  hitSlop={8}
                  style={styles.chipRemove}
                >
                  <MaterialIcons name="close" size={18} color={colors.textPrimary} />
                </Pressable>
              </View>
            ))}
          </View>
        ) : null}

        <Modal
          visible={itemSearchOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setItemSearchOpen(false)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setItemSearchOpen(false)}>
            <Pressable style={styles.modalContent} onPress={() => {}}>
              <Text style={styles.modalTitle}>Search items</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Type item name…"
                placeholderTextColor={colors.textSecondary}
                value={itemSearchQuery}
                onChangeText={setItemSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {itemSearchLoading ? (
                <View style={styles.searchLoading}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={styles.searchLoadingText}>Searching…</Text>
                </View>
              ) : (
                <View style={styles.searchResults}>
                  {itemSearchResults.length === 0 ? (
                    <Text style={styles.searchEmpty}>
                      {itemSearchQuery.trim() ? 'No items match. Try another name.' : 'Type to search items.'}
                    </Text>
                  ) : (
                    itemSearchResults.map((item) => (
                      <Pressable
                        key={item.itemId}
                        onPress={() => {
                          addSelectedItem(item);
                          setItemSearchOpen(false);
                        }}
                        style={({ pressed }) => [styles.searchResultRow, pressed && styles.searchResultRowPressed]}
                      >
                        <Text style={styles.searchResultName} numberOfLines={1}>
                          {item.itemName}
                        </Text>
                        {item.price != null ? (
                          <Text style={styles.searchResultPrice}>LKR {Number(item.price).toLocaleString()}</Text>
                        ) : null}
                      </Pressable>
                    ))
                  )}
                </View>
              )}
              <Pressable
                onPress={() => setItemSearchOpen(false)}
                style={styles.modalCloseBtn}
              >
                <Text style={styles.modalCloseText}>Close</Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        <PrimaryButton
          title="Create discount"
          onPress={handleSave}
          loading={loading}
          disabled={loading}
          style={styles.submitBtn}
        />
        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: layout.contentPaddingHorizontal, paddingBottom: spacing.sm },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  backText: { fontSize: 16, color: colors.primary, fontWeight: '600' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: layout.contentPaddingHorizontal, paddingBottom: spacing.xxl },
  title: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  input: { marginBottom: spacing.md },
  label: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  typeRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  typeBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.border + '88',
    alignItems: 'center',
  },
  typeBtnActive: { backgroundColor: colors.primary + '22', borderWidth: 1, borderColor: colors.primary },
  typeBtnText: { fontSize: fontSizes.sm, color: colors.textSecondary, fontWeight: '500' },
  typeBtnTextActive: { color: colors.primary, fontWeight: '600' },
  itemDropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.card,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  itemDropdownTriggerPressed: { opacity: 0.9 },
  itemDropdownTriggerText: { flex: 1, fontSize: fontSizes.base, color: colors.textSecondary },
  selectedChips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingLeft: spacing.sm,
    paddingRight: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary + '22',
    borderWidth: 1,
    borderColor: colors.primary + '44',
    maxWidth: '100%',
  },
  chipText: { fontSize: fontSizes.sm, color: colors.textPrimary, maxWidth: 140 },
  chipRemove: { padding: spacing.xs },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: layout.contentPaddingHorizontal,
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: layout.modalBorderRadius ?? 12,
    padding: spacing.lg,
    maxHeight: 320,
  },
  modalTitle: { fontSize: fontSizes.lg, fontWeight: fontWeights.semibold, color: colors.textPrimary, marginBottom: spacing.md },
  searchInput: {
    height: 48,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    fontSize: fontSizes.base,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  searchLoading: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.lg },
  searchLoadingText: { fontSize: fontSizes.sm, color: colors.textSecondary },
  searchResults: { maxHeight: 180 },
  searchEmpty: { fontSize: fontSizes.sm, color: colors.textSecondary, paddingVertical: spacing.lg, textAlign: 'center' },
  searchResultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs,
    gap: spacing.sm,
  },
  searchResultRowPressed: { backgroundColor: colors.border + '88' },
  searchResultName: { flex: 1, fontSize: fontSizes.base, color: colors.textPrimary },
  searchResultPrice: { fontSize: fontSizes.sm, color: colors.textSecondary },
  modalCloseBtn: { marginTop: spacing.md, paddingVertical: spacing.sm, alignItems: 'center' },
  modalCloseText: { fontSize: fontSizes.base, fontWeight: fontWeights.semibold, color: colors.primary },
  error: { color: colors.error, marginBottom: spacing.sm, fontSize: 14 },
  submitBtn: { marginTop: spacing.sm },
});

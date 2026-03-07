import { useLocalSearchParams, useRouter } from 'expo-router';
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

import { ScreenContainer } from '@/components/dashboard';
import { ThemedText } from '@/components/themed-text';
import { AppInput } from '@/components/ui/AppInput';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { useOutletContext } from '@/src/context/OutletContext';
import { colors } from '@/theme/colors';
import { layout, spacing } from '@/theme/spacing';

export default function EditItemScreen() {
  const { id, outletId } = useLocalSearchParams<{ id: string; outletId: string }>();
  const router = useRouter();
  const { getItemsByOutletId, updateItem } = useOutletContext();
  const items = outletId ? getItemsByOutletId(outletId) : [];
  const item = id ? items.find((i) => i.id === id) : null;

  const [name, setName] = useState(item?.name ?? '');
  const [price, setPrice] = useState(item != null ? String(item.price) : '');
  const [category, setCategory] = useState(item?.category ?? '');
  const [description, setDescription] = useState(item?.description ?? '');
  const [availability, setAvailability] = useState(item?.availability ?? true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!id) return;
    setError('');
    if (!name.trim()) {
      setError('Enter item name');
      return;
    }
    const num = parseFloat(price.replace(/,/g, ''));
    if (isNaN(num) || num < 0) {
      setError('Enter a valid price');
      return;
    }
    setLoading(true);
    try {
      await updateItem(id, {
        name: name.trim(),
        price: num,
        category: category.trim(),
        description: description.trim(),
        availability,
      });
      router.back();
    } catch {
      setError('Failed to update item');
    } finally {
      setLoading(false);
    }
  };

  if (!id || !item) {
    return (
      <ScreenContainer>
        <ThemedText>Item not found.</ThemedText>
        <PrimaryButton title="Back" onPress={() => router.back()} />
      </ScreenContainer>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenContainer>
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
              Edit Item
            </ThemedText>

            <AppInput
              placeholder="Item Name *"
              value={name}
              onChangeText={(t) => { setName(t); setError(''); }}
              editable={!loading}
              style={styles.input}
            />
            <AppInput
              placeholder="Price (LKR)"
              value={price}
              onChangeText={setPrice}
              keyboardType="decimal-pad"
              editable={!loading}
              style={styles.input}
            />
            <AppInput
              placeholder="Category"
              value={category}
              onChangeText={setCategory}
              editable={!loading}
              style={styles.input}
            />
            <AppInput
              placeholder="Description"
              value={description}
              onChangeText={setDescription}
              multiline
              editable={!loading}
              style={[styles.input, styles.inputMultiline]}
            />

            <ThemedText style={styles.label}>Availability</ThemedText>
            <View style={styles.row}>
              <TouchableOpacity
                style={[styles.toggleBtn, availability && styles.toggleBtnActive]}
                onPress={() => setAvailability(true)}
                disabled={loading}
              >
                <Text style={[styles.toggleText, availability && styles.toggleTextActive]}>Available</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, !availability && styles.toggleBtnActive]}
                onPress={() => setAvailability(false)}
                disabled={loading}
              >
                <Text style={[styles.toggleText, !availability && styles.toggleTextActive]}>Unavailable</Text>
              </TouchableOpacity>
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <PrimaryButton title="Save Changes" onPress={handleSave} loading={loading} disabled={loading} />
          </ScrollView>
        </KeyboardAvoidingView>
      </ScreenContainer>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  keyboard: { flex: 1 },
  scroll: {
    paddingHorizontal: layout.contentPaddingHorizontal,
    paddingTop: spacing.page,
    paddingBottom: spacing.xxxl,
  },
  title: { marginBottom: spacing.xl },
  input: { marginBottom: spacing.md },
  inputMultiline: { minHeight: 80 },
  label: { marginBottom: spacing.xs, fontSize: 14 },
  row: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  toggleBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.border,
    alignItems: 'center',
  },
  toggleBtnActive: { backgroundColor: colors.primary },
  toggleText: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  toggleTextActive: { color: colors.white },
  error: { color: colors.error, marginBottom: spacing.sm, fontSize: 14 },
});

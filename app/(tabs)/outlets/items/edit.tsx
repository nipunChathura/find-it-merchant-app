import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    Pressable,
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
import { AuthImage } from '@/components/ui/AuthImage';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import type { DropdownOption } from '@/components/ui/SearchableDropdown';
import { SearchableDropdown } from '@/components/ui/SearchableDropdown';
import { useAuth } from '@/context/auth-context';
import { categoryToOption, fetchCategories } from '@/services/categoryService';
import { updateItemById, type ItemApiDto, type UpdateItemRequestBody } from '@/services/itemService';
import { uploadImage } from '@/services/paymentService';
import { colors } from '@/theme/colors';
import { borderRadius, layout, spacing } from '@/theme/spacing';

const CATEGORY_LIST_SIZE = 50;

function parseItemFromParams(itemData?: string | null): ItemApiDto | null {
  if (!itemData || typeof itemData !== 'string') return null;
  try {
    const parsed = JSON.parse(itemData) as ItemApiDto;
    return parsed && typeof parsed.itemId === 'number' ? parsed : null;
  } catch {
    return null;
  }
}

export default function EditItemScreen() {
  const params = useLocalSearchParams<{ id: string; outletId: string; itemData?: string }>();
  const { id, outletId, itemData } = params;
  const router = useRouter();
  const { token } = useAuth();

  const itemFromApi = useMemo(() => parseItemFromParams(itemData), [itemData]);

  const [itemName, setItemName] = useState(itemFromApi?.itemName ?? '');
  const [itemDescription, setItemDescription] = useState(itemFromApi?.itemDescription ?? '');
  const [price, setPrice] = useState(
    itemFromApi != null ? String(itemFromApi.price) : ''
  );
  const [categoryId, setCategoryId] = useState(
    itemFromApi?.categoryId != null ? String(itemFromApi.categoryId) : ''
  );
  const [categoryOptions, setCategoryOptions] = useState<DropdownOption[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [availability, setAvailability] = useState(itemFromApi?.availability ?? true);
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>(
    (itemFromApi?.status?.toUpperCase() === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE') as 'ACTIVE' | 'INACTIVE'
  );
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const loadCategoryOptions = useCallback(async (nameSearch?: string) => {
    setCategoriesLoading(true);
    try {
      const list = await fetchCategories({
        name: (nameSearch ?? '').trim(),
        categoryType: '',
        status: '',
        page: 0,
        size: CATEGORY_LIST_SIZE,
      });
      const opts = list.map(categoryToOption).filter((o) => o.id !== 0);
      opts.sort((a, b) => String(a.name).localeCompare(String(b.name)));
      setCategoryOptions(opts);
    } catch {
      setCategoryOptions([]);
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategoryOptions();
  }, [loadCategoryOptions]);

  const categoryDropdownOptions: DropdownOption[] = useMemo(() => {
    const noCategory: DropdownOption = { id: 0, name: 'No category' };
    const list: DropdownOption[] = [noCategory, ...categoryOptions];
    const currentId = itemFromApi?.categoryId;
    if (currentId != null && currentId !== 0 && !list.some((o) => o.id === currentId)) {
      list.push({
        id: currentId,
        name: itemFromApi?.categoryName ?? `Category ${currentId}`,
      });
    }
    return list;
  }, [categoryOptions, itemFromApi?.categoryId, itemFromApi?.categoryName]);

  const selectedCategory: DropdownOption | null = useMemo(() => {
    const id = categoryId.trim() ? parseInt(categoryId, 10) : 0;
    const found = categoryDropdownOptions.find((o) => o.id === id);
    return found ?? null;
  }, [categoryId, categoryDropdownOptions]);

  const pickImage = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow access to photos to select an item image.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      setImageUri(result.assets[0].uri);
      setError('');
    }
  }, []);

  const handleSave = async () => {
    if (!id || !outletId) return;
    setError('');
    if (!itemName.trim()) {
      setError('Enter item name');
      return;
    }
    const num = parseFloat(price.replace(/,/g, ''));
    if (isNaN(num) || num < 0) {
      setError('Enter a valid price');
      return;
    }
    const outletIdNum = parseInt(outletId, 10);
    if (isNaN(outletIdNum)) {
      setError('Invalid outlet');
      return;
    }
    setLoading(true);
    try {
      let itemImageName: string | null = itemFromApi?.itemImage ?? null;
      if (imageUri) {
        setUploadingImage(true);
        try {
          itemImageName = await uploadImage(imageUri, 'item');
        } catch {
          setError('Failed to upload image');
          setLoading(false);
          setUploadingImage(false);
          return;
        } finally {
          setUploadingImage(false);
        }
      }
      const body: UpdateItemRequestBody = {
        itemName: itemName.trim(),
        itemDescription: itemDescription.trim() || null,
        categoryId: categoryId.trim() ? parseInt(categoryId, 10) || null : null,
        outletId: outletIdNum,
        price: num,
        availability,
        itemImage: itemImageName,
        status,
      };
      await updateItemById(id, body);
      router.back();
    } catch {
      setError('Failed to update item');
    } finally {
      setLoading(false);
    }
  };

  if (!id || !outletId) {
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

            <ThemedText style={styles.label}>Item Name *</ThemedText>
            <AppInput
              placeholder="Enter item name"
              value={itemName}
              onChangeText={(t) => { setItemName(t); setError(''); }}
              editable={!loading}
              style={styles.input}
            />
            <ThemedText style={styles.label}>Price (LKR)</ThemedText>
            <AppInput
              placeholder="Enter price"
              value={price}
              onChangeText={setPrice}
              keyboardType="decimal-pad"
              editable={!loading}
              style={styles.input}
            />
            <ThemedText style={styles.label}>Category</ThemedText>
            <SearchableDropdown
              options={categoryDropdownOptions}
              selected={selectedCategory}
              onSelect={(opt) => setCategoryId(opt.id === 0 ? '' : String(opt.id))}
              placeholder="Select category"
              searchPlaceholder="Search category"
              disabled={loading}
              loading={categoriesLoading}
              onOpen={() => loadCategoryOptions()}
            />

            <ThemedText style={styles.label}>Item image</ThemedText>
            {imageUri ? (
              <View style={styles.imageWrap}>
                <Image source={{ uri: imageUri }} style={styles.imagePreview} resizeMode="cover" />
                <View style={styles.imageActions}>
                  <PrimaryButton
                    title={uploadingImage ? 'Uploading…' : 'Change image'}
                    onPress={pickImage}
                    disabled={loading || uploadingImage}
                  />
                  <Pressable onPress={() => setImageUri(null)} disabled={loading} style={styles.removeImageBtn}>
                    <Text style={styles.removeImageText}>Remove</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <View style={styles.imageWrap}>
                {itemFromApi?.itemImage && token ? (
                  <View style={styles.currentImageWrap}>
                    <AuthImage
                      type="item"
                      fileName={itemFromApi.itemImage}
                      token={token}
                      style={styles.imagePreview}
                      resizeMode="cover"
                      placeholder={
                        <View style={[styles.imagePreview, styles.imagePlaceholder]}>
                          <MaterialIcons name="restaurant" size={40} color={colors.textSecondary} />
                        </View>
                      }
                    />
                    <Text style={styles.currentImageLabel}>Current image</Text>
                  </View>
                ) : null}
                <PrimaryButton
                  title="Select new image"
                  onPress={pickImage}
                  disabled={loading}
                />
              </View>
            )}

            <ThemedText style={styles.label}>Description</ThemedText>
            <AppInput
              placeholder="Enter description"
              value={itemDescription}
              onChangeText={setItemDescription}
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

            <ThemedText style={styles.label}>Status</ThemedText>
            <View style={styles.row}>
              <TouchableOpacity
                style={[styles.toggleBtn, status === 'ACTIVE' && styles.toggleBtnActive]}
                onPress={() => setStatus('ACTIVE')}
                disabled={loading}
              >
                <Text style={[styles.toggleText, status === 'ACTIVE' && styles.toggleTextActive]}>ACTIVE</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, status === 'INACTIVE' && styles.toggleBtnActive]}
                onPress={() => setStatus('INACTIVE')}
                disabled={loading}
              >
                <Text style={[styles.toggleText, status === 'INACTIVE' && styles.toggleTextActive]}>INACTIVE</Text>
              </TouchableOpacity>
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <PrimaryButton
              title={loading ? (uploadingImage ? 'Uploading…' : 'Saving…') : 'Save Changes'}
              onPress={handleSave}
              loading={loading}
              disabled={loading}
            />
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
  imageWrap: { marginBottom: spacing.lg },
  imagePreview: { width: '100%', height: 200, borderRadius: borderRadius.md, backgroundColor: colors.border },
  currentImageWrap: { marginBottom: spacing.sm },
  currentImageLabel: { fontSize: 12, color: colors.textSecondary, marginBottom: spacing.sm },
  imagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  imageActions: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  removeImageBtn: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
  removeImageText: { fontSize: 14, fontWeight: '600', color: colors.error },
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

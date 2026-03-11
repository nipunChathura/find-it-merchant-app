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
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenContainer } from '@/components/dashboard';
import { ThemedText } from '@/components/themed-text';
import { AppInput } from '@/components/ui/AppInput';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import type { DropdownOption } from '@/components/ui/SearchableDropdown';
import { SearchableDropdown } from '@/components/ui/SearchableDropdown';
import { CATEGORY_PAGE_SIZE, categoryToOption, fetchCategories } from '@/services/categoryService';
import { createItem } from '@/services/itemService';
import { uploadImage } from '@/services/paymentService';
import { colors } from '@/theme/colors';
import { borderRadius, layout, spacing } from '@/theme/spacing';

export default function AddItemScreen() {
  const { outletId } = useLocalSearchParams<{ outletId: string }>();
  const router = useRouter();
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<DropdownOption | null>(null);
  const [categoryOptions, setCategoryOptions] = useState<DropdownOption[]>([]);
  const [categoryOptionsLoading, setCategoryOptionsLoading] = useState(false);
  const [description, setDescription] = useState('');
  const [availability, setAvailability] = useState(true);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const loadCategories = useCallback(async () => {
    setCategoryOptionsLoading(true);
    try {
      const list = await fetchCategories({
        name: '',
        categoryType: '',
        status: '',
        page: 0,
        size: CATEGORY_PAGE_SIZE,
      });
      const opts = list.map(categoryToOption).filter((o) => o.id !== 0);
      opts.sort((a, b) => String(a.name).localeCompare(String(b.name)));
      setCategoryOptions(opts);
    } catch {
      setCategoryOptions([]);
    } finally {
      setCategoryOptionsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

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
    setError('');
    if (!outletId) return;
    if (!name.trim()) {
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
      let itemImageName: string | null = null;
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
      await createItem({
        itemName: name.trim(),
        itemDescription: description.trim() || null,
        categoryId: selectedCategory?.id != null && selectedCategory.id !== 0 ? selectedCategory.id : null,
        outletId: outletIdNum,
        price: num,
        availability,
        itemImage: itemImageName,
      });
      router.back();
    } catch {
      setError('Failed to add item');
    } finally {
      setLoading(false);
    }
  };

  if (!outletId) {
    return (
      <ScreenContainer>
        <ThemedText>Missing outlet.</ThemedText>
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
              Add Item
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
            <ThemedText style={styles.label}>Category</ThemedText>
            <SearchableDropdown
              options={categoryOptions}
              selected={selectedCategory}
              onSelect={setSelectedCategory}
              placeholder="Select category"
              searchPlaceholder="Search category"
              loading={categoryOptionsLoading}
              disabled={loading}
              onOpen={() => categoryOptions.length === 0 && loadCategories()}
            />

            <ThemedText style={styles.label}>Item image (optional)</ThemedText>
            {imageUri ? (
              <View style={styles.imageWrap}>
                <Image source={{ uri: imageUri }} style={styles.imagePreview} resizeMode="cover" />
                <View style={styles.imageActions}>
                  <PrimaryButton
                    title={uploadingImage ? 'Uploading…' : 'Change image'}
                    onPress={pickImage}
                    disabled={loading || uploadingImage}
                  />
                  <Pressable
                    onPress={() => setImageUri(null)}
                    disabled={loading}
                    style={styles.removeImageBtn}
                  >
                    <Text style={styles.removeImageText}>Remove</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <Pressable
                onPress={pickImage}
                disabled={loading}
                style={({ pressed }) => [styles.imagePlaceholder, pressed && styles.imagePlaceholderPressed]}
              >
                <MaterialIcons name="add-a-photo" size={40} color={colors.textSecondary} />
                <Text style={styles.imagePlaceholderText}>Select image</Text>
              </Pressable>
            )}

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

            <PrimaryButton
              title={loading ? (uploadingImage ? 'Uploading…' : 'Saving…') : 'Save Item'}
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
  imagePreview: { width: '100%', height: 200, borderRadius: borderRadius.md, marginBottom: spacing.sm, backgroundColor: colors.border },
  imageActions: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  removeImageBtn: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
  removeImageText: { fontSize: 14, fontWeight: '600', color: colors.error },
  imagePlaceholder: {
    width: '100%',
    height: 120,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.border,
    backgroundColor: colors.border + '44',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  imagePlaceholderPressed: { opacity: 0.9 },
  imagePlaceholderText: { fontSize: 14, color: colors.textSecondary, marginTop: spacing.xs },
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

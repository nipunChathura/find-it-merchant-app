import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text } from 'react-native';

import { ScreenContainer } from '@/components/dashboard';
import { ThemedText } from '@/components/themed-text';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { useAuth } from '@/context/auth-context';
import { authService } from '@/services/authService';
import { uploadImage } from '@/services/paymentService';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export default function ChangeProfileImageScreen() {
  const router = useRouter();
  const { updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow access to your photos to choose a profile image.');
      return;
    }
    setLoading(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]?.uri) {
        const uri = result.assets[0].uri;
        const fileName = await uploadImage(uri, 'profile');
        if (!fileName) {
          Alert.alert('Error', 'Failed to upload image.');
          return;
        }
        const { data } = await authService.updateProfileImage(fileName);
        const profileImageUrl = data?.profileImageUrl ?? data?.profileImage ?? fileName;
        await updateProfile({ profileImage: profileImageUrl, profileImageUri: null });
        router.back();
      }
    } catch {
      Alert.alert('Error', 'Failed to set profile image.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveImage = async () => {
    setLoading(true);
    try {
      await updateProfile({ profileImage: null, profileImageUri: null });
      router.back();
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <ThemedText type="title" style={styles.title}>
        Change profile image
      </ThemedText>
      <Text style={styles.subtitle}>
        Choose a photo from your gallery. It will be shown on your profile.
      </Text>
      <PrimaryButton
        title="Choose photo"
        onPress={handlePickImage}
        loading={loading}
        disabled={loading}
      />
      <Pressable
        style={({ pressed }) => [styles.removeBtn, pressed && styles.removeBtnPressed]}
        onPress={handleRemoveImage}
        disabled={loading}
      >
        <Text style={styles.removeBtnText}>Remove photo</Text>
      </Pressable>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { marginBottom: spacing.sm },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  removeBtn: {
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  removeBtnPressed: { opacity: 0.8 },
  removeBtnText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
});

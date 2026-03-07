import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ScreenContainer } from '@/components/dashboard';
import { useAuth } from '@/context/auth-context';
import { colors } from '@/theme/colors';
import { cardRadius, spacing } from '@/theme/spacing';
import { fontSizes, fontWeights } from '@/theme/typography';

const headerShadow = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
  android: { elevation: 3 },
  default: {},
});

function InfoRow({ icon, label, value }: { icon: 'person' | 'email' | 'phone' | 'location-on' | 'badge' | 'store'; label: string; value?: string | null }) {
  if (value == null || value === '') return null;
  return (
    <View style={styles.infoRow}>
      <MaterialIcons name={icon} size={20} color={colors.textSecondary} />
      <View style={styles.infoTextWrap}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();

  const merchant = user?.role === 'SUBMERCHANT' ? user.subMerchantInfo : user?.mainMerchantInfo;
  const displayName = merchant?.merchantName ?? user?.username ?? 'Merchant';
  const email = user?.email ?? merchant?.merchantEmail;
  const phone = user?.phone ?? merchant?.merchantPhoneNumber;
  const address = merchant?.merchantAddress;
  const nic = merchant?.merchantNic;
  const merchantType = merchant?.merchantType;

  return (
    <ScreenContainer>
      <View style={styles.pageHeader}>
        <Text style={styles.pageHeaderTitle}>Profile</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarWrap}>
            {user?.profileImageUri ? (
              <Image source={{ uri: user.profileImageUri }} style={styles.avatarImage} contentFit="cover" />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {displayName?.charAt(0).toUpperCase() ?? 'M'}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.role}>{user?.role === 'SUBMERCHANT' ? 'Sub Merchant' : 'Merchant'}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Account & merchant info</Text>
          <InfoRow icon="person" label="Username" value={user?.username} />
          <InfoRow icon="email" label="Email" value={email} />
          <InfoRow icon="phone" label="Phone" value={phone} />
          <InfoRow icon="location-on" label="Address" value={address} />
          <InfoRow icon="badge" label="NIC" value={nic} />
          <InfoRow icon="store" label="Type" value={merchantType} />
        </View>

        <Pressable
          style={({ pressed }) => [styles.menuButton, pressed && styles.buttonPressed]}
          onPress={() => router.push('/(tabs)/profile/change-image')}
        >
          <MaterialIcons name="photo-camera" size={22} color={colors.primary} />
          <Text style={styles.menuText}>Change profile image</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.menuButton, pressed && styles.buttonPressed]}
          onPress={() => router.push('/(tabs)/profile/change-password')}
        >
          <MaterialIcons name="lock" size={22} color={colors.primary} />
          <Text style={styles.menuText}>Change password</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.menuButton, pressed && styles.buttonPressed]}
          onPress={() => router.push('/(tabs)/profile/edit')}
        >
          <MaterialIcons name="edit" size={22} color={colors.primary} />
          <Text style={styles.menuText}>Edit profile</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.logoutButton, pressed && styles.buttonPressed]}
          onPress={async () => {
            await signOut();
            router.replace('/login');
          }}
        >
          <MaterialIcons name="logout" size={22} color={colors.white} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  pageHeader: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    marginHorizontal: -spacing.page,
    marginBottom: spacing.xl,
    borderBottomLeftRadius: cardRadius,
    borderBottomRightRadius: cardRadius,
    ...headerShadow,
  },
  pageHeaderTitle: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.bold,
    color: colors.white,
    letterSpacing: 0.3,
  },
  scroll: {
    padding: spacing.page,
    paddingBottom: spacing.xxxl,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  avatarWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 48,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: fontWeights.bold,
    color: colors.white,
  },
  name: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xxs,
  },
  role: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  cardTitle: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  infoTextWrap: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  infoLabel: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: fontSizes.base,
    color: colors.textPrimary,
  },
  menuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: 12,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  menuText: {
    fontSize: fontSizes.base,
    color: colors.textPrimary,
    fontWeight: fontWeights.medium,
  },
  buttonPressed: {
    opacity: 0.9,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.error,
    paddingVertical: spacing.lg,
    borderRadius: 12,
    marginTop: spacing.xl,
  },
  logoutText: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.semibold,
    color: colors.white,
  },
});

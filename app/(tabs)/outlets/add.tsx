import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AddOutletFormBody } from './add-form';
import { colors } from '@/theme/colors';
import { cardRadius, spacing } from '@/theme/spacing';
import { fontSizes, fontWeights } from '@/theme/typography';

export default function AddOutletScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => router.back()} style={styles.backRow} hitSlop={12}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Add Outlet</Text>
        <Text style={styles.headerSubtitle}>Create a new outlet</Text>
      </View>
      <AddOutletFormBody />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: cardRadius,
    borderBottomRightRadius: cardRadius,
  },
  backRow: {
    marginBottom: spacing.xs,
  },
  backText: {
    fontSize: fontSizes.sm,
    color: colors.white,
    opacity: 0.9,
  },
  headerTitle: {
    fontSize: fontSizes.xxl,
    fontWeight: fontWeights.bold,
    color: colors.white,
  },
  headerSubtitle: {
    fontSize: fontSizes.sm,
    color: colors.white,
    opacity: 0.85,
    marginTop: spacing.xxs,
  },
});

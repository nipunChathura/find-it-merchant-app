import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenContainer } from '@/components/dashboard';
import { ThemedText } from '@/components/themed-text';
import { AppInput } from '@/components/ui/AppInput';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { useOutletContext } from '@/src/context/OutletContext';
import { DAYS } from '@/src/types/schedule';
import { colors } from '@/theme/colors';
import { layout, spacing } from '@/theme/spacing';

export default function EditScheduleScreen() {
  const { id, outletId } = useLocalSearchParams<{ id: string; outletId: string }>();
  const router = useRouter();
  const { getSchedulesByOutletId, updateSchedule } = useOutletContext();
  const schedules = outletId ? getSchedulesByOutletId(outletId) : [];
  const schedule = id ? schedules.find((s) => s.id === id) : null;

  const [dayOfWeek, setDayOfWeek] = useState(schedule?.dayOfWeek ?? DAYS[0]);
  const [openTime, setOpenTime] = useState(schedule?.openTime ?? '09:00');
  const [closeTime, setCloseTime] = useState(schedule?.closeTime ?? '18:00');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!id) return;
    setError('');
    setLoading(true);
    try {
      await updateSchedule(id, { dayOfWeek, openTime, closeTime });
      router.back();
    } catch {
      setError('Failed to update schedule');
    } finally {
      setLoading(false);
    }
  };

  if (!id || !schedule) {
    return (
      <ScreenContainer>
        <ThemedText>Schedule not found.</ThemedText>
        <PrimaryButton title="Back" onPress={() => router.back()} />
      </ScreenContainer>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenContainer>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <ThemedText type="title" style={styles.title}>
            Edit Schedule
          </ThemedText>

          <ThemedText style={styles.label}>Day of week</ThemedText>
          <View style={styles.dayRowWrap}>
            {DAYS.map((d) => (
              <Pressable
                key={d}
                style={[styles.dayChip, dayOfWeek === d && styles.dayChipActive]}
                onPress={() => setDayOfWeek(d)}
                disabled={loading}
              >
                <Text style={[styles.dayChipText, dayOfWeek === d && styles.dayChipTextActive]}>{d.slice(0, 3)}</Text>
              </Pressable>
            ))}
          </View>

          <AppInput
            placeholder="Open time"
            value={openTime}
            onChangeText={setOpenTime}
            style={styles.input}
            editable={!loading}
          />
          <AppInput
            placeholder="Close time"
            value={closeTime}
            onChangeText={setCloseTime}
            style={styles.input}
            editable={!loading}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <PrimaryButton title="Save Changes" onPress={handleSave} loading={loading} disabled={loading} />
        </ScrollView>
      </ScreenContainer>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: {
    paddingHorizontal: layout.contentPaddingHorizontal,
    paddingTop: spacing.page,
    paddingBottom: spacing.xxxl,
  },
  title: { marginBottom: spacing.xl },
  label: { marginBottom: spacing.xs, fontSize: 14 },
  dayRowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.lg },
  dayChip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, backgroundColor: colors.border },
  dayChipActive: { backgroundColor: colors.primary },
  dayChipText: { fontSize: 14, color: colors.textPrimary },
  dayChipTextActive: { color: colors.white },
  input: { marginBottom: spacing.md },
  error: { color: colors.error, marginBottom: spacing.sm, fontSize: 14 },
});

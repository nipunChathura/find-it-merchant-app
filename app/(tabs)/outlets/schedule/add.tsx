import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenContainer } from '@/components/dashboard';
import { AppInput } from '@/components/ui/AppInput';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import {
    createSchedule,
    isValidTimeHHmm,
    SCHEDULE_DAYS,
    SCHEDULE_TYPES,
    type CreateSchedulePayload,
    type ScheduleType,
} from '@/services/scheduleService';
import { colors } from '@/theme/colors';
import { layout, spacing } from '@/theme/spacing';
import { fontSizes, fontWeights } from '@/theme/typography';

/** Format local date to YYYY-MM-DD */
function toYYYYMMDD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const TODAY = toYYYYMMDD(new Date());

export default function AddScheduleScreen() {
  const { outletId } = useLocalSearchParams<{ outletId: string }>();
  const router = useRouter();
  const [scheduleType, setScheduleType] = useState<ScheduleType>('NORMAL');
  const [selectedDays, setSelectedDays] = useState<Set<string>>(new Set());
  const [specialDate, setSpecialDate] = useState(TODAY);
  const [startDate, setStartDate] = useState(TODAY);
  const [endDate, setEndDate] = useState(TODAY);
  const [openTime, setOpenTime] = useState('09:00');
  const [closeTime, setCloseTime] = useState('18:00');
  const [isClosed, setIsClosed] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleDay = useCallback((day: string) => {
    setSelectedDays((prev) => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
  }, []);

  const buildPayload = useCallback(
    (dayOfWeek: string | null): CreateSchedulePayload => ({
      scheduleType,
      dayOfWeek,
      specialDate: scheduleType === 'EMERGENCY' || scheduleType === 'DAILY' ? specialDate.trim() || null : null,
      startDate: scheduleType === 'TEMPORARY' ? startDate.trim() || null : null,
      endDate: scheduleType === 'TEMPORARY' ? endDate.trim() || null : null,
      openTime: openTime.trim(),
      closeTime: closeTime.trim(),
      isClosed,
      reason: reason.trim() || null,
    }),
    [scheduleType, specialDate, startDate, endDate, openTime, closeTime, isClosed, reason]
  );

  const validate = useCallback((): boolean => {
    if (!openTime.trim() || !closeTime.trim()) {
      setError('Open time and close time are required.');
      return false;
    }
    if (!isValidTimeHHmm(openTime.trim()) || !isValidTimeHHmm(closeTime.trim())) {
      setError('Times must be in HH:mm format (e.g. 09:00, 18:30).');
      return false;
    }
    if (scheduleType === 'NORMAL') {
      if (selectedDays.size === 0) {
        setError('Select at least one day of the week.');
        return false;
      }
    } else if (scheduleType === 'EMERGENCY' || scheduleType === 'DAILY') {
      if (!specialDate.trim()) {
        setError('Date is required.');
        return false;
      }
    } else if (scheduleType === 'TEMPORARY') {
      if (!startDate.trim() || !endDate.trim()) {
        setError('Start date and end date are required.');
        return false;
      }
      if (startDate.trim() > endDate.trim()) {
        setError('Start date must be on or before end date.');
        return false;
      }
    }
    setError('');
    return true;
  }, [scheduleType, selectedDays, specialDate, startDate, endDate, openTime, closeTime]);

  const handleSave = async () => {
    if (!outletId) return;
    setError('');
    if (!validate()) return;
    setLoading(true);
    try {
      if (scheduleType === 'NORMAL' && selectedDays.size > 0) {
        const days = Array.from(selectedDays);
        let failed = 0;
        for (const day of days) {
          try {
            await createSchedule(outletId, buildPayload(day));
          } catch {
            failed += 1;
          }
        }
        if (failed === 0) {
          router.back();
        } else {
          setError(`Added ${days.length - failed} schedule(s). Failed to add ${failed}.`);
        }
      } else {
        const payload = buildPayload(null);
        await createSchedule(outletId, payload);
        router.back();
      }
    } catch {
      setError('Failed to add schedule.');
    } finally {
      setLoading(false);
    }
  };

  if (!outletId) {
    return (
      <ScreenContainer>
        <Text style={styles.error}>Missing outlet.</Text>
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
          <Text style={styles.title}>Add Schedule</Text>

          <Text style={styles.label}>Schedule type</Text>
          <View style={styles.typeRow}>
            {SCHEDULE_TYPES.map((t) => (
              <Pressable
                key={t}
                style={[styles.typeChip, scheduleType === t && styles.typeChipActive]}
                onPress={() => setScheduleType(t)}
                disabled={loading}
              >
                <Text style={[styles.typeChipText, scheduleType === t && styles.typeChipTextActive]}>{t}</Text>
              </Pressable>
            ))}
          </View>

          {scheduleType === 'NORMAL' && (
            <>
              <Text style={styles.label}>Day(s) of week (select at least one)</Text>
              <View style={styles.dayRowWrap}>
                {SCHEDULE_DAYS.map((d) => (
                  <Pressable
                    key={d}
                    style={[styles.dayChip, selectedDays.has(d) && styles.dayChipActive]}
                    onPress={() => toggleDay(d)}
                    disabled={loading}
                  >
                    <Text style={[styles.dayChipText, selectedDays.has(d) && styles.dayChipTextActive]}>{d.slice(0, 3)}</Text>
                  </Pressable>
                ))}
              </View>
            </>
          )}

          {(scheduleType === 'EMERGENCY' || scheduleType === 'DAILY') && (
            <>
              <Text style={styles.label}>Date (YYYY-MM-DD)</Text>
              <AppInput
                placeholder="e.g. 2025-03-15"
                value={specialDate}
                onChangeText={setSpecialDate}
                style={styles.input}
                editable={!loading}
              />
            </>
          )}

          {scheduleType === 'TEMPORARY' && (
            <>
              <Text style={styles.label}>Start date (YYYY-MM-DD)</Text>
              <AppInput
                placeholder="e.g. 2025-03-01"
                value={startDate}
                onChangeText={setStartDate}
                style={styles.input}
                editable={!loading}
              />
              <Text style={styles.label}>End date (YYYY-MM-DD)</Text>
              <AppInput
                placeholder="e.g. 2025-03-07"
                value={endDate}
                onChangeText={setEndDate}
                style={styles.input}
                editable={!loading}
              />
            </>
          )}

          <Text style={styles.label}>Open time (HH:mm)</Text>
          <AppInput
            placeholder="e.g. 09:00"
            value={openTime}
            onChangeText={setOpenTime}
            style={styles.input}
            editable={!loading}
          />
          <Text style={styles.label}>Close time (HH:mm)</Text>
          <AppInput
            placeholder="e.g. 18:00"
            value={closeTime}
            onChangeText={setCloseTime}
            style={styles.input}
            editable={!loading}
          />

          <View style={styles.switchRow}>
            <Text style={styles.label}>Closed (no opening this slot)</Text>
            <Switch value={isClosed} onValueChange={setIsClosed} disabled={loading} />
          </View>

          {(scheduleType === 'EMERGENCY' || scheduleType === 'DAILY' || scheduleType === 'TEMPORARY') && (
            <>
              <Text style={styles.label}>Reason (optional)</Text>
              <AppInput
                placeholder="e.g. Special event"
                value={reason}
                onChangeText={setReason}
                style={styles.input}
                editable={!loading}
                multiline
              />
            </>
          )}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <PrimaryButton title="Save Schedule" onPress={handleSave} loading={loading} disabled={loading} />
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
  title: { fontSize: fontSizes.xxl, fontWeight: fontWeights.bold, color: colors.textPrimary, marginBottom: spacing.xl },
  label: { marginBottom: spacing.xs, fontSize: fontSizes.sm, fontWeight: fontWeights.medium, color: colors.textPrimary },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.lg },
  typeChip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, backgroundColor: colors.border },
  typeChipActive: { backgroundColor: colors.primary },
  typeChipText: { fontSize: fontSizes.sm, color: colors.textPrimary },
  typeChipTextActive: { color: colors.white },
  dayRowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.lg },
  dayChip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, backgroundColor: colors.border },
  dayChipActive: { backgroundColor: colors.primary },
  dayChipText: { fontSize: fontSizes.sm, color: colors.textPrimary },
  dayChipTextActive: { color: colors.white },
  input: { marginBottom: spacing.md },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg },
  error: { color: colors.error, marginBottom: spacing.sm, fontSize: fontSizes.sm },
});

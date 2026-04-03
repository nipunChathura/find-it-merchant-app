import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
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
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { DatePickerField, TimePickerField } from '@/components/ui/SchedulePickerFields';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import {
    fetchOutletScheduleDetails,
    findScheduleSlotById,
    isValidTimeHHmm,
    SCHEDULE_DAYS,
    SCHEDULE_TYPES,
    updateScheduleSlot,
    type CreateSchedulePayload,
    type NormalScheduleSlot,
    type ScheduleType,
    type SpecialScheduleSlot,
} from '@/services/scheduleService';
import { colors } from '@/theme/colors';
import { layout, spacing } from '@/theme/spacing';
import { fontSizes, fontWeights } from '@/theme/typography';
import { normalizeApiTimeToHHmm, parseYYYYMMDDToDate, toYYYYMMDD } from '@/utils/scheduleDateTime';

export default function EditScheduleScreen() {
  const { id, outletId } = useLocalSearchParams<{ id: string; outletId: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(!!outletId && !!id);
  const [scheduleType, setScheduleType] = useState<ScheduleType>('NORMAL');
  const [dayOfWeek, setDayOfWeek] = useState<string>(SCHEDULE_DAYS[0]);
  const [specialDate, setSpecialDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [openTime, setOpenTime] = useState('09:00');
  const [closeTime, setCloseTime] = useState('18:00');
  const [isClosed, setIsClosed] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const scheduleId = id != null ? parseInt(id, 10) : NaN;

  useEffect(() => {
    if (!outletId || !id || Number.isNaN(scheduleId)) {
      setLoading(false);
      setNotFound(true);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    fetchOutletScheduleDetails(outletId)
      .then((data) => {
        if (cancelled) return;
        const found = findScheduleSlotById(data, scheduleId);
        if (!found) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        const { type, slot } = found;
        setScheduleType(type);
        if (type === 'NORMAL' && 'dayOfWeek' in slot) {
          setDayOfWeek((slot as NormalScheduleSlot).dayOfWeek);
        }
        if (type === 'EMERGENCY' || type === 'DAILY') {
          const raw = (slot as SpecialScheduleSlot).specialDate?.trim() ?? '';
          setSpecialDate(raw ? raw.slice(0, 10) : toYYYYMMDD(new Date()));
        }
        if (type === 'TEMPORARY') {
          const s = slot as SpecialScheduleSlot;
          const sd = s.startDate?.trim() ?? '';
          const ed = s.endDate?.trim() ?? '';
          setStartDate(sd ? sd.slice(0, 10) : toYYYYMMDD(new Date()));
          setEndDate(ed ? ed.slice(0, 10) : toYYYYMMDD(new Date()));
        }
        setOpenTime(normalizeApiTimeToHHmm(slot.openTime, '09:00'));
        setCloseTime(normalizeApiTimeToHHmm(slot.closeTime, '18:00'));
        setIsClosed((slot as NormalScheduleSlot & SpecialScheduleSlot).isClosed === 'Y');
        setReason((slot as SpecialScheduleSlot).reason ?? '');
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [outletId, id, scheduleId]);

  const buildPayload = useCallback((): CreateSchedulePayload => ({
    scheduleType,
    dayOfWeek: scheduleType === 'NORMAL' ? dayOfWeek : null,
    specialDate: scheduleType === 'EMERGENCY' || scheduleType === 'DAILY' ? (specialDate.trim() || null) : null,
    startDate: scheduleType === 'TEMPORARY' ? (startDate.trim() || null) : null,
    endDate: scheduleType === 'TEMPORARY' ? (endDate.trim() || null) : null,
    openTime: openTime.trim(),
    closeTime: closeTime.trim(),
    isClosed,
    reason: reason.trim() || null,
  }), [scheduleType, dayOfWeek, specialDate, startDate, endDate, openTime, closeTime, isClosed, reason]);

  const validate = useCallback((): boolean => {
    if (!openTime.trim() || !closeTime.trim()) {
      setError('Open time and close time are required.');
      return false;
    }
    if (!isValidTimeHHmm(openTime.trim()) || !isValidTimeHHmm(closeTime.trim())) {
      setError('Times must be in HH:mm format (e.g. 09:00, 18:30).');
      return false;
    }
    if (scheduleType === 'EMERGENCY' || scheduleType === 'DAILY') {
      if (!specialDate.trim()) {
        setError('Date is required.');
        return false;
      }
    }
    if (scheduleType === 'TEMPORARY') {
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
  }, [scheduleType, specialDate, startDate, endDate, openTime, closeTime]);

  const handleSave = async () => {
    if (!outletId || Number.isNaN(scheduleId)) return;
    setError('');
    if (!validate()) return;
    setSaving(true);
    try {
      await updateScheduleSlot(outletId, scheduleId, buildPayload());
      router.back();
    } catch {
      setError('Failed to update schedule.');
    } finally {
      setSaving(false);
    }
  };

  if (!outletId || !id) {
    return (
      <ScreenContainer>
        <Text style={styles.error}>Missing outlet or schedule.</Text>
        <PrimaryButton title="Back" onPress={() => router.back()} />
      </ScreenContainer>
    );
  }

  if (loading) {
    return (
      <ScreenContainer>
        <LoadingSpinner />
      </ScreenContainer>
    );
  }

  if (notFound) {
    return (
      <ScreenContainer>
        <Text style={styles.error}>Schedule not found.</Text>
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
          <Text style={styles.title}>Edit Schedule</Text>

          <Text style={styles.label}>Schedule type</Text>
          <View style={styles.typeRow}>
            {SCHEDULE_TYPES.map((t) => (
              <Pressable
                key={t}
                style={[styles.typeChip, scheduleType === t && styles.typeChipActive]}
                onPress={() => setScheduleType(t)}
                disabled={saving}
              >
                <Text style={[styles.typeChipText, scheduleType === t && styles.typeChipTextActive]}>{t}</Text>
              </Pressable>
            ))}
          </View>

          {scheduleType === 'NORMAL' && (
            <>
              <Text style={styles.label}>Day of week</Text>
              <View style={styles.dayRowWrap}>
                {SCHEDULE_DAYS.map((d) => (
                  <Pressable
                    key={d}
                    style={[styles.dayChip, dayOfWeek === d && styles.dayChipActive]}
                    onPress={() => setDayOfWeek(d)}
                    disabled={saving}
                  >
                    <Text style={[styles.dayChipText, dayOfWeek === d && styles.dayChipTextActive]}>{d.slice(0, 3)}</Text>
                  </Pressable>
                ))}
              </View>
            </>
          )}

          {(scheduleType === 'EMERGENCY' || scheduleType === 'DAILY') && (
            <DatePickerField label="Date" value={specialDate} onChange={setSpecialDate} disabled={saving} />
          )}

          {scheduleType === 'TEMPORARY' && (
            <>
              <DatePickerField label="Start date" value={startDate} onChange={setStartDate} disabled={saving} />
              <DatePickerField
                label="End date"
                value={endDate}
                onChange={setEndDate}
                disabled={saving}
                minimumDate={parseYYYYMMDDToDate(startDate)}
              />
            </>
          )}

          <TimePickerField label="Open time" value={openTime} onChange={setOpenTime} disabled={saving} />
          <TimePickerField label="Close time" value={closeTime} onChange={setCloseTime} disabled={saving} />

          <View style={styles.switchRow}>
            <Text style={styles.label}>Closed</Text>
            <Switch value={isClosed} onValueChange={setIsClosed} disabled={saving} />
          </View>

          {(scheduleType === 'EMERGENCY' || scheduleType === 'DAILY' || scheduleType === 'TEMPORARY') && (
            <>
              <Text style={styles.label}>Reason (optional)</Text>
              <AppInput
                placeholder="e.g. Special event"
                value={reason}
                onChangeText={setReason}
                style={styles.input}
                editable={!saving}
                multiline
              />
            </>
          )}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <PrimaryButton title="Save Changes" onPress={handleSave} loading={saving} disabled={saving} />
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

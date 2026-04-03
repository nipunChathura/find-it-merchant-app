import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import React, { useCallback, useEffect, useState } from 'react';
import {
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { AppInput } from '@/components/ui/AppInput';
import { colors } from '@/theme/colors';
import { inputRadius, spacing } from '@/theme/spacing';
import { fontSizes, fontWeights } from '@/theme/typography';
import {
    dateFromHHmmString,
    formatHHmmFromDate,
    parseYYYYMMDDToDate,
    toYYYYMMDD,
} from '@/utils/scheduleDateTime';

type PickerFieldProps = {
  label: string;
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
  /** YYYY-MM-DD bounds for date pickers */
  minimumDate?: Date;
  maximumDate?: Date;
  containerStyle?: object;
};

export function DatePickerField({
  label,
  value,
  onChange,
  disabled,
  minimumDate,
  maximumDate,
  containerStyle,
}: PickerFieldProps) {
  const [open, setOpen] = useState(false);
  const [iosDraft, setIosDraft] = useState(() => parseYYYYMMDDToDate(value));

  useEffect(() => {
    if (open && Platform.OS === 'ios') {
      setIosDraft(parseYYYYMMDDToDate(value));
    }
  }, [open, value]);

  const applyDate = useCallback(
    (d: Date) => {
      onChange(toYYYYMMDD(d));
    },
    [onChange]
  );

  const onAndroidChange = useCallback(
    (event: DateTimePickerEvent, date?: Date) => {
      if (Platform.OS === 'android') setOpen(false);
      if (event.type === 'set' && date) applyDate(date);
    },
    [applyDate]
  );

  const onIosChange = useCallback((_event: DateTimePickerEvent, date?: Date) => {
    if (date) setIosDraft(date);
  }, []);

  if (Platform.OS === 'web') {
    return (
      <View style={containerStyle}>
        <Text style={styles.label}>{label}</Text>
        <AppInput value={value} onChangeText={onChange} editable={!disabled} placeholder="YYYY-MM-DD" style={styles.fallbackInput} />
      </View>
    );
  }

  return (
    <View style={containerStyle}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        style={({ pressed }) => [styles.field, disabled && styles.fieldDisabled, pressed && !disabled && styles.fieldPressed]}
        onPress={() => !disabled && setOpen(true)}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <Text style={styles.fieldText}>{value || 'Select date'}</Text>
        <MaterialIcons name="calendar-today" size={22} color={colors.primary} />
      </Pressable>

      {open && Platform.OS === 'android' ? (
        <DateTimePicker
          value={parseYYYYMMDDToDate(value)}
          mode="date"
          display="default"
          onChange={onAndroidChange}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
        />
      ) : null}

      {Platform.OS === 'ios' ? (
        <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
          <View style={styles.modalRoot}>
            <Pressable style={styles.modalBackdrop} onPress={() => setOpen(false)} />
            <View style={styles.iosSheet}>
              <View style={styles.iosToolbar}>
                <Pressable onPress={() => setOpen(false)} hitSlop={12}>
                  <Text style={styles.iosToolbarBtn}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    applyDate(iosDraft);
                    setOpen(false);
                  }}
                  hitSlop={12}
                >
                  <Text style={[styles.iosToolbarBtn, styles.iosToolbarDone]}>Done</Text>
                </Pressable>
              </View>
              <DateTimePicker
                value={iosDraft}
                mode="date"
                display="spinner"
                onChange={onIosChange}
                minimumDate={minimumDate}
                maximumDate={maximumDate}
                themeVariant="light"
              />
            </View>

          </View>
        </Modal>
      ) : null}
    </View>
  );
}

export function TimePickerField({
  label,
  value,
  onChange,
  disabled,
  containerStyle,
}: Omit<PickerFieldProps, 'minimumDate' | 'maximumDate'>) {
  const [open, setOpen] = useState(false);
  const [iosDraft, setIosDraft] = useState(() => dateFromHHmmString(value));

  useEffect(() => {
    if (open && Platform.OS === 'ios') {
      setIosDraft(dateFromHHmmString(value));
    }
  }, [open, value]);

  const applyTime = useCallback(
    (d: Date) => {
      onChange(formatHHmmFromDate(d));
    },
    [onChange]
  );

  const onAndroidChange = useCallback(
    (event: DateTimePickerEvent, date?: Date) => {
      if (Platform.OS === 'android') setOpen(false);
      if (event.type === 'set' && date) applyTime(date);
    },
    [applyTime]
  );

  const onIosChange = useCallback((_event: DateTimePickerEvent, date?: Date) => {
    if (date) setIosDraft(date);
  }, []);

  if (Platform.OS === 'web') {
    return (
      <View style={containerStyle}>
        <Text style={styles.label}>{label}</Text>
        <AppInput value={value} onChangeText={onChange} editable={!disabled} placeholder="HH:mm" style={styles.fallbackInput} />
      </View>
    );
  }

  return (
    <View style={containerStyle}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        style={({ pressed }) => [styles.field, disabled && styles.fieldDisabled, pressed && !disabled && styles.fieldPressed]}
        onPress={() => !disabled && setOpen(true)}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <Text style={styles.fieldText}>{value || 'Select time'}</Text>
        <MaterialIcons name="schedule" size={22} color={colors.primary} />
      </Pressable>

      {open && Platform.OS === 'android' ? (
        <DateTimePicker
          value={dateFromHHmmString(value)}
          mode="time"
          display="default"
          is24Hour
          onChange={onAndroidChange}
        />
      ) : null}

      {Platform.OS === 'ios' ? (
        <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
          <View style={styles.modalRoot}>
            <Pressable style={styles.modalBackdrop} onPress={() => setOpen(false)} />
            <View style={styles.iosSheet}>
              <View style={styles.iosToolbar}>
                <Pressable onPress={() => setOpen(false)} hitSlop={12}>
                  <Text style={styles.iosToolbarBtn}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    applyTime(iosDraft);
                    setOpen(false);
                  }}
                  hitSlop={12}
                >
                  <Text style={[styles.iosToolbarBtn, styles.iosToolbarDone]}>Done</Text>
                </Pressable>
              </View>
              <DateTimePicker value={iosDraft} mode="time" display="spinner" is24Hour onChange={onIosChange} themeVariant="light" />
            </View>

          </View>
        </Modal>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    marginBottom: spacing.xs,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    color: colors.textPrimary,
  },
  field: {
    height: 48,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: inputRadius,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.card,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  fieldPressed: { opacity: 0.92 },
  fieldDisabled: { opacity: 0.55 },
  fieldText: {
    fontSize: fontSizes.base,
    color: colors.textPrimary,
  },
  fallbackInput: { marginBottom: spacing.md },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  iosSheet: {
    backgroundColor: colors.card,
    paddingBottom: spacing.xl,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },
  iosToolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  iosToolbarBtn: {
    fontSize: fontSizes.base,
    color: colors.textSecondary,
  },
  iosToolbarDone: {
    fontWeight: fontWeights.semibold,
    color: colors.primary,
  },
});

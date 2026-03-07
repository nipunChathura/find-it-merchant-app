import React, { useMemo, useState } from 'react';
import {
    FlatList,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TextInput
} from 'react-native';

import { colors } from '@/theme/colors';
import { inputRadius, layout, spacing } from '@/theme/spacing';
import { fontSizes } from '@/theme/typography';

const VISIBLE_ITEMS = 5;
const ITEM_HEIGHT = 48;
const LIST_MAX_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

export interface DropdownOption {
  id: number;
  name: string;
}

interface SearchableDropdownProps {
  options: DropdownOption[];
  selected: DropdownOption | null;
  onSelect: (option: DropdownOption) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  loading?: boolean;
  onOpen?: () => void;
}

export function SearchableDropdown({
  options,
  selected,
  onSelect,
  placeholder = 'Select…',
  searchPlaceholder = 'Search…',
  disabled = false,
  loading = false,
  onOpen,
}: SearchableDropdownProps) {
  const [visible, setVisible] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return options.slice(0, 50);
    const q = search.trim().toLowerCase();
    return options.filter((o) => o.name.toLowerCase().includes(q)).slice(0, 50);
  }, [options, search]);

  const open = () => {
    if (disabled || loading) return;
    setSearch('');
    setVisible(true);
    onOpen?.();
  };

  const choose = (option: DropdownOption) => {
    onSelect(option);
    setVisible(false);
  };

  return (
    <>
      <Pressable
        onPress={open}
        disabled={disabled || loading}
        style={[
          styles.trigger,
          (disabled || loading) && styles.triggerDisabled,
        ]}
      >
        <Text
          style={[styles.triggerText, !selected && styles.triggerPlaceholder]}
          numberOfLines={1}
        >
          {loading ? 'Loading…' : selected ? (selected.name ?? String(selected.id)) : placeholder}
        </Text>
        <Text style={styles.triggerChevron}>▼</Text>
      </Pressable>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setVisible(false)}>
          <Pressable style={styles.modalContent} onPress={() => {}}>
            <TextInput
              style={styles.searchInput}
              placeholder={searchPlaceholder}
              placeholderTextColor={colors.textSecondary}
              value={search}
              onChangeText={setSearch}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <FlatList
              key={`list-${options.length}-${visible}`}
              data={filtered}
              keyExtractor={(item) => `opt-${item.id}-${item.name}`}
              style={[styles.list, { maxHeight: LIST_MAX_HEIGHT }]}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <Pressable
                  style={({ pressed }) => [
                    styles.option,
                    pressed && styles.optionPressed,
                    selected?.id === item.id && styles.optionSelected,
                  ]}
                  onPress={() => choose(item)}
                >
                  <Text style={styles.optionText} numberOfLines={1}>
                    {item?.name ?? String(item?.id ?? '')}
                  </Text>
                </Pressable>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No results</Text>
              }
            />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: inputRadius,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.card,
    marginBottom: spacing.md,
  },
  triggerDisabled: {
    opacity: 0.6,
  },
  triggerText: {
    flex: 1,
    fontSize: fontSizes.base,
    color: colors.textPrimary,
  },
  triggerPlaceholder: {
    color: colors.textSecondary,
  },
  triggerChevron: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: layout.contentPaddingHorizontal,
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: layout.modalBorderRadius,
    padding: layout.modalPadding,
    maxHeight: LIST_MAX_HEIGHT + 80,
  },
  searchInput: {
    height: 48,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: inputRadius,
    paddingHorizontal: spacing.lg,
    fontSize: fontSizes.base,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  list: {
    flexGrow: 0,
  },
  option: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    borderRadius: 8,
  },
  optionPressed: {
    backgroundColor: colors.border,
  },
  optionSelected: {
    backgroundColor: colors.border,
  },
  optionText: {
    fontSize: fontSizes.base,
    color: colors.textPrimary,
  },
  emptyText: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    padding: spacing.lg,
  },
});

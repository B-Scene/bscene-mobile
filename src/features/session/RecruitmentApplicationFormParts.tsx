import { useEffect, useState, type ReactNode } from "react";
import {
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";
import Svg, { Path } from "react-native-svg";

import { AppIcon } from "@/shared/components/AppIcon";
import { BottomSheetModal } from "@/shared/components/BottomSheetModal";
import { colors, textStyles } from "@/shared/constants/theme";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
const SHEET_BACKDROP = "rgba(29, 26, 26, 0.5)";

const formatDateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;

const parseDateKey = (dateKey: string) => {
  const [year, month, day] = dateKey.split("-").map(Number);

  return year && month && day ? new Date(year, month - 1, day) : new Date();
};

export const getTodayDateKey = () => formatDateKey(new Date());

export const formatDeadlineDate = (value: string) => {
  if (!value) return "";

  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) return value;

  const weekDay = WEEKDAYS[new Date(year, month - 1, day).getDay()];

  return `${year}.${String(month).padStart(2, "0")}.${String(day).padStart(
    2,
    "0",
  )}. (${weekDay})`;
};

export function SessionFormTopBar({
  title,
  onBack,
  onClose,
}: {
  title: string;
  onBack: () => void;
  onClose: () => void;
}) {
  return (
    <View style={styles.topBar}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="뒤로가기"
        style={styles.topBarButton}
        onPress={onBack}
      >
        <AppIcon name="arrowLeft" size={24} />
      </Pressable>

      <Text numberOfLines={1} style={styles.topBarTitle}>
        {title}
      </Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="닫기"
        style={styles.topBarButton}
        onPress={onClose}
      >
        <AppIcon name="closeHeader" size={24} />
      </Pressable>
    </View>
  );
}

export function SessionTextInput({
  error = false,
  multiline = false,
  style,
  ...props
}: TextInputProps & { error?: boolean }) {
  const [focused, setFocused] = useState(false);

  return (
    <TextInput
      placeholderTextColor={colors.neutral500}
      textAlignVertical={multiline ? "top" : "center"}
      multiline={multiline}
      {...props}
      style={[
        styles.input,
        focused && styles.inputFocused,
        error && styles.inputError,
        style,
      ]}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
}

export function SessionCountedTextArea({
  value,
  maxLength,
  height,
  error = false,
  placeholder,
  onChangeText,
}: {
  value: string;
  maxLength: number;
  height: number;
  error?: boolean;
  placeholder: string;
  onChangeText: (value: string) => void;
}) {
  return (
    <View>
      <SessionTextInput
        multiline
        value={value}
        maxLength={maxLength}
        error={error}
        placeholder={placeholder}
        style={[styles.textArea, { height }]}
        onChangeText={onChangeText}
      />
      <Text pointerEvents="none" style={styles.count}>
        {value.length}/{maxLength}
      </Text>
    </View>
  );
}

export function SessionChips({
  options,
  isSelected,
  onPress,
  chipStyle = "application",
}: {
  options: readonly string[];
  isSelected: (option: string) => boolean;
  onPress: (option: string) => void;
  chipStyle?: "application" | "recruitment";
}) {
  return (
    <View style={styles.chips}>
      {options.map((option) => {
        const selected = isSelected(option);

        return (
          <Pressable
            key={option}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            style={[
              styles.chip,
              chipStyle === "recruitment"
                ? styles.chipRecruitment
                : styles.chipApplication,
              selected && styles.chipSelected,
            ]}
            onPress={() => onPress(option)}
          >
            <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
              {option}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function SessionPickerButton({
  value,
  placeholder,
  error = false,
  trailing,
  onPress,
}: {
  value: string;
  placeholder: string;
  error?: boolean;
  trailing: ReactNode;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      style={[styles.pickerButton, error && styles.inputError]}
      onPress={onPress}
    >
      <Text style={[styles.pickerText, !value && styles.pickerPlaceholder]}>
        {value || placeholder}
      </Text>
      {trailing}
    </Pressable>
  );
}

export function SessionSelect({
  value,
  options,
  placeholder,
  error = false,
  onChange,
}: {
  value: string;
  options: readonly string[];
  placeholder: string;
  error?: boolean;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <View style={[styles.select, open && styles.selectOpen]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        style={[
          styles.pickerButton,
          error && styles.inputError,
          open && styles.selectButtonOpen,
        ]}
        onPress={() => setOpen((prev) => !prev)}
      >
        <Text style={[styles.pickerText, !value && styles.pickerPlaceholder]}>
          {value || placeholder}
        </Text>
        <AppIcon
          name={open ? "arrowDownYellow" : "arrowDownGray"}
          width={10}
          height={6}
        />
      </Pressable>

      {open ? (
        <View style={styles.selectMenu}>
          {options.map((option) => (
            <Pressable
              key={option}
              accessibilityRole="button"
              onPress={() => {
                onChange(option);
                setOpen(false);
              }}
            >
              <Text style={styles.selectOption}>{option}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function SheetHandle() {
  return <View style={styles.handle} />;
}

function GenreSheetBody({
  title,
  options,
  selectedValue,
  onSelect,
}: {
  title: string;
  options: readonly string[];
  selectedValue: string;
  onSelect: (value: string) => void;
}) {
  const [draftValue, setDraftValue] = useState(selectedValue);
  const canApply = draftValue.length > 0;

  return (
    <View style={styles.selectSheet}>
      <View style={styles.selectSheetHeader}>
        <SheetHandle />
        <Text style={styles.selectSheetTitle}>필터</Text>
      </View>

      <ScrollView style={styles.selectSheetBody}>
        <Text style={styles.selectSheetLabel}>{title}</Text>
        <View style={styles.selectSheetChips}>
          {options.map((option) => {
            const selected = draftValue === option;

            return (
              <Pressable
                key={option}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                style={[styles.sheetChip, selected && styles.chipSelected]}
                onPress={() => setDraftValue(option)}
              >
                <Text
                  style={[
                    styles.sheetChipText,
                    selected && styles.chipTextSelected,
                  ]}
                >
                  {option}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <Pressable
        accessibilityRole="button"
        disabled={!canApply}
        style={[styles.applyButton, canApply && styles.applyButtonActive]}
        onPress={() => onSelect(draftValue)}
      >
        <Text style={[styles.applyText, canApply && styles.applyTextActive]}>
          선택완료
        </Text>
      </Pressable>
    </View>
  );
}

export function SessionSelectSheet({
  open,
  title,
  options,
  selectedValue,
  onSelect,
  onClose,
}: {
  open: boolean;
  title: string;
  options: readonly string[];
  selectedValue: string;
  onSelect: (value: string) => void;
  onClose: () => void;
}) {
  return (
    <BottomSheetModal
      open={open}
      closeLabel={`${title} 선택 닫기`}
      backdropColor="rgba(29, 26, 26, 0.7)"
      onClose={onClose}
    >
      <GenreSheetBody
        key={selectedValue}
        title={title}
        options={options}
        selectedValue={selectedValue}
        onSelect={(value) => {
          onSelect(value);
          onClose();
        }}
      />
    </BottomSheetModal>
  );
}

function Chevron({ direction }: { direction: "left" | "right" }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d={direction === "left" ? "M15 6L9 12L15 18" : "M9 6L15 12L9 18"}
        stroke={colors.neutral900}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function DateSheetBody({
  value,
  minDate,
  onSelect,
}: {
  value: string;
  minDate?: string;
  onSelect: (dateKey: string) => void;
}) {
  const [displayedMonth, setDisplayedMonth] = useState(() =>
    value ? parseDateKey(value) : new Date(),
  );
  const year = displayedMonth.getFullYear();
  const month = displayedMonth.getMonth();
  const startOffset = new Date(year, month, 1).getDay();
  const lastDay = new Date(year, month + 1, 0).getDate();
  const cellCount = Math.ceil((startOffset + lastDay) / 7) * 7;
  const todayKey = getTodayDateKey();
  const days = Array.from({ length: cellCount }, (_, index) => {
    const date = new Date(year, month, index - startOffset + 1);
    const dateKey = formatDateKey(date);
    const muted = date.getMonth() !== month;

    return {
      dateKey,
      label: String(date.getDate()),
      muted,
      sunday: !muted && date.getDay() === 0,
      today: !muted && dateKey === todayKey,
      disabled: !muted && Boolean(minDate && dateKey < minDate),
    };
  });

  const moveMonth = (amount: number) =>
    setDisplayedMonth(new Date(year, month + amount, 1));

  return (
    <View style={styles.dateSheet}>
      <SheetHandle />

      <View style={styles.dateBody}>
        <View style={styles.dateHeader}>
          <View style={styles.dateHeaderSide} />
          <View style={styles.monthNav}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="이전 달"
              onPress={() => moveMonth(-1)}
            >
              <Chevron direction="left" />
            </Pressable>
            <Text style={styles.monthLabel}>
              {year}년 {String(month + 1).padStart(2, "0")}월
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="다음 달"
              onPress={() => moveMonth(1)}
            >
              <Chevron direction="right" />
            </Pressable>
          </View>
          <Pressable
            accessibilityRole="button"
            style={[styles.dateHeaderSide, styles.todayButton]}
            onPress={() => setDisplayedMonth(new Date())}
          >
            <Text style={styles.todayText}>오늘</Text>
          </Pressable>
        </View>

        <View style={styles.dateGrid}>
          {WEEKDAYS.map((weekday) => (
            <View key={weekday} style={styles.dateCell}>
              <Text
                style={[styles.dateText, weekday === "일" && styles.sundayText]}
              >
                {weekday}
              </Text>
            </View>
          ))}

          {days.map((day) => {
            const selected = day.dateKey === value;
            const inactive = day.muted || day.disabled;

            return (
              <View key={day.dateKey} style={styles.dateCell}>
                <Pressable
                  accessibilityRole="button"
                  disabled={inactive}
                  style={[styles.dayButton, selected && styles.dayButtonSelected]}
                  onPress={() => onSelect(day.dateKey)}
                >
                  <Text
                    style={[
                      styles.dateText,
                      day.sunday && styles.sundayText,
                      inactive && styles.dayTextInactive,
                      selected && styles.dayTextSelected,
                    ]}
                  >
                    {day.label}
                  </Text>
                  {day.today && !selected ? (
                    <View style={styles.todayDot} />
                  ) : null}
                </Pressable>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

export function SessionDatePickerSheet({
  open,
  value,
  minDate,
  onClose,
  onSelect,
}: {
  open: boolean;
  value: string;
  minDate?: string;
  onClose: () => void;
  onSelect: (dateKey: string) => void;
}) {
  return (
    <BottomSheetModal
      open={open}
      closeLabel="날짜 선택 닫기"
      backdropColor={SHEET_BACKDROP}
      onClose={onClose}
    >
      <DateSheetBody
        key={value}
        value={value}
        minDate={minDate}
        onSelect={onSelect}
      />
    </BottomSheetModal>
  );
}

const onlyDigits = (value: string) => value.replace(/\D/g, "").slice(0, 2);

const clampTime = (value: string, max: number) =>
  value ? String(Math.min(Number(value), max)) : "";

function TimeInput({
  value,
  max,
  onChange,
}: {
  value: string;
  max: number;
  onChange: (value: string) => void;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <TextInput
      keyboardType="number-pad"
      value={value}
      style={[styles.timeInput, focused && styles.timeInputFocused]}
      onChangeText={(next) => onChange(onlyDigits(next))}
      onFocus={() => setFocused(true)}
      onBlur={() => {
        setFocused(false);
        onChange(clampTime(value, max));
      }}
    />
  );
}

function TimeSheetBody({
  value,
  title,
  onConfirm,
}: {
  value: string;
  title: string;
  onConfirm: (time: string) => void;
}) {
  const [initialHour = "", initialMinute = ""] = value.split(":");
  const [hour, setHour] = useState(initialHour);
  const [minute, setMinute] = useState(initialMinute);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSubscription = Keyboard.addListener(showEvent, (event) =>
      setKeyboardHeight(event.endCoordinates.height),
    );
    const hideSubscription = Keyboard.addListener(hideEvent, () =>
      setKeyboardHeight(0),
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const confirm = () => {
    const clampedHour = clampTime(hour, 23);
    const clampedMinute = clampTime(minute, 59);

    if (!clampedHour && !clampedMinute) {
      onConfirm("");
      return;
    }

    onConfirm(
      `${clampedHour.padStart(2, "0")}:${clampedMinute.padStart(2, "0")}`,
    );
  };

  return (
    <View style={[styles.timeSheet, { marginBottom: keyboardHeight }]}>
      <SheetHandle />

      <View style={styles.timeBody}>
        <View style={styles.timeHeader}>
          <View style={styles.timeHeaderSide} />
          <Text style={styles.monthLabel}>{title}</Text>
          <Pressable
            accessibilityRole="button"
            style={[styles.timeHeaderSide, styles.todayButton]}
            onPress={confirm}
          >
            <Text style={styles.timeConfirm}>확인</Text>
          </Pressable>
        </View>

        <View style={styles.timeInputs}>
          <TimeInput value={hour} max={23} onChange={setHour} />
          <Text style={styles.timeColon}>:</Text>
          <TimeInput value={minute} max={59} onChange={setMinute} />
        </View>
      </View>
    </View>
  );
}

export function SessionTimePickerSheet({
  open,
  value,
  title,
  onClose,
  onConfirm,
}: {
  open: boolean;
  value: string;
  title: string;
  onClose: () => void;
  onConfirm: (time: string) => void;
}) {
  return (
    <BottomSheetModal
      open={open}
      closeLabel="시간 선택 닫기"
      backdropColor={SHEET_BACKDROP}
      onClose={onClose}
    >
      <TimeSheetBody key={value} value={value} title={title} onConfirm={onConfirm} />
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  topBar: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.white,
    paddingHorizontal: 15,
  },
  topBarButton: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  topBarTitle: {
    ...textStyles.label2,
    flex: 1,
    color: colors.neutral900,
    textAlign: "center",
  },
  input: {
    ...textStyles.caption2,
    height: 30,
    borderWidth: 1,
    borderColor: colors.neutral400,
    borderRadius: 5,
    backgroundColor: colors.white,
    color: colors.neutral900,
    paddingHorizontal: 16,
    paddingVertical: 0,
  },
  inputFocused: {
    borderColor: colors.secondary500,
  },
  inputError: {
    borderColor: colors.error,
  },
  textArea: {
    paddingTop: 6,
    paddingBottom: 20,
  },
  count: {
    ...textStyles.caption4,
    position: "absolute",
    right: 13,
    bottom: 6,
    color: colors.neutral500,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    height: 26,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: colors.neutral300,
  },
  chipApplication: {
    paddingHorizontal: 15,
  },
  chipRecruitment: {
    minWidth: 56,
    paddingHorizontal: 8,
  },
  chipSelected: {
    backgroundColor: colors.secondary500,
  },
  chipText: {
    ...textStyles.caption2,
    color: colors.neutral600,
  },
  chipTextSelected: {
    color: colors.white,
  },
  pickerButton: {
    height: 30,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: colors.neutral400,
    borderRadius: 5,
    backgroundColor: colors.white,
    paddingHorizontal: 16,
  },
  pickerText: {
    ...textStyles.caption2,
    color: colors.neutral900,
  },
  pickerPlaceholder: {
    color: colors.neutral500,
  },
  select: {
    zIndex: 1,
  },
  selectOpen: {
    zIndex: 20,
  },
  selectButtonOpen: {
    borderColor: colors.secondary500,
  },
  selectMenu: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    gap: 4,
    marginTop: 4,
    borderWidth: 1,
    borderColor: colors.secondary500,
    borderRadius: 5,
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 10,
    zIndex: 20,
  },
  selectOption: {
    ...textStyles.caption3,
    color: colors.neutral600,
  },
  handle: {
    width: 44,
    height: 4,
    alignSelf: "center",
    borderRadius: 4,
    backgroundColor: "#DEDEDE",
  },
  selectSheet: {
    height: 610,
    flexShrink: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: colors.white,
    paddingBottom: 20,
  },
  selectSheetHeader: {
    height: 70,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  selectSheetTitle: {
    ...textStyles.h4,
    marginTop: 20,
    color: colors.neutral900,
    textAlign: "center",
  },
  selectSheetBody: {
    flex: 1,
    marginHorizontal: 20,
    paddingHorizontal: 12,
  },
  selectSheetLabel: {
    ...textStyles.body1,
    color: colors.neutral900,
  },
  selectSheetChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8,
  },
  sheetChip: {
    height: 26,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    backgroundColor: colors.neutral300,
    paddingHorizontal: 12,
  },
  sheetChipText: {
    ...textStyles.caption3,
    color: colors.neutral600,
  },
  applyButton: {
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: colors.neutral300,
    marginHorizontal: 20,
    marginTop: 16,
  },
  applyButtonActive: {
    backgroundColor: colors.secondary500,
  },
  applyText: {
    ...textStyles.label2,
    color: colors.neutral600,
  },
  applyTextActive: {
    color: colors.white,
  },
  dateSheet: {
    gap: 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: colors.white,
    paddingHorizontal: 15,
    paddingTop: 8,
    paddingBottom: 48,
  },
  dateBody: {
    gap: 16,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  dateHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateHeaderSide: {
    flex: 1,
  },
  monthNav: {
    flexDirection: "row",
    alignItems: "center",
    gap: 24,
  },
  monthLabel: {
    ...textStyles.label1,
    color: colors.neutral900,
  },
  todayButton: {
    alignItems: "flex-end",
  },
  todayText: {
    ...textStyles.caption3,
    color: colors.neutral500,
  },
  dateGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 10,
  },
  dateCell: {
    width: `${100 / 7}%`,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  dateText: {
    ...textStyles.caption3,
    color: colors.neutral900,
  },
  sundayText: {
    color: colors.error,
  },
  dayButton: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
  },
  dayButtonSelected: {
    backgroundColor: colors.secondary500,
  },
  dayTextInactive: {
    color: colors.neutral400,
  },
  dayTextSelected: {
    color: colors.white,
  },
  todayDot: {
    position: "absolute",
    bottom: 2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary400,
  },
  timeSheet: {
    gap: 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: colors.white,
    paddingHorizontal: 15,
    paddingTop: 8,
    paddingBottom: 64,
  },
  timeBody: {
    alignItems: "center",
    gap: 24,
    paddingTop: 12,
  },
  timeHeader: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  timeHeaderSide: {
    flex: 1,
  },
  timeConfirm: {
    ...textStyles.body1,
    color: colors.secondary500,
  },
  timeInputs: {
    flexDirection: "row",
    alignItems: "center",
    gap: 24,
  },
  timeInput: {
    ...textStyles.h4,
    width: 52,
    height: 40,
    borderWidth: 2,
    borderColor: colors.neutral400,
    borderRadius: 5,
    color: colors.neutral900,
    paddingVertical: 0,
    textAlign: "center",
  },
  timeInputFocused: {
    borderColor: colors.secondary500,
  },
  timeColon: {
    ...textStyles.h4,
    color: colors.neutral900,
  },
});

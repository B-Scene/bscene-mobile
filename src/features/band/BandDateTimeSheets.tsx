import { useState } from "react";
import {
  KeyboardAvoidingView,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Svg, { Path } from "react-native-svg";

import { BottomSheetModal } from "@/shared/components/BottomSheetModal";
import { colors, textStyles } from "@/shared/constants/theme";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
const SHEET_BACKDROP = "rgba(29, 26, 26, 0.5)";

type CalendarDay = {
  dateKey: string;
  label: string;
  muted: boolean;
  sunday: boolean;
  today: boolean;
};

const formatDateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;

const parseDateKey = (dateKey: string) => {
  const [year, month, day] = dateKey.split("-").map(Number);

  return new Date(year, month - 1, day);
};

const getCalendarDays = (displayedMonth: Date): CalendarDay[] => {
  const year = displayedMonth.getFullYear();
  const month = displayedMonth.getMonth();
  const startOffset = new Date(year, month, 1).getDay();
  const lastDay = new Date(year, month + 1, 0).getDate();
  const cellCount = Math.ceil((startOffset + lastDay) / 7) * 7;
  const todayKey = formatDateKey(new Date());

  return Array.from({ length: cellCount }, (_, index) => {
    const date = new Date(year, month, index - startOffset + 1);
    const dateKey = formatDateKey(date);
    const muted = date.getMonth() !== month;

    return {
      dateKey,
      label: String(date.getDate()),
      muted,
      sunday: !muted && date.getDay() === 0,
      today: !muted && dateKey === todayKey,
    };
  });
};

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

function SheetHandle() {
  return (
    <View style={styles.handleWrap}>
      <View style={styles.handle} />
    </View>
  );
}

export function DatePickerSheet({
  open,
  startDate,
  endDate,
  selectionMode = "range",
  onClose,
  onSelect,
}: {
  open: boolean;
  startDate: string;
  endDate: string;
  selectionMode?: "single" | "range";
  onClose: () => void;
  onSelect: (range: { start: string; end: string }) => void;
}) {
  const [wasOpen, setWasOpen] = useState(open);
  const [displayedMonth, setDisplayedMonth] = useState(() =>
    startDate ? parseDateKey(startDate) : new Date(),
  );
  const [rangeStart, setRangeStart] = useState(startDate);
  const [rangeEnd, setRangeEnd] = useState(endDate);

  if (open !== wasOpen) {
    setWasOpen(open);

    if (open) {
      setDisplayedMonth(startDate ? parseDateKey(startDate) : new Date());
      setRangeStart(startDate);
      setRangeEnd(endDate);
    }
  }

  const calendarDays = getCalendarDays(displayedMonth);
  const weeks = Array.from({ length: calendarDays.length / 7 }, (_, index) =>
    calendarDays.slice(index * 7, index * 7 + 7),
  );
  const monthLabel = `${displayedMonth.getFullYear()}년 ${String(
    displayedMonth.getMonth() + 1,
  ).padStart(2, "0")}월`;

  const moveMonth = (amount: number) => {
    setDisplayedMonth(
      (current) =>
        new Date(current.getFullYear(), current.getMonth() + amount, 1),
    );
  };

  const pressDay = (dateKey: string) => {
    if (selectionMode === "single") {
      setRangeStart(dateKey);
      onSelect({ start: dateKey, end: dateKey });
      return;
    }

    if (!rangeStart || rangeEnd || dateKey < rangeStart) {
      setRangeStart(dateKey);
      setRangeEnd("");
      return;
    }

    setRangeEnd(dateKey);
  };

  const dismiss = () => {
    if (rangeStart) {
      onSelect({ start: rangeStart, end: rangeEnd || rangeStart });
      return;
    }

    onClose();
  };

  const isInRange = (day?: CalendarDay) =>
    Boolean(
      day &&
        !day.muted &&
        rangeStart &&
        rangeEnd &&
        day.dateKey >= rangeStart &&
        day.dateKey <= rangeEnd,
    );

  return (
    <BottomSheetModal
      open={open}
      closeLabel="날짜 선택 닫기"
      backdropColor={SHEET_BACKDROP}
      onClose={dismiss}
    >
      <View style={[styles.sheet, styles.dateSheet]}>
        <SheetHandle />

        <View style={styles.calendar}>
          <View style={styles.monthRow}>
            <View style={styles.monthSide} />
            <View style={styles.monthCenter}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="이전 달"
                onPress={() => moveMonth(-1)}
              >
                <Chevron direction="left" />
              </Pressable>
              <Text style={styles.sheetTitle}>{monthLabel}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="다음 달"
                onPress={() => moveMonth(1)}
              >
                <Chevron direction="right" />
              </Pressable>
            </View>
            <View style={[styles.monthSide, styles.monthSideRight]}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setDisplayedMonth(new Date())}
              >
                <Text style={styles.todayText}>오늘</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.grid}>
            <View style={styles.week}>
              {WEEKDAYS.map((weekday) => (
                <View key={weekday} style={styles.cell}>
                  <Text
                    style={[
                      styles.dayText,
                      weekday === "일" && styles.dayTextSunday,
                    ]}
                  >
                    {weekday}
                  </Text>
                </View>
              ))}
            </View>

            {weeks.map((week) => (
              <View key={week[0].dateKey} style={styles.week}>
                {week.map((day, index) => {
                  const selected =
                    day.dateKey === rangeStart || day.dateKey === rangeEnd;
                  const inRange = isInRange(day);
                  const bridgeLeft = inRange && isInRange(week[index - 1]);
                  const bridgeRight = inRange && isInRange(week[index + 1]);

                  return (
                    <View key={day.dateKey} style={styles.cell}>
                      {inRange ? (
                        <View
                          style={[
                            styles.rangeBand,
                            bridgeLeft
                              ? styles.rangeBridgeLeft
                              : styles.rangeEdgeLeft,
                            bridgeRight
                              ? styles.rangeBridgeRight
                              : styles.rangeEdgeRight,
                          ]}
                        />
                      ) : null}

                      <Pressable
                        accessibilityRole="button"
                        accessibilityState={{ selected, disabled: day.muted }}
                        disabled={day.muted}
                        style={[styles.day, selected && styles.daySelected]}
                        onPress={() => pressDay(day.dateKey)}
                      >
                        <Text
                          style={[
                            styles.dayText,
                            day.sunday && styles.dayTextSunday,
                            day.muted && styles.dayTextMuted,
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
            ))}
          </View>
        </View>
      </View>
    </BottomSheetModal>
  );
}

const parseTime = (value: string) => {
  const [hour = "", minute = ""] = value.split(":");

  return { hour, minute };
};

const clamp = (value: string, max: number) =>
  value ? String(Math.min(Number(value), max)) : "";

const onlyDigits = (value: string) => value.replace(/\D/g, "").slice(0, 2);

function TimeInput({
  value,
  label,
  onChangeText,
  onBlur,
}: {
  value: string;
  label: string;
  onChangeText: (value: string) => void;
  onBlur: () => void;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <TextInput
      accessibilityLabel={label}
      keyboardType="number-pad"
      maxLength={2}
      value={value}
      style={[styles.timeInput, focused && styles.timeInputFocused]}
      onChangeText={(text) => onChangeText(onlyDigits(text))}
      onFocus={() => setFocused(true)}
      onBlur={() => {
        setFocused(false);
        onBlur();
      }}
    />
  );
}

export function TimePickerSheet({
  open,
  value,
  title = "공연 시작 시간",
  onClose,
  onConfirm,
}: {
  open: boolean;
  value: string;
  title?: string;
  onClose: () => void;
  onConfirm: (time: string) => void;
}) {
  const [wasOpen, setWasOpen] = useState(open);
  const [hour, setHour] = useState(() => parseTime(value).hour);
  const [minute, setMinute] = useState(() => parseTime(value).minute);

  if (open !== wasOpen) {
    setWasOpen(open);

    if (open) {
      setHour(parseTime(value).hour);
      setMinute(parseTime(value).minute);
    }
  }

  const confirm = () => {
    const clampedHour = clamp(hour, 23);
    const clampedMinute = clamp(minute, 59);

    if (!clampedHour && !clampedMinute) {
      onConfirm("");
      return;
    }

    onConfirm(
      `${clampedHour.padStart(2, "0")}:${clampedMinute.padStart(2, "0")}`,
    );
  };

  return (
    <BottomSheetModal
      open={open}
      closeLabel="시간 선택 닫기"
      backdropColor={SHEET_BACKDROP}
      onClose={onClose}
    >
      <KeyboardAvoidingView
        behavior="padding"
        style={[styles.sheet, styles.timeSheet]}
      >
        <SheetHandle />

        <View style={styles.timeBody}>
          <View style={styles.monthRow}>
            <View style={styles.monthSide} />
            <Text style={styles.sheetTitle}>{title}</Text>
            <View style={[styles.monthSide, styles.monthSideRight]}>
              <Pressable accessibilityRole="button" onPress={confirm}>
                <Text style={styles.confirmText}>확인</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.timeInputs}>
            <TimeInput
              label="시"
              value={hour}
              onChangeText={setHour}
              onBlur={() => setHour((prev) => clamp(prev, 23))}
            />
            <Text style={styles.timeColon}>:</Text>
            <TimeInput
              label="분"
              value={minute}
              onChangeText={setMinute}
              onBlur={() => setMinute((prev) => clamp(prev, 59))}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  sheet: {
    alignItems: "center",
    gap: 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: colors.white,
    paddingHorizontal: 15,
    paddingTop: 8,
  },
  dateSheet: {
    paddingBottom: 48,
  },
  timeSheet: {
    paddingBottom: 64,
  },
  handleWrap: {
    paddingBottom: 12,
  },
  handle: {
    width: 44,
    height: 4,
    borderRadius: 4,
    backgroundColor: "#DEDEDE",
  },
  calendar: {
    width: "100%",
    gap: 16,
    paddingHorizontal: 16,
  },
  monthRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
  },
  monthSide: {
    flex: 1,
  },
  monthSideRight: {
    alignItems: "flex-end",
  },
  monthCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 24,
  },
  sheetTitle: {
    ...textStyles.label1,
    color: colors.neutral900,
  },
  todayText: {
    ...textStyles.caption3,
    color: colors.neutral500,
  },
  grid: {
    gap: 10,
  },
  week: {
    flexDirection: "row",
  },
  cell: {
    height: 30,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  rangeBand: {
    position: "absolute",
    top: 0,
    bottom: 0,
    backgroundColor: "#FFF6E5",
  },
  rangeBridgeLeft: {
    left: 0,
  },
  rangeEdgeLeft: {
    left: "50%",
    marginLeft: -16,
    borderTopLeftRadius: 15,
    borderBottomLeftRadius: 15,
  },
  rangeBridgeRight: {
    right: 0,
  },
  rangeEdgeRight: {
    right: "50%",
    marginRight: -16,
    borderTopRightRadius: 15,
    borderBottomRightRadius: 15,
  },
  day: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
  },
  daySelected: {
    backgroundColor: colors.secondary500,
  },
  dayText: {
    ...textStyles.caption3,
    color: colors.neutral900,
  },
  dayTextSunday: {
    color: colors.error,
  },
  dayTextMuted: {
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
  timeBody: {
    width: "100%",
    alignItems: "center",
    gap: 24,
  },
  confirmText: {
    ...textStyles.body1,
    color: colors.secondary500,
    textAlign: "right",
  },
  timeInputs: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
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
    padding: 0,
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

import { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";

import { FanConcertCard } from "@/features/fan/FanConcertCard";
import { mapPerformanceToConcert } from "@/features/fan/concertMappers";
import {
  usePerformanceCalendarQuery,
  usePerformancesByDateInfiniteQuery,
} from "@/hooks/api/fan/useFanHome";
import { AppHeader } from "@/shared/components/AppHeader";
import { Screen } from "@/shared/components/Screen";
import { colors, textStyles } from "@/shared/constants/theme";

import type {
  PerformanceCalendarDateItem,
  PerformanceCalendarParams,
} from "@/types/fan/home";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

const formatDateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;

const normalizeDateKey = (value?: string | null) => {
  if (!value) return null;

  const datePart = value.split(/[T ]/)[0];

  if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) return datePart;

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : formatDateKey(date);
};

const getCalendarDateKey = (item: PerformanceCalendarDateItem) => {
  if (typeof item === "string") return normalizeDateKey(item);

  const dateValue =
    item.dateKey ??
    item.date ??
    item.performanceDate ??
    item.startDate ??
    item.startAt ??
    item.startDateTime;

  if (dateValue) return normalizeDateKey(dateValue);

  if (
    typeof item.year === "number" &&
    typeof item.month === "number" &&
    typeof item.day === "number"
  ) {
    return `${item.year}-${String(item.month).padStart(2, "0")}-${String(
      item.day,
    ).padStart(2, "0")}`;
  }

  return null;
};

const getCalendarWeeks = (
  displayedMonth: Date,
  selectedDateKey: string | null,
  eventDateKeys: Set<string>,
) => {
  const year = displayedMonth.getFullYear();
  const month = displayedMonth.getMonth();
  const startOffset = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();
  const cellCount = Math.ceil((startOffset + lastDate) / 7) * 7;
  const days = Array.from({ length: cellCount }, (_, index) => {
    const date = new Date(year, month, index - startOffset + 1);
    const dateKey = formatDateKey(date);
    const muted = date.getMonth() !== month;

    return {
      dateKey,
      label: String(date.getDate()),
      muted,
      sunday: !muted && date.getDay() === 0,
      selected: !muted && dateKey === selectedDateKey,
      hasEvent: !muted && eventDateKeys.has(dateKey),
    };
  });

  return Array.from({ length: cellCount / 7 }, (_, index) =>
    days.slice(index * 7, index * 7 + 7),
  );
};

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
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

export function FanConcertCalendarScreen() {
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [displayedMonth, setDisplayedMonth] = useState(() => {
    const today = new Date();

    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [hasMovedMonth, setHasMovedMonth] = useState(false);
  const calendarParams: PerformanceCalendarParams = hasMovedMonth
    ? {
        year: displayedMonth.getFullYear(),
        month: displayedMonth.getMonth() + 1,
      }
    : {};
  const calendarQuery = usePerformanceCalendarQuery(calendarParams);
  const eventsQuery = usePerformancesByDateInfiniteQuery(
    selectedDateKey ? { date: selectedDateKey } : {},
    10,
  );
  const eventDateKeys = useMemo(
    () =>
      new Set(
        (calendarQuery.data?.items ?? [])
          .map(getCalendarDateKey)
          .filter((dateKey): dateKey is string => Boolean(dateKey)),
      ),
    [calendarQuery.data],
  );
  const weeks = getCalendarWeeks(displayedMonth, selectedDateKey, eventDateKeys);
  const events =
    eventsQuery.data?.pages
      .flatMap((page) => page.items ?? [])
      .map(mapPerformanceToConcert) ?? [];
  const firstPage = eventsQuery.data?.pages[0];
  const totalCount =
    firstPage?.totalCount ??
    firstPage?.totalElements ??
    firstPage?.total ??
    events.length;
  const selectedDate = selectedDateKey
    ? new Date(`${selectedDateKey}T00:00:00`)
    : null;

  const moveMonth = (amount: number) => {
    setHasMovedMonth(true);
    setDisplayedMonth(
      (current) =>
        new Date(current.getFullYear(), current.getMonth() + amount, 1),
    );
    setSelectedDateKey(null);
  };

  return (
    <Screen
      edges={["top", "left", "right"]}
      scroll={false}
      contentStyle={styles.container}
    >
      <AppHeader title="공연 일정" style={styles.header} />

      <View style={styles.calendar}>
        <View style={styles.monthRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="이전 달"
            hitSlop={8}
            onPress={() => moveMonth(-1)}
          >
            <ChevronIcon direction="left" />
          </Pressable>

          <Text style={styles.monthLabel}>
            {displayedMonth.getFullYear()}년{" "}
            {String(displayedMonth.getMonth() + 1).padStart(2, "0")}월
          </Text>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="다음 달"
            hitSlop={8}
            onPress={() => moveMonth(1)}
          >
            <ChevronIcon direction="right" />
          </Pressable>
        </View>

        <View style={styles.weekRow}>
          {WEEKDAYS.map((weekday) => (
            <Text key={weekday} style={styles.weekday}>
              {weekday}
            </Text>
          ))}
        </View>

        <View style={styles.days}>
          {weeks.map((week) => (
            <View key={week[0].dateKey} style={styles.dayRow}>
              {week.map((day) => (
                <Pressable
                  key={day.dateKey}
                  accessibilityRole="button"
                  disabled={day.muted || !day.hasEvent}
                  style={[styles.day, day.selected && styles.daySelected]}
                  onPress={() =>
                    setSelectedDateKey((current) =>
                      current === day.dateKey ? null : day.dateKey,
                    )
                  }
                >
                  <Text
                    style={[
                      styles.dayText,
                      day.selected
                        ? styles.dayTextSelected
                        : day.muted
                          ? styles.dayTextMuted
                          : day.sunday && styles.dayTextSunday,
                    ]}
                  >
                    {day.label}
                  </Text>
                  {day.hasEvent ? <View style={styles.eventDot} /> : null}
                </Pressable>
              ))}
            </View>
          ))}
        </View>

        {calendarQuery.isLoading ? (
          <Text style={styles.calendarMessage}>
            공연 일정을 불러오는 중이에요
          </Text>
        ) : null}

        {calendarQuery.isError ? (
          <View style={styles.calendarError}>
            <Text style={styles.errorText}>공연 일정을 불러오지 못했어요</Text>
            <Pressable
              accessibilityRole="button"
              style={styles.retryButton}
              onPress={() => void calendarQuery.refetch()}
            >
              <Text style={styles.retryText}>다시 시도</Text>
            </Pressable>
          </View>
        ) : null}
      </View>

      {selectedDate ? (
        <>
          <Pressable
            accessibilityLabel="일정 목록 닫기"
            style={StyleSheet.absoluteFill}
            onPress={() => setSelectedDateKey(null)}
          />

          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />

            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>
                {selectedDate.getMonth() + 1}월 {selectedDate.getDate()}일 (
                {WEEKDAYS[selectedDate.getDay()]})
              </Text>
              <Text style={styles.sheetCount}>총 {totalCount}개</Text>
            </View>

            <FlatList
              data={events}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.sheetList}
              ListEmptyComponent={
                eventsQuery.isLoading ? (
                  <Text style={styles.sheetMessage}>
                    공연을 불러오는 중이에요
                  </Text>
                ) : eventsQuery.isError ? (
                  <View style={styles.sheetError}>
                    <Text style={styles.errorText}>
                      공연을 불러오지 못했어요
                    </Text>
                    <Pressable
                      accessibilityRole="button"
                      style={styles.retryButton}
                      onPress={() => void eventsQuery.refetch()}
                    >
                      <Text style={styles.retryText}>다시 시도</Text>
                    </Pressable>
                  </View>
                ) : (
                  <Text style={styles.sheetMessage}>
                    선택한 날짜의 공연이 없어요
                  </Text>
                )
              }
              ListFooterComponent={
                eventsQuery.isFetchingNextPage ? (
                  <Text style={styles.footerText}>더 불러오는 중이에요</Text>
                ) : undefined
              }
              renderItem={({ item }) => <FanConcertCard item={item} />}
              onEndReached={() => {
                if (eventsQuery.hasNextPage && !eventsQuery.isFetchingNextPage) {
                  void eventsQuery.fetchNextPage();
                }
              }}
              onEndReachedThreshold={0.35}
            />
          </View>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  header: {
    paddingHorizontal: 15,
  },
  calendar: {
    marginTop: 24,
    marginHorizontal: 31,
  },
  monthRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  monthLabel: {
    ...textStyles.label1,
    color: colors.neutral900,
  },
  weekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 24,
  },
  weekday: {
    ...textStyles.caption3,
    width: 28,
    color: colors.neutral900,
    textAlign: "center",
  },
  days: {
    gap: 28,
    marginTop: 24,
  },
  dayRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  day: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
  },
  daySelected: {
    backgroundColor: colors.primary50,
  },
  dayText: {
    ...textStyles.caption3,
    color: colors.neutral900,
  },
  dayTextSelected: {
    color: colors.primary400,
  },
  dayTextMuted: {
    color: colors.neutral500,
  },
  dayTextSunday: {
    color: colors.error,
  },
  eventDot: {
    position: "absolute",
    bottom: -1.5,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary400,
  },
  calendarMessage: {
    ...textStyles.body3,
    marginTop: 32,
    color: colors.neutral600,
    textAlign: "center",
  },
  calendarError: {
    alignItems: "center",
    marginTop: 32,
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  errorText: {
    ...textStyles.body3,
    color: colors.neutral700,
  },
  retryButton: {
    marginTop: 12,
    borderRadius: 8,
    backgroundColor: colors.primary400,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  retryText: {
    ...textStyles.caption3,
    color: colors.white,
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 488,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: colors.white,
    paddingHorizontal: 22.5,
    paddingTop: 12,
    boxShadow: "0px -5px 10px 0px rgba(0, 0, 0, 0.1)",
  },
  sheetHandle: {
    width: 44,
    height: 4,
    alignSelf: "center",
    borderRadius: 2,
    backgroundColor: colors.neutral300,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 24,
  },
  sheetTitle: {
    ...textStyles.label1,
    color: colors.neutral900,
  },
  sheetCount: {
    ...textStyles.caption3,
    color: colors.neutral600,
  },
  sheetList: {
    gap: 12,
    paddingTop: 16,
    paddingBottom: 32,
  },
  sheetMessage: {
    ...textStyles.body3,
    color: colors.neutral600,
    paddingVertical: 24,
    textAlign: "center",
  },
  sheetError: {
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  footerText: {
    ...textStyles.caption2,
    color: colors.neutral600,
    textAlign: "center",
  },
});

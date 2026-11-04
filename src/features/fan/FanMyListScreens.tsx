import { router, type Href } from "expo-router";
import { useCallback, useState, type ReactNode } from "react";
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
} from "react-native";

import { MyHeader } from "@/features/my/MyHeader";
import {
  useDeletePerformanceAlarm,
  useSetPerformanceAlarm,
} from "@/hooks/api/fan/useFanHome";
import { useUnfollowExploreBand } from "@/hooks/api/fan/useFanExplore";
import { useFollowedBandsQuery } from "@/hooks/api/user/useFollowedBands";
import { useInterestedPerformancesQuery } from "@/hooks/api/user/useInterestedPerformances";
import { usePerformanceHistoryQuery } from "@/hooks/api/user/usePerformanceHistory";
import { AppIcon } from "@/shared/components/AppIcon";
import { AppState } from "@/shared/components/AppState";
import { ConfirmModal } from "@/shared/components/ConfirmModal";
import { ProfileImage } from "@/shared/components/ProfileImage";
import { Screen } from "@/shared/components/Screen";
import { Toast } from "@/shared/components/Toast";
import { getGenreLabel, getRegionLabel } from "@/shared/constants/bandLabels";
import { colors, shadows, textStyles } from "@/shared/constants/theme";
import { formatDDayLabel, getDDay } from "@/shared/utils/dDay";
import type { FollowedBandItem } from "@/types/user/followedBands";
import type {
  InterestedPerformanceFilter,
  InterestedPerformanceItem,
} from "@/types/user/interestedPerformance";
import type { PerformanceHistoryItem } from "@/types/user/performanceHistory";

const TICKET_ICON = require("../../../assets/images/my/ticket-perform.png");
const LIKED_ICON = require("../../../assets/images/my/liked-perform.png");

type PerformanceFilter = InterestedPerformanceFilter;

const getFilters = (baseYear: number) =>
  [
    { code: "ALL", label: "전체" },
    { code: "THIS_YEAR", label: `${baseYear}년` },
    { code: "LAST_YEAR", label: `${baseYear - 1}년` },
    { code: "BEFORE", label: `${baseYear - 2}년 이전` },
  ] satisfies { code: PerformanceFilter; label: string }[];

const formatPerformanceDateTime = (date: string, startTime: string) =>
  `${date.replaceAll("-", ".")}. ${startTime.slice(0, 5)}`;

const hasPerformanceStarted = (date: string, startTime: string, now: Date) => {
  const start = new Date(`${date}T${startTime}`);

  return !Number.isNaN(start.getTime()) && start.getTime() <= now.getTime();
};

const getBandInfo = (band: FollowedBandItem) => band.band ?? band;

const getBandId = (band: FollowedBandItem) => {
  const bandInfo = getBandInfo(band);
  const numericId = Number(
    band.bandId ??
      bandInfo.bandId ??
      bandInfo.id ??
      band.targetBandId ??
      band.followingBandId ??
      band.followedBandId,
  );

  return Number.isFinite(numericId) ? numericId : null;
};

export function FollowedBandsScreen() {
  const query = useFollowedBandsQuery();
  const unfollowMutation = useUnfollowExploreBand();
  const [unfollowTarget, setUnfollowTarget] = useState<{
    bandId: number;
    name: string;
  } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const closeToast = useCallback(() => setToastMessage(null), []);

  const bands = query.data?.pages.flatMap((page) => page.items) ?? [];
  const totalCount = query.data?.pages[0]?.totalCount ?? bands.length;

  const confirmUnfollow = async () => {
    if (!unfollowTarget || unfollowMutation.isPending) return;

    const { bandId, name } = unfollowTarget;

    setUnfollowTarget(null);

    try {
      await unfollowMutation.mutateAsync(bandId);
      setToastMessage(`${name} 팔로우를 취소했어요`);
    } catch {
      setToastMessage("팔로우 취소에 실패했어요");
    }
  };

  return (
    <Screen edges={["top"]} scroll={false} contentStyle={styles.container}>
      <MyHeader title="팔로우한 밴드" />
      <Text style={styles.countText}>팔로우한 밴드 {totalCount}팀</Text>

      <FlatList
        data={bands}
        keyExtractor={(item, index) => String(getBandId(item) ?? index)}
        contentContainerStyle={styles.bandList}
        renderItem={({ item }) => (
          <FollowedBandRow
            item={item}
            disabled={unfollowMutation.isPending}
            onUnfollow={setUnfollowTarget}
          />
        )}
        onEndReached={() => {
          if (query.hasNextPage && !query.isFetchingNextPage) {
            void query.fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.35}
        ListEmptyComponent={
          <ListStatus
            isLoading={query.isLoading}
            isError={query.isError}
            loadingTitle="팔로우한 밴드를 불러오는 중이에요"
            errorTitle="팔로우한 밴드를 불러오지 못했어요"
            emptyTitle="팔로우한 밴드가 없어요"
            onRetry={() => void query.refetch()}
          />
        }
      />

      <ConfirmModal
        open={unfollowTarget !== null}
        title="팔로우를 취소할까요?"
        description={"이 밴드의 소식이\n홈피드에서 사라져요"}
        onCancel={() => setUnfollowTarget(null)}
        onConfirm={() => void confirmUnfollow()}
      />

      <Toast
        open={toastMessage !== null}
        message={toastMessage}
        tone={toastMessage?.includes("실패") ? "error" : "success"}
        onClose={closeToast}
      />
    </Screen>
  );
}

function FollowedBandRow({
  item,
  disabled,
  onUnfollow,
}: {
  item: FollowedBandItem;
  disabled: boolean;
  onUnfollow: (target: { bandId: number; name: string }) => void;
}) {
  const bandInfo = getBandInfo(item);
  const bandId = getBandId(item);
  const name = bandInfo.name ?? bandInfo.bandName ?? "밴드";
  const imageUrl =
    item.profileImageUrl ??
    item.bandProfileImageUrl ??
    item.imageUrl ??
    bandInfo.profileImageUrl ??
    bandInfo.bandProfileImageUrl ??
    bandInfo.imageUrl;
  const followerCount = bandInfo.followerCount ?? bandInfo.followers ?? 0;
  const genre = bandInfo.genre ? getGenreLabel(bandInfo.genre) : "장르";
  const region = bandInfo.region ? getRegionLabel(bandInfo.region) : "지역";

  return (
    <Pressable
      accessibilityRole="button"
      disabled={bandId == null}
      style={styles.bandRow}
      onPress={() => router.push(`/fan/bands/${bandId}` as Href)}
    >
      <ProfileImage imageUrl={imageUrl} size={35} variant="band" />

      <View style={styles.bandText}>
        <Text numberOfLines={1} style={styles.bandName}>
          {name}
        </Text>
        <Text numberOfLines={1} style={styles.bandMeta}>
          {`${genre} · ${region} · 팔로워 ${followerCount.toLocaleString()}명`}
        </Text>
      </View>

      <Pressable
        accessibilityRole="button"
        disabled={disabled || bandId == null}
        style={[styles.followingButton, disabled && styles.dimmed]}
        onPress={() => {
          if (bandId != null) onUnfollow({ bandId, name });
        }}
      >
        <Text style={styles.followingText}>팔로잉</Text>
      </Pressable>
    </Pressable>
  );
}

export function InterestedConcertsScreen() {
  const [filter, setFilter] = useState<PerformanceFilter>("ALL");
  const [pendingAlarmId, setPendingAlarmId] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const closeToast = useCallback(() => setToastMessage(null), []);
  const query = useInterestedPerformancesQuery(filter);
  const setAlarmMutation = useSetPerformanceAlarm();
  const deleteAlarmMutation = useDeletePerformanceAlarm();
  const firstPage = query.data?.pages[0];
  const concerts = query.data?.pages.flatMap((page) => page.items) ?? [];
  const today = new Date();

  const toggleAlarm = async (performanceId: number, isOn: boolean) => {
    if (pendingAlarmId !== null) return;

    setPendingAlarmId(performanceId);

    try {
      if (isOn) {
        await deleteAlarmMutation.mutateAsync(performanceId);
        setToastMessage("공연 알림을 해제했어요");
      } else {
        await setAlarmMutation.mutateAsync(performanceId);
        setToastMessage("공연 알림을 설정했어요");
      }
    } catch {
      setToastMessage(
        isOn ? "공연 알림 해제에 실패했어요" : "공연 알림 설정에 실패했어요",
      );
    } finally {
      setPendingAlarmId(null);
    }
  };

  return (
    <Screen edges={["top"]} scroll={false} contentStyle={styles.container}>
      <MyHeader title="관심 공연 목록" />

      <PerformanceList
        notice={
          "공연 상세페이지에서 하트를 눌러 찜한 공연이 모여요\n알림 설정 여부와는 별도로 관리됩니다"
        }
        summaryIcon={LIKED_ICON}
        summaryIconWidth={42}
        summaryLabel="관심 공연"
        totalCount={firstPage?.totalCount ?? 0}
        baseYear={firstPage?.baseYear ?? today.getFullYear()}
        filter={filter}
        onChangeFilter={setFilter}
        items={concerts}
        isLoading={query.isLoading}
        isError={query.isError}
        isFetchingNextPage={query.isFetchingNextPage}
        hasNextPage={query.hasNextPage}
        emptyTitle="관심 공연이 없어요"
        loadingTitle="관심 공연을 불러오는 중이에요"
        errorTitle="관심 공연을 불러오지 못했어요"
        onRetry={() => void query.refetch()}
        onFetchNext={() => void query.fetchNextPage()}
        renderAction={(item) => (
          <InterestedAction
            item={item}
            today={today}
            pending={pendingAlarmId === item.performanceId}
            onToggleAlarm={toggleAlarm}
          />
        )}
      />

      <Toast
        open={toastMessage !== null}
        message={toastMessage}
        tone={toastMessage?.includes("실패") ? "error" : "success"}
        onClose={closeToast}
      />
    </Screen>
  );
}

function InterestedAction({
  item,
  today,
  pending,
  onToggleAlarm,
}: {
  item: InterestedPerformanceItem;
  today: Date;
  pending: boolean;
  onToggleAlarm: (performanceId: number, isOn: boolean) => Promise<void>;
}) {
  const isCompleted = item.participationStatus === "COMPLETED";
  const isNotifyOn = item.participationStatus === "SCHEDULED";
  const isPast = hasPerformanceStarted(
    item.performanceDate,
    item.startTime,
    today,
  );

  return (
    <View style={styles.action}>
      {!isCompleted && !isPast ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`알림 ${isNotifyOn ? "켜짐" : "꺼짐"}`}
          accessibilityState={{ selected: isNotifyOn, disabled: pending }}
          disabled={pending}
          hitSlop={8}
          style={pending && styles.dimmed}
          onPress={() => void onToggleAlarm(item.performanceId, isNotifyOn)}
        >
          <AppIcon name={isNotifyOn ? "bellActive" : "bell"} />
        </Pressable>
      ) : null}

      <View style={styles.statusChip}>
        <Text style={styles.statusText}>
          {isCompleted
            ? "참여 완료"
            : formatDDayLabel(getDDay(item.performanceDate, today))}
        </Text>
      </View>
    </View>
  );
}

export function AttendedConcertsScreen() {
  const [filter, setFilter] = useState<PerformanceFilter>("ALL");
  const query = usePerformanceHistoryQuery(filter);
  const firstPage = query.data?.pages[0];
  const concerts = query.data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <Screen edges={["top"]} scroll={false} contentStyle={styles.container}>
      <MyHeader title="공연 참여 기록" />

      <PerformanceList
        notice={
          "공연 상세페이지에서 알림을 설정하면,\n공연 종료 후 '참여 완료'로 설정 가능합니다"
        }
        summaryIcon={TICKET_ICON}
        summaryIconWidth={43}
        summaryLabel="총 참여 공연"
        totalCount={firstPage?.totalCount ?? 0}
        baseYear={firstPage?.baseYear ?? new Date().getFullYear()}
        filter={filter}
        onChangeFilter={setFilter}
        items={concerts}
        isLoading={query.isLoading}
        isError={query.isError}
        isFetchingNextPage={query.isFetchingNextPage}
        hasNextPage={query.hasNextPage}
        emptyTitle="참여한 공연이 없어요"
        loadingTitle="공연 참여 기록을 불러오는 중이에요"
        errorTitle="공연 참여 기록을 불러오지 못했어요"
        onRetry={() => void query.refetch()}
        onFetchNext={() => void query.fetchNextPage()}
      />
    </Screen>
  );
}

function PerformanceList<
  T extends InterestedPerformanceItem | PerformanceHistoryItem,
>({
  notice,
  summaryIcon,
  summaryIconWidth,
  summaryLabel,
  totalCount,
  baseYear,
  filter,
  onChangeFilter,
  items,
  isLoading,
  isError,
  isFetchingNextPage,
  hasNextPage,
  emptyTitle,
  loadingTitle,
  errorTitle,
  onRetry,
  onFetchNext,
  renderAction,
}: {
  notice: string;
  summaryIcon: ImageSourcePropType;
  summaryIconWidth: number;
  summaryLabel: string;
  totalCount: number;
  baseYear: number;
  filter: PerformanceFilter;
  onChangeFilter: (filter: PerformanceFilter) => void;
  items: T[];
  isLoading: boolean;
  isError: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  emptyTitle: string;
  loadingTitle: string;
  errorTitle: string;
  onRetry: () => void;
  onFetchNext: () => void;
  renderAction?: (item: T) => ReactNode;
}) {
  return (
    <FlatList
      data={items}
      keyExtractor={(item) => String(item.performanceId)}
      contentContainerStyle={styles.performanceList}
      ListHeaderComponentStyle={styles.performanceHeader}
      ListHeaderComponent={
        <>
          <View style={styles.notice}>
            <Text style={styles.noticeText}>{notice}</Text>
          </View>

          <View style={styles.summaryCard}>
            <Image
              source={summaryIcon}
              style={{ width: summaryIconWidth, height: 42 }}
            />
            <View>
              <Text style={styles.summaryLabel}>{summaryLabel}</Text>
              <Text style={styles.summaryUnit}>
                <Text style={styles.summaryValue}>{totalCount}</Text> 회
              </Text>
            </View>
          </View>

          <View style={styles.filters}>
            {getFilters(baseYear).map((item) => {
              const selected = item.code === filter;

              return (
                <Pressable
                  key={item.code}
                  accessibilityRole="tab"
                  accessibilityState={{ selected }}
                  style={[styles.filter, selected && styles.filterSelected]}
                  onPress={() => onChangeFilter(item.code)}
                >
                  <Text style={styles.filterText}>{item.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </>
      }
      ItemSeparatorComponent={Separator}
      renderItem={({ item }) => (
        <PerformanceRow item={item} action={renderAction?.(item)} />
      )}
      onEndReached={() => {
        if (hasNextPage && !isFetchingNextPage) onFetchNext();
      }}
      onEndReachedThreshold={0.35}
      ListEmptyComponent={
        <ListStatus
          isLoading={isLoading}
          isError={isError}
          loadingTitle={loadingTitle}
          errorTitle={errorTitle}
          emptyTitle={emptyTitle}
          onRetry={onRetry}
        />
      }
    />
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

function PerformanceRow({
  item,
  action,
}: {
  item: InterestedPerformanceItem | PerformanceHistoryItem;
  action?: ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      style={styles.performanceCard}
      onPress={() =>
        router.push(`/fan/home/concerts/${item.performanceId}` as Href)
      }
    >
      <View style={styles.performanceMain}>
        <View style={styles.poster}>
          {item.posterImageUrl ? (
            <Image
              source={{ uri: item.posterImageUrl }}
              style={styles.posterImage}
            />
          ) : (
            <AppIcon name="imagePlaceholder" size={12} />
          )}
        </View>

        <View style={styles.performanceText}>
          <View>
            <Text numberOfLines={1} style={styles.performanceTitle}>
              {item.title}
            </Text>
            <View style={styles.venueRow}>
              <AppIcon name="location" size={14} />
              <Text numberOfLines={1} style={styles.venueText}>
                {item.venue}
              </Text>
            </View>
          </View>

          <Text style={styles.performanceDate}>
            {formatPerformanceDateTime(item.performanceDate, item.startTime)}
          </Text>
        </View>
      </View>

      {action}
    </Pressable>
  );
}

function ListStatus({
  isLoading,
  isError,
  loadingTitle,
  errorTitle,
  emptyTitle,
  onRetry,
}: {
  isLoading: boolean;
  isError: boolean;
  loadingTitle: string;
  errorTitle: string;
  emptyTitle: string;
  onRetry: () => void;
}) {
  if (isLoading) return <AppState loading title={loadingTitle} />;

  if (isError) {
    return (
      <AppState
        title={errorTitle}
        description="잠시 후 다시 시도해 주세요."
        actionLabel="다시 시도"
        onAction={onRetry}
      />
    );
  }

  return <AppState title={emptyTitle} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  countText: {
    ...textStyles.caption3,
    color: colors.neutral700,
    marginTop: 16,
    paddingHorizontal: 20,
  },
  bandList: {
    flexGrow: 1,
    gap: 20,
    paddingHorizontal: 32,
    paddingTop: 16,
    paddingBottom: 24,
  },
  bandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  bandText: {
    flex: 1,
    minWidth: 0,
  },
  bandName: {
    ...textStyles.caption3,
    color: "#000000",
  },
  bandMeta: {
    ...textStyles.caption2,
    color: colors.neutral600,
  },
  followingButton: {
    flexShrink: 0,
    borderRadius: 8,
    backgroundColor: colors.primary50,
    paddingHorizontal: 15,
    paddingVertical: 4,
  },
  followingText: {
    ...textStyles.caption3,
    color: colors.primary400,
  },
  dimmed: {
    opacity: 0.5,
  },
  performanceList: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  performanceHeader: {
    gap: 20,
    marginBottom: 20,
  },
  notice: {
    borderWidth: 1,
    borderColor: colors.primary300,
    borderRadius: 12,
    backgroundColor: colors.primary0,
    padding: 12,
  },
  noticeText: {
    ...textStyles.caption2,
    color: colors.neutral600,
    lineHeight: 20,
    textAlign: "center",
  },
  summaryCard: {
    ...shadows.card,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    borderRadius: 8,
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  summaryLabel: {
    ...textStyles.caption3,
    color: colors.neutral900,
  },
  summaryUnit: {
    ...textStyles.caption2,
    color: colors.neutral600,
  },
  summaryValue: {
    ...textStyles.h4,
    color: colors.primary500,
  },
  filters: {
    flexDirection: "row",
    borderRadius: 6,
    backgroundColor: colors.primary0,
    padding: 4,
  },
  filter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "transparent",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  filterSelected: {
    borderColor: "rgba(0, 0, 0, 0.04)",
    backgroundColor: colors.white,
    boxShadow:
      "0px 3px 8px 0px rgba(0, 0, 0, 0.12), 0px 3px 1px 0px rgba(0, 0, 0, 0.04)",
  },
  filterText: {
    ...textStyles.caption3,
    color: colors.neutral900,
    textAlign: "center",
  },
  separator: {
    height: 12,
  },
  performanceCard: {
    ...shadows.card,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    borderRadius: 12,
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  performanceMain: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  poster: {
    width: 50,
    height: 62,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderRadius: 8,
    backgroundColor: colors.neutral400,
  },
  posterImage: {
    width: "100%",
    height: "100%",
  },
  performanceText: {
    flex: 1,
    minWidth: 0,
    gap: 5,
  },
  performanceTitle: {
    ...textStyles.body1,
    color: colors.neutral900,
  },
  venueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  venueText: {
    ...textStyles.caption2,
    flexShrink: 1,
    color: colors.neutral700,
  },
  performanceDate: {
    ...textStyles.body5,
    color: colors.neutral500,
  },
  action: {
    flexShrink: 0,
    alignItems: "center",
    gap: 8,
  },
  statusChip: {
    height: 26,
    minWidth: 64,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    backgroundColor: colors.primary50,
    paddingHorizontal: 15,
  },
  statusText: {
    ...textStyles.caption3,
    color: colors.primary400,
  },
});

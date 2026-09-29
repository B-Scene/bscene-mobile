import {
  router,
} from "expo-router";
import { Search, X } from "lucide-react-native";
import { useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  useLiveNowInfiniteQuery,
  useReplayListInfiniteQuery,
  useScheduledLiveInfiniteQuery,
  useToggleLiveAlarmMutation,
} from "@/hooks/api/live/useLive";
import { AppHeader } from "@/shared/components/AppHeader";
import { AppState } from "@/shared/components/AppState";
import { Avatar } from "@/shared/components/Avatar";
import {
  colors,
  spacing,
} from "@/shared/constants/theme";
import type {
  LiveNowItem,
  LiveReplayItem,
  ReplaySort,
  ScheduledLiveItem,
} from "@/types/live/live";

type FanLiveListKind =
  | "now"
  | "scheduled"
  | "replays";

type FanLiveFilter =
  | "followed"
  | "all";

type FanLiveListItem =
  | LiveNowItem
  | ScheduledLiveItem
  | LiveReplayItem;

type FanLiveListScreenProps = {
  kind: FanLiveListKind;
};

const TITLE_BY_KIND: Record<FanLiveListKind, string> = {
  now: "진행 중인 라이브",
  scheduled: "예정된 라이브",
  replays: "다시보기",
};

const filterToApi =
  (
    filter: FanLiveFilter,
  ) =>
    filter === "followed"
      ? "following"
      : "all";

export function FanLiveListScreen({
  kind,
}: FanLiveListScreenProps) {
  const [
    filter,
    setFilter,
  ] =
    useState<FanLiveFilter>(
      "followed",
    );
  const [
    sort,
    setSort,
  ] =
    useState<ReplaySort>(
      "LATEST",
    );
  const [
    searchOpen,
    setSearchOpen,
  ] =
    useState(false);
  const [
    searchQuery,
    setSearchQuery,
  ] =
    useState("");

  const liveNowQuery =
    useLiveNowInfiniteQuery(
      filterToApi(filter),
    );
  const scheduledQuery =
    useScheduledLiveInfiniteQuery(
      filter === "followed",
    );
  const replayQuery =
    useReplayListInfiniteQuery(
      filterToApi(filter),
      sort,
    );

  const query =
    kind === "now"
      ? liveNowQuery
      : kind === "scheduled"
        ? scheduledQuery
        : replayQuery;

  const items =
    useMemo(() => {
      const pages =
        query.data?.pages ?? [];

      const allItems:
        FanLiveListItem[] = [];

      pages.forEach((page) => {
        allItems.push(
          ...(
            page.items as
              FanLiveListItem[]
          ),
        );
      });

      const normalizedQuery =
        searchQuery
          .trim()
          .toLocaleLowerCase();

      if (!normalizedQuery) {
        return allItems;
      }

      return allItems.filter(
        (item) =>
          `${item.title} ${item.bandName}`
            .toLocaleLowerCase()
            .includes(
              normalizedQuery,
            ),
      );
    }, [
      query.data?.pages,
      searchQuery,
    ]);

  const title =
    TITLE_BY_KIND[kind];

  const toggleSearch = () => {
    if (searchOpen) {
      setSearchQuery("");
    }

    setSearchOpen(
      (current) =>
        !current,
    );
  };

  return (
    <SafeAreaView
      style={styles.safeArea}
    >
      <AppHeader
        title={
          searchOpen
            ? ""
            : title
        }
        rightContent={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              searchOpen
                ? "검색 닫기"
                : `${title} 검색`
            }
            hitSlop={12}
            style={styles.headerIconButton}
            onPress={toggleSearch}
          >
            {searchOpen ? (
              <X
                size={21}
                color={
                  colors.neutral900
                }
              />
            ) : (
              <Search
                size={21}
                color={
                  colors.neutral900
                }
              />
            )}
          </Pressable>
        }
      />

      {searchOpen ? (
        <View
          style={styles.searchWrap}
        >
          <TextInput
            autoFocus
            value={searchQuery}
            placeholder={`${title} 검색`}
            placeholderTextColor={
              colors.neutral500
            }
            style={styles.searchInput}
            onChangeText={
              setSearchQuery
            }
          />
        </View>
      ) : null}

      <FilterTabs
        value={filter}
        onChange={setFilter}
      />

      {kind === "replays" ? (
        <ReplaySortBar
          sort={sort}
          onChange={setSort}
        />
      ) : null}

      {query.isLoading ? (
        <AppState
          loading
          title={`${title}를 불러오는 중이에요`}
        />
      ) : query.isError ? (
        <AppState
          title={`${title}를 불러오지 못했어요`}
          actionLabel="다시 시도"
          onAction={() =>
            void query.refetch()
          }
        />
      ) : (
        <LiveList
          kind={kind}
          items={items}
          filter={filter}
          searchQuery={searchQuery}
          onEndReached={() => {
            if (
              query.hasNextPage &&
              !query.isFetchingNextPage
            ) {
              void query.fetchNextPage();
            }
          }}
          isFetchingNextPage={
            query.isFetchingNextPage
          }
        />
      )}
    </SafeAreaView>
  );
}

function FilterTabs({
  value,
  onChange,
}: {
  value: FanLiveFilter;
  onChange: (value: FanLiveFilter) => void;
}) {
  return (
    <View style={styles.tabs}>
      {[
        ["followed", "팔로우한 밴드"],
        ["all", "전체 밴드"],
      ].map(([id, label]) => {
        const selected =
          value === id;

        return (
          <Pressable
            key={id}
            accessibilityRole="button"
            style={styles.tab}
            onPress={() =>
              onChange(
                id as FanLiveFilter,
              )
            }
          >
            <Text
              style={[
                styles.tabText,
                selected &&
                  styles.tabTextSelected,
              ]}
            >
              {label}
            </Text>
            {selected ? (
              <View
                style={
                  styles.tabIndicator
                }
              />
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

function ReplaySortBar({
  sort,
  onChange,
}: {
  sort: ReplaySort;
  onChange: (sort: ReplaySort) => void;
}) {
  return (
    <View style={styles.sortBar}>
      <Text style={styles.replayHint}>
        라이브는 최대 72시간까지 보관됩니다
      </Text>
      <View style={styles.sortButtons}>
        {[
          ["LATEST", "최신순"],
          ["POPULAR", "인기순"],
        ].map(([id, label]) => {
          const selected =
            sort === id;

          return (
            <Pressable
              key={id}
              style={[
                styles.sortButton,
                selected &&
                  styles.sortButtonSelected,
              ]}
              onPress={() =>
                onChange(
                  id as ReplaySort,
                )
              }
            >
              <Text
                style={[
                  styles.sortButtonText,
                  selected &&
                    styles.sortButtonTextSelected,
                ]}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function LiveList({
  kind,
  items,
  filter,
  searchQuery,
  onEndReached,
  isFetchingNextPage,
}: {
  kind: FanLiveListKind;
  items: FanLiveListItem[];
  filter: FanLiveFilter;
  searchQuery: string;
  onEndReached: () => void;
  isFetchingNextPage: boolean;
}) {
  const emptyTitle =
    searchQuery.trim()
      ? "검색 결과가 없어요"
      : kind === "now"
        ? "지금 진행 중인 라이브가 없어요"
        : kind === "scheduled"
          ? "예정된 라이브가 없어요"
          : "저장된 다시보기가 없어요";

  return (
    <FlatList
      data={items}
      keyExtractor={(item) =>
        `${kind}-${item.liveId}`
      }
      contentContainerStyle={[
        styles.listContent,
        items.length === 0 &&
          styles.listEmptyContent,
      ]}
      renderItem={({ item }) => {
        if (kind === "now") {
          return (
            <LiveNowListCard
              live={
                item as LiveNowItem
              }
            />
          );
        }

        if (kind === "scheduled") {
          return (
            <ScheduledLiveListCard
              live={
                item as ScheduledLiveItem
              }
              showNotificationButton={
                filter === "all"
              }
            />
          );
        }

        return (
          <ReplayListCard
            replay={
              item as LiveReplayItem
            }
          />
        );
      }}
      ListEmptyComponent={
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>{emptyTitle}</Text>
          <Text style={styles.emptyDescription}>
            {searchQuery.trim()
              ? "다른 검색어를 입력해 보세요"
              : kind === "now" && filter === "followed"
                ? "팔로우한 밴드가 라이브를 시작하면 알림을 보내드릴게요"
                : kind === "replays"
                  ? "라이브가 종료되면 밴드가 녹음본 저장 여부를 선택해요"
                  : "새로운 라이브가 등록되면 여기에서 확인할 수 있어요"}
          </Text>
        </View>
      }
      ListFooterComponent={
        isFetchingNextPage ? (
          <Text style={styles.footerText}>
            더 불러오는 중이에요
          </Text>
        ) : null
      }
      onEndReached={onEndReached}
      onEndReachedThreshold={0.4}
    />
  );
}

function LiveNowListCard({
  live,
}: {
  live: LiveNowItem;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      style={styles.liveCard}
      onPress={() =>
        router.push(
          `/fan/live/room/${live.liveId}` as Parameters<
            typeof router.push
          >[0],
        )
      }
    >
      <View style={styles.liveProfileWrap}>
        <Avatar
          imageUrl={
            live.bandProfileImageUrl ??
            live.thumbnailImageUrl
          }
          label={live.bandName}
          size={62}
        />
        <View style={styles.liveBadge}>
          <Text style={styles.liveBadgeText}>LIVE</Text>
        </View>
      </View>
      <View style={styles.liveCardInfo}>
        <Text numberOfLines={1} style={styles.cardTitle}>{live.title}</Text>
        <Text numberOfLines={1} style={styles.cardSubtitle}>{live.bandName}</Text>
        <Text style={styles.liveMeta}>
          {(live.viewerCount ?? live.viewCount ?? 0).toLocaleString()}명 시청 중
        </Text>
      </View>
      <View style={styles.enterButton}>
        <Text style={styles.enterButtonText}>입장</Text>
      </View>
    </Pressable>
  );
}

function ScheduledLiveListCard({
  live,
  showNotificationButton,
}: {
  live: ScheduledLiveItem;
  showNotificationButton: boolean;
}) {
  const mutation =
    useToggleLiveAlarmMutation();
  const [
    override,
    setOverride,
  ] =
    useState<
      boolean | null
    >(null);
  const notified =
    override ??
    live.isAlarmSet ??
    live.alarmSet ??
    live.notificationEnabled ??
    false;

  const toggleNotification =
    async () => {
      if (mutation.isPending) {
        return;
      }

      const previous =
        notified;
      setOverride(!previous);

      try {
        const result =
          await mutation.mutateAsync(
            live.liveId,
          );
        setOverride(
          result.alarmSet,
        );
      } catch {
        setOverride(previous);
        Alert.alert(
          "라이브 알림",
          "라이브 알림을 변경하지 못했어요.",
        );
      }
    };

  return (
    <View style={styles.liveCard}>
      <Avatar
        imageUrl={
          live.bandProfileImageUrl ??
          live.thumbnailImageUrl
        }
        label={live.bandName}
        size={62}
      />
      <View style={styles.liveCardInfo}>
        <Text numberOfLines={1} style={styles.cardTitle}>{live.title}</Text>
        <Text numberOfLines={1} style={styles.cardSubtitle}>{live.bandName}</Text>
        <Text style={styles.scheduledMeta}>
          {formatScheduledAt(live.scheduledAt)}
        </Text>
      </View>

      {showNotificationButton ? (
        <Pressable
          accessibilityRole="button"
          disabled={mutation.isPending}
          style={[
            styles.alarmButton,
            notified && styles.alarmButtonSoft,
          ]}
          onPress={() =>
            void toggleNotification()
          }
        >
          <Text
            style={styles.alarmButtonText}
          >
            {notified ? "알림 받는 중" : "알림 받기"}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function ReplayListCard({
  replay,
}: {
  replay: LiveReplayItem;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      style={styles.liveCard}
      onPress={() =>
        router.push(
          `/fan/live/replays/${replay.liveId}` as Parameters<
            typeof router.push
          >[0],
        )
      }
    >
      <View style={styles.replayThumb}>
        {replay.thumbnailImageUrl ? (
          <Image
            source={{
              uri: replay.thumbnailImageUrl,
            }}
            style={styles.replayImage}
          />
        ) : (
          <View style={styles.replayFallback}>
            <Text style={styles.replayFallbackText}>
              {replay.bandName.slice(0, 1)}
            </Text>
          </View>
        )}
        <View style={styles.replayDuration}>
          <Text style={styles.replayDurationText}>
            {formatReplayDuration(replay.durationSeconds)}
          </Text>
        </View>
      </View>
      <View style={styles.liveCardInfo}>
        <Text numberOfLines={1} style={styles.cardTitle}>{replay.title}</Text>
        <Text numberOfLines={1} style={styles.cardSubtitle}>{replay.bandName}</Text>
        <Text style={styles.replayMeta}>
          {replay.viewCount.toLocaleString()}회 재생
        </Text>
      </View>
    </Pressable>
  );
}

function formatScheduledAt(
  value: string,
) {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value;
  }

  return date.toLocaleString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatReplayDuration(
  totalSeconds?: number,
) {
  if (totalSeconds === undefined) {
    return "00:00:00";
  }

  const safeSeconds =
    Math.max(
      0,
      Math.floor(
        totalSeconds,
      ),
    );
  const hours =
    Math.floor(
      safeSeconds / 3600,
    );
  const minutes =
    Math.floor(
      (
        safeSeconds % 3600
      ) / 60,
    );
  const seconds =
    safeSeconds % 60;

  return [
    hours,
    minutes,
    seconds,
  ]
    .map((value) =>
      String(value).padStart(
        2,
        "0",
      ),
    )
    .join(":");
}

const styles =
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor:
        colors.white,
    },
    headerIconButton: {
      width: 40,
      height: 40,
      alignItems:
        "center",
      justifyContent:
        "center",
    },
    searchWrap: {
      paddingHorizontal:
        20,
      paddingBottom: 8,
    },
    searchInput: {
      height: 40,
      borderWidth: 1,
      borderColor:
        colors.neutral300,
      borderRadius: 999,
      paddingHorizontal:
        16,
      color:
        colors.neutral900,
      fontSize: 14,
      fontWeight: "500",
    },
    tabs: {
      height: 48,
      flexDirection:
        "row",
      borderBottomWidth: 1,
      borderBottomColor:
        colors.neutral400,
      paddingHorizontal:
        20,
    },
    tab: {
      flex: 1,
      alignItems:
        "center",
      justifyContent:
        "center",
    },
    tabText: {
      color:
        colors.neutral400,
      fontSize: 15,
      fontWeight: "700",
    },
    tabTextSelected: {
      color:
        colors.primary400,
    },
    tabIndicator: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: -1,
      height: 2,
      backgroundColor:
        colors.primary400,
    },
    sortBar: {
      height: 56,
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
      paddingHorizontal:
        20,
    },
    replayHint: {
      flex: 1,
      color:
        colors.neutral700,
      fontSize: 12,
      fontWeight: "500",
    },
    sortButtons: {
      flexDirection:
        "row",
      gap: 8,
    },
    sortButton: {
      borderRadius: 999,
      backgroundColor:
        colors.neutral300,
      paddingHorizontal:
        15,
      paddingVertical: 4,
    },
    sortButtonSelected: {
      backgroundColor:
        colors.primary50,
    },
    sortButtonText: {
      color:
        colors.neutral600,
      fontSize: 12,
      fontWeight: "700",
    },
    sortButtonTextSelected: {
      color:
        colors.primary400,
    },
    listContent: {
      paddingHorizontal:
        20,
      paddingTop:
        spacing.lg,
      paddingBottom: 120,
      gap: 12,
    },
    listEmptyContent: {
      flexGrow: 1,
      justifyContent:
        "center",
    },
    liveCard: {
      width: "100%",
      minHeight: 86,
      borderRadius: 16,
      backgroundColor:
        colors.white,
      flexDirection: "row",
      alignItems:
        "center",
      gap: 10,
      paddingHorizontal:
        16,
      paddingVertical:
        12,
      shadowColor:
        colors.neutral900,
      shadowOpacity: 0.1,
      shadowRadius: 8,
      shadowOffset: {
        width: 0,
        height: 4,
      },
      elevation: 3,
    },
    liveProfileWrap: {
      position:
        "relative",
      shadowColor:
        colors.primary400,
      shadowOpacity: 0.8,
      shadowRadius: 18,
      shadowOffset: {
        width: 0,
        height: 0,
      },
      elevation: 5,
    },
    liveBadge: {
      position:
        "absolute",
      left: 17,
      bottom: -2,
      width: 27,
      height: 12,
      borderRadius: 999,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        colors.primary400,
    },
    liveBadgeText: {
      color: colors.white,
      fontSize: 8,
      fontWeight: "700",
      lineHeight: 10,
    },
    liveCardInfo: {
      flex: 1,
      minWidth: 0,
    },
    cardTitle: {
      color:
        colors.neutral900,
      fontSize: 15,
      fontWeight: "700",
      lineHeight: 20,
    },
    cardSubtitle: {
      color:
        colors.neutral700,
      fontSize: 12,
      fontWeight: "500",
      lineHeight: 18,
      marginTop: 2,
    },
    liveMeta: {
      color:
        colors.primary400,
      fontSize: 12,
      fontWeight: "500",
      lineHeight: 18,
      marginTop: 4,
    },
    scheduledMeta: {
      color:
        colors.primary300,
      fontSize: 12,
      fontWeight: "500",
      lineHeight: 18,
      marginTop: 4,
    },
    replayMeta: {
      color:
        colors.neutral500,
      fontSize: 12,
      fontWeight: "500",
      lineHeight: 18,
      marginTop: 4,
    },
    enterButton: {
      width: 51,
      height: 22,
      borderRadius: 999,
      borderWidth: 1,
      borderColor:
        colors.primary400,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        colors.white,
    },
    enterButtonText: {
      color:
        colors.primary400,
      fontSize: 11,
      fontWeight: "700",
      lineHeight: 14,
    },
    alarmButton: {
      width: 81,
      height: 32,
      borderRadius: 999,
      borderWidth: 1,
      borderColor:
        colors.primary400,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        colors.white,
    },
    alarmButtonSoft: {
      borderColor:
        "transparent",
      backgroundColor:
        colors.primary0,
    },
    alarmButtonText: {
      color:
        colors.primary400,
      fontSize: 10,
      fontWeight: "700",
      lineHeight: 12,
      textAlign:
        "center",
    },
    replayThumb: {
      width: 110,
      height: 62,
      borderRadius: 8,
      overflow: "hidden",
      backgroundColor:
        colors.neutral200,
    },
    replayImage: {
      width: "100%",
      height: "100%",
    },
    replayFallback: {
      flex: 1,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        colors.primary0,
    },
    replayFallbackText: {
      color:
        colors.primary400,
      fontSize: 22,
      fontWeight: "700",
    },
    replayDuration: {
      position:
        "absolute",
      right: 7,
      bottom: 5,
      minWidth: 48,
      height: 13,
      borderRadius: 2,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        colors.neutral900,
      paddingHorizontal: 4,
    },
    replayDurationText: {
      color: colors.white,
      fontSize: 9,
      fontWeight: "500",
      lineHeight: 11,
    },
    emptyWrap: {
      alignItems:
        "center",
      gap: 12,
      paddingHorizontal:
        48,
    },
    emptyTitle: {
      color:
        colors.neutral900,
      fontSize: 18,
      fontWeight: "700",
      lineHeight: 20,
      textAlign:
        "center",
    },
    emptyDescription: {
      color:
        colors.neutral600,
      fontSize: 14,
      fontWeight: "500",
      lineHeight: 20,
      textAlign:
        "center",
    },
    footerText: {
      color:
        colors.neutral500,
      fontSize: 12,
      fontWeight: "500",
      lineHeight: 18,
      paddingVertical: 16,
      textAlign:
        "center",
    },
  });

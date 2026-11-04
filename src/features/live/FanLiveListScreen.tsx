import { router, type Href } from "expo-router";
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
  FanLiveNowCard,
  FanScheduledCard,
  formatReplayDuration,
} from "@/features/live/LiveCards";
import {
  useLiveNowInfiniteQuery,
  useReplayListInfiniteQuery,
  useScheduledLiveInfiniteQuery,
  useToggleLiveAlarmMutation,
} from "@/hooks/api/live/useLive";
import { AppIcon } from "@/shared/components/AppIcon";
import { colors, textStyles } from "@/shared/constants/theme";
import type {
  LiveNowItem,
  LiveReplayItem,
  ReplaySort,
  ScheduledLiveItem,
} from "@/types/live/live";

type FanLiveListKind = "now" | "scheduled" | "replays";

type FanLiveFilter = "followed" | "all";

type FanLiveListItem = LiveNowItem | ScheduledLiveItem | LiveReplayItem;

type FanLiveListScreenProps = {
  kind: FanLiveListKind;
};

const TITLE_BY_KIND: Record<FanLiveListKind, string> = {
  now: "진행 중인 라이브",
  scheduled: "예정된 라이브",
  replays: "다시보기",
};

const STATUS_NOUN_BY_KIND: Record<FanLiveListKind, string> = {
  now: "라이브 목록을",
  scheduled: "예정된 라이브를",
  replays: "다시보기를",
};

const filterToApi = (filter: FanLiveFilter) =>
  filter === "followed" ? "following" : "all";

export function FanLiveListScreen({ kind }: FanLiveListScreenProps) {
  const [filter, setFilter] = useState<FanLiveFilter>("followed");
  const [sort, setSort] = useState<ReplaySort>("LATEST");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const liveNowQuery = useLiveNowInfiniteQuery(filterToApi(filter));
  const scheduledQuery = useScheduledLiveInfiniteQuery(filter === "followed");
  const replayQuery = useReplayListInfiniteQuery(filterToApi(filter), sort);

  const query =
    kind === "now"
      ? liveNowQuery
      : kind === "scheduled"
        ? scheduledQuery
        : replayQuery;

  const items = useMemo(() => {
    const pages = query.data?.pages ?? [];

    const allItems: FanLiveListItem[] = [];

    pages.forEach((page) => {
      allItems.push(...(page.items as FanLiveListItem[]));
    });

    const normalizedQuery = searchQuery.trim().toLocaleLowerCase();

    if (!normalizedQuery) {
      return allItems;
    }

    return allItems.filter((item) =>
      `${item.title} ${item.bandName}`
        .toLocaleLowerCase()
        .includes(normalizedQuery),
    );
  }, [query.data?.pages, searchQuery]);

  const title = TITLE_BY_KIND[kind];

  const toggleSearch = () => {
    if (searchOpen) {
      setSearchQuery("");
    }

    setSearchOpen((current) => !current);
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="뒤로가기"
          hitSlop={12}
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <AppIcon name="arrowLeft" />
        </Pressable>

        {searchOpen ? (
          <TextInput
            autoFocus
            value={searchQuery}
            placeholder={`${title} 검색`}
            placeholderTextColor={colors.neutral400}
            accessibilityLabel={`${title} 검색어`}
            style={styles.searchInput}
            onChangeText={setSearchQuery}
          />
        ) : (
          <Text style={styles.headerTitle}>{title}</Text>
        )}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={searchOpen ? "검색 닫기" : `${title} 검색`}
          hitSlop={12}
          style={styles.searchButton}
          onPress={toggleSearch}
        >
          <AppIcon name={searchOpen ? "closeDark" : "searchDark"} size={20} />
        </Pressable>
      </View>

      <FilterTabs value={filter} onChange={setFilter} />

      {kind === "replays" ? (
        <ReplaySortBar sort={sort} onChange={setSort} />
      ) : null}

      {query.isLoading ? (
        <Text style={styles.statusText}>
          {STATUS_NOUN_BY_KIND[kind]} 불러오는 중이에요.
        </Text>
      ) : query.isError ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>
            {STATUS_NOUN_BY_KIND[kind]} 불러오지 못했어요.
          </Text>
          <Pressable
            accessibilityRole="button"
            style={styles.retryButton}
            onPress={() => void query.refetch()}
          >
            <Text style={styles.retryText}>다시 불러오기</Text>
          </Pressable>
        </View>
      ) : (
        <LiveList
          kind={kind}
          items={items}
          filter={filter}
          searchQuery={searchQuery}
          onEndReached={() => {
            if (query.hasNextPage && !query.isFetchingNextPage) {
              void query.fetchNextPage();
            }
          }}
          isFetchingNextPage={query.isFetchingNextPage}
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
        const selected = value === id;

        return (
          <Pressable
            key={id}
            accessibilityRole="button"
            style={styles.tab}
            onPress={() => onChange(id as FanLiveFilter)}
          >
            <Text style={[styles.tabText, selected && styles.tabTextSelected]}>
              {label}
            </Text>
            {selected ? <View style={styles.tabIndicator} /> : null}
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
      <Text style={styles.replayHint}>라이브는 최대 72시간까지 보관됩니다</Text>
      <View style={styles.sortButtons}>
        {[
          ["LATEST", "최신순"],
          ["POPULAR", "인기순"],
        ].map(([id, label]) => {
          const selected = sort === id;

          return (
            <Pressable
              key={id}
              style={[styles.sortButton, selected && styles.sortButtonSelected]}
              onPress={() => onChange(id as ReplaySort)}
            >
              <Text
                style={[
                  styles.sortButtonText,
                  selected && styles.sortButtonTextSelected,
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
  const hasSearch = Boolean(searchQuery.trim());
  const emptyTitle = hasSearch
    ? "검색 결과가 없어요"
    : kind === "now"
      ? "지금 진행 중인 라이브가 없어요"
      : kind === "scheduled"
        ? "예정된 라이브가 없어요"
        : "저장된 다시보기가 없어요";
  const emptyDescription = hasSearch
    ? "다른 검색어를 입력해 보세요"
    : kind === "replays"
      ? "라이브가 종료되면 밴드가\n녹음본 저장 여부를 선택해요"
      : kind === "scheduled"
        ? "새로운 라이브 일정이 등록되면\n알림을 보내드릴게요"
        : filter === "followed"
          ? "팔로우한 밴드가 라이브를 시작하면\n알림을 보내드릴게요"
          : "새로운 라이브가 시작되면 여기에서 확인할 수 있어요";

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => `${kind}-${item.liveId}`}
      contentContainerStyle={[
        styles.listContent,
        kind !== "replays" && styles.listContentTopGap,
        items.length === 0 && styles.listEmptyContent,
      ]}
      renderItem={({ item }) => {
        if (kind === "now") {
          const live = item as LiveNowItem;

          return (
            <FanLiveNowCard
              live={live}
              listenerLabel={`${(live.viewCount ?? live.viewerCount ?? 0).toLocaleString()}명 청취 중`}
            />
          );
        }

        if (kind === "scheduled") {
          return (
            <ScheduledLiveListCard
              live={item as ScheduledLiveItem}
              showNotificationButton={filter === "all"}
            />
          );
        }

        return <ReplayListCard replay={item as LiveReplayItem} />;
      }}
      ListEmptyComponent={
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>{emptyTitle}</Text>
          <Text style={styles.emptyDescription}>{emptyDescription}</Text>
        </View>
      }
      ListFooterComponent={
        isFetchingNextPage ? (
          <Text style={styles.footerText}>
            {kind === "replays" ? "다시보기를" : "라이브를"} 더 불러오는 중이에요.
          </Text>
        ) : undefined
      }
      onEndReached={onEndReached}
      onEndReachedThreshold={0.4}
    />
  );
}

function ScheduledLiveListCard({
  live,
  showNotificationButton,
}: {
  live: ScheduledLiveItem;
  showNotificationButton: boolean;
}) {
  const mutation = useToggleLiveAlarmMutation();
  const [override, setOverride] = useState<boolean | null>(null);
  const notified =
    override ??
    live.isAlarmSet ??
    live.alarmSet ??
    live.notificationEnabled ??
    false;

  const toggleNotification = async () => {
    if (mutation.isPending) {
      return;
    }

    const previous = notified;
    setOverride(!previous);

    try {
      const result = await mutation.mutateAsync(live.liveId);
      setOverride(result.alarmSet);
    } catch {
      setOverride(previous);
      Alert.alert("라이브 알림", "라이브 알림을 변경하지 못했어요.");
    }
  };

  return (
    <FanScheduledCard
      live={live}
      notified={notified}
      disabled={mutation.isPending}
      showNotification={showNotificationButton}
      onToggleNotification={() => void toggleNotification()}
    />
  );
}

function ReplayListCard({ replay }: { replay: LiveReplayItem }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${replay.title} 다시보기 열기`}
      style={styles.replayCard}
      onPress={() => router.push(`/fan/live/replays/${replay.liveId}` as Href)}
    >
      <View style={styles.replayThumb}>
        {replay.thumbnailImageUrl ? (
          <Image
            source={{ uri: replay.thumbnailImageUrl }}
            style={styles.replayImage}
          />
        ) : (
          <AppIcon name="bandDefaultProfile" size={110} />
        )}
        <View style={styles.replayDuration}>
          <Text style={styles.replayDurationText}>
            {formatReplayDuration(
              replay.durationSeconds ?? replay.durationSec ?? 0,
            )}
          </Text>
        </View>
      </View>

      <View style={styles.replayInfo}>
        <Text numberOfLines={1} style={styles.replayTitle}>
          {replay.title}
        </Text>
        <Text numberOfLines={1} style={styles.replayBand}>
          {replay.bandName}
        </Text>
        <View style={styles.replayMetaRow}>
          <AppIcon name="playMuted" size={9} />
          <Text style={styles.replayMeta}>
            {replay.viewCount.toLocaleString()}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    backgroundColor: colors.white,
  },
  backButton: {
    position: "absolute",
    left: 15,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    ...textStyles.label2,
    color: colors.neutral900,
  },
  searchButton: {
    position: "absolute",
    right: 24,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  searchInput: {
    ...textStyles.body3,
    flex: 1,
    height: 36,
    minWidth: 0,
    borderWidth: 1,
    borderColor: colors.primary400,
    borderRadius: 999,
    backgroundColor: colors.white,
    color: colors.neutral900,
    marginHorizontal: 56,
    paddingHorizontal: 16,
    paddingVertical: 0,
  },
  tabs: {
    height: 48,
    flexDirection: "row",
    borderBottomWidth: 2,
    borderBottomColor: colors.neutral400,
    paddingHorizontal: 20,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  tabText: {
    ...textStyles.body1,
    color: colors.neutral400,
  },
  tabTextSelected: {
    color: colors.primary400,
  },
  tabIndicator: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: -2,
    height: 2,
    backgroundColor: colors.primary400,
  },
  sortBar: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  replayHint: {
    ...textStyles.caption2,
    flex: 1,
    color: colors.neutral700,
  },
  sortButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sortButton: {
    borderRadius: 999,
    backgroundColor: colors.neutral300,
    paddingHorizontal: 15,
    paddingVertical: 4,
  },
  sortButtonSelected: {
    backgroundColor: colors.primary50,
  },
  sortButtonText: {
    ...textStyles.caption3,
    color: colors.neutral600,
  },
  sortButtonTextSelected: {
    color: colors.primary400,
  },
  statusText: {
    ...textStyles.caption2,
    color: colors.neutral500,
    paddingVertical: 40,
    textAlign: "center",
  },
  errorBox: {
    alignItems: "center",
    paddingVertical: 40,
  },
  errorText: {
    ...textStyles.caption2,
    color: colors.neutral600,
    textAlign: "center",
  },
  retryButton: {
    borderRadius: 8,
    backgroundColor: colors.primary400,
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  retryText: {
    ...textStyles.caption3,
    color: colors.white,
  },
  listContent: {
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  listContentTopGap: {
    paddingTop: 24,
  },
  listEmptyContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
  replayCard: {
    width: "100%",
    height: 86,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    boxShadow: "0px 4px 8px 0px rgba(20, 20, 20, 0.1)",
  },
  replayThumb: {
    width: 110,
    height: 62,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderRadius: 8,
    backgroundColor: colors.neutral200,
  },
  replayImage: {
    width: "100%",
    height: "100%",
  },
  replayDuration: {
    position: "absolute",
    right: 7,
    bottom: 5,
    height: 10,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 2,
    backgroundColor: colors.neutral900,
    paddingLeft: 3,
    paddingRight: 2,
  },
  replayDurationText: {
    ...textStyles.caption5,
    color: colors.white,
  },
  replayInfo: {
    flex: 1,
    minWidth: 0,
    marginLeft: 10,
  },
  replayTitle: {
    ...textStyles.body1,
    color: colors.neutral900,
  },
  replayBand: {
    ...textStyles.caption2,
    color: colors.neutral700,
    marginTop: 2,
  },
  replayMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  replayMeta: {
    ...textStyles.body5,
    color: colors.neutral500,
  },
  emptyWrap: {
    width: 219,
    alignSelf: "center",
    alignItems: "center",
    gap: 12,
  },
  emptyTitle: {
    ...textStyles.label1,
    color: colors.neutral900,
    textAlign: "center",
  },
  emptyDescription: {
    ...textStyles.caption1,
    color: colors.neutral600,
    textAlign: "center",
  },
  footerText: {
    ...textStyles.caption2,
    color: colors.neutral500,
    paddingVertical: 12,
    textAlign: "center",
  },
});

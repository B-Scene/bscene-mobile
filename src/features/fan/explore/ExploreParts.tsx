import { router, type Href } from "expo-router";
import { useCallback, useState, type ReactNode } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Path } from "react-native-svg";

import type { ExploreBandItem } from "@/features/fan/fanExploreMappers";
import {
  useFollowExploreBand,
  useUnfollowExploreBand,
} from "@/hooks/api/fan/useFanExplore";
import { AppHeader } from "@/shared/components/AppHeader";
import { AppIcon } from "@/shared/components/AppIcon";
import { BottomSheetModal } from "@/shared/components/BottomSheetModal";
import { ConfirmModal } from "@/shared/components/ConfirmModal";
import { ProfileImage } from "@/shared/components/ProfileImage";
import { Toast } from "@/shared/components/Toast";
import {
  BAND_GENRE_LABELS,
  BAND_REGION_LABELS,
  getGenreLabel,
  getRegionLabel,
} from "@/shared/constants/bandLabels";
import { colors, textStyles } from "@/shared/constants/theme";

import type {
  FanExploreContent,
  FanExplorePerformance,
  FanExploreSearchSort,
} from "@/types/fan/explore";

export type AppliedExploreFilters = {
  genre: string;
  region: string;
  content: string;
};

export type ExploreSearchType = "bands" | "concerts" | "contents";

export const DEFAULT_APPLIED_FILTERS: AppliedExploreFilters = {
  genre: "전체",
  region: "전체",
  content: "전체",
};

export const SEARCH_SORT_OPTIONS = ["정확도순", "인기순"] as const;
export type SearchSortOption = (typeof SEARCH_SORT_OPTIONS)[number];

export const SEARCH_SORT_TO_API: Record<SearchSortOption, FanExploreSearchSort> =
  {
    정확도순: "ACCURACY",
    인기순: "POPULAR",
  };

export const getSearchSortLabel = (sort: FanExploreSearchSort) =>
  sort === "POPULAR" ? "인기순" : "정확도순";

const FILTER_OPTIONS = {
  genre: [
    "전체",
    "인디",
    "팝",
    "팝록",
    "재즈",
    "블루스",
    "얼터너티브록",
    "사이키델릭록",
    "일렉트로닉록",
    "포크록",
    "펑크록",
    "하드록",
    "메탈",
    "etc.",
  ],
  region: [
    "전체",
    "서울",
    "경기",
    "인천",
    "부산",
    "대구",
    "광주",
    "대전",
    "울산",
    "세종",
    "충남",
    "충북",
    "전남",
    "전북",
    "경남",
    "경북",
    "강원",
    "제주",
  ],
  content: ["전체", "밴드", "공연", "콘텐츠"],
};

const FILTER_OPTION_WIDTHS: Record<string, number> = {
  팝: 41,
  콘텐츠: 62,
  블루스: 62,
  포크록: 62,
  펑크록: 62,
  하드록: 62,
  얼터너티브록: 93,
  사이키델릭록: 93,
  일렉트로닉록: 93,
};

const DEFAULT_OPTION_WIDTH = 51;
const SHEET_BACKDROP = "rgba(20, 20, 20, 0.75)";

const findCodeByLabel = (labels: Record<string, string>, label: string) =>
  Object.keys(labels).find((code) => labels[code] === label) ?? label;

export const getGenreFilterParam = (genre: string) =>
  genre === "전체" ? undefined : findCodeByLabel(BAND_GENRE_LABELS, genre);

export const getRegionFilterParam = (region: string) =>
  region === "전체" ? undefined : findCodeByLabel(BAND_REGION_LABELS, region);

export const getExplorePath = (
  type: ExploreSearchType | null,
  {
    keyword,
    sort,
    sortSelected,
    filters,
  }: {
    keyword: string;
    sort: FanExploreSearchSort;
    sortSelected: boolean;
    filters: AppliedExploreFilters;
  },
) => {
  const query = [
    ["q", keyword],
    ["sort", sort],
    ["sortSelected", sortSelected ? "1" : ""],
    ["genre", filters.genre === "전체" ? "" : filters.genre],
    ["region", filters.region === "전체" ? "" : filters.region],
  ]
    .filter(([, value]) => value)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join("&");
  const path = type
    ? `/fan/explore/search/results/${type}`
    : "/fan/explore/search/results";

  return `${path}?${query}` as Href;
};

export const getSearchTypeByContent = (
  content: string,
): ExploreSearchType | null => {
  if (content === "밴드") return "bands";
  if (content === "공연") return "concerts";
  if (content === "콘텐츠") return "contents";
  return null;
};

export function ExploreFilterBar({
  appliedFilters,
  appliedSort,
  highlightSort = true,
  disabledFilterIds = [],
  requireFilterForSort = false,
  registeredOnly,
  onRegisteredOnlyChange,
  onSortPress,
  onFilterPress,
}: {
  appliedFilters: AppliedExploreFilters;
  appliedSort?: string | null;
  highlightSort?: boolean;
  disabledFilterIds?: string[];
  requireFilterForSort?: boolean;
  registeredOnly?: boolean;
  onRegisteredOnlyChange?: (value: boolean) => void;
  onSortPress: () => void;
  onFilterPress: () => void;
}) {
  const filterChips = [
    { id: "genre", defaultLabel: "장르", value: appliedFilters.genre },
    { id: "region", defaultLabel: "지역", value: appliedFilters.region },
    { id: "content", defaultLabel: "유형", value: appliedFilters.content },
  ];
  const hasAppliedFilter = filterChips.some(
    (filter) => filter.value !== "전체",
  );
  const visibleChips = hasAppliedFilter
    ? filterChips.filter((filter) => filter.value !== "전체")
    : filterChips;
  const shouldHighlightSort = Boolean(appliedSort) && highlightSort;
  const isSortDisabled = requireFilterForSort && !hasAppliedFilter;

  return (
    <View style={styles.filterBar}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterScrollContent}
      >
        <Pressable
          accessibilityRole="button"
          disabled={isSortDisabled}
          style={[
            styles.chip,
            isSortDisabled
              ? styles.chipDisabledSort
              : shouldHighlightSort
                ? styles.chipApplied
                : styles.chipIdle,
          ]}
          onPress={onSortPress}
        >
          <Text
            style={[
              styles.chipText,
              isSortDisabled
                ? styles.chipTextMuted
                : shouldHighlightSort && styles.chipTextApplied,
            ]}
          >
            {appliedSort ?? "추천순"}
          </Text>
          <Svg width={12} height={7} viewBox="0 0 12 7" fill="none">
            <Path
              d="M0.75 0.75L5.75 5.75L10.75 0.75"
              stroke={
                shouldHighlightSort && !isSortDisabled
                  ? colors.primary400
                  : colors.neutral600
              }
              strokeOpacity={isSortDisabled ? 0.4 : 1}
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </Pressable>

        {visibleChips.map((filter) => {
          const isApplied = filter.value !== "전체";
          const isDisabled = disabledFilterIds.includes(filter.id);

          return (
            <Pressable
              key={filter.id}
              accessibilityRole="button"
              disabled={isDisabled}
              style={[
                styles.chip,
                !isApplied && styles.chipFixed,
                isDisabled
                  ? styles.chipDisabled
                  : isApplied
                    ? styles.chipApplied
                    : styles.chipIdle,
              ]}
              onPress={onFilterPress}
            >
              <Text
                style={[
                  styles.chipText,
                  isDisabled
                    ? styles.chipTextDisabled
                    : isApplied && styles.chipTextApplied,
                ]}
              >
                {isApplied ? filter.value : filter.defaultLabel}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {onRegisteredOnlyChange ? (
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: Boolean(registeredOnly) }}
          style={styles.registeredOnly}
          onPress={() => onRegisteredOnlyChange(!registeredOnly)}
        >
          <AppIcon
            name={registeredOnly ? "checkCircleActive" : "checkCircle"}
            size={16}
          />
          <Text
            style={[styles.chipText, registeredOnly && styles.chipTextApplied]}
          >
            등록 밴드만 보기
          </Text>
        </Pressable>
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="필터"
          hitSlop={10}
          onPress={onFilterPress}
        >
          <AppIcon name="filterControl" size={19} />
        </Pressable>
      )}
    </View>
  );
}

export function ExploreOptionSheet<T extends string>({
  open,
  options,
  selected,
  disabledOptions = [],
  onClose,
  onSelect,
}: {
  open: boolean;
  options: readonly T[];
  selected: T;
  disabledOptions?: readonly T[];
  onClose: () => void;
  onSelect: (option: T) => void;
}) {
  return (
    <BottomSheetModal
      open={open}
      closeLabel="정렬 닫기"
      backdropColor={SHEET_BACKDROP}
      onClose={onClose}
    >
      <View style={styles.sortSheet}>
        {options.map((option) => {
          const isSelected = selected === option;
          const isDisabled = disabledOptions.includes(option);

          return (
            <Pressable
              key={option}
              accessibilityRole="button"
              disabled={isDisabled}
              style={styles.sortOption}
              onPress={() => {
                onSelect(option);
                onClose();
              }}
            >
              <Text
                style={[
                  styles.sortText,
                  isSelected && styles.sortTextSelected,
                  isDisabled && styles.sortTextDisabled,
                ]}
              >
                {option}
              </Text>
              {isSelected ? <AppIcon name="checkActive" size={20} /> : null}
            </Pressable>
          );
        })}
      </View>
    </BottomSheetModal>
  );
}

function FilterOptionGroup({
  title,
  options,
  selected,
  selectable,
  onSelect,
}: {
  title: string;
  options: string[];
  selected: string;
  selectable: boolean;
  onSelect: (value: string) => void;
}) {
  return (
    <View>
      <Text style={styles.optionTitle}>{title}</Text>
      <View style={styles.options}>
        {options.map((option) => {
          const isSelected = selected === option;
          const isDisabled = !selectable && option !== "전체";

          return (
            <Pressable
              key={option}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              disabled={isDisabled}
              style={[
                styles.option,
                {
                  width: FILTER_OPTION_WIDTHS[option] ?? DEFAULT_OPTION_WIDTH,
                },
                isDisabled
                  ? styles.optionDisabled
                  : isSelected && styles.optionSelected,
              ]}
              onPress={() => onSelect(option)}
            >
              <Text
                style={[
                  styles.optionText,
                  isDisabled
                    ? styles.chipTextDisabled
                    : isSelected && styles.optionTextSelected,
                ]}
              >
                {option}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function ExploreFilterSheetBody({
  appliedFilters,
  contentSelectable,
  onClose,
  onApply,
}: {
  appliedFilters: AppliedExploreFilters;
  contentSelectable: boolean;
  onClose: () => void;
  onApply: (filters: AppliedExploreFilters) => void;
}) {
  const insets = useSafeAreaInsets();
  const [genre, setGenre] = useState(appliedFilters.genre);
  const [region, setRegion] = useState(appliedFilters.region);
  const [content, setContent] = useState(
    contentSelectable ? appliedFilters.content : "전체",
  );

  return (
    <View style={[styles.filterSheet, { paddingBottom: insets.bottom + 16 }]}>
      <View style={styles.sheetHandle} />
      <Text style={styles.sheetTitle}>필터</Text>

      <ScrollView contentContainerStyle={styles.filterGroups}>
        <FilterOptionGroup
          selectable
          title="장르"
          options={FILTER_OPTIONS.genre}
          selected={genre}
          onSelect={setGenre}
        />
        <FilterOptionGroup
          selectable
          title="지역"
          options={FILTER_OPTIONS.region}
          selected={region}
          onSelect={setRegion}
        />
        <FilterOptionGroup
          title="유형"
          options={FILTER_OPTIONS.content}
          selected={content}
          selectable={contentSelectable}
          onSelect={setContent}
        />
      </ScrollView>

      <Pressable
        accessibilityRole="button"
        style={styles.applyButton}
        onPress={() => {
          onApply({ genre, region, content });
          onClose();
        }}
      >
        <Text style={styles.applyText}>선택완료</Text>
      </Pressable>
    </View>
  );
}

export function ExploreFilterSheet({
  open,
  appliedFilters,
  contentSelectable = false,
  onClose,
  onApply,
}: {
  open: boolean;
  appliedFilters: AppliedExploreFilters;
  contentSelectable?: boolean;
  onClose: () => void;
  onApply: (filters: AppliedExploreFilters) => void;
}) {
  return (
    <BottomSheetModal
      open={open}
      closeLabel="필터 닫기"
      backdropColor={SHEET_BACKDROP}
      onClose={onClose}
    >
      <ExploreFilterSheetBody
        appliedFilters={appliedFilters}
        contentSelectable={contentSelectable}
        onClose={onClose}
        onApply={onApply}
      />
    </BottomSheetModal>
  );
}

export function ExploreBandCard({
  band,
  subtitle,
  onToggleFollow,
}: {
  band: ExploreBandItem;
  subtitle: string;
  onToggleFollow: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={band.bandId == null}
      style={styles.bandCard}
      onPress={() => {
        if (band.bandId == null) return;
        router.push(`/fan/bands/${band.bandId}` as Href);
      }}
    >
      <ProfileImage imageUrl={band.imageUrl} size={62} variant="band" />

      <View style={styles.flexText}>
        <Text numberOfLines={1} style={styles.bandName}>
          {band.name}
        </Text>
        <Text numberOfLines={1} style={styles.bandMeta}>
          {subtitle}
        </Text>
        {band.description ? (
          <Text numberOfLines={2} style={styles.bandDescription}>
            {band.description}
          </Text>
        ) : null}
      </View>

      <Pressable
        accessibilityRole="button"
        disabled={band.bandId == null}
        style={[styles.followButton, band.isFollowing && styles.following]}
        onPress={onToggleFollow}
      >
        <Text style={styles.followText}>
          {band.isFollowing ? "팔로잉" : "팔로우"}
        </Text>
      </Pressable>
    </Pressable>
  );
}

// 팔로우/언팔로우 확인과 결과 안내를 탐색 화면들이 함께 쓴다.
export function useExploreFollow() {
  const followMutation = useFollowExploreBand();
  const unfollowMutation = useUnfollowExploreBand();
  const [unfollowTarget, setUnfollowTarget] = useState<ExploreBandItem | null>(
    null,
  );
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const closeToast = useCallback(() => setToastMessage(null), []);
  const isPending = followMutation.isPending || unfollowMutation.isPending;

  const toggleFollow = async (band: ExploreBandItem) => {
    if (band.bandId == null || isPending) return;

    if (band.isFollowing) {
      setUnfollowTarget(band);
      return;
    }

    try {
      await followMutation.mutateAsync(band.bandId);
      setToastMessage(`${band.name}를 팔로우했어요`);
    } catch {
      setToastMessage("밴드 팔로우에 실패했어요");
    }
  };

  const confirmUnfollow = async () => {
    if (unfollowTarget?.bandId == null) return;

    const target = unfollowTarget;

    setUnfollowTarget(null);

    try {
      await unfollowMutation.mutateAsync(target.bandId as number);
      setToastMessage(`${target.name} 팔로우를 취소했어요`);
    } catch {
      setToastMessage("팔로우 취소에 실패했어요");
    }
  };

  const followLayer = (
    <>
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
    </>
  );

  return { toggleFollow, followLayer };
}

export const getBandSubtitle = (band: {
  band?: { genre?: string | null; region?: string | null };
  genre?: string | null;
  region?: string | null;
}) => {
  const info = band.band ?? band;
  const genre = info.genre ? getGenreLabel(info.genre) : "장르";
  const region = info.region ? getRegionLabel(info.region) : "지역";

  return `${genre} · ${region}`;
};

const MONTH_LABELS = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
];

const getPerformanceDate = (performance: FanExplorePerformance) => {
  const dateValue =
    performance.startAt ??
    performance.startedAt ??
    performance.startDateTime ??
    performance.performanceDate ??
    performance.startDate;
  const timeValue =
    performance.performanceTime ?? performance.startTime ?? performance.time;
  const value =
    dateValue && timeValue && !dateValue.includes("T")
      ? `${dateValue}T${timeValue}`
      : dateValue;
  const date = value ? new Date(value) : null;

  return date && !Number.isNaN(date.getTime()) ? date : null;
};

const formatDday = (date: Date | null, status?: string | null) => {
  if (!date) return status ?? "준비중";

  const today = new Date();
  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  const dateStart = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
  const diffDays = Math.ceil(
    (dateStart.getTime() - todayStart.getTime()) / 86_400_000,
  );

  if (diffDays < 0) return "종료";
  if (diffDays === 0) return "D-DAY";
  return `D-${diffDays}`;
};

export function ExploreConcertCard({
  performance,
  title,
  location,
  dateLabel,
  performanceId,
  posterUrl,
}: {
  performance: FanExplorePerformance;
  title: string;
  location: string;
  dateLabel: string;
  performanceId: number | null;
  posterUrl?: string | null;
}) {
  const date = getPerformanceDate(performance);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title} 상세보기`}
      disabled={performanceId == null}
      style={styles.concertCard}
      onPress={() => router.push(`/fan/home/concerts/${performanceId}` as Href)}
    >
      {posterUrl ? (
        <View style={styles.concertThumbnail}>
          <Image
            source={{ uri: posterUrl }}
            resizeMode="cover"
            style={styles.fill}
          />
        </View>
      ) : (
        <View style={styles.dateBadge}>
          <Text style={styles.dateMonth}>
            {date ? MONTH_LABELS[date.getMonth()] : "TBD"}
          </Text>
          <Text style={styles.dateDay}>
            {date ? String(date.getDate()).padStart(2, "0") : "--"}
          </Text>
        </View>
      )}

      <View style={styles.concertText}>
        <View style={styles.concertTitleGroup}>
          <Text numberOfLines={1} style={styles.concertTitle}>
            {title}
          </Text>
          <View style={styles.concertLocation}>
            <AppIcon name="concertLocation" size={14} />
            <Text numberOfLines={1} style={styles.concertVenue}>
              {location}
            </Text>
          </View>
        </View>
        <View style={styles.concertMeta}>
          <Text numberOfLines={1} style={styles.concertDateTime}>
            {dateLabel}
          </Text>
          <Text style={styles.concertDivider}>|</Text>
          <Text style={styles.concertStatus}>
            {formatDday(date, performance.status)}
          </Text>
        </View>
      </View>

      <AppIcon name="concertArrow" size={24} />
    </Pressable>
  );
}

const toStringList = (value?: string[] | string | null) => {
  if (Array.isArray(value)) return value.filter(Boolean);
  return typeof value === "string" && value ? [value] : [];
};

const formatPostedAgo = (createdAt?: string | null) => {
  const date = createdAt ? new Date(createdAt) : null;

  if (!date || Number.isNaN(date.getTime())) return undefined;

  const diffMinutes = Math.max(
    0,
    Math.floor((Date.now() - date.getTime()) / 60_000),
  );

  if (diffMinutes < 60) return `${diffMinutes}분 전`;

  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours < 24) return `${diffHours}시간 전`;

  return `${Math.floor(diffHours / 24)}일 전`;
};

function PlayIcon({ color }: { color: string }) {
  return (
    <Svg width={28} height={28} viewBox="0 0 28 28" fill="none">
      <Circle cx={14} cy={14} r={12} stroke={color} strokeWidth={3} />
      <Path d="M12 9.5L19 14L12 18.5V9.5Z" fill={color} />
    </Svg>
  );
}

export function ExploreNewsCard({
  content,
  keyword,
  postId,
}: {
  content: FanExploreContent;
  keyword: string;
  postId: number | null;
}) {
  const info =
    typeof content.content === "object" && content.content != null
      ? content.content
      : (content.post ?? content.detail ?? content);
  const mediaUrls = Array.from(
    new Set([
      ...toStringList(info.mediaUrls),
      ...toStringList(info.mediaUrl),
      ...toStringList(info.imageUrls),
      ...toStringList(info.images),
      ...toStringList(info.imageUrl),
    ]),
  );
  const mediaType = String(
    info.mediaType ?? info.contentType ?? info.type ?? "",
  ).toUpperCase();
  const variant =
    mediaType === "VIDEO"
      ? "video"
      : mediaUrls.length > 1
        ? "gallery"
        : mediaUrls.length === 1
          ? "image"
          : "text";
  const body =
    (typeof info.content === "string" ? info.content : null) ??
    info.contentText ??
    info.body ??
    info.text ??
    "";
  const videoThumbnailUrl = info.videoThumbnailUrl ?? info.thumbnailUrl;
  const meta = [
    info.genre ? getGenreLabel(info.genre) : null,
    info.region ? getRegionLabel(info.region) : null,
    formatPostedAgo(info.createdAt),
  ]
    .filter(Boolean)
    .join(" · ");
  const tags = Array.isArray(info.tags) ? info.tags : [];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${info.title || body || "게시물"} 상세보기`}
      disabled={postId == null}
      style={styles.newsCard}
      onPress={() => router.push(`/fan/explore/contents/${postId}` as Href)}
    >
      <View style={styles.newsHeader}>
        <ProfileImage
          imageUrl={info.profileImageUrl ?? info.bandProfileImageUrl}
          size={36}
          variant="band"
        />
        <View style={styles.flexText}>
          <Text numberOfLines={1} style={styles.newsBandName}>
            {info.bandName ?? info.name ?? keyword}
          </Text>
          <Text numberOfLines={1} style={styles.newsMeta}>
            {meta}
          </Text>
        </View>
      </View>

      {variant === "gallery" ? (
        <View style={styles.newsGalleryWrap}>
          <View style={styles.newsGallery}>
            {mediaUrls.slice(0, 2).map((url) => (
              <Image
                key={url}
                source={{ uri: url }}
                resizeMode="cover"
                style={styles.newsGalleryImage}
              />
            ))}
          </View>
          <View style={styles.newsDots}>
            {mediaUrls.map((url, index) => (
              <View
                key={url}
                style={[styles.newsDot, index === 0 && styles.newsDotActive]}
              />
            ))}
          </View>
        </View>
      ) : null}

      {variant === "image" ? (
        <View style={styles.newsMedia}>
          <Image
            source={{ uri: mediaUrls[0] }}
            resizeMode="cover"
            style={styles.fill}
          />
        </View>
      ) : null}

      {variant === "video" ? (
        <View style={styles.newsMedia}>
          {videoThumbnailUrl ? (
            <Image
              source={{ uri: videoThumbnailUrl }}
              resizeMode="cover"
              style={styles.fill}
            />
          ) : null}
          <View
            style={[
              styles.newsMediaOverlay,
              videoThumbnailUrl ? styles.newsMediaDim : null,
            ]}
          >
            <PlayIcon
              color={videoThumbnailUrl ? colors.white : colors.neutral700}
            />
          </View>
        </View>
      ) : null}

      <Text
        style={[styles.newsContent, variant !== "text" && styles.newsContentMedia]}
      >
        {body}
      </Text>

      {tags.length > 0 ? (
        <View style={styles.newsTags}>
          {tags.map((tag, index) => (
            <View key={`${tag}-${index}`} style={styles.newsTag}>
              <Text style={styles.newsTagText}>{tag}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </Pressable>
  );
}

export function ExploreSearchBar({
  initialKeyword,
  onSubmit,
}: {
  initialKeyword: string;
  onSubmit: (keyword: string) => void;
}) {
  const [keyword, setKeyword] = useState(initialKeyword);

  return (
    <>
      <AppHeader title="" style={styles.searchHeader} />

      <View style={styles.searchBar}>
        <TextInput
          accessibilityLabel="검색어"
          value={keyword}
          returnKeyType="search"
          style={styles.searchInput}
          onChangeText={setKeyword}
          onSubmitEditing={() => {
            const trimmedKeyword = keyword.trim();

            if (trimmedKeyword) onSubmit(trimmedKeyword);
          }}
        />
        {keyword ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="검색어 지우기"
            hitSlop={8}
            onPress={() => setKeyword("")}
          >
            <AppIcon name="timesCircle" size={16} />
          </Pressable>
        ) : null}
      </View>
    </>
  );
}

export function ExploreSectionTitle({
  title,
  count,
  onMorePress,
}: {
  title: string;
  count: number;
  onMorePress?: () => void;
}) {
  return (
    <View style={styles.sectionTitleRow}>
      <View style={styles.sectionTitleGroup}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionCount}>총 {count}개</Text>
      </View>

      {onMorePress ? (
        <Pressable
          accessibilityRole="button"
          style={styles.moreButton}
          onPress={onMorePress}
        >
          <Text style={styles.moreText}>더보기</Text>
          <View style={styles.moreIcon}>
            <AppIcon name="concertArrow" size={20} />
          </View>
        </Pressable>
      ) : null}
    </View>
  );
}

export function ExploreMessage({
  message,
  actionLabel,
  onAction,
}: {
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  if (actionLabel) {
    return (
      <Pressable accessibilityRole="button" onPress={onAction}>
        <Text style={styles.retryText}>{actionLabel}</Text>
      </Pressable>
    );
  }

  return <Text style={styles.message}>{message}</Text>;
}

export function ExploreList({ children }: { children: ReactNode }) {
  return <View style={styles.list}>{children}</View>;
}

const styles = StyleSheet.create({
  fill: {
    width: "100%",
    height: "100%",
  },
  flexText: {
    flex: 1,
    minWidth: 0,
  },
  filterBar: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral400,
    backgroundColor: colors.white,
    paddingHorizontal: 22,
  },
  filterScroll: {
    flex: 1,
  },
  filterScrollContent: {
    alignItems: "center",
    gap: 8,
    paddingRight: 16,
  },
  chip: {
    height: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    borderRadius: 11,
    borderWidth: 1,
    paddingHorizontal: 15,
  },
  chipFixed: {
    width: 48,
    paddingHorizontal: 0,
  },
  chipIdle: {
    borderColor: colors.neutral400,
    backgroundColor: colors.white,
  },
  chipApplied: {
    borderColor: colors.primary400,
    backgroundColor: colors.primary0,
  },
  chipDisabled: {
    borderColor: colors.neutral300,
    backgroundColor: colors.neutral200,
  },
  chipDisabledSort: {
    borderColor: colors.neutral300,
    backgroundColor: colors.white,
  },
  chipText: {
    ...textStyles.caption3,
    color: colors.neutral600,
  },
  chipTextApplied: {
    color: colors.primary400,
  },
  chipTextMuted: {
    color: colors.neutral400,
  },
  chipTextDisabled: {
    color: colors.neutral500,
  },
  registeredOnly: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingLeft: 8,
  },
  sortSheet: {
    gap: 10,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: colors.white,
    paddingHorizontal: 15,
    paddingTop: 32,
    paddingBottom: 48,
  },
  sortOption: {
    height: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
  },
  sortText: {
    ...textStyles.label2,
    color: colors.neutral900,
  },
  sortTextSelected: {
    color: colors.primary400,
  },
  sortTextDisabled: {
    color: colors.neutral400,
  },
  filterSheet: {
    flexShrink: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: colors.white,
    paddingTop: 8,
  },
  sheetHandle: {
    width: 42,
    height: 4,
    alignSelf: "center",
    borderRadius: 2,
    backgroundColor: colors.neutral400,
  },
  sheetTitle: {
    ...textStyles.label1,
    marginTop: 24,
    color: colors.neutral900,
    textAlign: "center",
  },
  filterGroups: {
    gap: 16,
    marginTop: 16,
    paddingLeft: 32,
    paddingRight: 31,
    paddingBottom: 8,
  },
  optionTitle: {
    ...textStyles.body1,
    color: colors.neutral900,
  },
  options: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    columnGap: 4,
    rowGap: 8,
    marginTop: 8,
  },
  option: {
    height: 26,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    backgroundColor: colors.neutral300,
  },
  optionSelected: {
    backgroundColor: colors.primary400,
  },
  optionDisabled: {
    backgroundColor: colors.neutral200,
    opacity: 0.6,
  },
  optionText: {
    ...textStyles.caption3,
    color: colors.neutral600,
  },
  optionTextSelected: {
    color: colors.white,
  },
  applyButton: {
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
    marginHorizontal: 34,
    borderRadius: 12,
    backgroundColor: colors.primary400,
  },
  applyText: {
    ...textStyles.label1,
    color: colors.white,
  },
  bandCard: {
    height: 86,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    borderRadius: 16,
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    boxShadow: "0px 4px 8px rgba(20, 20, 20, 0.1)",
  },
  bandName: {
    ...textStyles.body1,
    color: colors.neutral900,
  },
  bandMeta: {
    ...textStyles.body5,
    marginTop: 3,
    color: colors.neutral700,
  },
  bandDescription: {
    ...textStyles.body5,
    marginTop: 3,
    color: colors.primary300,
  },
  followButton: {
    width: 69,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary400,
    backgroundColor: colors.white,
  },
  following: {
    borderColor: colors.primary50,
    backgroundColor: colors.primary50,
  },
  followText: {
    ...textStyles.caption3,
    color: colors.primary400,
  },
  concertCard: {
    height: 86,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    borderRadius: 12,
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    boxShadow: "0px 0px 8px 0px rgba(0, 0, 0, 0.1)",
  },
  concertThumbnail: {
    width: 50,
    height: 62,
    overflow: "hidden",
    borderRadius: 8,
    backgroundColor: colors.neutral300,
  },
  dateBadge: {
    width: 50,
    height: 62,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: colors.secondary300,
  },
  dateMonth: {
    color: "#FFFDFB",
    fontSize: 16,
    fontWeight: "500",
    lineHeight: 16,
  },
  dateDay: {
    marginTop: 4,
    color: "#FFFDFB",
    fontSize: 24,
    fontWeight: "600",
    lineHeight: 24,
  },
  concertText: {
    flex: 1,
    minWidth: 0,
    gap: 5,
  },
  concertTitleGroup: {
    gap: 3,
  },
  concertTitle: {
    ...textStyles.body1,
    color: colors.neutral900,
  },
  concertLocation: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  concertVenue: {
    ...textStyles.caption2,
    flexShrink: 1,
    color: colors.neutral700,
  },
  concertMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  concertDateTime: {
    ...textStyles.body5,
    flexShrink: 1,
    color: colors.neutral500,
  },
  concertDivider: {
    ...textStyles.body5,
    color: colors.neutral400,
  },
  concertStatus: {
    ...textStyles.body5,
    color: colors.primary500,
  },
  newsCard: {
    borderRadius: 12,
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    boxShadow: "0px 0px 10px 1px rgba(20, 20, 20, 0.12)",
  },
  newsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  newsBandName: {
    ...textStyles.caption3,
    color: colors.neutral900,
  },
  newsMeta: {
    ...textStyles.caption2,
    color: colors.neutral700,
  },
  newsGalleryWrap: {
    marginTop: 16,
  },
  newsGallery: {
    flexDirection: "row",
    gap: 4,
  },
  newsGalleryImage: {
    flex: 1,
    height: 92,
    borderRadius: 4,
    backgroundColor: colors.neutral300,
  },
  newsDots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 2,
    marginTop: 6,
  },
  newsDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.neutral400,
  },
  newsDotActive: {
    backgroundColor: colors.primary400,
  },
  newsMedia: {
    width: 164,
    height: 92,
    alignSelf: "center",
    overflow: "hidden",
    marginTop: 16,
    borderRadius: 4,
    backgroundColor: colors.neutral300,
  },
  newsMediaOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
  },
  newsMediaDim: {
    backgroundColor: "rgba(41, 41, 41, 0.2)",
  },
  newsContent: {
    ...textStyles.caption2,
    marginTop: 16,
    color: colors.neutral900,
  },
  newsContentMedia: {
    marginTop: 8,
  },
  newsTags: {
    maxHeight: 20,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    overflow: "hidden",
    marginTop: 12,
  },
  newsTag: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    backgroundColor: colors.primary50,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  newsTagText: {
    ...textStyles.body5,
    color: colors.primary400,
  },
  searchHeader: {
    paddingHorizontal: 15,
  },
  searchBar: {
    height: 36,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    marginHorizontal: 15,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.neutral500,
    backgroundColor: colors.white,
    paddingHorizontal: 15,
  },
  searchInput: {
    ...textStyles.caption3,
    flex: 1,
    minWidth: 0,
    color: colors.neutral900,
    paddingVertical: 0,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  sectionTitleGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    ...textStyles.label1,
    color: colors.neutral900,
  },
  sectionCount: {
    ...textStyles.body5,
    color: colors.neutral600,
  },
  moreButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    transform: [{ translateX: 8 }],
  },
  moreText: {
    ...textStyles.body1,
    color: colors.neutral400,
  },
  moreIcon: {
    opacity: 0.28,
  },
  message: {
    ...textStyles.caption2,
    color: colors.neutral600,
  },
  retryText: {
    ...textStyles.caption2,
    color: colors.primary400,
  },
  list: {
    gap: 12,
  },
});

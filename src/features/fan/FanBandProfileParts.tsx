import type { ReactNode } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Path, Rect } from "react-native-svg";

import { AppIcon } from "@/shared/components/AppIcon";
import { ProfileImage } from "@/shared/components/ProfileImage";
import { colors, shadows, textStyles } from "@/shared/constants/theme";

import type { PerformanceListItem } from "@/types/band/performance";
import type { PostListItem } from "@/types/band/post";

const MONTHS = [
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

const COMPLETED_LABEL = "공연 완료";

const toDate = (value?: string | null) => {
  if (!value) return null;

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDateTime = (date: Date | null) => {
  if (!date) return "일정 미정";

  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");

  return `${date.getFullYear()}.${month}.${day}. ${hour}:${minute}`;
};

const formatDday = (date: Date | null) => {
  if (!date) return "준비중";

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

  if (diffDays < 0) return COMPLETED_LABEL;
  if (diffDays === 0) return "D-DAY";
  return `D-${diffDays}`;
};

const formatPostMeta = (createdAt: string, genre: string, region: string) => {
  const date = toDate(createdAt);

  if (!date) return `${genre} · ${region}`;

  const diffMinutes = Math.max(
    0,
    Math.floor((Date.now() - date.getTime()) / 60_000),
  );
  const timeLabel =
    diffMinutes < 60
      ? `${diffMinutes}분 전`
      : diffMinutes < 1440
        ? `${Math.floor(diffMinutes / 60)}시간 전`
        : `${Math.floor(diffMinutes / 1440)}일 전`;

  return `${genre} · ${region} · ${timeLabel}`;
};

export function ProfileTabs<T extends string>({
  tabs,
  activeTab,
  fullWidth = false,
  onChange,
}: {
  tabs: readonly T[];
  activeTab: T;
  fullWidth?: boolean;
  onChange: (tab: T) => void;
}) {
  return (
    <View style={[styles.tabs, fullWidth && styles.tabsFullWidth]}>
      <View style={styles.tabsLine} />
      {tabs.map((tab) => {
        const isActive = tab === activeTab;

        return (
          <Pressable
            key={tab}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            style={styles.tab}
            onPress={() => onChange(tab)}
          >
            <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
              {tab}
            </Text>
            {isActive ? (
              <View
                style={[
                  styles.tabIndicator,
                  fullWidth && styles.tabIndicatorFullWidth,
                ]}
              />
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

export function ProfileEmpty({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyDescription}>{description}</Text>
    </View>
  );
}

function ImagePlaceholderIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Rect
        x={4}
        y={5}
        width={16}
        height={14}
        rx={2}
        stroke={colors.neutral700}
        strokeWidth={2}
      />
      <Path
        d="M7 16L10.5 12.5L13 15L14.5 13.5L18 17"
        stroke={colors.neutral700}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function PlayIcon({ color }: { color: string }) {
  return (
    <Svg width={28} height={28} viewBox="0 0 28 28" fill="none">
      <Circle cx={14} cy={14} r={12} stroke={color} strokeWidth={3} />
      <Path d="M12 9.5L19 14L12 18.5V9.5Z" fill={color} />
    </Svg>
  );
}

function PostCardMedia({ post }: { post: PostListItem }) {
  const isVideo = post.type === "VIDEO";

  return (
    <View style={styles.postMedia}>
      {post.thumbnailUrl ? (
        <Image
          source={{ uri: post.thumbnailUrl }}
          resizeMode="cover"
          style={styles.fill}
        />
      ) : null}

      {isVideo ? (
        <View
          style={[
            styles.postMediaOverlay,
            post.thumbnailUrl ? styles.postMediaDim : null,
          ]}
        >
          <PlayIcon
            color={post.thumbnailUrl ? colors.white : colors.neutral700}
          />
        </View>
      ) : !post.thumbnailUrl ? (
        <View style={styles.postMediaOverlay}>
          <ImagePlaceholderIcon />
        </View>
      ) : null}
    </View>
  );
}

export function ProfilePostCard({
  post,
  bandName,
  profileImageUrl,
  genre,
  region,
  onPress,
}: {
  post: PostListItem;
  bandName: string;
  profileImageUrl?: string | null;
  genre: string;
  region: string;
  onPress: () => void;
}) {
  const hasMedia = post.type === "VIDEO" || post.type === "PHOTO";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${post.title} 상세보기`}
      style={styles.postCard}
      onPress={onPress}
    >
      <View style={styles.postHeader}>
        <ProfileImage imageUrl={profileImageUrl} size={36} variant="band" />
        <View style={styles.flexText}>
          <Text numberOfLines={1} style={styles.postBandName}>
            {bandName}
          </Text>
          <Text numberOfLines={1} style={styles.postMeta}>
            {formatPostMeta(post.createdAt, genre, region)}
          </Text>
        </View>
      </View>

      {hasMedia ? <PostCardMedia post={post} /> : null}

      <Text style={[styles.postContent, hasMedia && styles.postContentMedia]}>
        {post.description ?? post.title}
      </Text>
    </Pressable>
  );
}

export function ProfileConcertCard({
  performance,
  onPress,
}: {
  performance: PerformanceListItem;
  onPress: () => void;
}) {
  const date = toDate(performance.performanceDate);
  const dday = formatDday(date);
  const isCompleted = dday === COMPLETED_LABEL;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${performance.title} 상세보기`}
      style={styles.concertCard}
      onPress={onPress}
    >
      {performance.posterImageUrl ? (
        <View style={styles.concertThumbnail}>
          <Image
            source={{ uri: performance.posterImageUrl }}
            resizeMode="cover"
            style={styles.fill}
          />
        </View>
      ) : (
        <View
          style={[styles.dateBadge, isCompleted && styles.dateBadgeCompleted]}
        >
          <Text style={styles.dateMonth}>
            {date ? MONTHS[date.getMonth()] : "TBD"}
          </Text>
          <Text style={styles.dateDay}>
            {date ? String(date.getDate()).padStart(2, "0") : "--"}
          </Text>
        </View>
      )}

      <View style={styles.concertText}>
        <View style={styles.concertTitleGroup}>
          <Text
            numberOfLines={1}
            style={[styles.concertTitle, isCompleted && styles.completedText]}
          >
            {performance.title}
          </Text>
          <View style={styles.concertLocation}>
            <AppIcon
              name={isCompleted ? "concertLocationMuted" : "concertLocation"}
              size={14}
            />
            <Text
              numberOfLines={1}
              style={[
                styles.concertVenue,
                isCompleted && styles.completedText,
              ]}
            >
              {performance.venue}
            </Text>
          </View>
        </View>

        <View style={styles.concertMeta}>
          <Text numberOfLines={1} style={styles.concertDateTime}>
            {formatDateTime(date)}
          </Text>
          <Text style={styles.concertDivider}>|</Text>
          <Text
            style={[styles.concertStatus, isCompleted && styles.completedText]}
          >
            {dday}
          </Text>
        </View>
      </View>

      <AppIcon name="concertArrow" size={24} />
    </Pressable>
  );
}

export type ProfileMusicPlatform =
  | "spotify"
  | "youtube"
  | "soundcloud"
  | "other";

function MusicPlatformIcon({ type }: { type: ProfileMusicPlatform }) {
  if (type === "spotify") return <AppIcon name="spotify" size={35} />;
  if (type === "soundcloud") return <AppIcon name="soundcloud" size={35} />;

  if (type === "youtube") {
    return (
      <View style={styles.youtubeIcon}>
        <Image
          source={require("../../../assets/images/band/youtube.png")}
          style={styles.youtubeImage}
        />
      </View>
    );
  }

  return (
    <View style={styles.otherMusicIcon}>
      <AppIcon name="musicPlus" size={24} />
    </View>
  );
}

export function ProfileMusicCard({
  title,
  url,
  icon,
  onPress,
}: {
  title: string;
  url: string;
  icon: ProfileMusicPlatform;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="link"
      style={styles.musicCard}
      onPress={onPress}
    >
      <MusicPlatformIcon type={icon} />
      <View style={styles.flexText}>
        <Text numberOfLines={1} style={styles.musicTitle}>
          {title}
        </Text>
        <Text numberOfLines={1} style={styles.musicUrl}>
          {url}
        </Text>
      </View>
      <Svg width={8} height={15} viewBox="0 0 8 15" fill="none">
        <Path
          d="M1 1.5L6.5 7.5L1 13.5"
          stroke="#D4D4D4"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </Pressable>
  );
}

export function ProfileList({ children }: { children: ReactNode }) {
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
  tabs: {
    flexDirection: "row",
    paddingHorizontal: 32,
  },
  tabsFullWidth: {
    paddingHorizontal: 0,
  },
  tabsLine: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 2,
    backgroundColor: colors.neutral400,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingBottom: 10,
  },
  tabText: {
    ...textStyles.body1,
    color: colors.neutral400,
  },
  tabTextActive: {
    color: colors.primary400,
  },
  tabIndicator: {
    position: "absolute",
    left: "50%",
    bottom: 0,
    width: 114,
    height: 2,
    marginLeft: -57,
    borderRadius: 1,
    backgroundColor: colors.primary400,
  },
  tabIndicatorFullWidth: {
    left: 0,
    width: "100%",
    marginLeft: 0,
  },
  empty: {
    minHeight: 444,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  emptyTitle: {
    ...textStyles.label1,
    color: colors.neutral900,
    textAlign: "center",
  },
  emptyDescription: {
    ...textStyles.caption1,
    marginTop: 12,
    color: colors.neutral600,
    textAlign: "center",
  },
  list: {
    gap: 12,
    paddingHorizontal: 23,
    paddingTop: 24,
  },
  postCard: {
    borderRadius: 12,
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    boxShadow: "0px 0px 10px 1px rgba(20, 20, 20, 0.12)",
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  postBandName: {
    ...textStyles.caption3,
    color: colors.neutral900,
  },
  postMeta: {
    ...textStyles.caption2,
    color: colors.neutral700,
  },
  postMedia: {
    width: 164,
    height: 92,
    alignSelf: "center",
    overflow: "hidden",
    marginTop: 16,
    borderRadius: 4,
    backgroundColor: colors.neutral300,
  },
  postMediaOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
  },
  postMediaDim: {
    backgroundColor: "rgba(41, 41, 41, 0.2)",
  },
  postContent: {
    ...textStyles.caption2,
    marginTop: 16,
    color: colors.neutral900,
  },
  postContentMedia: {
    marginTop: 8,
  },
  concertCard: {
    ...shadows.card,
    height: 86,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    borderRadius: 12,
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    backgroundColor: colors.primary300,
  },
  dateBadgeCompleted: {
    backgroundColor: colors.neutral300,
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
  completedText: {
    color: colors.neutral500,
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
  youtubeIcon: {
    width: 35,
    height: 30,
    alignItems: "center",
  },
  youtubeImage: {
    width: 30,
    height: 30,
  },
  otherMusicIcon: {
    width: 35,
    height: 35,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: colors.neutral400,
  },
  musicCard: {
    ...shadows.card,
    width: "100%",
    maxWidth: 330,
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    gap: 25,
    borderRadius: 12,
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: 15,
  },
  musicTitle: {
    ...textStyles.caption3,
    color: colors.neutral900,
  },
  musicUrl: {
    ...textStyles.caption2,
    color: colors.neutral600,
  },
});

import { router } from "expo-router";
import type { ReactNode } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Path, Rect } from "react-native-svg";

import { AppIcon } from "@/shared/components/AppIcon";
import { colors, shadows, textStyles } from "@/shared/constants/theme";

export type ConcertTone = "fan" | "band";

const TONES = {
  fan: {
    pillBackground: colors.primary50,
    pillText: colors.primary400,
    divider: colors.primary0,
    likeGap: 2,
  },
  band: {
    pillBackground: colors.secondary100,
    pillText: colors.secondary600,
    divider: colors.secondary0,
    likeGap: 4,
  },
} as const;

export const formatConcertDateTime = (date: Date | null) => {
  if (!date) return "일정 미정";

  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const weekday = ["일", "월", "화", "수", "목", "금", "토"][date.getDay()];
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");

  return `${date.getFullYear()}.${month}.${day}. (${weekday}) ${hour}:${minute}`;
};

export function ConcertHeader({ children }: { children: ReactNode }) {
  return (
    <View style={styles.header}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="뒤로가기"
        hitSlop={12}
        style={styles.headerIcon}
        onPress={() => router.back()}
      >
        <AppIcon name="arrowLeft" size={24} />
      </Pressable>
      <View style={styles.headerActions}>{children}</View>
    </View>
  );
}

export function ConcertHeaderButton({
  label,
  disabled,
  onPress,
  children,
}: {
  label: string;
  disabled?: boolean;
  onPress: () => void;
  children: ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      hitSlop={8}
      style={styles.headerIcon}
      onPress={onPress}
    >
      {children}
    </Pressable>
  );
}

export function ConcertAlarmHint({ onClose }: { onClose: () => void }) {
  return (
    <View style={styles.hint}>
      <View style={styles.hintArrow} />
      <View style={styles.hintBody}>
        <View style={styles.hintHeader}>
          <Text style={styles.hintTitle}>공연 참여 예정이신가요?</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="공연 참여 예정 안내 닫기"
            hitSlop={8}
            style={styles.hintClose}
            onPress={onClose}
          >
            <AppIcon name="hintClose" size={20} />
          </Pressable>
        </View>
        <Text style={styles.hintDescription}>
          {"알림 설정을 하면 공연이 끝나고\n참여 여부를 선택할 수 있어요"}
        </Text>
      </View>
    </View>
  );
}

export function ConcertPoster({ imageUrl }: { imageUrl?: string | null }) {
  return (
    <View style={styles.poster}>
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          resizeMode="cover"
          style={styles.posterImage}
        />
      ) : (
        <Svg width={30} height={30} viewBox="0 0 24 24" fill="none">
          <Rect
            x={3}
            y={4}
            width={18}
            height={16}
            rx={2}
            stroke={colors.neutral700}
            strokeWidth={2}
          />
          <Path
            d="M6 16L10 12L13 15L15 13L19 17"
            stroke={colors.neutral700}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Circle cx={16.5} cy={8.5} r={1.5} fill={colors.neutral700} />
        </Svg>
      )}
    </View>
  );
}

export function ConcertHeadline({
  tone,
  dday,
  title,
  meta,
  isLiked,
  count,
  likeDisabled,
  onLikePress,
}: {
  tone: ConcertTone;
  dday: string;
  title: string;
  meta: string;
  isLiked: boolean;
  count: number;
  likeDisabled?: boolean;
  onLikePress?: () => void;
}) {
  const { likeGap, pillBackground, pillText } = TONES[tone];

  return (
    <View style={styles.headline}>
      <View style={styles.headlineText}>
        <View style={[styles.ddayPill, { backgroundColor: pillBackground }]}>
          <Text style={[styles.ddayText, { color: pillText }]}>{dday}</Text>
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.meta}>{meta}</Text>
      </View>

      <Pressable
        accessibilityRole={onLikePress ? "button" : undefined}
        accessibilityLabel={isLiked ? "좋아요 취소" : "좋아요"}
        accessibilityState={{ selected: isLiked }}
        disabled={likeDisabled || !onLikePress}
        style={[styles.like, { gap: likeGap }]}
        onPress={onLikePress}
      >
        <AppIcon name={isLiked ? "postHeartLiked" : "postHeart"} size={24} />
        <Text style={styles.likeCount}>{count}</Text>
      </Pressable>
    </View>
  );
}

export function ConcertInfoRows({
  rows,
  strong = false,
}: {
  rows: readonly { label: string; value: string }[];
  strong?: boolean;
}) {
  return (
    <View style={styles.infoRows}>
      {rows.map((item) => (
        <View key={item.label} style={styles.infoRow}>
          <Text style={styles.infoLabel}>{item.label}</Text>
          <Text style={[styles.infoValue, strong && styles.infoValueStrong]}>
            {item.value}
          </Text>
        </View>
      ))}
    </View>
  );
}

export function ConcertCard({ children }: { children: ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

export function ConcertDivider({ tone }: { tone: ConcertTone }) {
  return (
    <View style={[styles.divider, { backgroundColor: TONES[tone].divider }]} />
  );
}

export function ConcertIntro({
  tone,
  title,
  description,
  tags,
}: {
  tone: ConcertTone;
  title: string;
  description: string;
  tags: string[];
}) {
  const { pillBackground, pillText } = TONES[tone];

  return (
    <>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.description}>{description}</Text>

      {tags.length > 0 ? (
        <View style={styles.tags}>
          {tags.map((tag) => (
            <View
              key={tag}
              style={[styles.tag, { backgroundColor: pillBackground }]}
            >
              <Text style={[styles.tagText, { color: pillText }]}>{tag}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.white,
    paddingLeft: 15,
    paddingRight: 24,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  headerIcon: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  hint: {
    position: "absolute",
    top: 56,
    right: 24,
    zIndex: 20,
  },
  hintArrow: {
    position: "absolute",
    top: -7,
    right: 43,
    width: 18,
    height: 18,
    borderRadius: 3,
    backgroundColor: colors.white,
    transform: [{ rotate: "45deg" }],
  },
  hintBody: {
    ...shadows.card,
    width: 266,
    gap: 12,
    borderRadius: 16,
    backgroundColor: colors.white,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  hintHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 24,
  },
  hintTitle: {
    ...textStyles.label1,
    flexShrink: 1,
    color: colors.neutral900,
  },
  hintClose: {
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  hintDescription: {
    ...textStyles.caption1,
    color: colors.neutral600,
  },
  poster: {
    width: "100%",
    height: 492,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.neutral400,
  },
  posterImage: {
    width: "100%",
    height: "100%",
  },
  headline: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
  },
  headlineText: {
    flex: 1,
    minWidth: 0,
    alignItems: "flex-start",
  },
  ddayPill: {
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 5,
    paddingHorizontal: 15,
  },
  ddayText: {
    ...textStyles.caption3,
  },
  title: {
    ...textStyles.h3,
    marginTop: 4,
    color: colors.neutral900,
    letterSpacing: 0.72,
  },
  meta: {
    ...textStyles.caption2,
    color: colors.neutral600,
  },
  like: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 0,
    marginTop: 38,
  },
  likeCount: {
    ...textStyles.caption3,
    color: colors.neutral700,
    fontVariant: ["tabular-nums"],
  },
  infoRows: {
    gap: 10,
  },
  infoRow: {
    flexDirection: "row",
    gap: 8,
  },
  infoLabel: {
    ...textStyles.caption2,
    width: 88,
    color: colors.neutral700,
  },
  infoValue: {
    ...textStyles.body2,
    flex: 1,
    color: colors.neutral800,
    textAlign: "right",
  },
  infoValueStrong: {
    ...textStyles.body1,
    color: colors.neutral900,
  },
  card: {
    ...shadows.card,
    marginTop: 16,
    borderRadius: 12,
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  divider: {
    height: 16,
  },
  sectionTitle: {
    ...textStyles.body1,
    color: colors.neutral900,
  },
  description: {
    ...textStyles.caption2,
    marginTop: 20,
    color: colors.neutral900,
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginTop: 24,
  },
  tag: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  tagText: {
    ...textStyles.caption2,
  },
});

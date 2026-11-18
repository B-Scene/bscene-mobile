import { useQueryClient } from "@tanstack/react-query";
import { router, type Href } from "expo-router";
import { useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { FanDesignIcon } from "@/features/fan/FanDesignIcon";
import { isAlreadyInterestedPerformanceError } from "@/api/fan/home";
import type { ConcertListItem } from "@/features/fan/concertMappers";
import {
  invalidatePerformanceInterestQueries,
  useAddPerformanceInterest,
  useDeletePerformanceInterest,
} from "@/hooks/api/fan/useFanHome";
import { AppIcon } from "@/shared/components/AppIcon";
import { fanDesignText as textStyles } from "@/features/fan/fanDesignText";
import { colors, shadows } from "@/shared/constants/theme";

function ConcertLikeButton({ item }: { item: ConcertListItem }) {
  const queryClient = useQueryClient();
  const addInterestMutation = useAddPerformanceInterest();
  const deleteInterestMutation = useDeletePerformanceInterest();
  const [isSyncing, setIsSyncing] = useState(false);
  const { isInterested, performanceId, title } = item;

  const toggleInterest = async () => {
    if (performanceId == null) return;

    try {
      if (isInterested) {
        await deleteInterestMutation.mutateAsync(performanceId);
        return;
      }

      await addInterestMutation.mutateAsync(performanceId);
    } catch (error) {
      if (!isInterested && isAlreadyInterestedPerformanceError(error)) {
        setIsSyncing(true);

        try {
          await invalidatePerformanceInterestQueries(queryClient, performanceId);
        } finally {
          setIsSyncing(false);
        }
      }
    }
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        isInterested ? `${title} 관심 공연 해제` : `${title} 관심 공연 등록`
      }
      accessibilityState={{ selected: isInterested }}
      disabled={
        performanceId == null ||
        addInterestMutation.isPending ||
        deleteInterestMutation.isPending ||
        isSyncing
      }
      hitSlop={8}
      style={styles.like}
      onPress={() => void toggleInterest()}
    >
      {isInterested ? (
        <AppIcon name="postHeartLiked" width={20} height={17} />
      ) : (
        <AppIcon name="postHeart" size={24} />
      )}
    </Pressable>
  );
}

export function FanConcertCard({
  item,
  action = "interest",
}: {
  item: ConcertListItem;
  action?: "details" | "interest";
}) {

  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${item.title} 상세보기`}
        style={styles.main}
        onPress={() => router.push(`/fan/home/concerts/${item.id}` as Href)}
      >
        {item.thumbnailUrl ? (
          <Image
            source={{ uri: item.thumbnailUrl }}
            resizeMode="cover"
            style={styles.thumbnail}
          />
        ) : item.day === "--" || item.status === "준비중" ? (
          <View style={[styles.thumbnail, styles.posterPlaceholder]}>
            <FanDesignIcon name="poster" />
          </View>
        ) : (
          <View style={styles.dateBadge}>
            <Text style={styles.dateMonth}>{item.month}</Text>
            <Text style={styles.dateDay}>{item.day}</Text>
          </View>
        )}

        <View style={styles.text}>
          <View style={styles.titleGroup}>
            <Text numberOfLines={1} style={styles.title}>
              {item.title}
            </Text>
            <View style={styles.location}>
              <FanDesignIcon name="location" />
              <Text numberOfLines={1} style={styles.venue}>
                {item.location}
              </Text>
            </View>
          </View>
          <View style={styles.meta}>
            <Text numberOfLines={1} style={styles.dateTime}>
              {item.dateTime}
            </Text>
            <Text style={styles.divider}>|</Text>
            <Text style={styles.status}>{item.status}</Text>
          </View>
        </View>
        {action === "details" ? <FanDesignIcon name="concertArrow" /> : null}
      </Pressable>

      {action === "interest" ? <ConcertLikeButton item={item} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...shadows.card,
    height: 86,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    borderRadius: 12,
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  main: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  thumbnail: {
    width: 50,
    height: 62,
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
  posterPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.neutral400,
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
  text: {
    flex: 1,
    minWidth: 0,
    gap: 5,
  },
  titleGroup: {
    gap: 3,
  },
  title: {
    ...textStyles.body1,
    color: colors.neutral900,
  },
  location: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  venue: {
    ...textStyles.caption2,
    flexShrink: 1,
    color: colors.neutral700,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dateTime: {
    ...textStyles.body5,
    flexShrink: 1,
    color: colors.neutral500,
  },
  divider: {
    ...textStyles.body5,
    color: colors.neutral400,
  },
  status: {
    ...textStyles.body5,
    color: colors.primary500,
  },
  like: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
});

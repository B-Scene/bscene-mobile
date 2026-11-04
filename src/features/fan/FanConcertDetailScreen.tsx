import { useQueryClient } from "@tanstack/react-query";
import {
  router,
  useLocalSearchParams,
} from "expo-router";
import { useCallback, useRef, useState, type ComponentRef } from "react";
import {
  Linking,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

import {
  invalidatePerformanceInterestQueries,
  useAddPerformanceInterest,
  useDeletePerformanceAlarm,
  useDeletePerformanceInterest,
  useFanPerformanceDetailQuery,
  useSetPerformanceAlarm,
} from "@/hooks/api/fan/useFanHome";
import {
  isAlreadyInterestedPerformanceError,
  isAlreadySetPerformanceAlarmError,
} from "@/api/fan/home";
import {
  ConcertAlarmHint,
  ConcertCard,
  ConcertDivider,
  ConcertHeader,
  ConcertHeaderButton,
  ConcertHeadline,
  ConcertInfoRows,
  ConcertIntro,
  ConcertPoster,
  formatConcertDateTime,
} from "@/features/concert/ConcertDetailParts";
import { ProfileTabs } from "@/features/fan/FanBandProfileParts";
import { AppIcon } from "@/shared/components/AppIcon";
import { ConfirmModal } from "@/shared/components/ConfirmModal";
import { ProfileImage } from "@/shared/components/ProfileImage";
import { Screen } from "@/shared/components/Screen";
import { Toast } from "@/shared/components/Toast";
import { colors, shadows, textStyles } from "@/shared/constants/theme";
import {
  formatDateTime,
  formatDday,
  getCastingBandId,
  getCastingBandInfo,
  getCastingBandImageUrl,
  getConcertDate,
  getConcertLocation,
  getConcertTitle,
  getDetailPosterImageUrl,
} from "@/features/fan/concertMappers";

const AGE_RATING_LABELS: Record<string, string> = {
  ALL: "전체 관람가",
  AGE_12: "만 12세 이상",
  AGE_15: "만 15세 이상",
  AGE_19: "만 19세 이상",
};

const TABS = ["공연정보", "공연소개", "캐스팅"] as const;
type ConcertDetailTab = (typeof TABS)[number];

const SECTION_SCROLL_MARGIN: Record<ConcertDetailTab, number> = {
  공연정보: 43,
  공연소개: 43,
  캐스팅: 82,
};

const formatPrice = (value?: string | number | null) => {
  if (value === null || value === undefined || value === "") return "가격 미정";
  if (typeof value === "number") return `${value.toLocaleString()}원`;
  return value;
};

export function FanConcertDetailScreen() {
  const params = useLocalSearchParams<{ concertId?: string }>();
  const performanceId = Number(params.concertId);
  const queryClient = useQueryClient();
  const query = useFanPerformanceDetailQuery(
    Number.isFinite(performanceId) ? performanceId : 0,
  );
  const addInterestMutation = useAddPerformanceInterest();
  const deleteInterestMutation = useDeletePerformanceInterest();
  const setAlarmMutation = useSetPerformanceAlarm();
  const deleteAlarmMutation = useDeletePerformanceAlarm();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const sectionOffsets = useRef<Partial<Record<ConcertDetailTab, number>>>({});
  const [selectedTab, setSelectedTab] = useState<ConcertDetailTab>("공연정보");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isAlarmModalOpen, setIsAlarmModalOpen] = useState(false);
  const [isAlarmHintDismissed, setIsAlarmHintDismissed] = useState(false);
  const closeToast = useCallback(() => setToastMessage(null), []);
  const detail = query.data;
  const date = getConcertDate(detail ?? {});
  const title = getConcertTitle(detail);
  const location = getConcertLocation(detail);
  const meta =
    [detail?.genre, detail?.region].filter(Boolean).join(" · ") || "장르 · 지역";
  const posterImageUrl = getDetailPosterImageUrl(detail);
  const description =
    detail?.introduction ??
    detail?.description ??
    detail?.content ??
    "공연 소개가 준비 중이에요.";
  const price = formatPrice(detail?.ticketPrice ?? detail?.price);
  const ageRating =
    AGE_RATING_LABELS[String(detail?.ageRating ?? "")] ??
    detail?.ageRating ??
    "관람 연령 미정";
  const isInterested = detail?.isInterested ?? detail?.interested ?? false;
  const interestCount = detail?.interestCount ?? 0;
  const isAlarmSet =
    detail?.notificationEnabled ??
    detail?.alarmSet ??
    detail?.isAlarmSet ??
    detail?.alarmEnabled ??
    false;
  const isInterestPending =
    addInterestMutation.isPending || deleteInterestMutation.isPending;
  const isAlarmPending =
    setAlarmMutation.isPending || deleteAlarmMutation.isPending;
  const infoRows = [
    { label: "공연 일시", value: formatConcertDateTime(date) },
    { label: "공연 장소", value: location },
    { label: "티켓 가격", value: price },
    { label: "관람 연령", value: ageRating },
  ];
  const tags = detail?.tags?.length ? detail.tags : [title];
  const casting = detail?.casting ?? [];
  const showAlarmHint = Boolean(detail) && !isAlarmSet && !isAlarmHintDismissed;

  const selectTab = (tab: ConcertDetailTab) => {
    setSelectedTab(tab);

    const offset = sectionOffsets.current[tab];

    if (offset !== undefined) {
      scrollRef.current?.scrollTo({
        y: Math.max(0, offset - SECTION_SCROLL_MARGIN[tab]),
        animated: true,
      });
    }
  };

  const recordSectionOffset = (tab: ConcertDetailTab, y: number) => {
    sectionOffsets.current[tab] = y;
  };

  const openTicket = async () => {
    if (!detail?.ticketLink) return;

    try {
      await Linking.openURL(detail.ticketLink);
    } catch {
      setToastMessage("예매 링크 열기에 실패했어요");
    }
  };

  const shareConcert = async () => {
    if (!Number.isFinite(performanceId) || performanceId <= 0) {
      setToastMessage("공연 정보를 확인할 수 없어요");
      return;
    }

    const concertLink = `https://bscene.app/fan/home/concerts/${performanceId}`;

    try {
      await Share.share({
        title,
        message: `${title}\n${location} · ${formatDateTime(date)}\n${concertLink}`,
        url: concertLink,
      });
    } catch {
      setToastMessage("공연 링크 공유에 실패했어요");
    }
  };

  const toggleInterest = async () => {
    if (!Number.isFinite(performanceId) || performanceId <= 0) return;

    if (isInterested) {
      try {
        await deleteInterestMutation.mutateAsync(performanceId);
        setToastMessage("관심 공연을 해제했어요");
      } catch {
        setToastMessage("관심 공연 해제에 실패했어요");
      }
      return;
    }

    try {
      await addInterestMutation.mutateAsync(performanceId);
    } catch (error) {
      if (isAlreadyInterestedPerformanceError(error)) {
        await invalidatePerformanceInterestQueries(queryClient, performanceId);
        return;
      }
      setToastMessage("관심 공연 등록에 실패했어요");
    }
  };

  const toggleAlarm = async () => {
    if (!Number.isFinite(performanceId) || performanceId <= 0) return;

    if (isAlarmSet) {
      try {
        await deleteAlarmMutation.mutateAsync(performanceId);
        setToastMessage("공연 알림을 해제했어요");
      } catch {
        setToastMessage("공연 알림 해제에 실패했어요");
      }
      return;
    }

    try {
      await setAlarmMutation.mutateAsync(performanceId);
      setIsAlarmModalOpen(true);
    } catch (error) {
      if (isAlreadySetPerformanceAlarmError(error)) {
        await invalidatePerformanceInterestQueries(queryClient, performanceId);
        setToastMessage("이미 공연 알림이 설정되어 있어요");
        return;
      }
      setToastMessage("공연 알림 설정에 실패했어요");
    }
  };

  return (
    <Screen
      edges={["top", "left", "right"]}
      scroll={false}
      contentStyle={styles.container}
    >
      <ScrollView
        ref={scrollRef}
        stickyHeaderIndices={[2]}
        contentContainerStyle={{ paddingBottom: insets.bottom }}
      >
        <View>
          <ConcertHeader>
            <ConcertHeaderButton
              label={isAlarmSet ? "공연 알림 설정됨" : "공연 알림 설정"}
              disabled={isAlarmPending}
              onPress={() => void toggleAlarm()}
            >
              <AppIcon
                name={isAlarmSet ? "notificationOnDark" : "notificationOffDark"}
                size={24}
              />
            </ConcertHeaderButton>
            <ConcertHeaderButton
              label="공유하기"
              onPress={() => void shareConcert()}
            >
              <AppIcon name="shareDark" size={24} />
            </ConcertHeaderButton>
          </ConcertHeader>

          <ConcertPoster imageUrl={posterImageUrl} />

          {showAlarmHint ? (
            <ConcertAlarmHint onClose={() => setIsAlarmHintDismissed(true)} />
          ) : null}
        </View>

        <View style={styles.summary}>
          {query.isLoading ? (
            <Text style={styles.loadingText}>공연 정보를 불러오는 중이에요</Text>
          ) : null}

          {query.isError ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>공연 정보를 불러오지 못했어요</Text>
              <Pressable
                accessibilityRole="button"
                style={styles.retryButton}
                onPress={() => void query.refetch()}
              >
                <Text style={styles.retryText}>다시 시도</Text>
              </Pressable>
            </View>
          ) : null}

          <ConcertHeadline
            tone="fan"
            dday={formatDday(detail ?? {}, date)}
            title={title}
            meta={meta}
            isLiked={isInterested}
            count={interestCount}
            likeDisabled={isInterestPending}
            onLikePress={() => void toggleInterest()}
          />

          <ConcertCard>
            <ConcertInfoRows rows={infoRows.slice(0, 3)} strong />

            <Pressable
              accessibilityRole="button"
              disabled={!detail?.ticketLink}
              style={[
                styles.ticketButton,
                !detail?.ticketLink && styles.ticketButtonDisabled,
              ]}
              onPress={() => void openTicket()}
            >
              <Text
                style={[
                  styles.ticketText,
                  !detail?.ticketLink && styles.ticketTextDisabled,
                ]}
              >
                {detail?.ticketLink ? "예매하기" : "지금은 예매할 수 없어요"}
              </Text>
            </Pressable>
          </ConcertCard>
        </View>

        <View style={styles.tabs}>
          <ProfileTabs
            fullWidth
            tabs={TABS}
            activeTab={selectedTab}
            onChange={selectTab}
          />
        </View>

        <View
          style={styles.infoSection}
          onLayout={(event) =>
            recordSectionOffset("공연정보", event.nativeEvent.layout.y)
          }
        >
          <Text style={styles.infoTitle}>공연정보</Text>
          <View style={styles.infoRows}>
            <ConcertInfoRows rows={infoRows} />
          </View>
        </View>

        <ConcertDivider tone="fan" />

        <View
          style={styles.introSection}
          onLayout={(event) =>
            recordSectionOffset("공연소개", event.nativeEvent.layout.y)
          }
        >
          <ConcertIntro
            tone="fan"
            title="공연소개"
            description={description}
            tags={tags}
          />
        </View>

        <ConcertDivider tone="fan" />

        <View
          style={styles.castingSection}
          onLayout={(event) =>
            recordSectionOffset("캐스팅", event.nativeEvent.layout.y)
          }
        >
          <Text style={styles.sectionTitle}>캐스팅</Text>

          <View style={styles.castingList}>
            {casting.length > 0 ? (
              casting.map((band, index) => {
                const bandInfo = getCastingBandInfo(band);
                const bandId = getCastingBandId(band);
                const bandName =
                  bandInfo.bandName ?? bandInfo.name ?? band.bandName ?? "밴드명";
                const bandMeta =
                  [
                    bandInfo.genre ?? bandInfo.bandGenre,
                    bandInfo.region ?? bandInfo.bandRegion,
                  ]
                    .filter(Boolean)
                    .join(" · ") || "장르 · 지역";

                return (
                  <Pressable
                    key={`${bandId ?? bandName}-${index}`}
                    accessibilityRole="button"
                    disabled={bandId == null}
                    style={styles.castingCard}
                    onPress={() => {
                      if (bandId == null) return;
                      router.push(
                        `/fan/bands/${bandId}` as Parameters<
                          typeof router.push
                        >[0],
                      );
                    }}
                  >
                    <ProfileImage
                      imageUrl={getCastingBandImageUrl(band)}
                      size={35}
                      variant="band"
                    />
                    <View style={styles.castingText}>
                      <Text numberOfLines={1} style={styles.castingName}>
                        {bandName}
                      </Text>
                      <Text numberOfLines={1} style={styles.castingMeta}>
                        {bandMeta}
                      </Text>
                    </View>
                    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                      <Path
                        d="M9 6L15 12L9 18"
                        stroke={colors.neutral400}
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Svg>
                  </Pressable>
                );
              })
            ) : (
              <Text style={styles.castingMeta}>캐스팅 정보가 준비 중이에요</Text>
            )}
          </View>
        </View>
      </ScrollView>

      <ConfirmModal
        open={isAlarmModalOpen}
        showCancel={false}
        title="공연 알림이 설정됐어요"
        description="공연 시작 1시간 전에 알림을 보내드릴게요"
        onCancel={() => setIsAlarmModalOpen(false)}
        onConfirm={() => setIsAlarmModalOpen(false)}
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

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  summary: {
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  loadingText: {
    ...textStyles.body3,
    marginBottom: 16,
    color: colors.neutral600,
  },
  errorBox: {
    alignItems: "flex-start",
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
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
  ticketButton: {
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: colors.primary400,
  },
  ticketButtonDisabled: {
    borderColor: colors.neutral400,
  },
  ticketText: {
    ...textStyles.label2,
    color: colors.primary400,
  },
  ticketTextDisabled: {
    color: colors.neutral500,
  },
  tabs: {
    backgroundColor: colors.white,
  },
  infoSection: {
    paddingHorizontal: 29,
    paddingVertical: 16,
  },
  infoTitle: {
    ...textStyles.body1,
    color: colors.neutral900,
    fontWeight: "700",
    lineHeight: 38,
  },
  infoRows: {
    marginTop: 17,
  },
  introSection: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  castingSection: {
    paddingHorizontal: 29,
    paddingTop: 16,
    paddingBottom: 48,
  },
  sectionTitle: {
    ...textStyles.body1,
    color: colors.neutral900,
  },
  castingList: {
    gap: 12,
    marginTop: 16,
  },
  castingCard: {
    ...shadows.card,
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
    borderRadius: 8,
    backgroundColor: colors.white,
    paddingHorizontal: 16,
  },
  castingText: {
    flex: 1,
    minWidth: 0,
  },
  castingName: {
    ...textStyles.caption3,
    color: colors.neutral900,
  },
  castingMeta: {
    ...textStyles.caption2,
    color: colors.neutral600,
  },
});

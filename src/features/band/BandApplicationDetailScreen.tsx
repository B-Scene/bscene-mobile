import { router, useLocalSearchParams, type Href } from "expo-router";
import { useRef, useState, type ComponentRef } from "react";
import {
  Alert,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import Svg, { Path } from "react-native-svg";

import { MyHeader } from "@/features/my/MyHeader";
import { useApplicationSubmissionDetailQuery } from "@/hooks/api/session/useSessionApplication";
import { useCreateChatRoomMutation } from "@/hooks/api/session/useSessionChat";
import { useAcceptApplicationSubmissionMutation } from "@/hooks/api/user/useReceivedApplications";
import { AppIcon } from "@/shared/components/AppIcon";
import { AppState } from "@/shared/components/AppState";
import { ConfirmModal } from "@/shared/components/ConfirmModal";
import { ProfileImage } from "@/shared/components/ProfileImage";
import { Screen } from "@/shared/components/Screen";
import { colors, textStyles } from "@/shared/constants/theme";
import type { ApplicantStatus } from "@/types/user/receivedApplications";

const TABS = ["소개", "정보", "경력", "포트폴리오"] as const;
type DetailTab = (typeof TABS)[number];

const TAB_BAR_HEIGHT = 44;

const parseRouteId = (value?: string | string[]) => {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const parsed = Number(rawValue);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

const formatDeadline = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  const pad = (part: number) => String(part).padStart(2, "0");

  return `${date.getFullYear()}. ${pad(date.getMonth() + 1)}. ${pad(date.getDate())}. ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const splitGenres = (value: string) =>
  value
    .split(/[,/·]/)
    .map((item) => item.trim())
    .filter(Boolean);

export function BandApplicationDetailScreen() {
  const params = useLocalSearchParams<{
    applySubmissionId?: string;
    status?: ApplicantStatus;
  }>();
  const applySubmissionId = parseRouteId(params.applySubmissionId);
  const query = useApplicationSubmissionDetailQuery(applySubmissionId);
  const acceptMutation = useAcceptApplicationSubmissionMutation();
  const createChatMutation = useCreateChatRoomMutation();
  const detail = query.data;
  const isAlreadyDecided = params.status != null && params.status !== "PENDING";

  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const sectionsTopRef = useRef(0);
  const sectionOffsetsRef = useRef<Partial<Record<DetailTab, number>>>({});
  const [activeTab, setActiveTab] = useState<DetailTab>("소개");
  const [pendingDecision, setPendingDecision] = useState<boolean | null>(null);

  const handleSectionLayout = (tab: DetailTab, event: LayoutChangeEvent) => {
    sectionOffsetsRef.current[tab] = event.nativeEvent.layout.y;
  };

  const handleTabPress = (tab: DetailTab) => {
    setActiveTab(tab);
    scrollRef.current?.scrollTo({
      y:
        sectionsTopRef.current +
        (sectionOffsetsRef.current[tab] ?? 0) -
        TAB_BAR_HEIGHT,
      animated: true,
    });
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const line =
      event.nativeEvent.contentOffset.y +
      TAB_BAR_HEIGHT +
      8 -
      sectionsTopRef.current;
    const current = TABS.reduce<DetailTab>(
      (matched, tab) =>
        (sectionOffsetsRef.current[tab] ?? Infinity) <= line ? tab : matched,
      "소개",
    );

    setActiveTab(current);
  };

  const openChat = async () => {
    if (applySubmissionId <= 0 || createChatMutation.isPending) return;

    try {
      const room = await createChatMutation.mutateAsync({
        contextType: "RECRUITMENT",
        applicationSubmissionId: applySubmissionId,
      });

      router.push(`/band/session/messages/${room.chatRoomId}` as Href);
    } catch {
      Alert.alert(
        "채팅하기",
        "채팅방 생성에 실패했어요. 잠시 후 다시 시도해주세요.",
      );
    }
  };

  const confirmDecision = async () => {
    if (pendingDecision === null || acceptMutation.isPending) return;

    const isApproved = pendingDecision;

    setPendingDecision(null);

    try {
      await acceptMutation.mutateAsync({ applySubmissionId, isApproved });
      router.back();
    } catch {
      Alert.alert(
        isApproved ? "지원 수락" : "지원 거절",
        isApproved
          ? "지원 수락에 실패했어요. 잠시 후 다시 시도해주세요."
          : "지원 거절에 실패했어요. 잠시 후 다시 시도해주세요.",
      );
    }
  };

  if (query.isLoading || query.isError || !detail) {
    return (
      <Screen scroll={false} contentStyle={styles.container}>
        <MyHeader title="" />
        {query.isLoading ? (
          <AppState loading title="지원서 정보를 불러오고 있어요" />
        ) : (
          <AppState
            title="지원서 정보를 불러오지 못했어요"
            actionLabel="다시 시도"
            onAction={() => void query.refetch()}
          />
        )}
      </Screen>
    );
  }

  const canChat = detail.isOwner;
  const chatColor = canChat ? colors.secondary500 : colors.neutral400;
  const isDecisionDisabled = isAlreadyDecided || acceptMutation.isPending;

  return (
    <Screen scroll={false} contentStyle={styles.container}>
      <MyHeader title="" />

      <ScrollView
        ref={scrollRef}
        stickyHeaderIndices={[1]}
        scrollEventThrottle={32}
        onScroll={handleScroll}
      >
        <View>
          <View style={styles.posting}>
            <Text style={styles.postingLabel}>지원 공고</Text>
            <View style={styles.postingText}>
              <Text style={styles.postingTitle}>
                {detail.recruitmentTitle} · {detail.bandName}
              </Text>
              <Text style={styles.postingDeadline}>
                모집 마감 {formatDeadline(detail.deadlineAt)}
              </Text>
            </View>
          </View>

          <View style={styles.band} />

          <View style={styles.profile}>
            <Text style={styles.profileTitle}>
              {detail.part} 세션 지원합니다
            </Text>

            <View style={styles.profileRow}>
              <ProfileImage imageUrl={detail.profileImageUrl} size={96} />

              <View style={styles.profileText}>
                <Text numberOfLines={1} style={styles.nickname}>
                  {detail.nickname}
                </Text>

                <View style={styles.profileMetaRow}>
                  <Text numberOfLines={1} style={styles.profileMeta}>
                    {detail.part} · {detail.skillLevel} · {detail.region}
                  </Text>

                  <Pressable
                    accessibilityRole="button"
                    disabled={!canChat}
                    style={[styles.chatButton, { borderColor: chatColor }]}
                    onPress={() => void openChat()}
                  >
                    <ChatBubbleIcon color={chatColor} />
                    <Text style={[styles.chatText, { color: chatColor }]}>
                      채팅하기
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.tabBar}>
          {TABS.map((tab) => {
            const selected = activeTab === tab;

            return (
              <Pressable
                key={tab}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                style={[styles.tab, selected && styles.tabSelected]}
                onPress={() => handleTabPress(tab)}
              >
                <Text style={selected ? styles.tabTextOn : styles.tabTextOff}>
                  {tab}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View
          style={styles.sections}
          onLayout={(event) => {
            sectionsTopRef.current = event.nativeEvent.layout.y;
          }}
        >
          <View
            style={styles.introSection}
            onLayout={(event) => handleSectionLayout("소개", event)}
          >
            <Text style={styles.sectionTitle}>세션 소개</Text>
            <Text style={styles.quote}>“{detail.oneLineIntro}”</Text>
            <Text style={styles.body}>{detail.intro}</Text>
          </View>

          <View style={styles.sectionDivider} />

          <View
            style={styles.section}
            onLayout={(event) => handleSectionLayout("정보", event)}
          >
            <Text style={styles.sectionTitle}>세션 정보</Text>
            <InfoGroup label="파트" values={[detail.part]} />
            <InfoGroup label="실력대" values={[detail.skillLevel]} />
            <InfoGroup label="선호 장르" values={splitGenres(detail.genre)} />
            <InfoGroup label="활동 지역" values={[detail.region]} />
            <InfoGroup
              label="가능한 활동"
              values={detail.availableActivities}
            />
          </View>

          <View style={styles.sectionDivider} />

          <View
            style={styles.section}
            onLayout={(event) => handleSectionLayout("경력", event)}
          >
            <Text style={styles.sectionTitle}>경력</Text>

            {detail.careers.length > 0 ? (
              detail.careers.map((career) => (
                <View
                  key={career.sessionApplicationCareerId}
                  style={styles.career}
                >
                  <View style={styles.careerPeriodRow}>
                    <View style={styles.careerDot} />
                    <Text style={styles.careerPeriod}>{career.period}</Text>
                  </View>
                  <View style={styles.careerText}>
                    <Text style={styles.careerTitle}>{career.name}</Text>
                    <Text style={styles.careerDescription}>
                      {career.description}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>등록된 경력이 없어요</Text>
            )}
          </View>

          <View style={styles.sectionDivider} />

          <View
            style={styles.section}
            onLayout={(event) => handleSectionLayout("포트폴리오", event)}
          >
            <Text style={styles.sectionTitle}>포트폴리오</Text>

            {detail.portfolioLinks.length > 0 ? (
              detail.portfolioLinks.map((link) => (
                <Pressable
                  key={link.sessionApplicationLinkId}
                  accessibilityRole="link"
                  style={styles.portfolio}
                  onPress={() => void Linking.openURL(link.url)}
                >
                  <View style={styles.thumbnail}>
                    {link.thumbnailUrl ? (
                      <Image
                        source={{ uri: link.thumbnailUrl }}
                        style={styles.thumbnailImage}
                      />
                    ) : null}
                    <View style={styles.playButton}>
                      <AppIcon name="playButton" />
                    </View>
                  </View>

                  <View style={styles.portfolioText}>
                    <Text style={styles.portfolioTitle}>
                      {link.title ?? link.url}
                    </Text>
                    <Text numberOfLines={1} style={styles.portfolioUrl}>
                      {link.url}
                    </Text>
                  </View>
                </Pressable>
              ))
            ) : (
              <Text style={styles.emptyText}>등록된 포트폴리오가 없어요</Text>
            )}
          </View>
        </View>

        <View style={styles.decision}>
          {isAlreadyDecided ? (
            <Text style={styles.decidedText}>
              이미 처리되었거나 취소된 지원이에요
            </Text>
          ) : null}

          <View style={styles.decisionActions}>
            <Pressable
              accessibilityRole="button"
              disabled={isDecisionDisabled}
              style={[
                styles.decisionButton,
                styles.rejectButton,
                isAlreadyDecided && styles.rejectButtonDecided,
              ]}
              onPress={() => setPendingDecision(false)}
            >
              <Text
                style={[
                  styles.rejectText,
                  isAlreadyDecided && styles.rejectTextDecided,
                ]}
              >
                거절
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              disabled={isDecisionDisabled}
              style={[
                styles.decisionButton,
                styles.acceptButton,
                isAlreadyDecided && styles.acceptButtonDecided,
              ]}
              onPress={() => setPendingDecision(true)}
            >
              <Text
                style={[
                  styles.acceptText,
                  isAlreadyDecided && styles.acceptTextDecided,
                ]}
              >
                수락
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <ConfirmModal
        open={pendingDecision !== null}
        tone="orange"
        title={
          pendingDecision ? "이 지원자를 수락할까요?" : "이 지원자를 거절할까요?"
        }
        confirmLabel={pendingDecision ? "수락" : "거절"}
        onCancel={() => setPendingDecision(null)}
        onConfirm={() => void confirmDecision()}
      />
    </Screen>
  );
}

function ChatBubbleIcon({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
      <Path
        d="M9.75 8.25H5.25C5.05109 8.25 4.86032 8.32902 4.71967 8.46967C4.57902 8.61032 4.5 8.80109 4.5 9C4.5 9.19891 4.57902 9.38968 4.71967 9.53033C4.86032 9.67098 5.05109 9.75 5.25 9.75H9.75C9.94891 9.75 10.1397 9.67098 10.2803 9.53033C10.421 9.38968 10.5 9.19891 10.5 9C10.5 8.80109 10.421 8.61032 10.2803 8.46967C10.1397 8.32902 9.94891 8.25 9.75 8.25ZM12.75 5.25H5.25C5.05109 5.25 4.86032 5.32902 4.71967 5.46967C4.57902 5.61032 4.5 5.80109 4.5 6C4.5 6.19891 4.57902 6.38968 4.71967 6.53033C4.86032 6.67098 5.05109 6.75 5.25 6.75H12.75C12.9489 6.75 13.1397 6.67098 13.2803 6.53033C13.421 6.38968 13.5 6.19891 13.5 6C13.5 5.80109 13.421 5.61032 13.2803 5.46967C13.1397 5.32902 12.9489 5.25 12.75 5.25ZM14.25 1.5H3.75C3.15326 1.5 2.58097 1.73705 2.15901 2.15901C1.73705 2.58097 1.5 3.15326 1.5 3.75V11.25C1.5 11.8467 1.73705 12.419 2.15901 12.841C2.58097 13.2629 3.15326 13.5 3.75 13.5H12.4425L15.2175 16.2825C15.2876 16.352 15.3707 16.407 15.4621 16.4443C15.5534 16.4817 15.6513 16.5006 15.75 16.5C15.8484 16.5025 15.946 16.482 16.035 16.44C16.172 16.3837 16.2892 16.2882 16.372 16.1654C16.4547 16.0426 16.4993 15.8981 16.5 15.75V3.75C16.5 3.15326 16.2629 2.58097 15.841 2.15901C15.419 1.73705 14.8467 1.5 14.25 1.5ZM15 13.9425L13.2825 12.2175C13.2124 12.148 13.1293 12.093 13.0379 12.0557C12.9466 12.0183 12.8487 11.9994 12.75 12H3.75C3.55109 12 3.36032 11.921 3.21967 11.7803C3.07902 11.6397 3 11.4489 3 11.25V3.75C3 3.55109 3.07902 3.36032 3.21967 3.21967C3.36032 3.07902 3.55109 3 3.75 3H14.25C14.4489 3 14.6397 3.07902 14.7803 3.21967C14.921 3.36032 15 3.55109 15 3.75V13.9425Z"
        fill={color}
      />
    </Svg>
  );
}

function InfoGroup({ label, values }: { label: string; values: string[] }) {
  return (
    <View style={styles.infoGroup}>
      <Text style={styles.infoLabel}>{label}</Text>
      <View style={styles.infoValues}>
        {values.map((value) => (
          <View key={value} style={styles.infoChip}>
            <Text style={styles.infoChipText}>{value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 0,
    paddingVertical: 0,
    backgroundColor: colors.white,
  },
  posting: {
    gap: 16,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  postingLabel: {
    ...textStyles.body1,
    color: colors.neutral900,
  },
  postingText: {
    gap: 4,
  },
  postingTitle: {
    ...textStyles.label1,
    color: colors.neutral900,
  },
  postingDeadline: {
    ...textStyles.caption3,
    color: colors.neutral600,
  },
  band: {
    height: 16,
    marginTop: 16,
    backgroundColor: colors.secondary0,
  },
  profile: {
    gap: 24,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  profileTitle: {
    ...textStyles.h3,
    color: colors.neutral900,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 24,
  },
  profileText: {
    flex: 1,
    minWidth: 0,
    gap: 16,
  },
  nickname: {
    color: colors.neutral900,
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 20,
  },
  profileMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  profileMeta: {
    ...textStyles.caption1,
    flexShrink: 1,
    color: colors.neutral700,
  },
  chatButton: {
    flexShrink: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 4,
  },
  chatText: {
    ...textStyles.caption3,
  },
  tabBar: {
    height: TAB_BAR_HEIGHT,
    flexDirection: "row",
    borderBottomWidth: 2,
    borderBottomColor: colors.neutral400,
    backgroundColor: colors.white,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: -2,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabSelected: {
    borderBottomColor: colors.secondary500,
  },
  tabTextOn: {
    ...textStyles.body6,
    color: colors.secondary500,
  },
  tabTextOff: {
    ...textStyles.body1,
    color: colors.neutral400,
  },
  sections: {
    gap: 24,
    paddingTop: 24,
  },
  introSection: {
    gap: 12,
    paddingHorizontal: 24,
  },
  section: {
    gap: 16,
    paddingHorizontal: 24,
  },
  sectionDivider: {
    height: 2,
    marginHorizontal: 24,
    backgroundColor: colors.neutral300,
  },
  sectionTitle: {
    ...textStyles.label1,
    color: colors.neutral900,
  },
  quote: {
    ...textStyles.body1,
    color: colors.secondary500,
  },
  body: {
    ...textStyles.caption2,
    color: colors.neutral800,
  },
  infoGroup: {
    gap: 8,
  },
  infoLabel: {
    ...textStyles.body1,
    color: colors.neutral800,
  },
  infoValues: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  infoChip: {
    height: 26,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.neutral400,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  infoChipText: {
    ...textStyles.caption3,
    color: colors.neutral600,
  },
  career: {
    gap: 8,
  },
  careerPeriodRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  careerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.secondary500,
  },
  careerPeriod: {
    ...textStyles.body4,
    color: colors.neutral500,
  },
  careerText: {
    gap: 4,
    paddingLeft: 14,
  },
  careerTitle: {
    ...textStyles.body6,
    color: colors.neutral800,
  },
  careerDescription: {
    ...textStyles.caption2,
    color: colors.neutral700,
  },
  emptyText: {
    ...textStyles.caption2,
    color: colors.neutral500,
  },
  portfolio: {
    gap: 16,
  },
  thumbnail: {
    width: "100%",
    maxWidth: 330,
    aspectRatio: 16 / 9,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderRadius: 8,
    backgroundColor: colors.neutral500,
  },
  thumbnailImage: {
    width: "100%",
    height: "100%",
  },
  playButton: {
    position: "absolute",
  },
  portfolioText: {
    gap: 4,
  },
  portfolioTitle: {
    ...textStyles.body1,
    color: colors.neutral800,
  },
  portfolioUrl: {
    ...textStyles.caption2,
    color: colors.neutral500,
  },
  decision: {
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 32,
    paddingTop: 36,
    paddingBottom: 36,
  },
  decidedText: {
    ...textStyles.caption2,
    color: colors.neutral500,
  },
  decisionActions: {
    alignSelf: "stretch",
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
  },
  decisionButton: {
    flex: 1,
    maxWidth: 157,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  rejectButton: {
    borderWidth: 1,
    borderColor: colors.secondary500,
  },
  rejectButtonDecided: {
    borderColor: colors.neutral400,
  },
  rejectText: {
    ...textStyles.body1,
    color: colors.secondary500,
  },
  rejectTextDecided: {
    color: colors.neutral400,
  },
  acceptButton: {
    backgroundColor: colors.secondary500,
  },
  acceptButtonDecided: {
    backgroundColor: colors.neutral300,
  },
  acceptText: {
    ...textStyles.body1,
    color: colors.white,
  },
  acceptTextDecided: {
    color: colors.neutral500,
  },
});

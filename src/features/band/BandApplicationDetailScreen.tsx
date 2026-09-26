import {
  router,
  useLocalSearchParams,
} from "expo-router";
import {
  Alert,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useApplicationSubmissionDetailQuery } from "@/hooks/api/session/useSessionApplication";
import { useCreateChatRoomMutation } from "@/hooks/api/session/useSessionChat";
import { useAcceptApplicationSubmissionMutation } from "@/hooks/api/user/useReceivedApplications";
import { AppHeader } from "@/shared/components/AppHeader";
import { AppState } from "@/shared/components/AppState";
import { Avatar } from "@/shared/components/Avatar";
import { Screen } from "@/shared/components/Screen";
import { colors } from "@/shared/constants/theme";
import type { ApplicantStatus } from "@/types/user/receivedApplications";

const parseRouteId = (value?: string | string[]) => {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const parsed = Number(rawValue);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

const formatDeadline = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");

  return `${year}.${month}.${day}. ${hour}:${minute}`;
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

  const openChat = async () => {
    if (applySubmissionId <= 0 || createChatMutation.isPending) {
      return;
    }

    try {
      const room = await createChatMutation.mutateAsync({
        contextType: "RECRUITMENT",
        applicationSubmissionId: applySubmissionId,
      });

      router.push(
        `/band/session/messages/${room.chatRoomId}` as Parameters<
          typeof router.push
        >[0],
      );
    } catch {
      Alert.alert(
        "쪽지",
        "채팅방을 만들지 못했어요. 잠시 후 다시 시도해 주세요.",
      );
    }
  };

  const decide = (isApproved: boolean) => {
    Alert.alert(
      isApproved ? "지원 수락" : "지원 거절",
      isApproved ? "이 지원자를 수락할까요?" : "이 지원자를 거절할까요?",
      [
        {
          text: "취소",
          style: "cancel",
        },
        {
          text: isApproved ? "수락" : "거절",
          style: isApproved ? "default" : "destructive",
          onPress: () => {
            void (async () => {
              try {
                await acceptMutation.mutateAsync({
                  applySubmissionId,
                  isApproved,
                });

                router.back();
              } catch {
                Alert.alert(
                  isApproved ? "지원 수락" : "지원 거절",
                  isApproved
                    ? "지원 수락에 실패했어요."
                    : "지원 거절에 실패했어요.",
                );
              }
            })();
          },
        },
      ],
    );
  };

  return (
    <Screen contentStyle={styles.container}>
      <AppHeader title="지원서 상세" />

      {query.isLoading ? (
        <AppState loading title="지원서 정보를 불러오는 중이에요" />
      ) : query.isError || !detail ? (
        <AppState
          title="지원서 정보를 불러오지 못했어요"
          description="삭제되었거나 네트워크 연결이 불안정할 수 있어요."
          actionLabel="다시 시도"
          onAction={() => void query.refetch()}
        />
      ) : (
        <>
          <View style={styles.recruitmentSummary}>
            <Text style={styles.eyebrow}>지원 공고</Text>
            <Text style={styles.recruitmentTitle}>
              {detail.recruitmentTitle} · {detail.bandName}
            </Text>
            <Text style={styles.meta}>
              모집 마감 {formatDeadline(detail.deadlineAt)}
            </Text>
          </View>

          <View style={styles.profileSummary}>
            <Avatar
              imageUrl={detail.profileImageUrl}
              label={detail.nickname}
              size={72}
            />
            <View style={styles.profileText}>
              <Text style={styles.profileTitle}>
                {detail.part} 세션 지원합니다
              </Text>
              <Text style={styles.nickname}>{detail.nickname}</Text>
              <Text style={styles.meta}>
                {[detail.part, detail.skillLevel, detail.region]
                  .filter(Boolean)
                  .join(" · ")}
              </Text>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            disabled={createChatMutation.isPending}
            style={styles.messageButton}
            onPress={() => void openChat()}
          >
            <Text style={styles.messageButtonText}>
              {createChatMutation.isPending
                ? "쪽지방 생성 중"
                : "지원자에게 쪽지 보내기"}
            </Text>
          </Pressable>

          <DetailSection title="세션 소개">
            <Text style={styles.quote}>“{detail.oneLineIntro}”</Text>
            <Text style={styles.body}>{detail.intro}</Text>
          </DetailSection>

          <DetailSection title="세션 정보">
            <InfoGroup label="파트" values={[detail.part]} />
            <InfoGroup label="실력대" values={[detail.skillLevel]} />
            <InfoGroup label="선호 장르" values={splitGenres(detail.genre)} />
            <InfoGroup label="활동 지역" values={[detail.region]} />
            <InfoGroup label="가능한 활동" values={detail.availableActivities} />
          </DetailSection>

          <DetailSection title="경력">
            {detail.careers.length > 0 ? (
              <View style={styles.timeline}>
                {detail.careers.map((career) => (
                  <View
                    key={career.sessionApplicationCareerId}
                    style={styles.career}
                  >
                    <View style={styles.timelineDot} />
                    <Text style={styles.careerPeriod}>{career.period}</Text>
                    <Text style={styles.careerTitle}>{career.name}</Text>
                    {career.description ? (
                      <Text style={styles.body}>{career.description}</Text>
                    ) : null}
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.emptyText}>등록된 경력이 없어요</Text>
            )}
          </DetailSection>

          <DetailSection title="포트폴리오">
            {detail.portfolioLinks.length > 0 ? (
              <View style={styles.portfolioList}>
                {detail.portfolioLinks.map((link, index) => (
                  <Pressable
                    key={link.sessionApplicationLinkId}
                    accessibilityRole="link"
                    style={styles.portfolioCard}
                    onPress={() => void Linking.openURL(link.url)}
                  >
                    <View style={styles.playCircle}>
                      <Text style={styles.playText}>▶</Text>
                    </View>
                    <Text numberOfLines={1} style={styles.portfolioTitle}>
                      {link.title?.trim() || `포트폴리오 ${index + 1}`}
                    </Text>
                    <Text numberOfLines={1} style={styles.portfolioUrl}>
                      {link.url}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : (
              <Text style={styles.emptyText}>등록된 포트폴리오가 없어요</Text>
            )}
          </DetailSection>

          {isAlreadyDecided ? (
            <Text style={styles.decidedText}>
              이미 처리되었거나 취소된 지원이에요.
            </Text>
          ) : null}

          <View style={styles.decisionActions}>
            <Pressable
              accessibilityRole="button"
              disabled={isAlreadyDecided || acceptMutation.isPending}
              style={[styles.rejectButton, isAlreadyDecided && styles.disabledButton]}
              onPress={() => decide(false)}
            >
              <Text style={styles.rejectButtonText}>거절</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              disabled={isAlreadyDecided || acceptMutation.isPending}
              style={[styles.acceptButton, isAlreadyDecided && styles.disabledButton]}
              onPress={() => decide(true)}
            >
              <Text style={styles.acceptButtonText}>수락</Text>
            </Pressable>
          </View>

          <Pressable
            accessibilityRole="button"
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>지원자 목록으로</Text>
          </Pressable>
        </>
      )}
    </Screen>
  );
}

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function InfoGroup({
  label,
  values,
}: {
  label: string;
  values: string[];
}) {
  const filteredValues = values.filter(Boolean);

  return (
    <View style={styles.infoGroup}>
      <Text style={styles.infoLabel}>{label}</Text>
      <View style={styles.badges}>
        {filteredValues.length > 0 ? (
          filteredValues.map((value) => (
            <Text key={value} style={styles.infoPill}>
              {value}
            </Text>
          ))
        ) : (
          <Text style={styles.emptyText}>미입력</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 0,
    paddingBottom: 32,
    backgroundColor: colors.white,
  },
  recruitmentSummary: {
    gap: 4,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  eyebrow: {
    color: colors.neutral600,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 18,
  },
  recruitmentTitle: {
    color: colors.neutral900,
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 24,
  },
  meta: {
    color: colors.neutral600,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 18,
  },
  profileSummary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 24,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.neutral300,
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  profileText: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  profileTitle: {
    color: colors.neutral900,
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 24,
  },
  nickname: {
    color: colors.neutral800,
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 20,
  },
  messageButton: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.secondary500,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 24,
    marginTop: 16,
  },
  messageButtonText: {
    color: colors.secondary500,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
  },
  section: {
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral300,
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  sectionTitle: {
    color: colors.neutral900,
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 22,
    marginBottom: 16,
  },
  quote: {
    color: colors.secondary500,
    fontSize: 15,
    fontWeight: "500",
    lineHeight: 20,
  },
  body: {
    color: colors.neutral800,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 18,
    marginTop: 8,
  },
  infoGroup: {
    marginBottom: 20,
  },
  infoLabel: {
    color: colors.neutral800,
    fontSize: 15,
    fontWeight: "500",
    lineHeight: 20,
  },
  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  infoPill: {
    minHeight: 26,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.neutral400,
    color: colors.neutral600,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 24,
    paddingHorizontal: 15,
  },
  emptyText: {
    color: colors.neutral500,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 18,
  },
  timeline: {
    gap: 20,
  },
  career: {
    position: "relative",
    paddingLeft: 28,
  },
  timelineDot: {
    position: "absolute",
    top: 4,
    left: 4,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.secondary400,
  },
  careerPeriod: {
    color: colors.neutral500,
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 18,
  },
  careerTitle: {
    color: colors.neutral800,
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 20,
    marginTop: 4,
  },
  portfolioList: {
    gap: 24,
  },
  portfolioCard: {
    gap: 8,
  },
  playCircle: {
    height: 172,
    borderRadius: 6,
    backgroundColor: colors.neutral500,
    alignItems: "center",
    justifyContent: "center",
  },
  playText: {
    color: colors.white,
    fontSize: 20,
    fontWeight: "700",
  },
  portfolioTitle: {
    color: colors.neutral800,
    fontSize: 15,
    fontWeight: "500",
    lineHeight: 20,
    marginTop: 8,
  },
  portfolioUrl: {
    color: colors.neutral500,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 18,
  },
  decidedText: {
    color: colors.neutral600,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
    marginTop: 18,
    textAlign: "center",
  },
  decisionActions: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 24,
    paddingTop: 18,
  },
  rejectButton: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.secondary500,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
  },
  rejectButtonText: {
    color: colors.secondary500,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
  },
  acceptButton: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.secondary500,
  },
  acceptButtonText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
  },
  disabledButton: {
    opacity: 0.45,
  },
  backButton: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.neutral400,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 24,
    marginTop: 10,
  },
  backButtonText: {
    color: colors.neutral600,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
  },
});

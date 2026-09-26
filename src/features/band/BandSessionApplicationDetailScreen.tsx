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

import { useSessionApplicationDetailQuery } from "@/hooks/api/session/useSessionApplication";
import { useCreateChatRoomMutation } from "@/hooks/api/session/useSessionChat";
import { AppHeader } from "@/shared/components/AppHeader";
import { AppState } from "@/shared/components/AppState";
import { Avatar } from "@/shared/components/Avatar";
import { Screen } from "@/shared/components/Screen";
import { colors } from "@/shared/constants/theme";

const parseRouteId = (value?: string | string[]) => {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number(raw);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

export function BandSessionApplicationDetailScreen() {
  const params = useLocalSearchParams<{
    applicationId?: string;
  }>();

  const applicationId = parseRouteId(params.applicationId);
  const query = useSessionApplicationDetailQuery(applicationId);
  const chatMutation = useCreateChatRoomMutation();
  const detail = query.data;

  const openChat = async () => {
    if (!detail || chatMutation.isPending) {
      return;
    }

    try {
      const room = await chatMutation.mutateAsync({
        contextType: "SESSION_SEARCH",
        sessionApplicationId: detail.sessionApplicationId,
      });

      router.push(
        `/band/session/messages/${room.chatRoomId}` as Parameters<
          typeof router.push
        >[0],
      );
    } catch {
      Alert.alert("쪽지", "쪽지방을 만들지 못했어요.");
    }
  };

  return (
    <Screen contentStyle={styles.container}>
      <AppHeader title="세션 프로필" />

      {query.isLoading ? (
        <AppState loading title="세션 프로필을 불러오는 중이에요" />
      ) : query.isError || !detail ? (
        <AppState
          title="세션 프로필을 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요."
          actionLabel="다시 시도"
          onAction={() => void query.refetch()}
        />
      ) : (
        <>
          <View style={styles.summary}>
            <Text style={styles.applicationTitle}>
              <Text style={styles.applicationTitleAccent}>
                [{detail.title}]
              </Text>
            </Text>

            <View style={styles.profileRow}>
              <Avatar
                imageUrl={detail.profileImageUrl}
                label={detail.nickname}
                size={72}
              />

              <View style={styles.profileText}>
                <Text numberOfLines={1} style={styles.nickname}>
                  {detail.nickname}
                </Text>
                <Text numberOfLines={1} style={styles.profileDescription}>
                  {[detail.part, detail.skillLevel, detail.region]
                    .filter(Boolean)
                    .join(" · ") || "기본 정보 없음"}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.tabs}>
            {["소개", "정보", "경력", "포트폴리오"].map((tab, index) => (
              <View
                key={tab}
                style={[
                  styles.tabItem,
                  index === 0 && styles.tabItemActive,
                ]}
              >
                <Text
                  style={[
                    styles.tabText,
                    index === 0 && styles.tabTextActive,
                  ]}
                >
                  {tab}
                </Text>
              </View>
            ))}
          </View>

          <DetailSection title="세션 소개">
            <Text style={styles.quote}>
              “{detail.oneLineIntro || "등록된 한줄 소개가 없어요"}”
            </Text>
            <Text style={styles.bodyText}>
              {detail.intro || "등록된 소개글이 없어요"}
            </Text>
          </DetailSection>

          <DetailSection title="세션 정보">
            <InfoPills label="파트" values={[detail.part]} />
            <InfoPills label="실력대" values={[detail.skillLevel]} />
            <InfoPills label="선호 장르" values={[detail.genre]} />
            <InfoPills label="활동 지역" values={[detail.region]} />
            <InfoPills
              label="가능한 활동"
              values={detail.availableActivities}
            />
          </DetailSection>

          <DetailSection title="경력">
            {detail.careers.length === 0 ? (
              <Text style={styles.emptyText}>등록된 경력이 없어요</Text>
            ) : (
              <View style={styles.timeline}>
                {detail.careers.map((career) => (
                  <View
                    key={career.sessionApplicationCareerId}
                    style={styles.careerItem}
                  >
                    <View style={styles.timelineDot} />
                    <Text style={styles.careerPeriod}>{career.period}</Text>
                    <Text style={styles.careerTitle}>{career.name}</Text>
                    {career.description ? (
                      <Text style={styles.bodyText}>{career.description}</Text>
                    ) : null}
                  </View>
                ))}
              </View>
            )}
          </DetailSection>

          <DetailSection title="포트폴리오">
            {detail.portfolioLinks.length === 0 ? (
              <Text style={styles.emptyText}>등록된 포트폴리오가 없어요</Text>
            ) : (
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
            )}
          </DetailSection>

          <Pressable
            accessibilityRole="button"
            disabled={chatMutation.isPending}
            style={styles.messageButton}
            onPress={() => void openChat()}
          >
            <Text style={styles.messageButtonText}>
              {chatMutation.isPending
                ? "쪽지방 생성 중"
                : `${detail.nickname}님에게 쪽지 보내기`}
            </Text>
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

function InfoPills({
  label,
  values,
}: {
  label: string;
  values: string[];
}) {
  const visibleValues = values.filter((value) => value.trim().length > 0);

  return (
    <View style={styles.infoBlock}>
      <Text style={styles.infoLabel}>{label}</Text>
      <View style={styles.infoPills}>
        {visibleValues.length > 0 ? (
          visibleValues.map((value, index) => (
            <Text key={`${label}-${value}-${index}`} style={styles.infoPill}>
              {value}
            </Text>
          ))
        ) : (
          <Text style={styles.emptyText}>등록된 정보가 없어요</Text>
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
  summary: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  applicationTitle: {
    color: colors.neutral900,
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 22,
  },
  applicationTitleAccent: {
    color: colors.secondary500,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 24,
    marginTop: 28,
  },
  profileText: {
    flex: 1,
    minWidth: 0,
  },
  nickname: {
    color: colors.neutral900,
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 22,
  },
  profileDescription: {
    color: colors.neutral600,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 18,
    marginTop: 8,
  },
  tabs: {
    height: 48,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.neutral300,
    flexDirection: "row",
    backgroundColor: colors.white,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  tabItemActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.secondary500,
  },
  tabText: {
    color: colors.neutral400,
    fontSize: 15,
    fontWeight: "500",
    lineHeight: 20,
  },
  tabTextActive: {
    color: colors.secondary500,
    fontWeight: "700",
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
  bodyText: {
    color: colors.neutral800,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 18,
    marginTop: 8,
  },
  infoBlock: {
    marginBottom: 20,
  },
  infoLabel: {
    color: colors.neutral800,
    fontSize: 15,
    fontWeight: "500",
    lineHeight: 20,
  },
  infoPills: {
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
  careerItem: {
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
  messageButton: {
    height: 52,
    borderRadius: 12,
    backgroundColor: colors.secondary500,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 24,
    marginTop: 24,
  },
  messageButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 20,
  },
});

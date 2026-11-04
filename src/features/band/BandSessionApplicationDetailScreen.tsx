import { router, useLocalSearchParams } from "expo-router";
import { useRef, useState, type ComponentRef, type ReactNode } from "react";
import {
  Alert,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  useMySessionApplicationDetailQuery,
  useSessionApplicationDetailQuery,
} from "@/hooks/api/session/useSessionApplication";
import { useCreateChatRoomMutation } from "@/hooks/api/session/useSessionChat";
import { AppIcon } from "@/shared/components/AppIcon";
import { ProfileImage } from "@/shared/components/ProfileImage";
import { Screen } from "@/shared/components/Screen";
import { colors, textStyles } from "@/shared/constants/theme";
import { getApiErrorMessage } from "@/shared/utils/getApiErrorMessage";

const DETAIL_TABS = [
  { id: "introduction", label: "소개" },
  { id: "information", label: "정보" },
  { id: "career", label: "경력" },
  { id: "portfolio", label: "포트폴리오" },
] as const;

type SectionId = (typeof DETAIL_TABS)[number]["id"];

const parseRouteId = (value?: string | string[]) => {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number(raw);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

export function BandSessionApplicationDetailScreen() {
  const params = useLocalSearchParams<{
    applicationId?: string;
    own?: string;
  }>();
  const applicationId = parseRouteId(params.applicationId);
  const isOwnApplication = params.own === "1";
  const publicQuery = useSessionApplicationDetailQuery(
    isOwnApplication ? 0 : applicationId,
  );
  const myQuery = useMySessionApplicationDetailQuery(
    isOwnApplication ? applicationId : 0,
  );
  const query = isOwnApplication ? myQuery : publicQuery;
  const detail = isOwnApplication
    ? myQuery.data
      ? { ...myQuery.data, nickname: myQuery.data.name || "닉네임 없음" }
      : undefined
    : publicQuery.data;
  const chatMutation = useCreateChatRoomMutation();
  const [activeSection, setActiveSection] = useState<SectionId>("introduction");
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const contentTopRef = useRef(0);
  const sectionTopsRef = useRef<Partial<Record<SectionId, number>>>({});

  const moveToSection = (sectionId: SectionId) => {
    setActiveSection(sectionId);
    scrollRef.current?.scrollTo({
      y:
        contentTopRef.current +
        (sectionTopsRef.current[sectionId] ?? 0) -
        47,
      animated: true,
    });
  };

  const saveSectionTop = (sectionId: SectionId, y: number) => {
    sectionTopsRef.current[sectionId] = y;
  };

  const openChat = async () => {
    if (!detail || isOwnApplication || chatMutation.isPending) return;

    try {
      const room = await chatMutation.mutateAsync({
        contextType: "SESSION_SEARCH",
        sessionApplicationId: applicationId,
      });

      router.push(
        `/band/session/messages/${room.chatRoomId}` as Parameters<
          typeof router.push
        >[0],
      );
    } catch (error) {
      Alert.alert(
        "쪽지",
        getApiErrorMessage(
          error,
          "쪽지방 생성에 실패했어요. 잠시 후 다시 시도해주세요.",
        ),
      );
    }
  };

  return (
    <Screen scroll={false} contentStyle={styles.container}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="뒤로가기"
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <AppIcon name="arrowLeft" size={24} />
        </Pressable>
      </View>

      {query.isLoading ? (
        <View style={styles.state}>
          <Text style={styles.stateText}>지원서 정보를 불러오고 있어요</Text>
        </View>
      ) : query.isError || !detail ? (
        <View style={styles.state}>
          <Text style={styles.stateText}>지원서 정보를 불러오지 못했어요</Text>
          <Pressable
            accessibilityRole="button"
            style={styles.retryButton}
            onPress={() => void query.refetch()}
          >
            <Text style={styles.retryText}>다시 시도</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <ScrollView
            ref={scrollRef}
            style={styles.scroll}
            stickyHeaderIndices={[1]}
          >
            <View style={styles.summary}>
              <Text style={styles.title}>{detail.title}</Text>

              <View style={styles.profileRow}>
                <ProfileImage
                  imageUrl={detail.profileImageUrl}
                  size={96}
                  variant="user"
                />

                <View style={styles.profileText}>
                  <Text numberOfLines={1} style={styles.nickname}>
                    {detail.nickname}
                  </Text>
                  <Text numberOfLines={1} style={styles.profileDescription}>
                    {detail.part} · {detail.skillLevel} · {detail.region}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.tabs}>
              {DETAIL_TABS.map((tab) => {
                const isActive = activeSection === tab.id;

                return (
                  <Pressable
                    key={tab.id}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: isActive }}
                    style={styles.tabItem}
                    onPress={() => moveToSection(tab.id)}
                  >
                    <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                      {tab.label}
                    </Text>
                    {isActive ? <View style={styles.tabIndicator} /> : null}
                  </Pressable>
                );
              })}
            </View>

            <View
              style={styles.content}
              onLayout={(event) => {
                contentTopRef.current = event.nativeEvent.layout.y;
              }}
            >
              <DetailSection
                title="세션 소개"
                onLayoutY={(y) => saveSectionTop("introduction", y)}
              >
                <Text style={styles.quote}>
                  “{detail.oneLineIntro || "등록된 한줄 소개가 없어요"}”
                </Text>
                <Text style={styles.bodyText}>
                  {detail.intro || "자기소개가 없습니다."}
                </Text>
              </DetailSection>

              <DetailSection
                title="세션 정보"
                onLayoutY={(y) => saveSectionTop("information", y)}
              >
                <View style={styles.infoList}>
                  <InfoChips label="파트" values={[detail.part]} />
                  <InfoChips label="실력대" values={[detail.skillLevel]} />
                  <InfoChips
                    label="선호 장르"
                    values={detail.genre.split(/[,/·]/).map((value) => value.trim())}
                  />
                  <InfoChips label="활동 지역" values={[detail.region]} />
                  <InfoChips
                    label="가능한 활동"
                    values={detail.availableActivities}
                    emptyText="등록된 가능 활동이 없어요"
                  />
                </View>
              </DetailSection>

              <DetailSection
                title="경력"
                onLayoutY={(y) => saveSectionTop("career", y)}
              >
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
                          <Text style={styles.careerDescription}>
                            {career.description}
                          </Text>
                        ) : null}
                      </View>
                    ))}
                  </View>
                )}
              </DetailSection>

              <DetailSection
                last
                title="포트폴리오"
                onLayoutY={(y) => saveSectionTop("portfolio", y)}
              >
                {detail.portfolioLinks.length === 0 ? (
                  <Text style={styles.emptyText}>등록된 포트폴리오가 없어요</Text>
                ) : (
                  <View style={styles.portfolioList}>
                    {detail.portfolioLinks.map((link, index) => (
                      <Pressable
                        key={link.sessionApplicationLinkId}
                        accessibilityRole="link"
                        onPress={() => void Linking.openURL(link.url)}
                      >
                        <View style={styles.thumbnail}>
                          {link.thumbnailUrl ? (
                            <Image
                              source={{ uri: link.thumbnailUrl }}
                              resizeMode="cover"
                              style={StyleSheet.absoluteFill}
                            />
                          ) : null}
                          <AppIcon name="playButton" size={24} />
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
            </View>
          </ScrollView>

          {!isOwnApplication ? (
            <View style={styles.footer}>
              <Pressable
                accessibilityRole="button"
                disabled={chatMutation.isPending}
                style={[
                  styles.messageButton,
                  chatMutation.isPending && styles.messageButtonDisabled,
                ]}
                onPress={() => void openChat()}
              >
                <Text style={styles.messageButtonText}>
                  {chatMutation.isPending ? "쪽지방 여는 중" : "쪽지 보내기"}
                </Text>
              </Pressable>
            </View>
          ) : null}
        </>
      )}
    </Screen>
  );
}

function DetailSection({
  title,
  last = false,
  onLayoutY,
  children,
}: {
  title: string;
  last?: boolean;
  onLayoutY: (y: number) => void;
  children: ReactNode;
}) {
  return (
    <View
      style={[styles.section, last && styles.sectionLast]}
      onLayout={(event) => onLayoutY(event.nativeEvent.layout.y)}
    >
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function InfoChips({
  label,
  values,
  emptyText = "등록된 정보가 없어요",
}: {
  label: string;
  values: string[];
  emptyText?: string;
}) {
  const visibleValues = values.filter((value) => value.trim().length > 0);

  return (
    <View>
      <Text style={styles.infoLabel}>{label}</Text>
      <View style={styles.infoChips}>
        {visibleValues.length > 0 ? (
          visibleValues.map((value, index) => (
            <View key={`${label}-${value}-${index}`} style={styles.infoChip}>
              <Text style={styles.infoChipText}>{value}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>{emptyText}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    backgroundColor: colors.white,
  },
  header: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    paddingHorizontal: 15,
    paddingVertical: 5,
  },
  backButton: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    flex: 1,
  },
  state: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  stateText: {
    ...textStyles.caption1,
    color: colors.neutral500,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 12,
    borderRadius: 8,
    backgroundColor: colors.secondary500,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  retryText: {
    ...textStyles.caption2,
    color: colors.white,
  },
  summary: {
    paddingHorizontal: 24,
    paddingTop: 25,
    paddingBottom: 30,
  },
  title: {
    ...textStyles.h3,
    color: colors.neutral900,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 32,
    marginTop: 30,
  },
  profileText: {
    flex: 1,
    minWidth: 0,
  },
  nickname: {
    ...textStyles.label1,
    color: colors.neutral900,
  },
  profileDescription: {
    ...textStyles.caption3,
    marginTop: 8,
    color: colors.neutral600,
  },
  tabs: {
    height: 48,
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral400,
    backgroundColor: colors.white,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  tabText: {
    ...textStyles.body1,
    color: colors.neutral400,
  },
  tabTextActive: {
    color: colors.secondary500,
  },
  tabIndicator: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: -1,
    height: 2,
    backgroundColor: colors.secondary500,
  },
  content: {
    paddingHorizontal: 24,
  },
  section: {
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral300,
    paddingVertical: 28,
  },
  sectionLast: {
    borderBottomWidth: 0,
  },
  sectionTitle: {
    ...textStyles.label1,
    color: colors.neutral900,
  },
  sectionBody: {
    marginTop: 20,
  },
  quote: {
    ...textStyles.body1,
    color: colors.secondary500,
  },
  bodyText: {
    ...textStyles.caption2,
    marginTop: 12,
    color: colors.neutral800,
  },
  infoList: {
    gap: 20,
  },
  infoLabel: {
    ...textStyles.body1,
    color: colors.neutral800,
  },
  infoChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  infoChip: {
    height: 26,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.neutral400,
    borderRadius: 8,
    backgroundColor: colors.white,
    paddingHorizontal: 15,
  },
  infoChipText: {
    ...textStyles.caption3,
    color: colors.neutral600,
  },
  emptyText: {
    ...textStyles.caption2,
    color: colors.neutral500,
  },
  timeline: {
    gap: 20,
  },
  careerItem: {
    paddingLeft: 28,
  },
  timelineDot: {
    position: "absolute",
    top: 2,
    left: 4,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.secondary400,
  },
  careerPeriod: {
    ...textStyles.body4,
    color: colors.neutral500,
  },
  careerTitle: {
    ...textStyles.body6,
    marginTop: 4,
    color: colors.neutral800,
  },
  careerDescription: {
    ...textStyles.caption2,
    marginTop: 4,
    color: colors.neutral700,
  },
  portfolioList: {
    gap: 24,
  },
  thumbnail: {
    height: 172,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderRadius: 8,
    backgroundColor: colors.neutral400,
  },
  portfolioTitle: {
    ...textStyles.body1,
    marginTop: 16,
    color: colors.neutral800,
  },
  portfolioUrl: {
    ...textStyles.caption2,
    marginTop: 4,
    color: colors.neutral500,
  },
  footer: {
    backgroundColor: colors.white,
    paddingHorizontal: 20,
    paddingVertical: 16,
    boxShadow: "0px -5px 20px 0px rgba(0, 0, 0, 0.03)",
  },
  messageButton: {
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: colors.secondary500,
  },
  messageButtonDisabled: {
    backgroundColor: colors.neutral300,
  },
  messageButtonText: {
    ...textStyles.label1,
    color: colors.white,
  },
});

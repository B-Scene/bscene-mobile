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

import {
  useSessionApplicationDetailQuery,
} from "@/hooks/api/session/useSessionApplication";
import {
  useCreateChatRoomMutation,
} from "@/hooks/api/session/useSessionChat";
import { AppButton } from "@/shared/components/AppButton";
import { AppCard } from "@/shared/components/AppCard";
import { AppHeader } from "@/shared/components/AppHeader";
import { AppState } from "@/shared/components/AppState";
import { Avatar } from "@/shared/components/Avatar";
import { Badge } from "@/shared/components/Badge";
import { Screen } from "@/shared/components/Screen";
import {
  colors,
  spacing,
} from "@/shared/constants/theme";

const parseRouteId = (
  value?: string | string[],
) => {
  const raw =
    Array.isArray(value)
      ? value[0]
      : value;

  const parsed =
    Number(raw);

  return Number.isFinite(parsed) &&
    parsed > 0
    ? parsed
    : 0;
};

export function BandSessionApplicationDetailScreen() {
  const params =
    useLocalSearchParams<{
      applicationId?: string;
    }>();

  const applicationId =
    parseRouteId(
      params.applicationId,
    );

  const query =
    useSessionApplicationDetailQuery(
      applicationId,
    );

  const chatMutation =
    useCreateChatRoomMutation();

  const detail =
    query.data;

  const openChat =
    async () => {
      if (
        !detail ||
        chatMutation.isPending
      ) {
        return;
      }

      try {
        const room =
          await chatMutation.mutateAsync(
            {
              contextType:
                "SESSION_SEARCH",

              sessionApplicationId:
                detail.sessionApplicationId,
            },
          );

        router.push(
          `/band/session/messages/${room.chatRoomId}` as Parameters<
            typeof router.push
          >[0],
        );
      } catch {
        Alert.alert(
          "쪽지",
          "쪽지방을 만들지 못했어요.",
        );
      }
    };

  return (
    <Screen
      contentStyle={
        styles.container
      }
    >
      <AppHeader title="세션 프로필" />

      {query.isLoading ? (
        <AppState
          loading
          title="세션 프로필을 불러오는 중이에요"
        />
      ) : query.isError ||
        !detail ? (
        <AppState
          title="세션 프로필을 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요."
          actionLabel="다시 시도"
          onAction={() =>
            void query.refetch()
          }
        />
      ) : (
        <>
          <AppCard
            style={
              styles.profileCard
            }
          >
            <Avatar
              imageUrl={
                detail.profileImageUrl
              }
              label={
                detail.nickname
              }
              size={82}
            />

            <View
              style={
                styles.profileInfo
              }
            >
              <Text
                style={
                  styles.nickname
                }
              >
                {detail.nickname}
              </Text>

              <Text
                style={styles.meta}
              >
                {[
                  detail.part,
                  detail.skillLevel,
                  detail.region,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </Text>
            </View>
          </AppCard>

          <AppCard
            style={styles.section}
          >
            <Text
              style={
                styles.applicationTitle
              }
            >
              {detail.title}
            </Text>

            <Text
              style={
                styles.quote
              }
            >
              “
              {detail.oneLineIntro}
              ”
            </Text>

            <Text
              style={styles.body}
            >
              {detail.intro}
            </Text>
          </AppCard>

          <AppCard
            style={styles.section}
          >
            <Text
              style={
                styles.sectionTitle
              }
            >
              세션 정보
            </Text>

            <Info
              label="파트"
              value={detail.part}
            />

            <Info
              label="실력대"
              value={
                detail.skillLevel
              }
            />

            <Info
              label="장르"
              value={detail.genre}
            />

            <Info
              label="활동 지역"
              value={detail.region}
            />

            <View
              style={styles.badges}
            >
              {detail.availableActivities.map(
                (activity) => (
                  <Badge
                    key={activity}
                    label={activity}
                  />
                ),
              )}
            </View>
          </AppCard>

          <AppCard
            style={styles.section}
          >
            <Text
              style={
                styles.sectionTitle
              }
            >
              경력
            </Text>

            {detail.careers.length ===
            0 ? (
              <Text
                style={styles.meta}
              >
                등록된 경력이
                없어요.
              </Text>
            ) : (
              detail.careers.map(
                (career) => (
                  <View
                    key={
                      career.sessionApplicationCareerId
                    }
                    style={
                      styles.career
                    }
                  >
                    <Text
                      style={
                        styles.careerTitle
                      }
                    >
                      {career.name}
                    </Text>

                    <Text
                      style={
                        styles.meta
                      }
                    >
                      {career.period}
                    </Text>

                    <Text
                      style={
                        styles.body
                      }
                    >
                      {
                        career.description
                      }
                    </Text>
                  </View>
                ),
              )
            )}
          </AppCard>

          <AppCard
            style={styles.section}
          >
            <Text
              style={
                styles.sectionTitle
              }
            >
              포트폴리오
            </Text>

            {detail.portfolioLinks
              .length === 0 ? (
              <Text
                style={styles.meta}
              >
                등록된 링크가
                없어요.
              </Text>
            ) : (
              detail.portfolioLinks.map(
                (link) => (
                  <Pressable
                    key={
                      link.sessionApplicationLinkId
                    }
                    accessibilityRole="link"
                    onPress={() =>
                      void Linking.openURL(
                        link.url,
                      )
                    }
                  >
                    <Text
                      style={
                        styles.link
                      }
                    >
                      {link.title ??
                        link.url}
                    </Text>
                  </Pressable>
                ),
              )
            )}
          </AppCard>

          <AppButton
            label={`${detail.nickname}님에게 쪽지 보내기`}
            loading={
              chatMutation.isPending
            }
            onPress={() =>
              void openChat()
            }
          />
        </>
      )}
    </Screen>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View
      style={styles.infoRow}
    >
      <Text
        style={
          styles.infoLabel
        }
      >
        {label}
      </Text>

      <Text
        style={
          styles.infoValue
        }
      >
        {value}
      </Text>
    </View>
  );
}

const styles =
  StyleSheet.create({
    container: {
      gap: spacing.lg,
    },

    profileCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.lg,
    },

    profileInfo: {
      flex: 1,
      gap: spacing.xs,
    },

    nickname: {
      color:
        colors.neutral900,
      fontSize: 22,
      fontWeight: "900",
    },

    meta: {
      color:
        colors.neutral600,
      fontSize: 12,
      lineHeight: 18,
    },

    section: {
      gap: spacing.md,
    },

    sectionTitle: {
      color:
        colors.neutral900,
      fontSize: 17,
      fontWeight: "900",
    },

    applicationTitle: {
      color:
        colors.neutral900,
      fontSize: 20,
      fontWeight: "900",
    },

    quote: {
      color:
        colors.primary600,
      fontSize: 15,
      fontWeight: "800",
    },

    body: {
      color:
        colors.neutral800,
      fontSize: 14,
      lineHeight: 22,
    },

    infoRow: {
      flexDirection: "row",
      justifyContent:
        "space-between",
      gap: spacing.lg,
    },

    infoLabel: {
      color:
        colors.neutral600,
      fontSize: 13,
      fontWeight: "700",
    },

    infoValue: {
      color:
        colors.neutral900,
      fontSize: 13,
      fontWeight: "800",
    },

    badges: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.xs,
    },

    career: {
      gap: spacing.xs,
      borderTopWidth: 1,
      borderTopColor:
        colors.neutral300,
      paddingTop:
        spacing.md,
    },

    careerTitle: {
      color:
        colors.neutral900,
      fontSize: 15,
      fontWeight: "900",
    },

    link: {
      color:
        colors.primary600,
      fontSize: 13,
      fontWeight: "800",
    },
  });
import {
    router,
} from "expo-router";

import {
    Radio,
} from "lucide-react-native";

import {
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";

import {
    useLiveHomeQuery,
} from "@/hooks/api/live/useLive";

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

import type {
    LiveNowItem,
} from "@/types/live/live";

export function LiveHomeScreen({
  mode,
}: {
  mode: "fan" | "band";
}) {
  const query =
    useLiveHomeQuery();

  const data =
    query.data;

  return (
    <Screen
      contentStyle={
        styles.container
      }
    >
      <AppHeader
        title="라이브"
        showBack={false}
      />

      {mode ===
      "band" ? (
        <AppButton
          label="라이브 시작하기"
          onPress={() =>
            router.push(
              "/band/live/create" as Parameters<
                typeof router.push
              >[0],
            )
          }
        />
      ) : null}

      {query.isLoading ? (
        <AppState
          loading
          title="라이브를 불러오는 중이에요"
        />
      ) : query.isError ||
        !data ? (
        <AppState
          title="라이브를 불러오지 못했어요"
          actionLabel="다시 시도"
          onAction={() =>
            void query.refetch()
          }
        />
      ) : (
        <>
          <View
            style={
              styles.sectionHeader
            }
          >
            <Radio
              size={20}
              color={
                mode ===
                "band"
                  ? colors.secondary600
                  : colors.primary600
              }
            />

            <Text
              style={
                styles.sectionTitle
              }
            >
              지금 라이브
            </Text>
          </View>

          {data.liveNow
            .length === 0 ? (
            <AppCard>
              <Text
                style={
                  styles.empty
                }
              >
                현재 진행 중인
                라이브가 없어요.
              </Text>
            </AppCard>
          ) : (
            data.liveNow.map(
              (live) => (
                <LiveCard
                  key={
                    live.liveId
                  }
                  live={live}
                  mode={mode}
                />
              ),
            )
          )}

          <Text
            style={
              styles.sectionTitle
            }
          >
            예정된 라이브
          </Text>

          {data.scheduled
            .length === 0 ? (
            <Text
              style={
                styles.empty
              }
            >
              예정된 라이브가
              없어요.
            </Text>
          ) : (
            data.scheduled.map(
              (live) => (
                <AppCard
                  key={
                    live.liveId
                  }
                  style={
                    styles.card
                  }
                >
                  <Avatar
                    imageUrl={
                      live.bandProfileImageUrl
                    }
                    label={
                      live.bandName
                    }
                    size={48}
                  />

                  <View
                    style={
                      styles.cardInfo
                    }
                  >
                    <Text
                      style={
                        styles.title
                      }
                    >
                      {live.title}
                    </Text>

                    <Text
                      style={
                        styles.meta
                      }
                    >
                      {
                        live.bandName
                      }
                    </Text>

                    <Text
                      style={
                        styles.meta
                      }
                    >
                      {new Date(
                        live.scheduledAt,
                      ).toLocaleString()}
                    </Text>
                  </View>
                </AppCard>
              ),
            )
          )}
        </>
      )}
    </Screen>
  );
}

function LiveCard({
  live,
  mode,
}: {
  live: LiveNowItem;

  mode:
    | "fan"
    | "band";
}) {
  return (
    <Pressable
      onPress={() =>
        router.push(
          `/${mode}/live/room/${live.liveId}` as Parameters<
            typeof router.push
          >[0],
        )
      }
    >
      <AppCard
        style={
          styles.card
        }
      >
        <Avatar
          imageUrl={
            live.bandProfileImageUrl
          }
          label={
            live.bandName
          }
          size={54}
        />

        <View
          style={
            styles.cardInfo
          }
        >
          <View
            style={
              styles.badges
            }
          >
            <Badge
              label="LIVE"
              tone="pink"
            />

            {live.isMine ? (
              <Badge
                label="내 라이브"
                tone="yellow"
              />
            ) : null}
          </View>

          <Text
            style={styles.title}
          >
            {live.title}
          </Text>

          <Text
            style={styles.meta}
          >
            {live.bandName} ·{" "}
            {live.viewerCount ??
              live.viewCount ??
              0}
            명 시청 중
          </Text>
        </View>
      </AppCard>
    </Pressable>
  );
}

const styles =
  StyleSheet.create({
    container: {
      gap: spacing.lg,
      paddingBottom:
        spacing.xxl,
    },

    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },

    sectionTitle: {
      color:
        colors.neutral900,
      fontSize: 18,
      fontWeight: "900",
    },

    card: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
    },

    cardInfo: {
      flex: 1,
      gap: spacing.xs,
    },

    badges: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.xs,
    },

    title: {
      color:
        colors.neutral900,
      fontSize: 15,
      fontWeight: "900",
    },

    meta: {
      color:
        colors.neutral600,
      fontSize: 12,
      lineHeight: 18,
    },

    empty: {
      color:
        colors.neutral500,
      fontSize: 13,
      lineHeight: 20,
    },
  });
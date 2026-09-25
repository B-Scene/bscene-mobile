import {
    router,
} from "expo-router";

import {
    Alert,
    StyleSheet,
    Text,
    View,
} from "react-native";

import {
    useBandQuery,
} from "@/hooks/api/band/useBand";

import {
    useBandMembersQuery,
    useRemoveBandMember,
} from "@/hooks/api/band/useBandManagement";

import {
    useActiveBandId,
} from "@/hooks/api/user/useMyProfiles";

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

const PART_LABELS:
  Record<string, string> = {
    VOCAL: "보컬",
    GUITAR: "기타",
    BASS: "베이스",
    KEYBOARD: "키보드",
    DRUM: "드럼",
    ETC: "기타",
  };

export function BandMemberManageScreen() {
  const activeBand =
    useActiveBandId();

  const bandId =
    activeBand.activeBandId;

  const bandQuery =
    useBandQuery(
      bandId,
    );

  const membersQuery =
    useBandMembersQuery(
      bandId,
    );

  const removeMutation =
    useRemoveBandMember(
      bandId,
    );

  const members =
    membersQuery.data ?? [];

  const activeMembers =
    members.filter(
      (member) =>
        member.status !==
        "INVITED",
    );

  const invitedMembers =
    members.filter(
      (member) =>
        member.status ===
        "INVITED",
    );

  const myProfileId =
    activeBand.activeBand
      ?.bandMemberProfileId;

  const viewerMember =
    members.find(
      (member) =>
        member.bandMemberProfileId ===
        myProfileId,
    );

  const viewerIsOwner =
    viewerMember?.owner ??
    false;

  const remove = (
    userId: number,
    name: string,
  ) => {
    Alert.alert(
      "멤버 내보내기",
      `${name}님을 밴드에서 내보낼까요?`,
      [
        {
          text: "취소",
          style: "cancel",
        },

        {
          text: "내보내기",
          style:
            "destructive",

          onPress: () => {
            void removeMutation.mutateAsync(
              userId,
            );
          },
        },
      ],
    );
  };

  if (
    activeBand.isLoading ||
    membersQuery.isLoading
  ) {
    return (
      <Screen>
        <AppHeader title="멤버 관리" />

        <AppState
          loading
          title="멤버를 불러오는 중이에요"
        />
      </Screen>
    );
  }

  if (
    !bandId ||
    membersQuery.isError
  ) {
    return (
      <Screen>
        <AppHeader title="멤버 관리" />

        <AppState
          title="멤버를 불러오지 못했어요"
        />
      </Screen>
    );
  }

  return (
    <Screen
      contentStyle={
        styles.container
      }
    >
      <AppHeader title="멤버 관리" />

      <AppCard
        style={
          styles.bandCard
        }
      >
        <Avatar
          imageUrl={
            bandQuery.data
              ?.profileImageUrl
          }
          label={
            bandQuery.data
              ?.name ??
            "밴드"
          }
          size={58}
        />

        <View
          style={
            styles.bandInfo
          }
        >
          <Text
            style={
              styles.bandName
            }
          >
            {bandQuery.data
              ?.name ??
              "밴드"}
          </Text>

          <Text
            style={
              styles.meta
            }
          >
            멤버{" "}
            {
              activeMembers.length
            }
            명
          </Text>
        </View>

        {viewerIsOwner ? (
          <AppButton
            label="멤버 초대"
            variant="secondary"
            style={
              styles.inviteButton
            }
            onPress={() =>
              router.push(
                "/band/my/members/invite" as Parameters<
                  typeof router.push
                >[0],
              )
            }
          />
        ) : null}
      </AppCard>

      <Text
        style={
          styles.sectionTitle
        }
      >
        현재 멤버
      </Text>

      {activeMembers.map(
        (member) => {
          const name =
            member.profileNickname ??
            "닉네임 없음";

          return (
            <AppCard
              key={member.id}
              style={
                styles.memberCard
              }
            >
              <Avatar
                label={name}
                size={44}
              />

              <View
                style={
                  styles.memberInfo
                }
              >
                <Text
                  style={
                    styles.memberName
                  }
                >
                  {name}
                </Text>

                <Text
                  style={
                    styles.meta
                  }
                >
                  {member.memberType ===
                  "SESSION"
                    ? "세션"
                    : "멤버"}
                  {member.part
                    ? ` · ${
                        PART_LABELS[
                          member.part
                        ] ??
                        member.part
                      }`
                    : ""}
                </Text>
              </View>

              {member.owner ? (
                <Badge
                  label="운영자"
                  tone="yellow"
                />
              ) : viewerIsOwner ? (
                <AppButton
                  label="내보내기"
                  variant="ghost"
                  style={
                    styles.removeButton
                  }
                  onPress={() =>
                    remove(
                      member.userId,
                      name,
                    )
                  }
                />
              ) : null}
            </AppCard>
          );
        },
      )}

      {invitedMembers.length >
      0 ? (
        <>
          <Text
            style={
              styles.sectionTitle
            }
          >
            초대 대기
          </Text>

          {invitedMembers.map(
            (member) => {
              const name =
                member.profileNickname ??
                "초대 사용자";

              return (
                <AppCard
                  key={
                    member.id
                  }
                  style={
                    styles.memberCard
                  }
                >
                  <Avatar
                    label={
                      name
                    }
                    size={44}
                  />

                  <View
                    style={
                      styles.memberInfo
                    }
                  >
                    <Text
                      style={
                        styles.memberName
                      }
                    >
                      {name}
                    </Text>

                    <Text
                      style={
                        styles.meta
                      }
                    >
                      초대 발송됨
                    </Text>
                  </View>

                  {viewerIsOwner ? (
                    <AppButton
                      label="취소"
                      variant="ghost"
                      style={
                        styles.removeButton
                      }
                      onPress={() =>
                        void removeMutation.mutateAsync(
                          member.userId,
                        )
                      }
                    />
                  ) : null}
                </AppCard>
              );
            },
          )}
        </>
      ) : null}
    </Screen>
  );
}

const styles =
  StyleSheet.create({
    container: {
      gap: spacing.lg,
      paddingBottom:
        spacing.xxl,
    },

    bandCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
    },

    bandInfo: {
      flex: 1,
      gap: spacing.xs,
    },

    bandName: {
      color:
        colors.neutral900,
      fontSize: 17,
      fontWeight: "900",
    },

    meta: {
      color:
        colors.neutral600,
      fontSize: 12,
      lineHeight: 18,
    },

    inviteButton: {
      minHeight: 38,
      paddingHorizontal:
        spacing.md,
    },

    sectionTitle: {
      color:
        colors.neutral900,
      fontSize: 17,
      fontWeight: "900",
    },

    memberCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
    },

    memberInfo: {
      flex: 1,
      gap: spacing.xs,
    },

    memberName: {
      color:
        colors.neutral900,
      fontSize: 14,
      fontWeight: "900",
    },

    removeButton: {
      minHeight: 36,
      paddingHorizontal:
        spacing.sm,
    },
  });
import {
    router,
} from "expo-router";

import {
    Alert,
    Pressable,
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

import { AppHeader } from "@/shared/components/AppHeader";
import { AppState } from "@/shared/components/AppState";
import { Avatar } from "@/shared/components/Avatar";
import { Screen } from "@/shared/components/Screen";

import {
    colors,
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

      <View
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
          <Pressable
            accessibilityRole="button"
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
          >
            <Text style={styles.inviteButtonText}>멤버 초대</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.memberList}>
        <Text style={styles.sectionTitle}>현재 멤버</Text>

        {activeMembers.map(
          (member) => {
            const name =
              member.profileNickname ??
              "닉네임 없음";

            return (
              <View
                key={member.id}
                style={
                  styles.memberCard
                }
              >
                <Avatar
                  label={name}
                  size={40}
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
                    {member.bandMemberProfileId === myProfileId ? " (나)" : ""}
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
                  <Text style={styles.ownerBadge}>운영자</Text>
                ) : viewerIsOwner ? (
                  <Pressable
                    accessibilityRole="button"
                    style={
                      styles.removeButton
                    }
                    onPress={() =>
                      remove(
                        member.userId,
                        name,
                      )
                    }
                  >
                    <Text style={styles.removeButtonText}>내보내기</Text>
                  </Pressable>
                ) : null}
              </View>
            );
          },
        )}
      </View>

      {invitedMembers.length >
      0 ? (
        <>
          <View style={styles.sectionDivider} />

          <View style={styles.memberList}>
            <Text style={styles.sectionTitle}>초대 대기 멤버</Text>

            {invitedMembers.map(
              (member) => {
                const name =
                  member.profileNickname ??
                  "초대 사용자";

                return (
                  <View
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
                      size={40}
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
                      <Pressable
                        accessibilityRole="button"
                        style={
                          styles.removeButton
                        }
                        onPress={() =>
                          void removeMutation.mutateAsync(
                            member.userId,
                          )
                        }
                      >
                        <Text style={styles.cancelButtonText}>취소</Text>
                      </Pressable>
                    ) : null}
                  </View>
                );
              },
            )}
          </View>
        </>
      ) : null}
    </Screen>
  );
}

const styles =
  StyleSheet.create({
    container: {
      gap: 24,
      paddingHorizontal: 24,
      paddingBottom: 32,
      backgroundColor: colors.white,
    },

    bandCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      borderRadius: 12,
      backgroundColor: colors.white,
      padding: 12,
      shadowColor: colors.neutral900,
      shadowOpacity: 0.1,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 0 },
      elevation: 2,
    },

    bandInfo: {
      flex: 1,
      gap: 4,
    },

    bandName: {
      color:
        colors.neutral900,
      fontSize: 15,
      fontWeight: "700",
      lineHeight: 20,
    },

    meta: {
      color:
        colors.neutral600,
      fontSize: 12,
      fontWeight: "500",
      lineHeight: 18,
    },

    inviteButton: {
      minHeight: 28,
      borderRadius: 8,
      backgroundColor: colors.secondary400,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 15,
      paddingVertical: 4,
    },

    inviteButtonText: {
      color: colors.white,
      fontSize: 12,
      fontWeight: "500",
      lineHeight: 18,
    },

    memberList: {
      gap: 14,
    },

    sectionTitle: {
      color:
        colors.neutral700,
      fontSize: 15,
      fontWeight: "500",
      lineHeight: 20,
    },

    memberCard: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      borderRadius: 8,
      backgroundColor: colors.white,
      padding: 12,
      shadowColor: colors.neutral900,
      shadowOpacity: 0.1,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 0 },
      elevation: 2,
    },

    memberInfo: {
      flex: 1,
      minWidth: 0,
      gap: 3,
    },

    memberName: {
      color:
        colors.neutral900,
      fontSize: 12,
      fontWeight: "500",
      lineHeight: 18,
    },

    ownerBadge: {
      borderWidth: 1,
      borderColor: colors.secondary500,
      borderRadius: 999,
      color: colors.secondary500,
      fontSize: 12,
      fontWeight: "500",
      lineHeight: 18,
      paddingHorizontal: 12,
      paddingVertical: 4,
    },

    removeButton: {
      minHeight: 28,
      justifyContent: "center",
      paddingHorizontal: 4,
    },

    removeButtonText: {
      color: colors.neutral500,
      fontSize: 10,
      fontWeight: "500",
      lineHeight: 14,
    },

    cancelButtonText: {
      color: colors.error,
      fontSize: 12,
      fontWeight: "500",
      lineHeight: 18,
    },

    sectionDivider: {
      height: 16,
      backgroundColor: colors.neutral200,
      marginHorizontal: -24,
    },
  });

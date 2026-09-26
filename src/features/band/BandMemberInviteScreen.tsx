import {
    Alert,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

import {
    useState,
} from "react";

import {
    useBandMemberCandidatesQuery,
    useInviteBandMember,
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

const getStatusLabel = (
  status:
    | string
    | null,
  inviteAvailable: boolean,
) => {
  if (
    status ===
    "INVITED"
  ) {
    return "초대 대기";
  }

  if (
    status ===
    "ACCEPTED"
  ) {
    return "멤버";
  }

  if (
    !inviteAvailable
  ) {
    return "초대 불가";
  }

  return null;
};

export function BandMemberInviteScreen() {
  const activeBand =
    useActiveBandId();

  const bandId =
    activeBand.activeBandId;

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    keyword,
    setKeyword,
  ] = useState("");

  const query =
    useBandMemberCandidatesQuery(
      bandId,
      keyword,
    );

  const inviteMutation =
    useInviteBandMember(
      bandId,
    );

  const searchUser =
    () => {
      const trimmed =
        search.trim();

      if (!trimmed) {
        return;
      }

      setKeyword(trimmed);
    };

  const invite = (
    userId: number,
    nickname: string,
  ) => {
    Alert.alert(
      "멤버 초대",
      `${nickname}님에게 밴드 초대를 보낼까요?`,
      [
        {
          text: "취소",
          style: "cancel",
        },

        {
          text: "초대",

          onPress: () => {
            void (async () => {
              try {
                await inviteMutation.mutateAsync(
                  {
                    userId,
                    memberType:
                      "MEMBER",
                  },
                );

                Alert.alert(
                  "초대 완료",
                  "멤버 초대를 보냈어요.",
                );

                void query.refetch();
              } catch {
                Alert.alert(
                  "멤버 초대",
                  "초대를 보내지 못했어요.",
                );
              }
            })();
          },
        },
      ],
    );
  };

  return (
    <Screen
      contentStyle={
        styles.container
      }
    >
      <AppHeader title="멤버 초대" />

      <View style={styles.searchBox}>
        <Text style={styles.searchIcon}>⌕</Text>
        <TextInput
          value={search}
          placeholder="이름 검색"
          placeholderTextColor={colors.neutral500}
          returnKeyType="search"
          style={styles.searchInput}
          onSubmitEditing={searchUser}
          onChangeText={setSearch}
        />
        {search ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="검색어 지우기"
            hitSlop={8}
            onPress={() => {
              setSearch("");
              setKeyword("");
            }}
          >
            <Text style={styles.clearText}>×</Text>
          </Pressable>
        ) : null}
        <Pressable
          accessibilityRole="button"
          style={styles.searchButton}
          onPress={searchUser}
        >
          <Text style={styles.searchButtonText}>검색</Text>
        </Pressable>
      </View>

      {!keyword ? (
        <AppState
          title="멤버를 검색해 보세요"
          description="B:Scene 사용자 닉네임으로 검색할 수 있어요."
        />
      ) : query.isLoading ? (
        <AppState
          loading
          title="사용자를 검색하는 중이에요"
        />
      ) : query.isError ? (
        <AppState
          title="검색에 실패했어요"
          actionLabel="다시 시도"
          onAction={() =>
            void query.refetch()
          }
        />
      ) : (
        <View
          style={
            styles.results
          }
        >
          {(
            query.data ?? []
          ).length === 0 ? (
          <View style={styles.emptyResult}>
            <Text style={styles.emptyTitle}>검색 결과가 없어요</Text>
            <Text style={styles.emptyDescription}>
              회원가입하지 않았거나 세션 프로필이 없는 경우{"\n"}
              추후 초대 링크로 멤버를 초대할 수 있어요
            </Text>
          </View>
        ) : (
            query.data?.map(
              (candidate) => {
                const status =
                  getStatusLabel(
                    candidate.bandMemberStatus,
                    candidate.inviteAvailable,
                  );

                return (
                  <View
                    key={
                      candidate.userId
                    }
                    style={
                      styles.candidate
                    }
                  >
                    <Avatar
                      label={
                        candidate.nickname
                      }
                      size={40}
                    />

                    <View
                      style={
                        styles.info
                      }
                    >
                      <Text
                        style={
                          styles.nickname
                        }
                      >
                        {
                          candidate.nickname
                        }
                      </Text>

                      {status ? (
                        <Text
                          style={[
                            styles.statusBadge,
                            status === "멤버" && styles.memberBadge,
                            status === "초대 대기" && styles.pendingBadge,
                            status === "초대 불가" && styles.disabledBadge,
                          ]}
                        >
                          {status}
                        </Text>
                      ) : (
                        <Text
                          style={
                            styles.available
                          }
                        >
                          초대 가능
                        </Text>
                      )}
                    </View>

                    {!status &&
                    candidate.inviteAvailable ? (
                      <Pressable
                        accessibilityRole="button"
                        disabled={inviteMutation.isPending}
                        style={
                          styles.inviteButton
                        }
                        onPress={() =>
                          invite(
                            candidate.userId,
                            candidate.nickname,
                          )
                        }
                      >
                        <Text style={styles.inviteButtonText}>초대</Text>
                      </Pressable>
                    ) : null}
                  </View>
                );
              },
            )
          )}
        </View>
      )}
    </Screen>
  );
}

const styles =
  StyleSheet.create({
    container: {
      gap: 24,
      paddingHorizontal: 24,
      backgroundColor: colors.white,
    },

    searchBox: {
      height: 36,
      borderWidth: 1,
      borderColor: colors.neutral500,
      borderRadius: 999,
      backgroundColor: colors.white,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 16,
    },

    searchIcon: {
      color: colors.neutral500,
      fontSize: 18,
      lineHeight: 18,
    },

    searchInput: {
      flex: 1,
      color: colors.neutral900,
      fontSize: 15,
      fontWeight: "500",
      lineHeight: 20,
      paddingVertical: 0,
    },

    clearText: {
      color: colors.neutral400,
      fontSize: 20,
      lineHeight: 20,
    },

    searchButton: {
      height: 26,
      borderRadius: 8,
      backgroundColor: colors.secondary500,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 12,
    },

    searchButtonText: {
      color: colors.white,
      fontSize: 12,
      fontWeight: "500",
      lineHeight: 18,
    },

    results: {
      gap: 16,
      paddingHorizontal: 16,
    },

    candidate: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 16,
    },

    info: {
      flex: 1,
      minWidth: 0,
      gap: 4,
    },

    nickname: {
      color:
        colors.neutral900,
      fontSize: 15,
      fontWeight: "700",
      lineHeight: 20,
    },

    available: {
      color:
        colors.secondary600,
      fontSize: 12,
      fontWeight: "500",
      lineHeight: 18,
    },

    statusBadge: {
      height: 26,
      minWidth: 53,
      borderRadius: 8,
      textAlign: "center",
      fontSize: 12,
      fontWeight: "500",
      lineHeight: 26,
      paddingHorizontal: 10,
    },

    memberBadge: {
      backgroundColor: colors.secondary400,
      color: colors.white,
    },

    pendingBadge: {
      backgroundColor: colors.secondary100,
      color: colors.secondary500,
    },

    disabledBadge: {
      backgroundColor: colors.neutral300,
      color: colors.neutral500,
    },

    inviteButton: {
      height: 26,
      minWidth: 53,
      borderWidth: 1,
      borderColor: colors.secondary500,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 10,
    },

    inviteButtonText: {
      color: colors.secondary500,
      fontSize: 12,
      fontWeight: "500",
      lineHeight: 18,
    },

    emptyResult: {
      alignItems: "center",
      gap: 12,
      marginTop: 64,
      paddingHorizontal: 16,
    },

    emptyTitle: {
      color: colors.neutral900,
      fontSize: 18,
      fontWeight: "700",
      lineHeight: 22,
      textAlign: "center",
    },

    emptyDescription: {
      color: colors.neutral600,
      fontSize: 14,
      fontWeight: "500",
      lineHeight: 20,
      textAlign: "center",
    },
  });

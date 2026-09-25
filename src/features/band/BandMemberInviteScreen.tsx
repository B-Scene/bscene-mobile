import {
    Alert,
    StyleSheet,
    Text,
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

import { AppButton } from "@/shared/components/AppButton";
import { AppCard } from "@/shared/components/AppCard";
import { AppHeader } from "@/shared/components/AppHeader";
import { AppState } from "@/shared/components/AppState";
import { AppTextInput } from "@/shared/components/AppTextInput";
import { Avatar } from "@/shared/components/Avatar";
import { Badge } from "@/shared/components/Badge";
import { Screen } from "@/shared/components/Screen";

import {
    colors,
    spacing,
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

      <AppTextInput
        label="사용자 검색"
        value={search}
        placeholder="닉네임 검색"
        returnKeyType="search"
        onSubmitEditing={
          searchUser
        }
        onChangeText={
          setSearch
        }
      />

      <AppButton
        label="검색"
        onPress={
          searchUser
        }
      />

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
            <AppState
              title="검색 결과가 없어요"
              description="아직 가입하지 않은 사용자는 마지막 Deep Link 단계에서 초대 링크로 연결할 예정이에요."
            />
          ) : (
            query.data?.map(
              (candidate) => {
                const status =
                  getStatusLabel(
                    candidate.bandMemberStatus,
                    candidate.inviteAvailable,
                  );

                return (
                  <AppCard
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
                      size={46}
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
                        <Badge
                          label={
                            status
                          }
                        />
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
                      <AppButton
                        label="초대"
                        variant="secondary"
                        loading={
                          inviteMutation.isPending
                        }
                        style={
                          styles.inviteButton
                        }
                        onPress={() =>
                          invite(
                            candidate.userId,
                            candidate.nickname,
                          )
                        }
                      />
                    ) : null}
                  </AppCard>
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
      gap: spacing.lg,
    },

    results: {
      gap: spacing.md,
    },

    candidate: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
    },

    info: {
      flex: 1,
      gap: spacing.xs,
    },

    nickname: {
      color:
        colors.neutral900,
      fontSize: 15,
      fontWeight: "900",
    },

    available: {
      color:
        colors.secondary600,
      fontSize: 12,
      fontWeight: "800",
    },

    inviteButton: {
      minHeight: 38,
      paddingHorizontal:
        spacing.md,
    },
  });
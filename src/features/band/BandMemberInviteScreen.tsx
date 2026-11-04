import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import type { BandMemberCandidate } from "@/api/band/bandManagement";
import { MyHeader } from "@/features/my/MyHeader";
import { useBandQuery } from "@/hooks/api/band/useBand";
import {
  useBandMemberCandidatesQuery,
  useInviteBandMember,
} from "@/hooks/api/band/useBandManagement";
import { useActiveBandId } from "@/hooks/api/user/useMyProfiles";
import { AppIcon } from "@/shared/components/AppIcon";
import { AppState } from "@/shared/components/AppState";
import { ConfirmModal } from "@/shared/components/ConfirmModal";
import { ProfileImage } from "@/shared/components/ProfileImage";
import { Screen } from "@/shared/components/Screen";
import { Toast } from "@/shared/components/Toast";
import { colors, textStyles } from "@/shared/constants/theme";

type InviteBadge = "invite" | "member" | "pending" | "unavailable";

const getInviteBadge = (candidate: BandMemberCandidate): InviteBadge => {
  if (candidate.bandMemberStatus === "INVITED") return "pending";
  if (candidate.bandMemberStatus === "ACCEPTED") return "member";
  if (candidate.bandMemberStatus) return "unavailable";

  return candidate.inviteAvailable ? "invite" : "unavailable";
};

export function BandMemberInviteScreen() {
  const activeBand = useActiveBandId();
  const bandId = activeBand.activeBandId;
  const { data: band } = useBandQuery(bandId);
  const [search, setSearch] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [inviteTarget, setInviteTarget] = useState<BandMemberCandidate | null>(
    null,
  );
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const closeToast = useCallback(() => setToastMessage(null), []);

  const query = useBandMemberCandidatesQuery(bandId, search);
  const inviteMutation = useInviteBandMember(bandId);
  const candidates = query.data ?? [];
  const isSearchActive = isFocused || search.length > 0;
  const showResults = search.trim().length > 0;

  const confirmInvite = async () => {
    if (!inviteTarget || inviteMutation.isPending) return;

    const { userId } = inviteTarget;

    setInviteTarget(null);

    try {
      await inviteMutation.mutateAsync({ userId, memberType: "MEMBER" });
      setToastMessage("초대장을 발송했어요");
      void query.refetch();
    } catch {
      setToastMessage("초대를 보내지 못했어요");
    }
  };

  return (
    <Screen scroll={false} contentStyle={styles.container}>
      <MyHeader title="멤버 초대" />

      <View style={styles.content}>
        <View style={[styles.searchBox, isSearchActive && styles.searchActive]}>
          <AppIcon name={isSearchActive ? "searchActive" : "search"} size={16} />
          <TextInput
            value={search}
            placeholder="이름 검색"
            placeholderTextColor={colors.neutral500}
            returnKeyType="search"
            style={styles.searchInput}
            onChangeText={setSearch}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
          {search ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="검색어 지우기"
              hitSlop={8}
              onPress={() => setSearch("")}
            >
              <AppIcon name="deleteCircle" size={16} />
            </Pressable>
          ) : null}
        </View>

        {!showResults || query.isLoading ? null : query.isError ? (
          <AppState
            title="검색에 실패했어요"
            actionLabel="다시 시도"
            onAction={() => void query.refetch()}
          />
        ) : candidates.length === 0 ? (
          <View style={styles.emptyResult}>
            <Text style={styles.emptyTitle}>검색 결과가 없어요</Text>
            <Text style={styles.emptyDescription}>
              {
                "회원가입하지 않았거나 세션 프로필이 없는 경우\n추후 초대 링크로 멤버를 초대할 수 있어요"
              }
            </Text>
          </View>
        ) : (
          <View style={styles.results}>
            {candidates.map((candidate) => (
              <View key={candidate.userId} style={styles.candidate}>
                <View style={styles.candidateMain}>
                  <ProfileImage size={40} />
                  <Text numberOfLines={1} style={styles.nickname}>
                    {candidate.nickname}
                  </Text>
                </View>

                <InviteAction
                  badge={getInviteBadge(candidate)}
                  onInvite={() => setInviteTarget(candidate)}
                />
              </View>
            ))}
          </View>
        )}
      </View>

      <ConfirmModal
        open={inviteTarget !== null}
        tone="orange"
        title={`${inviteTarget?.nickname ?? ""}님을 초대할까요?`}
        description={`초대장을 보내면 상대방이 수락 후\n${band?.name ?? ""}의 멤버로 참여하게 됩니다.`}
        onCancel={() => setInviteTarget(null)}
        onConfirm={() => void confirmInvite()}
      />

      <Toast
        open={toastMessage !== null}
        message={toastMessage}
        tone={toastMessage?.includes("못했어요") ? "error" : "success"}
        onClose={closeToast}
      />
    </Screen>
  );
}

function InviteAction({
  badge,
  onInvite,
}: {
  badge: InviteBadge;
  onInvite: () => void;
}) {
  if (badge === "invite") {
    return (
      <Pressable
        accessibilityRole="button"
        style={[styles.badge, styles.inviteBadge]}
        onPress={onInvite}
      >
        <Text style={styles.inviteBadgeText}>초대</Text>
      </Pressable>
    );
  }

  if (badge === "member") {
    return (
      <View style={[styles.badge, styles.memberBadge]}>
        <Text style={styles.memberBadgeText}>멤버</Text>
      </View>
    );
  }

  if (badge === "pending") {
    return (
      <View style={[styles.badge, styles.pendingBadge]}>
        <Text style={styles.pendingBadgeText}>대기</Text>
      </View>
    );
  }

  return (
    <View style={[styles.badge, styles.disabledBadge]}>
      <Text numberOfLines={1} style={styles.disabledBadgeText}>
        초대불가
      </Text>
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  searchBox: {
    height: 36,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: colors.neutral500,
    borderRadius: 999,
    backgroundColor: colors.white,
    paddingHorizontal: 16,
  },
  searchActive: {
    borderColor: colors.secondary500,
    boxShadow: "0px 0px 4px 0px rgba(252, 193, 63, 0.5)",
  },
  searchInput: {
    ...textStyles.body2,
    flex: 1,
    color: colors.neutral900,
    paddingVertical: 0,
  },
  emptyResult: {
    alignItems: "center",
    gap: 12,
    marginTop: 64,
    paddingHorizontal: 16,
  },
  emptyTitle: {
    ...textStyles.label1,
    color: colors.neutral900,
    textAlign: "center",
  },
  emptyDescription: {
    ...textStyles.caption1,
    color: colors.neutral600,
    textAlign: "center",
  },
  results: {
    gap: 16,
    marginTop: 24,
    paddingHorizontal: 16,
  },
  candidate: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  candidateMain: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  nickname: {
    ...textStyles.body6,
    flexShrink: 1,
    color: colors.neutral900,
  },
  badge: {
    width: 53,
    height: 26,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  inviteBadge: {
    borderWidth: 1,
    borderColor: colors.secondary500,
  },
  inviteBadgeText: {
    ...textStyles.caption3,
    color: colors.secondary500,
  },
  memberBadge: {
    backgroundColor: colors.secondary400,
  },
  memberBadgeText: {
    ...textStyles.caption3,
    color: colors.white,
  },
  pendingBadge: {
    backgroundColor: colors.secondary100,
  },
  pendingBadgeText: {
    ...textStyles.caption3,
    color: colors.secondary400,
  },
  disabledBadge: {
    backgroundColor: colors.neutral300,
  },
  disabledBadgeText: {
    ...textStyles.caption3,
    color: colors.neutral500,
  },
});

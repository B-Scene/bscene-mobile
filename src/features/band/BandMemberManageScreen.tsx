import { router, type Href } from "expo-router";
import { useState, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { BandMemberItem } from "@/api/band/bandManagement";
import { BandBanner } from "@/features/my/BandBanner";
import { MyHeader } from "@/features/my/MyHeader";
import { useBandQuery } from "@/hooks/api/band/useBand";
import {
  useBandMembersQuery,
  useRemoveBandMember,
} from "@/hooks/api/band/useBandManagement";
import { useActiveBandId } from "@/hooks/api/user/useMyProfiles";
import { AppState } from "@/shared/components/AppState";
import { ConfirmModal } from "@/shared/components/ConfirmModal";
import { ProfileImage } from "@/shared/components/ProfileImage";
import { Screen } from "@/shared/components/Screen";
import { getPartLabel } from "@/shared/constants/bandLabels";
import { colors, shadows, textStyles } from "@/shared/constants/theme";

const getRoleLabel = (member: BandMemberItem) => {
  const typeLabel = member.memberType === "SESSION" ? "세션" : "멤버";

  return member.part ? `${typeLabel} · ${getPartLabel(member.part)}` : typeLabel;
};

export function BandMemberManageScreen() {
  const activeBand = useActiveBandId();
  const bandId = activeBand.activeBandId;
  const bandQuery = useBandQuery(bandId);
  const membersQuery = useBandMembersQuery(bandId);
  const removeMutation = useRemoveBandMember(bandId);
  const [removeTargetId, setRemoveTargetId] = useState<number | null>(null);

  const members = membersQuery.data ?? [];
  const activeMembers = members.filter((member) => member.status !== "INVITED");
  const invitedMembers = members.filter(
    (member) => member.status === "INVITED",
  );
  const myProfileId = activeBand.activeBand?.bandMemberProfileId;
  const viewerIsOwner =
    members.find((member) => member.bandMemberProfileId === myProfileId)
      ?.owner ?? false;

  const confirmRemove = async () => {
    if (removeTargetId === null) return;

    const userId = removeTargetId;

    setRemoveTargetId(null);
    await removeMutation.mutateAsync(userId);
  };

  if (activeBand.isLoading || membersQuery.isLoading) {
    return (
      <Screen contentStyle={styles.container}>
        <MyHeader title="멤버 관리" />
        <AppState loading title="멤버를 불러오는 중이에요" />
      </Screen>
    );
  }

  if (!bandId || membersQuery.isError) {
    return (
      <Screen contentStyle={styles.container}>
        <MyHeader title="멤버 관리" />
        <AppState title="멤버를 불러오지 못했어요" />
      </Screen>
    );
  }

  return (
    <Screen contentStyle={styles.container}>
      <MyHeader title="멤버 관리" />

      <View style={styles.content}>
        <View style={styles.activeSection}>
          <BandBanner
            bandName={bandQuery.data?.name ?? ""}
            description={`현재 선택된 밴드 · 멤버 ${bandQuery.data?.memberCount ?? 0}명`}
            profileImageUrl={bandQuery.data?.profileImageUrl}
            action={
              viewerIsOwner ? (
                <Pressable
                  accessibilityRole="button"
                  style={styles.inviteButton}
                  onPress={() => router.push("/band/my/members/invite" as Href)}
                >
                  <Text style={styles.inviteText}>멤버 초대</Text>
                </Pressable>
              ) : undefined
            }
          />

          <View style={styles.activeList}>
            {activeMembers.map((member) => {
              const isSelf = member.bandMemberProfileId === myProfileId;

              return (
                <MemberCard
                  key={member.id}
                  name={`${member.profileNickname ?? "닉네임 없음"}${isSelf ? " (나)" : ""}`}
                  meta={getRoleLabel(member)}
                  action={
                    member.owner ? (
                      <View style={styles.ownerBadge}>
                        <Text style={styles.ownerText}>운영자</Text>
                      </View>
                    ) : viewerIsOwner ? (
                      <Pressable
                        accessibilityRole="button"
                        hitSlop={8}
                        onPress={() => setRemoveTargetId(member.userId)}
                      >
                        <Text style={styles.removeText}>내보내기</Text>
                      </Pressable>
                    ) : null
                  }
                />
              );
            })}
          </View>
        </View>

        {invitedMembers.length > 0 ? (
          <>
            <View style={styles.sectionBand} />

            <View style={styles.pendingSection}>
              <Text style={styles.pendingTitle}>초대 대기 멤버</Text>

              <View style={styles.pendingList}>
                {invitedMembers.map((member) => (
                  <MemberCard
                    key={member.id}
                    name={member.profileNickname ?? "초대 사용자"}
                    meta="초대 발송됨"
                    action={
                      viewerIsOwner ? (
                        <Pressable
                          accessibilityRole="button"
                          hitSlop={8}
                          onPress={() => removeMutation.mutate(member.userId)}
                        >
                          <Text style={styles.cancelText}>취소</Text>
                        </Pressable>
                      ) : null
                    }
                  />
                ))}
              </View>
            </View>
          </>
        ) : null}
      </View>

      <ConfirmModal
        open={removeTargetId !== null}
        tone="orange"
        title="해당 멤버를 내보낼까요?"
        description="내보낸 멤버는 밴드에서 제거됩니다."
        confirmLabel="내보내기"
        onCancel={() => setRemoveTargetId(null)}
        onConfirm={() => void confirmRemove()}
      />
    </Screen>
  );
}

function MemberCard({
  name,
  meta,
  action,
}: {
  name: string;
  meta: string;
  action: ReactNode;
}) {
  return (
    <View style={styles.memberCard}>
      <View style={styles.memberMain}>
        <ProfileImage size={40} />
        <View style={styles.memberText}>
          <Text numberOfLines={1} style={styles.memberName}>
            {name}
          </Text>
          <Text numberOfLines={1} style={styles.memberMeta}>
            {meta}
          </Text>
        </View>
      </View>

      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    paddingBottom: 24,
    backgroundColor: colors.white,
  },
  content: {
    gap: 24,
  },
  activeSection: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  inviteButton: {
    flexShrink: 0,
    borderRadius: 8,
    backgroundColor: colors.secondary400,
    paddingHorizontal: 15,
    paddingVertical: 4,
  },
  inviteText: {
    ...textStyles.caption3,
    color: colors.white,
  },
  activeList: {
    gap: 14,
    marginTop: 24,
    paddingHorizontal: 8,
  },
  sectionBand: {
    height: 16,
    backgroundColor: colors.neutral200,
  },
  pendingSection: {
    gap: 16,
  },
  pendingTitle: {
    ...textStyles.body1,
    color: colors.neutral700,
    paddingHorizontal: 23,
  },
  pendingList: {
    gap: 14,
    paddingHorizontal: 32,
  },
  memberCard: {
    ...shadows.card,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    borderRadius: 8,
    backgroundColor: colors.white,
    padding: 12,
  },
  memberMain: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  memberText: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  memberName: {
    ...textStyles.caption3,
    color: colors.neutral900,
  },
  memberMeta: {
    ...textStyles.caption2,
    color: colors.neutral600,
  },
  ownerBadge: {
    flexShrink: 0,
    borderWidth: 1,
    borderColor: colors.secondary500,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  ownerText: {
    ...textStyles.caption3,
    color: colors.secondary500,
  },
  removeText: {
    ...textStyles.caption4,
    color: colors.neutral500,
  },
  cancelText: {
    ...textStyles.caption3,
    color: colors.error,
    textAlign: "right",
  },
});

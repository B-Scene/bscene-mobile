import { router, type Href } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { ModeSwitchSheet } from "@/features/my/ModeSwitchSheet";
import { MyHeader } from "@/features/my/MyHeader";
import {
  EmptyState,
  MenuDivider,
  MenuSection,
  ProfileSummary,
  StatRow,
} from "@/features/my/MyProfileParts";
import { useBandMyPageQuery } from "@/hooks/api/user/useBandMyPage";
import { useActiveBandId } from "@/hooks/api/user/useMyProfiles";
import { AppState } from "@/shared/components/AppState";
import { ConfirmModal } from "@/shared/components/ConfirmModal";
import { Screen } from "@/shared/components/Screen";
import { getPartLabel } from "@/shared/constants/bandLabels";
import { colors } from "@/shared/constants/theme";
import { useAuthStore } from "@/stores/useAuthStore";

const go = (href: string) => () => router.push(href as Href);

export function BandMyScreen() {
  const myPageQuery = useBandMyPageQuery();
  const activeBandQuery = useActiveBandId();
  const clearSession = useAuthStore((state) => state.clearSession);
  const [isModeSwitchOpen, setIsModeSwitchOpen] = useState(false);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);

  const data = myPageQuery.data;
  const activeBand = activeBandQuery.activeBand;
  const hasBand = Boolean(activeBand);
  const showNoBandState =
    !hasBand && !activeBandQuery.isLoading && !activeBandQuery.isError;
  const bandName = hasBand ? (data?.bandName ?? "") : "";
  const partsLabel = (data?.parts ?? []).map(getPartLabel).join(" · ");

  const logout = () => {
    setIsLogoutOpen(false);
    void clearSession().then(() => router.replace("/login"));
  };

  return (
    <Screen edges={["top"]} contentStyle={styles.container}>
      <MyHeader title="마이" showBack={false} />

      {myPageQuery.isError ? (
        <AppState
          title="밴드 마이페이지를 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요."
          actionLabel="다시 시도"
          onAction={() => void myPageQuery.refetch()}
        />
      ) : (
        <>
          <View style={styles.profileBand}>
            <ProfileSummary
              name={data?.nickname ?? ""}
              subtitle={[bandName, partsLabel].filter(Boolean).join(" · ")}
              profileImageUrl={activeBand?.profileImageUrl}
              variant="band"
              switchLabel={hasBand ? bandName : undefined}
              onSwitch={() => setIsModeSwitchOpen(true)}
            />

            <View style={styles.stats}>
              <StatRow
                stats={[
                  {
                    label: "팔로워",
                    value: data?.follower ?? 0,
                    onPress: go("/band/my/followers"),
                  },
                  {
                    label: "지원자",
                    value: data?.applicant ?? 0,
                    onPress: go("/band/my/applications"),
                  },
                  {
                    label: "공연",
                    value: data?.performance ?? 0,
                    onPress: go("/band/home"),
                  },
                ]}
              />
            </View>
          </View>

          <View style={styles.menuContent}>
            {hasBand ? (
              <>
                <MenuSection
                  title="현재 선택된 밴드 관리"
                  items={[
                    {
                      label: "밴드 프로필 관리",
                      onPress: go("/band/my/profile/edit"),
                    },
                    {
                      label: "멤버 관리",
                      onPress: go("/band/my/members"),
                    },
                    {
                      label: "모집 공고 관리",
                      onPress: go("/band/my/postings"),
                    },
                    {
                      label: "받은 지원 관리",
                      onPress: go("/band/my/applications"),
                    },
                  ]}
                />

                <MenuDivider />
              </>
            ) : showNoBandState ? (
              <>
                <View style={styles.emptyWrap}>
                  <EmptyState
                    title="등록된 밴드가 없어요"
                    description={
                      "밴드를 등록하면 콘텐츠, 공연, 라이브 등\n다양한 활동을 관리할 수 있어요"
                    }
                    actionLabel="밴드 등록하기"
                    onAction={go("/band/my/profile/new")}
                  />
                </View>

                <MenuDivider />
              </>
            ) : null}

            <MenuSection
              title="알림"
              items={[
                {
                  label: "모집 공고 알림 설정",
                  onPress: go("/band/my/recruit-alert"),
                },
                {
                  label: "라이브 알림 설정",
                  onPress: go("/band/my/live-alert"),
                },
              ]}
            />

            <MenuDivider />

            <MenuSection
              title="계정"
              items={[
                {
                  label: "로그아웃",
                  onPress: () => setIsLogoutOpen(true),
                },
              ]}
            />
          </View>
        </>
      )}

      <ConfirmModal
        open={isLogoutOpen}
        tone="orange"
        title="로그아웃 할까요?"
        description="언제든지 다시 로그인할 수 있어요"
        confirmLabel="로그아웃"
        onCancel={() => setIsLogoutOpen(false)}
        onConfirm={logout}
      />

      <ModeSwitchSheet
        open={isModeSwitchOpen}
        onClose={() => setIsModeSwitchOpen(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    paddingBottom: 24,
    backgroundColor: colors.white,
  },
  profileBand: {
    backgroundColor: colors.secondary0,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  stats: {
    marginTop: 16,
  },
  menuContent: {
    gap: 16,
    paddingTop: 18,
    paddingBottom: 20,
  },
  emptyWrap: {
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
});

import { router, type Href } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { MenuDivider, MenuSection, ProfileSummary, StatRow } from "@/features/my/MyProfileParts";
import { MyHeader } from "@/features/my/MyHeader";
import { useGenres, useRegions } from "@/hooks/api/onboarding/useOnboarding";
import { useFanInformationQuery } from "@/hooks/api/user/useFanInformation";
import { useFanMyPageQuery } from "@/hooks/api/user/useFanMyPage";
import { AppState } from "@/shared/components/AppState";
import { ConfirmModal } from "@/shared/components/ConfirmModal";
import { Screen } from "@/shared/components/Screen";
import { colors } from "@/shared/constants/theme";
import { useAuthStore } from "@/stores/useAuthStore";
import type { CodeName } from "@/types/onboarding/onboarding";

const getCodeName = (codeNames: CodeName[], code: string) =>
  codeNames.find((item) => item.code === code)?.name ?? code;

const buildSubtitle = (
  data: {
    genre: string;
    additionalGenreCount: number;
    regions: string[];
  },
  genres: CodeName[],
  regions: CodeName[],
) => {
  const genreLabel = data.genre ? getCodeName(genres, data.genre) : "";
  const genreText =
    data.additionalGenreCount > 0
      ? `${genreLabel} 외 ${data.additionalGenreCount}`
      : genreLabel;
  const regionText = (data.regions ?? [])
    .map((region) => getCodeName(regions, region))
    .join(", ");

  return [genreText, regionText].filter(Boolean).join(" · ");
};

const go = (href: string) => () => router.push(href as Href);

export function FanMyScreen() {
  const myPageQuery = useFanMyPageQuery();
  const fanInformationQuery = useFanInformationQuery();
  const { data: genres = [] } = useGenres();
  const { data: regions = [] } = useRegions();
  const clearSession = useAuthStore((state) => state.clearSession);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const data = myPageQuery.data;

  const logout = () => {
    setIsLogoutOpen(false);
    void clearSession().then(() => router.replace("/login"));
  };

  return (
    <Screen edges={["top"]} contentStyle={styles.container}>
      <MyHeader title="마이" showBack={false} />

      {myPageQuery.isError ? (
        <AppState
          title="마이페이지를 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요."
          actionLabel="다시 시도"
          onAction={() => void myPageQuery.refetch()}
        />
      ) : (
        <>
          <View style={styles.profileBand}>
            <ProfileSummary
              name={data?.nickname ?? ""}
              subtitle={data ? buildSubtitle(data, genres, regions) : ""}
              profileImageUrl={fanInformationQuery.data?.profileImageUrl}
              variant="user"
            />

            <View style={styles.stats}>
              <StatRow
                stats={[
                  {
                    label: "팔로잉",
                    value: data?.followingCount ?? 0,
                    onPress: go("/fan/my/followed-bands"),
                  },
                  {
                    label: "관심 공연",
                    value: data?.interestedPerformanceCount ?? 0,
                    onPress: go("/fan/my/interested-concerts"),
                  },
                  {
                    label: "참여 공연",
                    value: data?.participatedPerformanceCount ?? 0,
                    onPress: go("/fan/my/attended-concerts"),
                  },
                ]}
              />
            </View>
          </View>

          <View style={styles.menuContent}>
            <MenuSection
              title="탐색 활동"
              items={[
                {
                  label: "팔로우한 밴드",
                  onPress: go("/fan/my/followed-bands"),
                },
                {
                  label: "관심 공연 목록",
                  onPress: go("/fan/my/interested-concerts"),
                },
                {
                  label: "공연 참여 기록",
                  onPress: go("/fan/my/attended-concerts"),
                },
              ]}
            />

            <MenuDivider />

            <MenuSection
              title="알림"
              items={[
                {
                  label: "공연 알림 설정",
                  onPress: go("/fan/my/concert-alert"),
                },
                {
                  label: "라이브 알림 설정",
                  onPress: go("/fan/my/live-alert"),
                },
              ]}
            />

            <MenuDivider />

            <MenuSection
              title="계정"
              items={[
                {
                  label: "내 정보 수정",
                  onPress: go("/fan/my/profile/edit"),
                },
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
        title="로그아웃 할까요?"
        description="언제든지 다시 로그인할 수 있어요"
        confirmLabel="로그아웃"
        onCancel={() => setIsLogoutOpen(false)}
        onConfirm={logout}
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
    backgroundColor: colors.primary0,
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
});

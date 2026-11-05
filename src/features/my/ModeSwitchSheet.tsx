import { router, usePathname } from "expo-router";
import { useState, type ReactNode } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useChangeUserMode, useToggleUserMode } from "@/hooks/api/user/useMode";
import { useMyProfilesQuery } from "@/hooks/api/user/useMyProfiles";
import { AppIcon } from "@/shared/components/AppIcon";
import { ProfileImage } from "@/shared/components/ProfileImage";
import { Toast } from "@/shared/components/Toast";
import { getGenreLabel, getRegionLabel } from "@/shared/constants/bandLabels";
import { colors, shadows, textStyles } from "@/shared/constants/theme";
import { useAuthStore } from "@/stores/useAuthStore";
import { useModeStore } from "@/stores/useModeStore";
import { useOnboardingDraftStore } from "@/stores/useOnboardingDraftStore";
import { BottomSheetModal } from "@/shared/components/BottomSheetModal";

const FAN_START_ID = "fan-start";
const BAND_START_ID = "band-start";

function AccountRow({
  avatar,
  name,
  subtitle,
  selected,
  selectedTone,
  onSelect,
}: {
  avatar: ReactNode;
  name: string;
  subtitle?: string;
  selected: boolean;
  selectedTone: "fan" | "band";
  onSelect: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      style={styles.accountRow}
      onPress={onSelect}
    >
      <View style={styles.accountMain}>
        {avatar}
        <View style={styles.accountText}>
          <Text
            numberOfLines={1}
            style={[styles.accountName, !subtitle && styles.accountNameMuted]}
          >
            {name}
          </Text>
          {subtitle ? (
            <Text numberOfLines={1} style={styles.accountSubtitle}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>

      <AppIcon
        name={
          !selected
            ? "checkEmpty"
            : selectedTone === "fan"
              ? "checkCircleFan"
              : "checkCircleBand"
        }
      />
    </Pressable>
  );
}

export function ModeSwitchSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const setMode = useModeStore((state) => state.setMode);
  const setCurrentMode = useAuthStore((state) => state.setCurrentMode);
  const setOnboardingModes = useOnboardingDraftStore((state) => state.setModes);
  const changeUserMode = useChangeUserMode();
  const toggleUserMode = useToggleUserMode();
  const { data: profiles } = useMyProfilesQuery({ type: "all" });
  const { data: bandProfiles } = useMyProfilesQuery({ type: "band" });

  const fanProfile = profiles?.fanProfile ?? null;
  const fanAccountId = fanProfile
    ? `fan-${fanProfile.fanProfileId}`
    : FAN_START_ID;
  const bandAccounts = (
    bandProfiles?.bandProfiles.length
      ? bandProfiles.bandProfiles
      : (profiles?.bandProfiles ?? [])
  ).map((band) => ({
    ...band,
    id: `band-${band.bandId}`,
    subtitle: `${getGenreLabel(band.genre)} · ${getRegionLabel(band.region)}`,
  }));
  const isFanMode = pathname.startsWith("/fan");
  const initialSelectedId =
    isFanMode && fanProfile
      ? fanAccountId
      : (bandAccounts.find((band) => band.isActive)?.id ??
        bandAccounts[0]?.id ??
        (isFanMode ? FAN_START_ID : BAND_START_ID));

  const [pickedId, setPickedId] = useState<string | null>(null);
  const [showError, setShowError] = useState(false);
  const selectedId = pickedId ?? initialSelectedId;

  const close = () => {
    setPickedId(null);
    setShowError(false);
    onClose();
  };

  const isSelectionUnchanged = selectedId === initialSelectedId;
  const isDisabled =
    isSelectionUnchanged ||
    changeUserMode.isPending ||
    toggleUserMode.isPending;
  const isFanSelected = selectedId.startsWith("fan");

  const finishSwitch = () => {
    setMode(isFanSelected ? "fan" : "band");
    // 재시작 시 SplashScreen이 이 값으로 첫 화면을 정한다.
    void setCurrentMode(isFanSelected ? "FAN" : "BAND");
    close();
    router.replace(isFanSelected ? "/fan/home" : "/band/home");
  };

  const switchMode = () => {
    if (selectedId === FAN_START_ID) {
      setOnboardingModes(["FAN", "BAND"], "FAN");
      close();
      router.push("/onboarding/fan-nickname");
      return;
    }

    if (selectedId === BAND_START_ID) {
      setShowError(false);
      toggleUserMode.mutate(undefined, {
        onSuccess: finishSwitch,
        onError: () => setShowError(true),
      });
      return;
    }

    const selectedBand = bandAccounts.find((band) => band.id === selectedId);
    const profileId = isFanSelected
      ? fanProfile?.fanProfileId
      : selectedBand?.bandMemberProfileId;

    if (!profileId) return;

    setShowError(false);
    changeUserMode.mutate(
      { profileId, type: isFanSelected ? "FAN" : "BAND" },
      {
        onSuccess: finishSwitch,
        onError: () => setShowError(true),
      },
    );
  };

  return (
    <BottomSheetModal open={open} maxHeight="85%" onClose={close}>
      <View
        style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 32) }]}
      >
        <View style={styles.handle} />
        <Text style={styles.title}>모드 전환</Text>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.sections}
        >
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, styles.fanTitle]}>팬 모드</Text>
            <AccountRow
              avatar={
                fanProfile ? (
                  <ProfileImage
                    imageUrl={fanProfile.profileImageUrl}
                    size={40}
                  />
                ) : (
                  <View style={styles.plusAvatar}>
                    <AppIcon name="plus" />
                  </View>
                )
              }
              name={fanProfile?.nickname || "팬 모드 시작하기"}
              subtitle={fanProfile?.email}
              selected={selectedId === fanAccountId}
              selectedTone="fan"
              onSelect={() => setPickedId(fanAccountId)}
            />
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, styles.bandTitle]}>
              밴드 모드
            </Text>
            {bandAccounts.length > 0 ? (
              bandAccounts.map((band) => (
                <AccountRow
                  key={band.id}
                  avatar={
                    <ProfileImage
                      imageUrl={band.profileImageUrl}
                      size={40}
                      variant="band"
                    />
                  }
                  name={band.bandName}
                  subtitle={band.subtitle}
                  selected={selectedId === band.id}
                  selectedTone="band"
                  onSelect={() => setPickedId(band.id)}
                />
              ))
            ) : (
              <AccountRow
                avatar={
                  <View style={styles.plusAvatar}>
                    <AppIcon name="plus" />
                  </View>
                }
                name="밴드 모드 시작하기"
                selected={selectedId === BAND_START_ID}
                selectedTone="band"
                onSelect={() => setPickedId(BAND_START_ID)}
              />
            )}
          </View>
        </ScrollView>

        <Pressable
          accessibilityRole="button"
          disabled={isDisabled}
          style={[
            styles.submit,
            isDisabled
              ? styles.submitDisabled
              : isFanSelected
                ? styles.submitFan
                : styles.submitBand,
          ]}
          onPress={switchMode}
        >
          <Text
            style={[
              styles.submitText,
              isDisabled && styles.submitTextDisabled,
            ]}
          >
            모드 전환
          </Text>
        </Pressable>
      </View>

      <Toast
        open={showError}
        tone="error"
        message="모드 전환에 실패했어요. 다시 시도해주세요"
        onClose={() => setShowError(false)}
      />
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  sheet: {
    flexShrink: 1,
    alignItems: "center",
    gap: 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: colors.white,
    paddingHorizontal: 15,
    paddingTop: 20,
  },
  handle: {
    width: 44,
    height: 4,
    borderRadius: 4,
    backgroundColor: "#DEDEDE",
  },
  title: {
    ...textStyles.label1,
    color: colors.neutral900,
    textAlign: "center",
  },
  scroll: {
    alignSelf: "stretch",
    flexGrow: 0,
    flexShrink: 1,
  },
  sections: {
    gap: 24,
    paddingHorizontal: 9,
    paddingVertical: 8,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    ...textStyles.label2,
    marginBottom: 4,
  },
  fanTitle: {
    color: colors.primary400,
  },
  bandTitle: {
    color: colors.secondary500,
  },
  accountRow: {
    ...shadows.card,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 8,
    backgroundColor: colors.white,
    paddingLeft: 12,
    paddingRight: 15,
    paddingVertical: 12,
  },
  accountMain: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 25,
  },
  accountText: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
  },
  accountName: {
    ...textStyles.body1,
    color: colors.neutral900,
  },
  accountNameMuted: {
    color: colors.neutral700,
  },
  accountSubtitle: {
    ...textStyles.caption2,
    color: colors.neutral600,
  },
  plusAvatar: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: colors.neutral300,
  },
  submit: {
    alignSelf: "stretch",
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    marginHorizontal: 5,
  },
  submitDisabled: {
    backgroundColor: colors.neutral300,
  },
  submitFan: {
    backgroundColor: colors.primary400,
  },
  submitBand: {
    backgroundColor: colors.secondary500,
  },
  submitText: {
    ...textStyles.label1,
    color: colors.white,
  },
  submitTextDisabled: {
    color: colors.neutral600,
  },
});

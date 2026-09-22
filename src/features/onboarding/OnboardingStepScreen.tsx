import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

import {
  useCheckFanNickname,
  useGenres,
  useRegions,
  useSaveOnboarding,
} from "@/hooks/api/onboarding/useOnboarding";
import { AppButton } from "@/shared/components/AppButton";
import { AppTextInput } from "@/shared/components/AppTextInput";
import { Chip } from "@/shared/components/Chip";
import { Screen } from "@/shared/components/Screen";
import { colors, radius, spacing } from "@/shared/constants/theme";
import { useOnboardingDraftStore } from "@/stores/useOnboardingDraftStore";
import type { ModeCode } from "@/types/onboarding/onboarding";

type Step =
  | "agreement"
  | "mode"
  | "fan-nickname"
  | "genre"
  | "region"
  | "notification-permission"
  | "complete";

type OnboardingStepScreenProps = {
  step: Step;
};

const fallbackGenres = [
  { code: "ROCK", name: "록" },
  { code: "INDIE_POP", name: "인디팝" },
  { code: "PUNK", name: "펑크" },
  { code: "METAL", name: "메탈" },
  { code: "JAZZ", name: "재즈" },
  { code: "BLUES", name: "블루스" },
];

const fallbackRegions = [
  { code: "SEOUL", name: "서울" },
  { code: "GYEONGGI", name: "경기" },
  { code: "INCHEON", name: "인천" },
  { code: "ETC", name: "기타" },
];

export function OnboardingStepScreen({ step }: OnboardingStepScreenProps) {
  const draft = useOnboardingDraftStore();
  const [termsAccepted, setTermsAccepted] = useState(false);
  const checkNicknameMutation = useCheckFanNickname();
  const saveOnboardingMutation = useSaveOnboarding();
  const genresQuery = useGenres();
  const regionsQuery = useRegions();

  const genreOptions = genresQuery.data?.length ? genresQuery.data : fallbackGenres;
  const regionOptions = regionsQuery.data?.length ? regionsQuery.data : fallbackRegions;

  const nicknameError = useMemo(() => {
    if (draft.fanNickname.trim().length === 0) return undefined;
    if (draft.fanNickname.trim().length < 2) return "두 글자 이상 입력해 주세요.";
    return undefined;
  }, [draft.fanNickname]);

  const handleSaveOnboarding = () => {
    if (!draft.initialMode) {
      Alert.alert("모드 선택 필요", "팬 또는 밴드 모드를 선택해 주세요.");
      router.replace("/onboarding/mode");
      return;
    }

    saveOnboardingMutation.mutate(
      {
        selectedModes: draft.selectedModes.length
          ? draft.selectedModes
          : [draft.initialMode],
        initialMode: draft.initialMode,
        fanNickname: draft.fanNickname.trim() || undefined,
        genres: draft.genres,
        regions: draft.regions,
      },
      {
        onSuccess: () => {
          draft.reset();
          router.replace("/home");
        },
        onError: () => {
          Alert.alert("온보딩 저장 실패", "입력 정보를 확인한 뒤 다시 시도해 주세요.");
        },
      },
    );
  };

  if (step === "agreement") {
    return (
      <OnboardingFrame
        title="B:Scene 이용을 시작할게요"
        description="서비스 이용약관과 개인정보 처리방침 동의 흐름은 웹의 약관 데이터를 기준으로 모바일 체크 UI에 연결합니다."
        footer={
          <AppButton
            label="동의하고 계속"
            disabled={!termsAccepted}
            onPress={() => router.push("/onboarding/mode")}
          />
        }
      >
        <Chip
          label={termsAccepted ? "필수 약관 동의 완료" : "필수 약관에 동의합니다"}
          selected={termsAccepted}
          onPress={() => setTermsAccepted((current) => !current)}
        />
      </OnboardingFrame>
    );
  }

  if (step === "mode") {
    const selectMode = (mode: ModeCode) => {
      draft.setModes([mode], mode);
    };

    return (
      <OnboardingFrame
        title="어떤 모드로 시작할까요?"
        description="웹과 동일하게 팬 모드와 밴드 모드를 구분하고, 이후 ModeGuard 기준으로 홈을 나눕니다."
        footer={
          <AppButton
            label="다음"
            disabled={!draft.initialMode}
            onPress={() =>
              router.push(
                draft.initialMode === "FAN"
                  ? "/onboarding/fan-nickname"
                  : "/onboarding/genre",
              )
            }
          />
        }
      >
        <View style={styles.cardRow}>
          <ModeCard
            title="팬"
            description="좋아하는 밴드의 공연과 라이브를 따라가요."
            selected={draft.initialMode === "FAN"}
            onPress={() => selectMode("FAN")}
          />
          <ModeCard
            title="밴드"
            description="공연, 콘텐츠, 세션 모집을 관리해요."
            selected={draft.initialMode === "BAND"}
            onPress={() => selectMode("BAND")}
          />
        </View>
      </OnboardingFrame>
    );
  }

  if (step === "fan-nickname") {
    const handleNext = () => {
      const nickname = draft.fanNickname.trim();

      checkNicknameMutation.mutate(nickname, {
        onSuccess: ({ available }) => {
          if (!available) {
            Alert.alert("사용할 수 없는 닉네임", "다른 닉네임을 입력해 주세요.");
            return;
          }

          router.push("/onboarding/genre");
        },
        onError: () => {
          Alert.alert("닉네임 확인 실패", "잠시 후 다시 시도해 주세요.");
        },
      });
    };

    return (
      <OnboardingFrame
        title="팬 닉네임을 알려주세요"
        description="공연 후기와 라이브 채팅에서 사용할 이름입니다."
        footer={
          <AppButton
            label="중복 확인 후 다음"
            disabled={Boolean(nicknameError) || draft.fanNickname.trim().length === 0}
            loading={checkNicknameMutation.isPending}
            onPress={handleNext}
          />
        }
      >
        <AppTextInput
          label="닉네임"
          placeholder="예: 비씬러"
          value={draft.fanNickname}
          onChangeText={draft.setFanNickname}
          error={nicknameError}
        />
      </OnboardingFrame>
    );
  }

  if (step === "genre") {
    return (
      <OnboardingFrame
        title="좋아하는 장르를 골라주세요"
        description="선택한 장르는 홈 추천과 밴드 탐색에 사용됩니다."
        footer={
          <AppButton
            label="다음"
            disabled={draft.genres.length === 0}
            onPress={() => router.push("/onboarding/region")}
          />
        }
      >
        <View style={styles.chipWrap}>
          {genreOptions.map((genre) => (
            <Chip
              key={genre.code}
              label={genre.name}
              selected={draft.genres.includes(genre.code)}
              onPress={() => draft.toggleGenre(genre.code)}
            />
          ))}
        </View>
      </OnboardingFrame>
    );
  }

  if (step === "region") {
    return (
      <OnboardingFrame
        title="활동 지역을 선택해주세요"
        description="가까운 공연과 세션 모집을 더 잘 찾을 수 있습니다."
        footer={
          <AppButton
            label="다음"
            disabled={draft.regions.length === 0}
            onPress={() => router.push("/onboarding/notification-permission")}
          />
        }
      >
        <View style={styles.chipWrap}>
          {regionOptions.map((region) => (
            <Chip
              key={region.code}
              label={region.name}
              selected={draft.regions.includes(region.code)}
              onPress={() => draft.toggleRegion(region.code)}
            />
          ))}
        </View>
      </OnboardingFrame>
    );
  }

  if (step === "notification-permission") {
    return (
      <OnboardingFrame
        title="알림을 받아볼까요?"
        description="공연 알림, 라이브 시작, 세션 지원 상태를 놓치지 않도록 Expo 알림 권한을 연결할 예정입니다."
        footer={
          <AppButton
            label="완료 화면으로"
            onPress={() => router.push("/onboarding/complete")}
          />
        }
      >
        <View style={styles.noticeCard}>
          <Text style={styles.noticeTitle}>모바일 권한 처리 예정</Text>
          <Text style={styles.noticeDescription}>
            웹의 PushNotificationBridge와 알림 설정 API를 Expo Notifications 기반으로 전환합니다.
          </Text>
        </View>
      </OnboardingFrame>
    );
  }

  return (
    <OnboardingFrame
      title="준비가 끝났어요"
      description="선택한 모드와 관심 정보를 저장하고 B:Scene 모바일 홈으로 이동합니다."
      footer={
        <AppButton
          label="B:Scene 시작하기"
          loading={saveOnboardingMutation.isPending}
          onPress={handleSaveOnboarding}
        />
      }
    >
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLine}>모드: {draft.initialMode ?? "-"}</Text>
        <Text style={styles.summaryLine}>
          장르: {draft.genres.length ? draft.genres.join(", ") : "-"}
        </Text>
        <Text style={styles.summaryLine}>
          지역: {draft.regions.length ? draft.regions.join(", ") : "-"}
        </Text>
      </View>
    </OnboardingFrame>
  );
}

function OnboardingFrame({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <Screen contentStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Onboarding</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
      <View style={styles.body}>{children}</View>
      <View style={styles.footer}>{footer}</View>
    </Screen>
  );
}

function ModeCard({
  title,
  description,
  selected,
  onPress,
}: {
  title: string;
  description: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <ChipCard selected={selected} onPress={onPress}>
      <Text style={[styles.modeTitle, selected && styles.selectedText]}>{title}</Text>
      <Text style={styles.modeDescription}>{description}</Text>
    </ChipCard>
  );
}

function ChipCard({
  selected,
  onPress,
  children,
}: {
  selected: boolean;
  onPress: () => void;
  children: React.ReactNode;
}) {
  return (
    <View
      onTouchEnd={onPress}
      style={[styles.modeCard, selected && styles.selectedModeCard]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xxl,
  },
  header: {
    gap: spacing.md,
  },
  eyebrow: {
    color: colors.primary500,
    fontSize: 13,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  title: {
    color: colors.neutral900,
    fontSize: 28,
    fontWeight: "900",
  },
  description: {
    color: colors.neutral600,
    fontSize: 15,
    lineHeight: 22,
  },
  body: {
    gap: spacing.lg,
  },
  footer: {
    marginTop: "auto",
  },
  cardRow: {
    gap: spacing.lg,
  },
  modeCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.neutral300,
    padding: spacing.xl,
    gap: spacing.sm,
    backgroundColor: colors.white,
  },
  selectedModeCard: {
    borderColor: colors.primary500,
    backgroundColor: colors.primary50,
  },
  modeTitle: {
    color: colors.neutral900,
    fontSize: 20,
    fontWeight: "900",
  },
  selectedText: {
    color: colors.primary600,
  },
  modeDescription: {
    color: colors.neutral600,
    fontSize: 14,
    lineHeight: 20,
  },
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  noticeCard: {
    borderRadius: radius.lg,
    backgroundColor: colors.secondary100,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  noticeTitle: {
    color: colors.neutral900,
    fontSize: 17,
    fontWeight: "900",
  },
  noticeDescription: {
    color: colors.neutral700,
    fontSize: 14,
    lineHeight: 20,
  },
  summaryCard: {
    borderRadius: radius.lg,
    backgroundColor: colors.neutral100,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  summaryLine: {
    color: colors.neutral800,
    fontSize: 15,
    fontWeight: "600",
  },
});

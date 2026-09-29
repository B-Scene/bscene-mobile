import { router } from "expo-router";
import { AlertCircle, Bell, Check, ChevronLeft, Smartphone } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";

import {
  AGREEMENT_DETAILS,
  AGREEMENTS,
  type AgreementKey,
} from "@/features/onboarding/agreementData";
import {
  BSceneLogo,
  BSceneSymbol,
} from "@/features/onboarding/BSceneBrandAssets";
import {
  useCheckFanNickname,
  useGenres,
  useRegions,
  useSaveOnboarding,
} from "@/hooks/api/onboarding/useOnboarding";
import { useRegisterPushToken } from "@/hooks/api/notification/useNotification";
import { colors } from "@/shared/constants/theme";
import { requestExpoPushToken } from "@/shared/utils/expoNotifications";
import { getHomePathForMode, useModeStore } from "@/stores/useModeStore";
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

type ModeOption = "fan" | "band" | "both";

const fallbackGenres = [
  { code: "INDIE", name: "인디" },
  { code: "POP", name: "팝" },
  { code: "POP_ROCK", name: "팝록" },
  { code: "JAZZ", name: "재즈" },
  { code: "BLUES", name: "블루스" },
  { code: "ALTERNATIVE_ROCK", name: "얼터너티브록" },
  { code: "PSYCHEDELIC_ROCK", name: "사이키델릭록" },
  { code: "ELECTRONIC_ROCK", name: "일렉트로닉록" },
  { code: "FOLK_ROCK", name: "포크록" },
  { code: "PUNK_ROCK", name: "펑크록" },
  { code: "HARD_ROCK", name: "하드록" },
  { code: "METAL", name: "메탈" },
  { code: "ETC", name: "etc" },
];

const fallbackRegions = [
  { code: "SEOUL", name: "서울" },
  { code: "GYEONGGI", name: "경기" },
  { code: "INCHEON", name: "인천" },
  { code: "BUSAN", name: "부산" },
  { code: "DAEGU", name: "대구" },
  { code: "GWANGJU", name: "광주" },
  { code: "DAEJEON", name: "대전" },
  { code: "ETC", name: "기타" },
];

const genreRows = [
  ["인디", "팝", "팝록", "재즈", "블루스"],
  ["얼터너티브록", "사이키델릭록", "일렉트로닉록"],
  ["포크록", "펑크록", "하드록", "메탈", "etc"],
];

const modeOptions: {
  value: ModeOption;
  title: string;
  description: string;
}[] = [
  {
    value: "fan",
    title: "팬으로 시작",
    description: "밴드 탐색 · 공연 발견 · 라이브 청취",
  },
  {
    value: "band",
    title: "밴드로 시작",
    description: "밴드 운영 · 세션 모집 · 라이브 송출",
  },
  {
    value: "both",
    title: "둘 다",
    description: "팬 활동 + 밴드 운영 모두",
  },
];

const getModeOption = (
  selectedModes: ModeCode[],
  initialMode: ModeCode | null,
): ModeOption => {
  if (selectedModes.includes("FAN") && selectedModes.includes("BAND")) return "both";
  if (initialMode === "BAND") return "band";
  return "fan";
};

const getSelectedModes = (mode: ModeOption): ModeCode[] => {
  if (mode === "band") return ["BAND"];
  if (mode === "both") return ["FAN", "BAND"];
  return ["FAN"];
};

const getInitialMode = (mode: ModeOption): ModeCode => {
  return mode === "band" ? "BAND" : "FAN";
};

export function OnboardingStepScreen({ step }: OnboardingStepScreenProps) {
  const draft = useOnboardingDraftStore();
  const setMode = useModeStore((state) => state.setMode);
  const [acceptedAgreements, setAcceptedAgreements] = useState<
    Partial<Record<AgreementKey, boolean>>
  >({});
  const [selectedAgreementKey, setSelectedAgreementKey] =
    useState<AgreementKey | null>(null);
  const [nicknameAvailable, setNicknameAvailable] = useState<boolean | null>(null);
  const checkNicknameMutation = useCheckFanNickname();
  const saveOnboardingMutation = useSaveOnboarding();
  const registerPushTokenMutation = useRegisterPushToken();
  const genresQuery = useGenres();
  const regionsQuery = useRegions();
  const genreOptions = genresQuery.data?.length ? genresQuery.data : fallbackGenres;
  const regionOptions = regionsQuery.data?.length ? regionsQuery.data : fallbackRegions;
  const trimmedNickname = draft.fanNickname.trim();
  const allAgreementsAccepted = AGREEMENTS.every(
    (agreement) => acceptedAgreements[agreement.key],
  );
  const requiredAgreementAccepted = AGREEMENTS.filter((agreement) => agreement.required)
    .every((agreement) => acceptedAgreements[agreement.key]);

  useEffect(() => {
    if (step !== "fan-nickname") return;
    if (!trimmedNickname) return;

    const timer = setTimeout(() => {
      checkNicknameMutation.mutate(trimmedNickname, {
        onSuccess: ({ available }) => setNicknameAvailable(available),
        onError: () => setNicknameAvailable(null),
      });
    }, 500);

    return () => clearTimeout(timer);
  }, [checkNicknameMutation, step, trimmedNickname]);

  useEffect(() => {
    if (step !== "mode") return;
    if (draft.initialMode) return;
    draft.setModes(["FAN"], "FAN");
  }, [draft, step]);

  const handleSaveOnboarding = () => {
    if (!draft.initialMode) {
      Alert.alert("모드 선택 필요", "팬 또는 밴드 모드를 선택해 주세요.");
      router.replace("/onboarding/mode");
      return;
    }

    const initialMode = draft.initialMode;

    saveOnboardingMutation.mutate(
      {
        selectedModes: draft.selectedModes.length
          ? draft.selectedModes
          : [initialMode],
        initialMode,
        fanNickname: draft.fanNickname.trim() || undefined,
        genres: draft.genres,
        regions: draft.regions,
      },
      {
        onSuccess: () => {
          setMode(initialMode === "BAND" ? "band" : "fan");
          draft.reset();
          router.replace(
            getHomePathForMode(initialMode) as Parameters<typeof router.replace>[0],
          );
        },
        onError: () => {
          Alert.alert("온보딩 저장 실패", "입력 정보를 확인한 뒤 다시 시도해 주세요.");
        },
      },
    );
  };

  if (step === "agreement") {
    const selectedAgreement = selectedAgreementKey
      ? AGREEMENT_DETAILS[selectedAgreementKey]
      : null;

    const toggleAgreement = (key: AgreementKey) => {
      setAcceptedAgreements((current) => ({
        ...current,
        [key]: !current[key],
      }));
    };
    const toggleAllAgreements = () => {
      const nextValue = !allAgreementsAccepted;
      setAcceptedAgreements(
        AGREEMENTS.reduce<Partial<Record<AgreementKey, boolean>>>(
          (next, agreement) => ({
            ...next,
            [agreement.key]: nextValue,
          }),
          {},
        ),
      );
    };

    return (
      <OnboardingFrame
        title="약관 동의"
        showCenteredTitle
        footer={
          <PrimaryButton
            label="다음"
            disabled={!requiredAgreementAccepted}
            onPress={() => router.push("/onboarding/mode")}
          />
        }
      >
        <View style={styles.agreementHero}>
          <BSceneLogo width={119} height={22} />
          <Text style={styles.agreementHeading}>서비스 이용약관</Text>
        </View>

        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: allAgreementsAccepted }}
          style={styles.allAgreementRow}
          onPress={toggleAllAgreements}
        >
          <CheckCircle checked={allAgreementsAccepted} large />
          <Text style={styles.allAgreementText}>모두 동의 (선택 정보 포함)</Text>
        </Pressable>

        <View style={styles.agreementRows}>
          {AGREEMENTS.map((agreement) => {
            const checked = Boolean(acceptedAgreements[agreement.key]);

            return (
              <View key={agreement.key} style={styles.agreementRow}>
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked }}
                  style={styles.agreementToggle}
                  onPress={() => toggleAgreement(agreement.key)}
                >
                  <CheckCircle checked={checked} />
                  <Text style={styles.agreementLabel}>
                    [{agreement.required ? "필수" : "선택"}] {agreement.label}
                  </Text>
                </Pressable>
                <Pressable onPress={() => setSelectedAgreementKey(agreement.key)}>
                  <Text style={styles.viewLink}>보기</Text>
                </Pressable>
              </View>
            );
          })}
        </View>

        <TermModal
          title={selectedAgreement?.title ?? ""}
          content={selectedAgreement?.content ?? ""}
          visible={Boolean(selectedAgreement)}
          onClose={() => setSelectedAgreementKey(null)}
        />
      </OnboardingFrame>
    );
  }

  if (step === "mode") {
    const selectedMode = getModeOption(draft.selectedModes, draft.initialMode);
    const selectMode = (mode: ModeOption) => {
      draft.setModes(getSelectedModes(mode), getInitialMode(mode));
    };

    return (
      <OnboardingFrame
        footer={
          <PrimaryButton
            label="다음"
            disabled={!draft.initialMode}
            onPress={() =>
              router.push(
                draft.initialMode === "BAND"
                  ? "/onboarding/notification-permission"
                  : "/onboarding/fan-nickname",
              )
            }
          />
        }
      >
        <StepTitle
          title={"어떤 목적으로\n사용하시나요?"}
          description="나중에 언제든 변경할 수 있어요"
        />
        <View style={styles.modeList}>
          {modeOptions.map((option) => {
            const selected = selectedMode === option.value;

            return (
              <Pressable
                key={option.value}
                style={[styles.modeCard, selected && styles.modeCardSelected]}
                onPress={() => selectMode(option.value)}
              >
                <Text style={[styles.modeTitle, selected && styles.modeTitleSelected]}>
                  {option.title}
                </Text>
                <Text
                  style={[
                    styles.modeDescription,
                    selected && styles.modeDescriptionSelected,
                  ]}
                >
                  {option.description}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </OnboardingFrame>
    );
  }

  if (step === "fan-nickname") {
    const isDuplicate = nicknameAvailable === false;
    const isValidNickname =
      trimmedNickname.length > 0 &&
      nicknameAvailable === true &&
      !checkNicknameMutation.isPending;

    const handleChangeNickname = (value: string) => {
      draft.setFanNickname(value.slice(0, 8));
      setNicknameAvailable(null);
    };

    return (
      <OnboardingFrame
        footer={
          <PrimaryButton
            label="다음"
            disabled={!isValidNickname}
            loading={checkNicknameMutation.isPending}
            onPress={() => router.push("/onboarding/genre")}
          />
        }
      >
        <StepTitle
          title={"팬모드에서 사용할\n닉네임을 정해주세요"}
          description="나중에 언제든 변경할 수 있어요"
        />
        <View style={styles.nicknameBlock}>
          <TextInput
            value={draft.fanNickname}
            placeholder="8자 이내 한글 혹은 영문"
            placeholderTextColor={colors.neutral400}
            maxLength={8}
            style={[
              styles.nicknameInput,
              isDuplicate ? styles.nicknameInputError : styles.nicknameInputActive,
            ]}
            onChangeText={handleChangeNickname}
          />
          {isDuplicate ? (
            <View style={styles.errorRow}>
              <AlertCircle size={14} color={colors.error} />
              <Text style={styles.errorText}>이미 존재하는 닉네임입니다.</Text>
            </View>
          ) : null}
        </View>
      </OnboardingFrame>
    );
  }

  if (step === "genre") {
    const orderedRows = genreRows
      .map((row) =>
        row
          .map((name) => genreOptions.find((genre) => genre.name === name))
          .filter((genre) => genre !== undefined),
      )
      .filter((row) => row.length > 0);

    const toggleGenre = (code: string) => {
      if (!draft.genres.includes(code) && draft.genres.length >= 3) return;
      draft.toggleGenre(code);
    };

    return (
      <OnboardingFrame
        footer={
          <PrimaryButton
            label="다음"
            disabled={draft.genres.length === 0}
            onPress={() => router.push("/onboarding/region")}
          />
        }
      >
        <StepTitle title="관심 장르를 선택하세요" description="최대 3개" />
        <View style={styles.pillRows}>
          {orderedRows.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.pillRow}>
              {row.map((genre) => (
                <Pill
                  key={genre.code}
                  label={genre.name}
                  selected={draft.genres.includes(genre.code)}
                  onPress={() => toggleGenre(genre.code)}
                />
              ))}
            </View>
          ))}
        </View>
      </OnboardingFrame>
    );
  }

  if (step === "region") {
    const rows = [
      regionOptions.slice(0, 5),
      regionOptions.slice(5, 10),
      regionOptions.slice(10, 15),
      regionOptions.slice(15),
    ].filter((row) => row.length > 0);

    const toggleRegion = (code: string) => {
      if (!draft.regions.includes(code) && draft.regions.length >= 2) return;
      draft.toggleRegion(code);
    };

    return (
      <OnboardingFrame
        footer={
          <PrimaryButton
            label="다음"
            disabled={draft.regions.length === 0}
            onPress={() => router.push("/onboarding/notification-permission")}
          />
        }
      >
        <StepTitle title="활동 지역을 선택하세요" description="최대 2개" />
        <View style={styles.regionRows}>
          {rows.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.regionRow}>
              {row.map((region) => (
                <Pill
                  key={region.code}
                  label={region.name}
                  selected={draft.regions.includes(region.code)}
                  onPress={() => toggleRegion(region.code)}
                />
              ))}
            </View>
          ))}
        </View>
      </OnboardingFrame>
    );
  }

  if (step === "notification-permission") {
    const requestNotificationPermission = async () => {
      try {
        const result = await requestExpoPushToken();

        if (result.status === "unavailable") {
          Alert.alert(
            "실제 기기에서 설정할 수 있어요",
            "푸시 알림은 iOS 또는 Android 실제 기기에서 사용할 수 있어요.",
          );
          router.push("/onboarding/complete");
          return;
        }

        if (result.status === "denied") {
          Alert.alert(
            "알림 권한이 꺼져 있어요",
            "마이페이지에서 언제든 다시 설정할 수 있어요.",
          );
          router.push("/onboarding/complete");
          return;
        }

        if (!result.token) {
          Alert.alert("알림 설정 실패", "푸시 토큰을 발급받지 못했어요.");
          return;
        }

        await registerPushTokenMutation.mutateAsync({
          token: result.token,
          platform: "WEB",
        });
        router.push("/onboarding/complete");
      } catch {
        Alert.alert(
          "알림 설정 실패",
          "알림 권한 또는 토큰 등록 중 문제가 발생했어요. 나중에 다시 설정할 수 있어요.",
        );
      }
    };

    return (
      <View style={styles.notificationRoot}>
        <View style={styles.notificationContent}>
          <GradientCircle>
            <Bell size={42} color={colors.white} />
          </GradientCircle>
          <Text style={styles.notificationTitle}>
            중요한 소식을{"\n"}놓치지 마세요
          </Text>
          <Text style={styles.notificationDescription}>
            밴드 초대, 세션 지원 결과, 새로운 쪽지와{"\n"}
            팔로우한 밴드의 공연, 라이브 소식을 바로 알려드려요.
          </Text>
          <View style={styles.nativeNoticeCard}>
            <View style={styles.nativeNoticeHeader}>
              <Smartphone size={20} color={colors.primary400} />
              <Text style={styles.nativeNoticeTitle}>모바일 알림 안내</Text>
            </View>
            <Text style={styles.nativeNoticeText}>
              기기 알림 권한을 허용하면 B:Scene 앱에서 공연, 라이브, 세션 소식을 받을 수 있어요.
            </Text>
          </View>
        </View>
        <View style={styles.notificationFooter}>
          <PrimaryButton
            label={
              registerPushTokenMutation.isPending
                ? "알림 설정 중..."
                : "알림 허용하고 시작하기"
            }
            disabled={registerPushTokenMutation.isPending}
            onPress={() => void requestNotificationPermission()}
          />
          <Pressable
            disabled={registerPushTokenMutation.isPending}
            style={styles.laterButton}
            onPress={() => router.push("/onboarding/complete")}
          >
            <Text style={styles.laterText}>나중에 하기</Text>
          </Pressable>
          <Text style={styles.notificationHint}>
            알림 설정은 마이페이지에서 언제든 변경할 수 있어요.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.completeRoot}>
      <View style={styles.completeBody}>
        <BSceneSymbol width={78} height={86} />
        <Text style={styles.completeTitle}>설정이 완료됐어요</Text>
        <Text style={styles.completeDescription}>
          지금 바로 B:Scene을{"\n"}시작해보세요
        </Text>
      </View>
      <View style={styles.completeFooter}>
        <PrimaryButton
          label={saveOnboardingMutation.isPending ? "저장 중..." : "B:Scene 시작하기"}
          disabled={saveOnboardingMutation.isPending}
          onPress={handleSaveOnboarding}
        />
      </View>
    </View>
  );
}

function OnboardingFrame({
  title,
  showCenteredTitle = false,
  children,
  footer,
}: {
  title?: string;
  showCenteredTitle?: boolean;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <View style={styles.frameRoot}>
      <View style={styles.topBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="뒤로가기"
          hitSlop={12}
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ChevronLeft size={24} color={colors.neutral900} />
        </Pressable>
        {showCenteredTitle ? <Text style={styles.topBarTitle}>{title}</Text> : null}
        <View style={styles.backButton} />
      </View>
      <ScrollView contentContainerStyle={styles.frameContent}>{children}</ScrollView>
      <View style={styles.frameFooter}>{footer}</View>
    </View>
  );
}

function StepTitle({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <View style={styles.stepTitleBlock}>
      <Text style={styles.stepTitle}>{title}</Text>
      <Text style={styles.stepDescription}>{description}</Text>
    </View>
  );
}

function PrimaryButton({
  label,
  disabled,
  loading,
  onPress,
}: {
  label: string;
  disabled?: boolean;
  loading?: boolean;
  onPress: () => void;
}) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.primaryButton,
        isDisabled ? styles.primaryButtonDisabled : styles.primaryButtonEnabled,
        pressed && !isDisabled && styles.pressed,
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.primaryButtonText,
          isDisabled ? styles.primaryButtonTextDisabled : styles.primaryButtonTextEnabled,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function CheckCircle({ checked, large = false }: { checked: boolean; large?: boolean }) {
  const size = large ? 24 : 20;

  return (
    <View
      style={[
        styles.checkCircle,
        { width: size, height: size, borderRadius: size / 2 },
        checked && styles.checkCircleActive,
      ]}
    >
      {checked ? <Check size={large ? 15 : 13} color={colors.white} /> : null}
    </View>
  );
}

function Pill({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      style={[styles.pill, selected ? styles.pillSelected : styles.pillIdle]}
      onPress={onPress}
    >
      <Text style={[styles.pillText, selected ? styles.pillTextSelected : styles.pillTextIdle]}>
        {label}
      </Text>
    </Pressable>
  );
}

function TermModal({
  title,
  content,
  visible,
  onClose,
}: {
  title: string;
  content: string;
  visible: boolean;
  onClose: () => void;
}) {
  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable style={styles.termSheet}>
          <View style={styles.termHeader}>
            <Text style={styles.termTitle}>{title}</Text>
            <Pressable onPress={onClose}>
              <Text style={styles.termClose}>닫기</Text>
            </Pressable>
          </View>
          <ScrollView style={styles.termScroll}>
            <Text style={styles.termContent}>{content}</Text>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function GradientCircle({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.gradientCircle}>
      <Svg width={80} height={80} viewBox="0 0 80 80" style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="notificationGradient" x1="0" y1="0" x2="80" y2="80">
            <Stop stopColor="#FFE031" />
            <Stop offset="1" stopColor="#F04579" />
          </LinearGradient>
        </Defs>
        <Rect width={80} height={80} rx={40} fill="url(#notificationGradient)" />
      </Svg>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  frameRoot: {
    flex: 1,
    backgroundColor: colors.white,
  },
  topBar: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  backButton: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  topBarTitle: {
    color: colors.neutral900,
    fontSize: 18,
    fontWeight: "600",
    lineHeight: 20,
  },
  frameContent: {
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 112,
  },
  frameFooter: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 36,
  },
  stepTitleBlock: {
    marginTop: 0,
  },
  stepTitle: {
    color: colors.neutral900,
    fontSize: 28,
    fontWeight: "700",
    lineHeight: 38,
  },
  stepDescription: {
    color: colors.neutral600,
    fontSize: 15,
    fontWeight: "500",
    lineHeight: 20,
    marginTop: 8,
  },
  primaryButton: {
    height: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonEnabled: {
    backgroundColor: colors.primary400,
    borderColor: colors.primary400,
  },
  primaryButtonDisabled: {
    backgroundColor: colors.neutral300,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 20,
  },
  primaryButtonTextEnabled: {
    color: colors.white,
  },
  primaryButtonTextDisabled: {
    color: colors.neutral600,
  },
  agreementHero: {
    alignItems: "flex-start",
    gap: 4,
    paddingTop: 8,
  },
  agreementHeading: {
    color: colors.neutral900,
    fontSize: 24,
    fontWeight: "700",
    lineHeight: 38,
  },
  allAgreementRow: {
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral300,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 28,
    paddingBottom: 16,
  },
  allAgreementText: {
    color: colors.neutral900,
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 20,
  },
  agreementRows: {
    gap: 12,
    marginTop: 16,
  },
  agreementRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  agreementToggle: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  agreementLabel: {
    color: colors.neutral900,
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
  },
  viewLink: {
    color: colors.neutral500,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 18,
  },
  checkCircle: {
    borderWidth: 1.5,
    borderColor: colors.neutral400,
    alignItems: "center",
    justifyContent: "center",
  },
  checkCircleActive: {
    borderColor: colors.primary400,
    backgroundColor: colors.primary400,
  },
  modeList: {
    gap: 10,
    marginTop: 40,
  },
  modeCard: {
    height: 72,
    borderWidth: 1,
    borderColor: colors.neutral400,
    borderRadius: 12,
    backgroundColor: colors.white,
    justifyContent: "center",
    paddingHorizontal: 25,
  },
  modeCardSelected: {
    borderWidth: 1.5,
    borderColor: colors.primary400,
  },
  modeTitle: {
    color: colors.neutral400,
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 20,
  },
  modeTitleSelected: {
    color: colors.primary400,
  },
  modeDescription: {
    color: colors.neutral400,
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
    marginTop: 2,
  },
  modeDescriptionSelected: {
    color: colors.neutral600,
  },
  nicknameBlock: {
    marginTop: 40,
  },
  nicknameInput: {
    height: 72,
    borderWidth: 1.5,
    borderRadius: 12,
    backgroundColor: colors.white,
    color: colors.neutral900,
    fontSize: 18,
    fontWeight: "600",
    lineHeight: 20,
    paddingHorizontal: 24,
  },
  nicknameInputActive: {
    borderColor: colors.primary400,
  },
  nicknameInputError: {
    borderColor: colors.error,
  },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 18,
  },
  pillRows: {
    gap: 8,
    marginTop: 32,
  },
  pillRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  regionRows: {
    alignItems: "center",
    gap: 8,
    marginTop: 32,
  },
  regionRow: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  pill: {
    borderRadius: 100,
    paddingHorizontal: 15,
    paddingVertical: 4,
  },
  pillSelected: {
    backgroundColor: colors.primary400,
  },
  pillIdle: {
    backgroundColor: colors.neutral200,
  },
  pillText: {
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 20,
  },
  pillTextSelected: {
    color: colors.white,
  },
  pillTextIdle: {
    color: colors.neutral600,
  },
  notificationRoot: {
    flex: 1,
    backgroundColor: colors.white,
    paddingHorizontal: 20,
    paddingTop: 136,
    paddingBottom: 84,
  },
  notificationContent: {
    alignItems: "center",
  },
  gradientCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.primary400,
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
    overflow: "hidden",
  },
  notificationTitle: {
    color: colors.neutral900,
    fontSize: 28,
    fontWeight: "700",
    lineHeight: 38,
    marginTop: 28,
    textAlign: "center",
  },
  notificationDescription: {
    color: colors.neutral600,
    fontSize: 15,
    fontWeight: "500",
    lineHeight: 22,
    marginTop: 12,
    textAlign: "center",
  },
  nativeNoticeCard: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#FCD7E2",
    borderRadius: 12,
    backgroundColor: "#FFF6F8",
    gap: 10,
    marginTop: 44,
    padding: 16,
  },
  nativeNoticeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  nativeNoticeTitle: {
    color: colors.neutral900,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
  nativeNoticeText: {
    color: colors.neutral600,
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 20,
  },
  notificationFooter: {
    marginTop: "auto",
    alignItems: "center",
  },
  laterButton: {
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  laterText: {
    color: colors.neutral600,
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 20,
  },
  notificationHint: {
    color: colors.neutral400,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 18,
    marginTop: 12,
    textAlign: "center",
  },
  completeRoot: {
    flex: 1,
    backgroundColor: colors.white,
    paddingHorizontal: 20,
    paddingBottom: 60,
  },
  completeBody: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 96,
  },
  completeTitle: {
    color: colors.neutral900,
    fontSize: 28,
    fontWeight: "700",
    lineHeight: 38,
    marginTop: 28,
    textAlign: "center",
  },
  completeDescription: {
    color: colors.neutral600,
    fontSize: 15,
    fontWeight: "500",
    lineHeight: 20,
    marginTop: 12,
    textAlign: "center",
  },
  completeFooter: {
    width: "100%",
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  termSheet: {
    maxHeight: "70%",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    backgroundColor: colors.white,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 28,
  },
  termHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  termTitle: {
    color: colors.neutral900,
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 20,
  },
  termClose: {
    color: colors.neutral500,
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
  },
  termScroll: {
    maxHeight: 420,
  },
  termContent: {
    color: colors.neutral700,
    fontSize: 10,
    fontWeight: "500",
    lineHeight: 16,
  },
  pressed: {
    opacity: 0.82,
  },
});

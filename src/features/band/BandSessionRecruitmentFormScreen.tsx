import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Svg, { Circle, Path } from "react-native-svg";

import {
  useCreateSessionRecruitment,
  useSessionRecruitmentEditInfoQuery,
  useUpdateSessionRecruitment,
} from "@/hooks/api/session/useSessionRecruitment";
import { useBandMyPageQuery } from "@/hooks/api/user/useBandMyPage";
import { AppButton } from "@/shared/components/AppButton";
import { AppHeader } from "@/shared/components/AppHeader";
import { AppState } from "@/shared/components/AppState";
import { Screen } from "@/shared/components/Screen";
import { colors } from "@/shared/constants/theme";
import type {
  CreateSessionRecruitmentRequest,
  SessionRecruitmentEditInfoResponse,
  UpdateSessionRecruitmentRequest,
} from "@/types/session/sessionRecruitment";

type Step = 1 | 2;

const PART_OPTIONS = ["보컬", "기타", "베이스", "키보드", "드럼", "etc"];
const SKILL_OPTIONS = ["입문", "중급", "상급"];
const DETAIL_MAX_LENGTH = 500;

const parseRouteId = (value?: string | string[]) => {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const parsed = Number(rawValue);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

const splitDeadlineAt = (value?: string) => {
  if (!value) return { deadlineDate: "", deadlineTime: "" };
  const [date, time = ""] = value.split("T");

  return {
    deadlineDate: date ?? "",
    deadlineTime: time.slice(0, 5),
  };
};

const toDeadlineAt = (date: string, time: string) => `${date}T${time}:00`;

export function BandSessionRecruitmentFormScreen() {
  const params = useLocalSearchParams<{ recruitmentId?: string }>();
  const recruitmentId = parseRouteId(params.recruitmentId);
  const isEditMode = recruitmentId > 0;
  const myPageQuery = useBandMyPageQuery();
  const editInfoQuery = useSessionRecruitmentEditInfoQuery(recruitmentId);

  if (myPageQuery.isLoading || (isEditMode && editInfoQuery.isLoading)) {
    return (
      <Screen contentStyle={styles.container}>
        <AppHeader title={isEditMode ? "모집 공고 수정" : "모집 공고 등록"} />
        <AppState loading title="모집 공고 정보를 준비하는 중이에요" />
      </Screen>
    );
  }

  if (!myPageQuery.data?.isBandMember) {
    return (
      <Screen contentStyle={styles.container}>
        <AppHeader title={isEditMode ? "모집 공고 수정" : "모집 공고 등록"} />
        <AppState
          title="등록된 밴드를 찾지 못했어요"
          description="밴드 프로필을 먼저 확인해 주세요."
        />
      </Screen>
    );
  }

  if (isEditMode && (editInfoQuery.isError || !editInfoQuery.data)) {
    return (
      <Screen contentStyle={styles.container}>
        <AppHeader title="모집 공고 수정" />
        <AppState
          title="모집 공고를 불러오지 못했어요"
          description="삭제되었거나 네트워크 연결이 불안정할 수 있어요."
          actionLabel="다시 시도"
          onAction={() => void editInfoQuery.refetch()}
        />
      </Screen>
    );
  }

  return (
    <RecruitmentForm
      key={recruitmentId || "new"}
      bandMemberId={myPageQuery.data.bandMemberProfileId}
      recruitmentId={recruitmentId}
      initialValue={editInfoQuery.data}
    />
  );
}

function RecruitmentForm({
  bandMemberId,
  recruitmentId,
  initialValue,
}: {
  bandMemberId: number;
  recruitmentId: number;
  initialValue?: SessionRecruitmentEditInfoResponse;
}) {
  const isEditMode = recruitmentId > 0 && Boolean(initialValue);
  const deadline = splitDeadlineAt(initialValue?.deadlineAt);
  const createMutation = useCreateSessionRecruitment();
  const updateMutation = useUpdateSessionRecruitment();
  const [step, setStep] = useState<Step>(1);
  const [title, setTitle] = useState(initialValue?.recruitmentTitle ?? "");
  const [summary, setSummary] = useState(initialValue?.summary ?? "");
  const [content, setContent] = useState(initialValue?.content ?? "");
  const [part, setPart] = useState(initialValue?.part ?? "기타");
  const [skillLevel, setSkillLevel] = useState(initialValue?.skillLevel ?? "중급");
  const [genre, setGenre] = useState(initialValue?.genre ?? "");
  const [region, setRegion] = useState(initialValue?.region ?? "");
  const [practiceSchedule, setPracticeSchedule] = useState(
    initialValue?.practiceSchedule ?? "",
  );
  const [practicePlace, setPracticePlace] = useState(
    initialValue?.practicePlace ?? "",
  );
  const [deadlineDate, setDeadlineDate] = useState(deadline.deadlineDate);
  const [deadlineTime, setDeadlineTime] = useState(deadline.deadlineTime);
  const [qualification, setQualification] = useState(
    initialValue?.qualification ?? "",
  );
  const [showErrors, setShowErrors] = useState(false);
  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const hasStep1Error = [title, summary, content, part, skillLevel, genre].some(
    (value) => !value.trim(),
  );
  const hasStep2Error = [
    region,
    practiceSchedule,
    practicePlace,
    deadlineDate,
    deadlineTime,
    qualification,
  ].some((value) => !value.trim());

  const submit = async () => {
    if (hasStep1Error || hasStep2Error) {
      setShowErrors(true);
      return;
    }

    const payload = {
      recruitmentTitle: title.trim(),
      summary: summary.trim(),
      content: content.trim(),
      part: part.trim(),
      skillLevel: skillLevel.trim(),
      genre: genre.trim(),
      region: region.trim(),
      practiceSchedule: practiceSchedule.trim(),
      practicePlace: practicePlace.trim(),
      deadlineAt: toDeadlineAt(deadlineDate.trim(), deadlineTime.trim()),
      qualification: qualification.trim(),
    };

    try {
      if (isEditMode) {
        const result = await updateMutation.mutateAsync({
          sessionRecruitmentId: recruitmentId,
          body: payload satisfies UpdateSessionRecruitmentRequest,
        });
        router.replace(
          `/band/session/recruitments/${result.sessionRecruitmentId}` as Parameters<
            typeof router.replace
          >[0],
        );
        return;
      }

      const result = await createMutation.mutateAsync({
        ...payload,
        bandMemberId,
      } satisfies CreateSessionRecruitmentRequest);
      router.replace(
        `/band/session/recruitments/${result.sessionRecruitmentId}` as Parameters<
          typeof router.replace
        >[0],
      );
    } catch {
      Alert.alert(
        isEditMode ? "모집 공고 수정" : "모집 공고 등록",
        "모집 공고를 저장하지 못했어요.",
      );
    }
  };

  const goNext = () => {
    if (hasStep1Error) {
      setShowErrors(true);
      return;
    }

    setShowErrors(false);
    setStep(2);
  };

  return (
    <Screen contentStyle={styles.container}>
      <AppHeader title={isEditMode ? "모집 공고 수정" : "모집 공고 등록"} />
      <StepIndicator step={step} />

      <View style={styles.body}>
        <View style={styles.formCard}>
          {step === 1 ? (
            <>
              <Field label="공고 제목" required error={showErrors && !title.trim()}>
                <NativeInput
                  value={title}
                  placeholder="공고 제목을 입력해주세요"
                  maxLength={50}
                  error={showErrors && !title.trim()}
                  onChangeText={setTitle}
                />
              </Field>

              <Field
                label="공고 한줄 소개"
                required
                error={showErrors && !summary.trim()}
              >
                <NativeInput
                  value={summary}
                  placeholder="공고 목록에 표시될 짧은 소개를 입력해주세요. (최대 50자)"
                  maxLength={50}
                  error={showErrors && !summary.trim()}
                  onChangeText={setSummary}
                />
              </Field>

              <Field
                label="공고 상세 소개"
                required
                error={showErrors && !content.trim()}
              >
                <NativeInput
                  value={content}
                  placeholder="모집 공고의 상세 내용을 입력해주세요"
                  multiline
                  maxLength={DETAIL_MAX_LENGTH}
                  error={showErrors && !content.trim()}
                  onChangeText={setContent}
                />
                <Text style={styles.countText}>
                  {content.length}/{DETAIL_MAX_LENGTH}
                </Text>
              </Field>

              <Field label="모집 파트" required>
                <View style={styles.optionWrap}>
                  {PART_OPTIONS.map((item) => (
                    <OptionChip
                      key={item}
                      label={item}
                      selected={part === item}
                      onPress={() => setPart(item)}
                    />
                  ))}
                </View>
              </Field>

              <Field label="실력대" required>
                <View style={styles.optionWrap}>
                  {SKILL_OPTIONS.map((item) => (
                    <OptionChip
                      key={item}
                      label={item}
                      selected={skillLevel === item}
                      onPress={() => setSkillLevel(item)}
                    />
                  ))}
                </View>
              </Field>

              <Field label="장르" required error={showErrors && !genre.trim()}>
                <NativeInput
                  value={genre}
                  placeholder="장르 선택"
                  error={showErrors && !genre.trim()}
                  onChangeText={setGenre}
                />
              </Field>
            </>
          ) : (
            <>
              <Field label="활동 지역" required error={showErrors && !region.trim()}>
                <NativeInput
                  value={region}
                  placeholder="지역 선택"
                  error={showErrors && !region.trim()}
                  onChangeText={setRegion}
                />
              </Field>

              <Field
                label="연습 일정"
                required
                error={showErrors && !practiceSchedule.trim()}
              >
                <NativeInput
                  value={practiceSchedule}
                  placeholder="연습 일정을 작성해주세요"
                  error={showErrors && !practiceSchedule.trim()}
                  onChangeText={setPracticeSchedule}
                />
              </Field>

              <Field
                label="연습 장소"
                required
                error={showErrors && !practicePlace.trim()}
              >
                <NativeInput
                  value={practicePlace}
                  placeholder="연습 장소를 작성해주세요"
                  error={showErrors && !practicePlace.trim()}
                  onChangeText={setPracticePlace}
                />
              </Field>

              <Field
                label="모집 마감일"
                required
                error={
                  showErrors && (!deadlineDate.trim() || !deadlineTime.trim())
                }
              >
                <NativeInput
                  value={deadlineDate}
                  placeholder="YYYY-MM-DD"
                  error={showErrors && !deadlineDate.trim()}
                  onChangeText={setDeadlineDate}
                />
                <NativeInput
                  value={deadlineTime}
                  placeholder="HH:mm"
                  error={showErrors && !deadlineTime.trim()}
                  onChangeText={setDeadlineTime}
                />
              </Field>

              <Field
                label="지원 자격"
                required
                error={showErrors && !qualification.trim()}
              >
                <NativeInput
                  value={qualification}
                  placeholder="지원 자격을 입력해주세요"
                  multiline
                  maxLength={DETAIL_MAX_LENGTH}
                  error={showErrors && !qualification.trim()}
                  onChangeText={setQualification}
                />
                <Text style={styles.countText}>
                  {qualification.length}/{DETAIL_MAX_LENGTH}
                </Text>
              </Field>
            </>
          )}
        </View>

        <View style={styles.submitArea}>
          {step === 1 ? (
            <AppButton
              label="다음"
              style={[
                styles.submitButton,
                hasStep1Error ? styles.submitButtonDisabled : styles.submitButtonActive,
              ]}
              onPress={goNext}
            />
          ) : (
            <AppButton
              label={
                isSubmitting
                  ? isEditMode
                    ? "수정 중"
                    : "등록 중"
                  : isEditMode
                    ? "수정하기"
                    : "모집 공고 등록"
              }
              loading={isSubmitting}
              disabled={isSubmitting}
              style={[
                styles.submitButton,
                hasStep2Error ? styles.submitButtonDisabled : styles.submitButtonActive,
              ]}
              onPress={() => void submit()}
            />
          )}
        </View>
      </View>
    </Screen>
  );
}

function StepIndicator({ step }: { step: Step }) {
  return (
    <View style={styles.stepWrap}>
      <View style={styles.stepItem}>
        {step > 1 ? <CheckStepIcon /> : <NumberStepIcon value="1" active />}
        <Text
          style={[
            styles.stepLabel,
            step === 1 ? styles.stepLabelActive : styles.stepLabelIdle,
          ]}
        >
          기본 정보
        </Text>
      </View>
      <View style={[styles.stepLine, step > 1 && styles.stepLineActive]} />
      <View style={styles.stepItem}>
        <NumberStepIcon value="2" active={step === 2} />
        <Text
          style={[
            styles.stepLabel,
            step === 2 ? styles.stepLabelActive : styles.stepLabelIdle,
          ]}
        >
          모집 정보
        </Text>
      </View>
    </View>
  );
}

function Field({
  label,
  required = false,
  error = false,
  children,
}: {
  label: string;
  required?: boolean;
  error?: boolean;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>
        {label} {required ? <Text style={styles.required}>*</Text> : null}
      </Text>
      {children}
      {error ? <Text style={styles.errorText}>{label}은 필수 항목이에요</Text> : null}
    </View>
  );
}

function NativeInput({
  error = false,
  multiline = false,
  style,
  ...props
}: React.ComponentProps<typeof TextInput> & {
  error?: boolean;
}) {
  return (
    <TextInput
      placeholderTextColor={colors.neutral500}
      textAlignVertical={multiline ? "top" : "center"}
      style={[
        styles.input,
        multiline && styles.textArea,
        error && styles.inputError,
        style,
      ]}
      multiline={multiline}
      {...props}
    />
  );
}

function OptionChip({
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
      style={[styles.optionChip, selected ? styles.optionChipSelected : styles.optionChipIdle]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.optionChipText,
          selected ? styles.optionChipTextSelected : styles.optionChipTextIdle,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function NumberStepIcon({ value, active }: { value: string; active: boolean }) {
  return (
    <View>
      <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
        <Circle
          cx={12}
          cy={12}
          r={11}
          fill={active ? colors.secondary500 : colors.white}
          stroke={active ? colors.secondary500 : colors.secondary300}
          strokeWidth={2}
        />
      </Svg>
      <Text style={[styles.stepNumber, active && styles.stepNumberActive]}>
        {value}
      </Text>
    </View>
  );
}

function CheckStepIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={12} fill={colors.secondary500} />
      <Path
        d="M7 12.2L10.2 15.4L17.2 8.6"
        stroke={colors.white}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 104,
    backgroundColor: colors.secondary0,
  },
  stepWrap: {
    backgroundColor: colors.secondary0,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
    gap: 12,
    paddingTop: 16,
    paddingBottom: 18,
  },
  stepItem: {
    alignItems: "center",
    gap: 7,
  },
  stepLine: {
    width: 128,
    height: 2,
    backgroundColor: colors.secondary300,
    marginTop: 11,
  },
  stepLineActive: {
    backgroundColor: colors.secondary500,
  },
  stepLabel: {
    fontSize: 10,
    fontWeight: "500",
    lineHeight: 12,
  },
  stepLabelActive: {
    color: colors.secondary500,
  },
  stepLabelIdle: {
    color: colors.neutral400,
  },
  stepNumber: {
    position: "absolute",
    left: 0,
    top: 5,
    width: 24,
    color: colors.secondary500,
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 14,
    textAlign: "center",
  },
  stepNumberActive: {
    color: colors.white,
  },
  body: {
    paddingHorizontal: 20,
  },
  formCard: {
    borderRadius: 16,
    backgroundColor: colors.white,
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 16,
    shadowColor: colors.neutral900,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 2,
  },
  field: {
    gap: 8,
  },
  label: {
    color: colors.neutral900,
    fontSize: 15,
    fontWeight: "500",
    lineHeight: 20,
  },
  required: {
    color: colors.error,
  },
  input: {
    minHeight: 38,
    borderWidth: 1,
    borderColor: colors.neutral400,
    borderRadius: 5,
    backgroundColor: colors.white,
    color: colors.neutral900,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 18,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  textArea: {
    minHeight: 58,
    paddingTop: 8,
  },
  inputError: {
    borderColor: colors.error,
  },
  errorText: {
    color: colors.error,
    fontSize: 10,
    fontWeight: "500",
    lineHeight: 12,
  },
  countText: {
    alignSelf: "flex-end",
    color: colors.neutral500,
    fontSize: 10,
    fontWeight: "500",
    lineHeight: 12,
    marginTop: -22,
    marginRight: 13,
  },
  optionWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  optionChip: {
    minHeight: 26,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  optionChipSelected: {
    backgroundColor: colors.secondary500,
  },
  optionChipIdle: {
    backgroundColor: colors.neutral300,
  },
  optionChipText: {
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 14,
  },
  optionChipTextSelected: {
    color: colors.white,
  },
  optionChipTextIdle: {
    color: colors.neutral600,
  },
  submitArea: {
    marginTop: 18,
  },
  submitButton: {
    minHeight: 52,
    borderRadius: 12,
  },
  submitButtonActive: {
    backgroundColor: colors.secondary500,
  },
  submitButtonDisabled: {
    backgroundColor: colors.neutral300,
  },
});

import { router, useLocalSearchParams } from "expo-router";
import { useState, type ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { RecruitmentCreatedScreen } from "@/features/session/RecruitmentCompleteScreens";
import {
  formatDeadlineDate,
  getTodayDateKey,
  SessionChips,
  SessionCountedTextArea,
  SessionDatePickerSheet,
  SessionFormTopBar,
  SessionPickerButton,
  SessionSelect,
  SessionSelectSheet,
  SessionTextInput,
  SessionTimePickerSheet,
} from "@/features/session/RecruitmentApplicationFormParts";
import {
  useCreateSessionRecruitment,
  useSessionRecruitmentEditInfoQuery,
  useUpdateSessionRecruitment,
} from "@/hooks/api/session/useSessionRecruitment";
import { useBandMyPageQuery } from "@/hooks/api/user/useBandMyPage";
import { AppHeader } from "@/shared/components/AppHeader";
import { AppIcon } from "@/shared/components/AppIcon";
import { AppState } from "@/shared/components/AppState";
import { ConfirmModal } from "@/shared/components/ConfirmModal";
import { Screen } from "@/shared/components/Screen";
import { colors, textStyles } from "@/shared/constants/theme";
import { getApiErrorMessage } from "@/shared/utils/getApiErrorMessage";
import type {
  CreateSessionRecruitmentRequest,
  SessionRecruitmentEditInfoResponse,
  CreateSessionRecruitmentResponse,
  UpdateSessionRecruitmentRequest,
} from "@/types/session/sessionRecruitment";

type Step = 1 | 2;

const PART_OPTIONS = ["보컬", "기타", "베이스", "키보드", "드럼", "etc"];
const SKILL_OPTIONS = ["입문", "중급", "상급"];
const GENRE_OPTIONS = [
  "인디",
  "팝",
  "팝록",
  "재즈",
  "블루스",
  "얼터너티브록",
  "사이키델릭록",
  "일렉트로닉록",
  "포크록",
  "펑크록",
  "하드록",
  "메탈",
  "etc",
];
const REGION_OPTIONS = [
  "서울",
  "경기",
  "인천",
  "부산",
  "대구",
  "광주",
  "대전",
  "울산",
  "세종",
  "충남",
  "충북",
  "전남",
  "전북",
  "경남",
  "경북",
  "강원",
  "제주",
  "지역 미상",
];
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
  const [part, setPart] = useState(initialValue?.part ?? "");
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
  const [submitErrorMessage, setSubmitErrorMessage] = useState("");
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isGenreSheetOpen, setIsGenreSheetOpen] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);
  const [created, setCreated] = useState<CreateSessionRecruitmentResponse | null>(null);
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

    setSubmitErrorMessage("");

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
      setCreated(result);
    } catch (error) {
      setSubmitErrorMessage(
        getApiErrorMessage(
          error,
          isEditMode
            ? "모집 공고 수정에 실패했어요. 잠시 후 다시 시도해주세요."
            : "모집 공고 등록에 실패했어요. 잠시 후 다시 시도해주세요.",
        ),
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

  if (created) {
    const createdDeadline = splitDeadlineAt(created.deadlineAt);

    return (
      <RecruitmentCreatedScreen
        rows={[
          ["공고 제목", created.recruitmentTitle ?? title.trim()],
          ["모집 파트", created.part ?? part],
          ["실력대", created.skillLevel ?? skillLevel],
          ["장르", created.genre ?? genre],
          ["활동 지역", created.region ?? region],
          [
            "모집 마감",
            `${formatDeadlineDate(createdDeadline.deadlineDate || deadlineDate)} ${
              createdDeadline.deadlineTime || deadlineTime
            }`,
          ],
        ]}
        onBackToSession={() =>
          router.replace("/band/session" as Parameters<typeof router.replace>[0])
        }
        onConfirmPost={() =>
          router.replace(
            `/band/session/recruitments/${created.sessionRecruitmentId}` as Parameters<
              typeof router.replace
            >[0],
          )
        }
      />
    );
  }

  const isDateMissing = showErrors && !deadlineDate.trim();
  const isTimeMissing = showErrors && !deadlineTime.trim();
  const headerTitle = isEditMode ? "세션 모집 공고 수정" : "세션 모집 공고 등록";

  return (
    <Screen scroll={false} contentStyle={styles.container}>
      <SessionFormTopBar
        title={headerTitle}
        onBack={() => setIsCancelModalOpen(true)}
        onClose={() => router.back()}
      />

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
      >
        <StepIndicator step={step} />

        <View style={styles.body}>
          <View style={styles.formCard}>
            {step === 1 ? (
              <>
                <Field
                  label="공고 제목"
                  required
                  error={showErrors && !title.trim() ? "공고명은 필수 항목이에요" : ""}
                >
                  <SessionTextInput
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
                  error={
                    showErrors && !summary.trim()
                      ? "공고 한줄 소개는 필수 항목이에요"
                      : ""
                  }
                >
                  <SessionTextInput
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
                  error={
                    showErrors && !content.trim()
                      ? "공고 상세 소개는 필수 항목이에요"
                      : ""
                  }
                >
                  <SessionCountedTextArea
                    value={content}
                    height={58}
                    maxLength={DETAIL_MAX_LENGTH}
                    error={showErrors && !content.trim()}
                    placeholder="모집 공고의 상세 내용을 입력해주세요"
                    onChangeText={setContent}
                  />
                </Field>

                <Field
                  label="모집 파트"
                  required
                  chips
                  error={showErrors && !part.trim() ? "파트를 선택해주세요" : ""}
                >
                  <SessionChips
                    chipStyle="recruitment"
                    options={PART_OPTIONS}
                    isSelected={(item) => part === item}
                    onPress={setPart}
                  />
                </Field>

                <Field label="실력대" required chips>
                  <SessionChips
                    chipStyle="recruitment"
                    options={SKILL_OPTIONS}
                    isSelected={(item) => skillLevel === item}
                    onPress={setSkillLevel}
                  />
                </Field>

                <Field
                  label="장르"
                  required
                  error={showErrors && !genre.trim() ? "장르를 선택해주세요" : ""}
                >
                  <SessionPickerButton
                    value={genre}
                    placeholder="장르 선택"
                    error={showErrors && !genre.trim()}
                    trailing={<AppIcon name="arrowDownGray" width={12} height={7} />}
                    onPress={() => setIsGenreSheetOpen(true)}
                  />
                </Field>
              </>
            ) : (
              <>
                <Field
                  label="활동 지역"
                  required
                  raised
                  error={
                    showErrors && !region.trim() ? "활동 지역을 선택해주세요" : ""
                  }
                >
                  <SessionSelect
                    value={region}
                    options={REGION_OPTIONS}
                    placeholder="지역 선택"
                    error={showErrors && !region.trim()}
                    onChange={setRegion}
                  />
                </Field>

                <Field
                  label="연습 일정"
                  required
                  error={
                    showErrors && !practiceSchedule.trim()
                      ? "연습 일정은 필수 항목이에요"
                      : ""
                  }
                >
                  <SessionTextInput
                    value={practiceSchedule}
                    placeholder="연습 일정을 작성해주세요"
                    maxLength={50}
                    error={showErrors && !practiceSchedule.trim()}
                    onChangeText={setPracticeSchedule}
                  />
                </Field>

                <Field
                  label="연습 장소"
                  required
                  error={
                    showErrors && !practicePlace.trim()
                      ? "연습 장소는 필수 항목이에요"
                      : ""
                  }
                >
                  <SessionTextInput
                    value={practicePlace}
                    placeholder="연습 장소를 작성해주세요"
                    maxLength={50}
                    error={showErrors && !practicePlace.trim()}
                    onChangeText={setPracticePlace}
                  />
                </Field>

                <Field label="모집 마감일" required>
                  <View style={styles.deadlineFields}>
                    <SessionPickerButton
                      value={formatDeadlineDate(deadlineDate)}
                      placeholder="날짜 선택"
                      error={isDateMissing}
                      trailing={<AppIcon name="sessionDeadlineDate" size={16} />}
                      onPress={() => setIsDatePickerOpen(true)}
                    />
                    <SessionPickerButton
                      value={deadlineTime}
                      placeholder="시간 선택"
                      error={isTimeMissing}
                      trailing={<AppIcon name="sessionDeadlineTime" size={16} />}
                      onPress={() => setIsTimePickerOpen(true)}
                    />
                  </View>
                  {isDateMissing ? (
                    <Text style={styles.errorText}>
                      모집 마감 날짜를 선택해주세요
                    </Text>
                  ) : null}
                  {isTimeMissing ? (
                    <Text style={styles.errorText}>
                      모집 마감 시간을 선택해주세요
                    </Text>
                  ) : null}
                </Field>

                <Field
                  label="지원 자격"
                  required
                  error={
                    showErrors && !qualification.trim()
                      ? "지원 자격은 필수 항목이에요"
                      : ""
                  }
                >
                  <SessionCountedTextArea
                    value={qualification}
                    height={58}
                    maxLength={DETAIL_MAX_LENGTH}
                    error={showErrors && !qualification.trim()}
                    placeholder="지원 자격을 입력해주세요"
                    onChangeText={setQualification}
                  />
                </Field>
              </>
            )}
          </View>
        </View>

        <View style={styles.submitArea}>
          {step === 2 && submitErrorMessage ? (
            <Text style={styles.submitError}>{submitErrorMessage}</Text>
          ) : null}

          {step === 1 ? (
            <SubmitButton active={!hasStep1Error} label="다음" onPress={goNext} />
          ) : (
            <SubmitButton
              active={!hasStep2Error && !isSubmitting}
              disabled={isSubmitting}
              label={
                isSubmitting
                  ? isEditMode
                    ? "수정 중"
                    : "등록 중"
                  : isEditMode
                    ? "수정하기"
                    : "모집 공고 등록"
              }
              onPress={() => void submit()}
            />
          )}
        </View>
      </ScrollView>

      <ConfirmModal
        open={isCancelModalOpen}
        tone="orange"
        title={
          isEditMode
            ? "모집 공고 수정을 취소할까요?"
            : "모집 공고 등록을 취소할까요?"
        }
        description={"입력한 내용은 저장되지 않고\n사라집니다."}
        onCancel={() => setIsCancelModalOpen(false)}
        onConfirm={() => {
          setIsCancelModalOpen(false);
          router.back();
        }}
      />

      <SessionSelectSheet
        open={isGenreSheetOpen}
        title="장르"
        options={GENRE_OPTIONS}
        selectedValue={genre}
        onSelect={setGenre}
        onClose={() => setIsGenreSheetOpen(false)}
      />

      <SessionDatePickerSheet
        open={isDatePickerOpen}
        value={deadlineDate}
        minDate={getTodayDateKey()}
        onClose={() => setIsDatePickerOpen(false)}
        onSelect={(dateKey) => {
          setDeadlineDate(dateKey);
          setIsDatePickerOpen(false);
        }}
      />

      <SessionTimePickerSheet
        open={isTimePickerOpen}
        value={deadlineTime}
        title="모집 마감 시간"
        onClose={() => setIsTimePickerOpen(false)}
        onConfirm={(time) => {
          setDeadlineTime(time);
          setIsTimePickerOpen(false);
        }}
      />
    </Screen>
  );
}

function StepIndicator({ step }: { step: Step }) {
  return (
    <View style={styles.stepWrap}>
      <StepNode active={step === 1} complete={step === 2} label="기본 정보" number={1} />
      <View style={[styles.stepLine, step === 2 && styles.stepLineActive]} />
      <StepNode active={step === 2} label="상세 정보" number={2} />
    </View>
  );
}

function StepNode({
  active,
  complete = false,
  label,
  number,
}: {
  active: boolean;
  complete?: boolean;
  label: string;
  number: number;
}) {
  const highlighted = active || complete;

  return (
    <View style={styles.stepNode}>
      <View style={[styles.stepCircle, highlighted && styles.stepCircleActive]}>
        <Text style={styles.stepNumber}>{complete ? "✓" : number}</Text>
      </View>
      <Text style={[styles.stepLabel, highlighted && styles.stepLabelActive]}>
        {label}
      </Text>
    </View>
  );
}

function Field({
  label,
  required = false,
  chips = false,
  raised = false,
  error = "",
  children,
}: {
  label: string;
  required?: boolean;
  chips?: boolean;
  raised?: boolean;
  error?: string;
  children: ReactNode;
}) {
  return (
    <View style={raised && styles.fieldRaised}>
      <Text style={[styles.label, chips && styles.labelChips]}>
        {label}
        {required ? <Text style={styles.required}> *</Text> : null}
      </Text>
      {children}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

function SubmitButton({
  active,
  disabled = false,
  label,
  onPress,
}: {
  active: boolean;
  disabled?: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      style={[styles.submitButton, active && styles.submitButtonActive]}
      onPress={onPress}
    >
      <Text style={[styles.submitText, active && styles.submitTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    backgroundColor: colors.secondary0,
  },
  scrollContent: {
    paddingBottom: 92,
  },
  stepWrap: {
    height: 77,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
    backgroundColor: colors.secondary0,
    paddingTop: 16,
  },
  stepNode: {
    width: 58,
    alignItems: "center",
    gap: 3,
  },
  stepCircle: {
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: colors.neutral500,
  },
  stepCircleActive: {
    backgroundColor: colors.secondary500,
  },
  stepNumber: {
    ...textStyles.body4,
    color: colors.white,
  },
  stepLabel: {
    ...textStyles.body4,
    color: colors.neutral500,
  },
  stepLabelActive: {
    color: colors.secondary500,
  },
  stepLine: {
    width: 128,
    height: 2,
    marginTop: 9,
    backgroundColor: colors.neutral400,
  },
  stepLineActive: {
    backgroundColor: colors.secondary500,
  },
  body: {
    paddingHorizontal: 20,
  },
  formCard: {
    gap: 12,
    borderRadius: 16,
    backgroundColor: colors.white,
    paddingHorizontal: 18,
    paddingVertical: 16,
    boxShadow: "0px 0px 8px 0px rgba(0, 0, 0, 0.08)",
  },
  fieldRaised: {
    zIndex: 10,
  },
  label: {
    ...textStyles.body1,
    marginBottom: 4,
    color: colors.neutral900,
  },
  labelChips: {
    marginBottom: 8,
  },
  required: {
    color: colors.error,
  },
  errorText: {
    ...textStyles.body4,
    marginTop: 4,
    color: colors.error,
  },
  deadlineFields: {
    gap: 4,
  },
  submitArea: {
    gap: 8,
    marginTop: 18,
    paddingHorizontal: 20,
  },
  submitError: {
    ...textStyles.body5,
    color: colors.error,
    textAlign: "center",
  },
  submitButton: {
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: colors.neutral300,
  },
  submitButtonActive: {
    backgroundColor: colors.secondary500,
  },
  submitText: {
    ...textStyles.label1,
    color: colors.neutral600,
  },
  submitTextActive: {
    color: colors.white,
  },
});

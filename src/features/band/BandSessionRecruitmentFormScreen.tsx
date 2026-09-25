import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

import {
  useCreateSessionRecruitment,
  useSessionRecruitmentEditInfoQuery,
  useUpdateSessionRecruitment,
} from "@/hooks/api/session/useSessionRecruitment";
import { useBandMyPageQuery } from "@/hooks/api/user/useBandMyPage";
import { AppButton } from "@/shared/components/AppButton";
import { AppCard } from "@/shared/components/AppCard";
import { AppHeader } from "@/shared/components/AppHeader";
import { AppState } from "@/shared/components/AppState";
import { AppTextInput } from "@/shared/components/AppTextInput";
import { Chip } from "@/shared/components/Chip";
import { Screen } from "@/shared/components/Screen";
import { colors, spacing } from "@/shared/constants/theme";
import type {
  CreateSessionRecruitmentRequest,
  SessionRecruitmentEditInfoResponse,
  UpdateSessionRecruitmentRequest,
} from "@/types/session/sessionRecruitment";

const PART_OPTIONS = ["보컬", "기타", "베이스", "키보드", "드럼", "etc"];
const SKILL_OPTIONS = ["입문", "중급", "상급"];

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
  const requiredValues = {
    title,
    summary,
    content,
    part,
    skillLevel,
    genre,
    region,
    practiceSchedule,
    practicePlace,
    deadlineDate,
    deadlineTime,
    qualification,
  };
  const hasRequiredError = Object.values(requiredValues).some(
    (value) => !value.trim(),
  );

  const submit = async () => {
    if (hasRequiredError) {
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

  return (
    <Screen contentStyle={styles.container}>
      <AppHeader title={isEditMode ? "모집 공고 수정" : "모집 공고 등록"} />

      <AppCard style={styles.formCard}>
        <AppTextInput
          label="공고 제목"
          value={title}
          placeholder="함께할 세션을 찾는 제목"
          error={showErrors && !title.trim() ? "제목을 입력해 주세요." : undefined}
          onChangeText={setTitle}
        />
        <AppTextInput
          label="한 줄 소개"
          value={summary}
          placeholder="공고를 짧게 소개해 주세요"
          error={
            showErrors && !summary.trim() ? "한 줄 소개를 입력해 주세요." : undefined
          }
          onChangeText={setSummary}
        />
        <AppTextInput
          label="상세 내용"
          value={content}
          placeholder="활동 방향, 원하는 멤버, 분위기 등을 적어주세요"
          multiline
          textAlignVertical="top"
          style={styles.multilineInput}
          error={
            showErrors && !content.trim() ? "상세 내용을 입력해 주세요." : undefined
          }
          onChangeText={setContent}
        />

        <View style={styles.field}>
          <Text style={styles.label}>모집 파트</Text>
          <View style={styles.chips}>
            {PART_OPTIONS.map((item) => (
              <Chip
                key={item}
                label={item}
                selected={part === item}
                onPress={() => setPart(item)}
              />
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>실력</Text>
          <View style={styles.chips}>
            {SKILL_OPTIONS.map((item) => (
              <Chip
                key={item}
                label={item}
                selected={skillLevel === item}
                onPress={() => setSkillLevel(item)}
              />
            ))}
          </View>
        </View>

        <AppTextInput
          label="장르"
          value={genre}
          placeholder="예: 인디"
          error={showErrors && !genre.trim() ? "장르를 입력해 주세요." : undefined}
          onChangeText={setGenre}
        />
        <AppTextInput
          label="지역"
          value={region}
          placeholder="예: 서울"
          error={showErrors && !region.trim() ? "지역을 입력해 주세요." : undefined}
          onChangeText={setRegion}
        />
        <AppTextInput
          label="연습 일정"
          value={practiceSchedule}
          placeholder="예: 매주 토요일 오후"
          error={
            showErrors && !practiceSchedule.trim()
              ? "연습 일정을 입력해 주세요."
              : undefined
          }
          onChangeText={setPracticeSchedule}
        />
        <AppTextInput
          label="연습 장소"
          value={practicePlace}
          placeholder="예: 홍대 합주실"
          error={
            showErrors && !practicePlace.trim()
              ? "연습 장소를 입력해 주세요."
              : undefined
          }
          onChangeText={setPracticePlace}
        />
        <View style={styles.rowFields}>
          <AppTextInput
            label="마감일"
            value={deadlineDate}
            placeholder="YYYY-MM-DD"
            error={
              showErrors && !deadlineDate.trim()
                ? "마감일을 입력해 주세요."
                : undefined
            }
            style={styles.flexInput}
            onChangeText={setDeadlineDate}
          />
          <AppTextInput
            label="마감 시간"
            value={deadlineTime}
            placeholder="HH:mm"
            error={
              showErrors && !deadlineTime.trim()
                ? "마감 시간을 입력해 주세요."
                : undefined
            }
            style={styles.flexInput}
            onChangeText={setDeadlineTime}
          />
        </View>
        <AppTextInput
          label="지원 자격"
          value={qualification}
          placeholder="필수 경험이나 조건을 적어주세요"
          multiline
          textAlignVertical="top"
          style={styles.multilineInput}
          error={
            showErrors && !qualification.trim()
              ? "지원 자격을 입력해 주세요."
              : undefined
          }
          onChangeText={setQualification}
        />

        <AppButton
          label={isEditMode ? "수정 완료" : "모집 공고 등록"}
          loading={isSubmitting}
          onPress={() => void submit()}
        />
      </AppCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  formCard: {
    gap: spacing.lg,
  },
  field: {
    gap: spacing.sm,
  },
  label: {
    color: colors.neutral800,
    fontSize: 14,
    fontWeight: "700",
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  rowFields: {
    gap: spacing.md,
  },
  flexInput: {
    flex: 1,
  },
  multilineInput: {
    minHeight: 112,
    paddingTop: spacing.md,
  },
});

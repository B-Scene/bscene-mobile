import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Svg, { Circle, Path } from "react-native-svg";

import {
  useBandPerformanceQuery,
  useCreateBandPerformance,
  useUpdateBandPerformance,
} from "@/hooks/api/band/useBand";
import { useActiveBandId } from "@/hooks/api/user/useMyProfiles";
import { AppButton } from "@/shared/components/AppButton";
import { AppHeader } from "@/shared/components/AppHeader";
import { AppState } from "@/shared/components/AppState";
import { Screen } from "@/shared/components/Screen";
import { colors } from "@/shared/constants/theme";
import type {
  CreatePerformanceRequest,
  PerformanceAgeRating,
  PerformanceResponse,
  UpdatePerformanceRequest,
} from "@/types/band/performance";

type Step = 1 | 2;

const DESCRIPTION_MAX_LENGTH = 500;

const AGE_RATINGS: { label: string; value: PerformanceAgeRating }[] = [
  { label: "전체", value: "ALL" },
  { label: "12세", value: "AGE_12" },
  { label: "15세", value: "AGE_15" },
  { label: "19세", value: "AGE_19" },
];

const parseRouteId = (value?: string | string[]) => {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const parsed = Number(rawValue);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const splitTags = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim().replace(/^#/, ""))
    .filter(Boolean);

export function BandPerformanceFormScreen() {
  const params = useLocalSearchParams<{ performanceId?: string }>();
  const performanceId = parseRouteId(params.performanceId);
  const isEditMode = Boolean(performanceId);
  const activeBandQuery = useActiveBandId();
  const performanceQuery = useBandPerformanceQuery(performanceId);
  const bandId = activeBandQuery.activeBandId;

  if (activeBandQuery.isLoading || (isEditMode && performanceQuery.isLoading)) {
    return (
      <Screen contentStyle={styles.container}>
        <AppHeader title={isEditMode ? "공연 수정" : "공연 등록"} />
        <AppState loading title="공연 정보를 준비하는 중이에요" />
      </Screen>
    );
  }

  if (!bandId) {
    return (
      <Screen contentStyle={styles.container}>
        <AppHeader title={isEditMode ? "공연 수정" : "공연 등록"} />
        <AppState
          title="등록된 밴드를 찾지 못했어요"
          description="밴드 프로필을 먼저 확인해 주세요."
        />
      </Screen>
    );
  }

  if (isEditMode && (performanceQuery.isError || !performanceQuery.data)) {
    return (
      <Screen contentStyle={styles.container}>
        <AppHeader title="공연 수정" />
        <AppState
          title="공연 정보를 불러오지 못했어요"
          description="삭제되었거나 네트워크 연결이 불안정할 수 있어요."
          actionLabel="다시 시도"
          onAction={() => void performanceQuery.refetch()}
        />
      </Screen>
    );
  }

  return (
    <PerformanceForm
      key={performanceId ?? "new"}
      bandId={bandId}
      performanceId={performanceId}
      initialPerformance={performanceQuery.data}
    />
  );
}

function PerformanceForm({
  bandId,
  performanceId,
  initialPerformance,
}: {
  bandId: number;
  performanceId: number | null;
  initialPerformance?: PerformanceResponse;
}) {
  const isEditMode = Boolean(performanceId && initialPerformance);
  const createPerformance = useCreateBandPerformance(bandId);
  const updatePerformance = useUpdateBandPerformance(performanceId);
  const [step, setStep] = useState<Step>(1);
  const [title, setTitle] = useState(initialPerformance?.title ?? "");
  const [genre, setGenre] = useState(initialPerformance?.genre ?? "");
  const [performanceDate, setPerformanceDate] = useState(
    initialPerformance?.performanceDate ?? "",
  );
  const [startTime, setStartTime] = useState(initialPerformance?.startTime ?? "");
  const [region, setRegion] = useState(initialPerformance?.region ?? "");
  const [venue, setVenue] = useState(initialPerformance?.venue ?? "");
  const [description, setDescription] = useState(
    initialPerformance?.description ?? "",
  );
  const [ticketPrice, setTicketPrice] = useState(
    initialPerformance?.ticketPrice ?? "",
  );
  const [ticketLink, setTicketLink] = useState(
    initialPerformance?.ticketLink ?? "",
  );
  const [posterImageUrl, setPosterImageUrl] = useState(
    initialPerformance?.posterImageUrl ?? "",
  );
  const [ageRating, setAgeRating] = useState<PerformanceAgeRating>(
    initialPerformance?.ageRating ?? "ALL",
  );
  const [tags, setTags] = useState(initialPerformance?.tags?.join(", ") ?? "");
  const [showErrors, setShowErrors] = useState(false);
  const isSubmitting = createPerformance.isPending || updatePerformance.isPending;
  const hasStep1Error = [title, genre, region, description].some(
    (value) => !value.trim(),
  );
  const hasStep2Error = [performanceDate, startTime, venue, ticketPrice].some(
    (value) => !value.trim(),
  );

  const submit = async () => {
    if (hasStep1Error || hasStep2Error) {
      setShowErrors(true);
      return;
    }

    const nextTags = splitTags(tags);
    const commonPayload = {
      title: title.trim(),
      genre: genre.trim(),
      performanceDate: performanceDate.trim(),
      startTime: startTime.trim(),
      region: region.trim(),
      venue: venue.trim(),
      description: description.trim(),
      ticketPrice: ticketPrice.trim(),
      ticketLink: ticketLink.trim() || undefined,
      posterImageUrl: posterImageUrl.trim() || undefined,
      ageRating,
      tags: nextTags.length > 0 ? nextTags : undefined,
    };

    const onSuccess = (nextPerformanceId: number) => {
      router.replace(
        `/band/home/concerts/${nextPerformanceId}` as Parameters<
          typeof router.replace
        >[0],
      );
    };

    try {
      if (isEditMode && performanceId) {
        const result = await updatePerformance.mutateAsync(
          commonPayload satisfies UpdatePerformanceRequest,
        );
        onSuccess(result.performanceId);
        return;
      }

      const result = await createPerformance.mutateAsync(
        commonPayload satisfies CreatePerformanceRequest,
      );
      onSuccess(result.performanceId);
    } catch {
      Alert.alert(
        isEditMode ? "공연 수정" : "공연 등록",
        "공연 정보를 저장하지 못했어요.",
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
      <AppHeader title={isEditMode ? "공연 수정" : "공연 등록"} />
      <StepIndicator step={step} />

      <View style={styles.body}>
        <View style={styles.formCard}>
          {step === 1 ? (
            <>
              <Field label="공연명" required error={showErrors && !title.trim()}>
                <NativeInput
                  value={title}
                  placeholder="공연 제목을 입력해주세요"
                  error={showErrors && !title.trim()}
                  onChangeText={setTitle}
                />
              </Field>

              <Field label="장르" required error={showErrors && !genre.trim()}>
                <NativeInput
                  value={genre}
                  placeholder="장르 선택"
                  error={showErrors && !genre.trim()}
                  onChangeText={setGenre}
                />
              </Field>

              <Field label="지역" required error={showErrors && !region.trim()}>
                <NativeInput
                  value={region}
                  placeholder="지역 선택"
                  error={showErrors && !region.trim()}
                  onChangeText={setRegion}
                />
              </Field>

              <Field label="관람 연령" required>
                <View style={styles.ageRow}>
                  {AGE_RATINGS.map((item) => (
                    <Pressable
                      key={item.value}
                      accessibilityRole="button"
                      style={[
                        styles.ageButton,
                        ageRating === item.value
                          ? styles.ageButtonSelected
                          : styles.ageButtonIdle,
                      ]}
                      onPress={() => setAgeRating(item.value)}
                    >
                      <Text
                        style={[
                          styles.ageButtonText,
                          ageRating === item.value
                            ? styles.ageButtonTextSelected
                            : styles.ageButtonTextIdle,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </Field>

              <Field label="공연 포스터">
                <View style={styles.posterBox}>
                  {posterImageUrl.trim() ? (
                    <Image
                      source={{ uri: posterImageUrl.trim() }}
                      style={styles.posterPreview}
                    />
                  ) : (
                    <View style={styles.posterPlaceholder}>
                      <PosterIcon />
                      <Text style={styles.posterPlaceholderText}>
                        공연 포스터 URL을 입력해주세요
                      </Text>
                    </View>
                  )}
                </View>
                <NativeInput
                  value={posterImageUrl}
                  placeholder="포스터 이미지 URL"
                  autoCapitalize="none"
                  onChangeText={setPosterImageUrl}
                />
              </Field>

              <Field
                label="공연 소개"
                required
                error={showErrors && !description.trim()}
              >
                <NativeInput
                  value={description}
                  placeholder="공연에 대해 소개해주세요"
                  multiline
                  maxLength={DESCRIPTION_MAX_LENGTH}
                  error={showErrors && !description.trim()}
                  onChangeText={setDescription}
                />
                <Text style={styles.countText}>
                  {description.length}/{DESCRIPTION_MAX_LENGTH}
                </Text>
              </Field>

              <Field label="태그">
                <NativeInput
                  value={tags}
                  placeholder="쉼표로 구분해서 입력"
                  onChangeText={setTags}
                />
                {splitTags(tags).length > 0 ? (
                  <View style={styles.tagPreview}>
                    {splitTags(tags).slice(0, 8).map((tag) => (
                      <View key={tag} style={styles.tagChip}>
                        <Text style={styles.tagChipText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}
              </Field>
            </>
          ) : (
            <>
              <Field
                label="공연 날짜"
                required
                error={showErrors && !performanceDate.trim()}
              >
                <NativeInput
                  value={performanceDate}
                  placeholder="YYYY-MM-DD"
                  error={showErrors && !performanceDate.trim()}
                  onChangeText={setPerformanceDate}
                />
              </Field>

              <Field
                label="공연 시작 시간"
                required
                error={showErrors && !startTime.trim()}
              >
                <NativeInput
                  value={startTime}
                  placeholder="HH:mm"
                  error={showErrors && !startTime.trim()}
                  onChangeText={setStartTime}
                />
              </Field>

              <Field label="공연 장소" required error={showErrors && !venue.trim()}>
                <NativeInput
                  value={venue}
                  placeholder="공연 장소를 작성해주세요"
                  error={showErrors && !venue.trim()}
                  onChangeText={setVenue}
                />
              </Field>

              <Field
                label="티켓 가격"
                required
                error={showErrors && !ticketPrice.trim()}
              >
                <NativeInput
                  value={ticketPrice}
                  placeholder="티켓 가격을 작성해주세요"
                  error={showErrors && !ticketPrice.trim()}
                  onChangeText={setTicketPrice}
                />
              </Field>

              <Field label="티켓 예매 링크 (선택)">
                <NativeInput
                  value={ticketLink}
                  placeholder="예매 링크 또는 관련 게시글 링크를 첨부해주세요"
                  autoCapitalize="none"
                  onChangeText={setTicketLink}
                />
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
              label={isSubmitting ? "저장 중..." : isEditMode ? "수정 완료" : "공연 등록"}
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
          일정 & 장소
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

function PosterIcon() {
  return (
    <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 5.5C4 4.672 4.672 4 5.5 4H18.5C19.328 4 20 4.672 20 5.5V18.5C20 19.328 19.328 20 18.5 20H5.5C4.672 20 4 19.328 4 18.5V5.5Z"
        stroke={colors.secondary500}
        strokeWidth={2}
      />
      <Path
        d="M6.5 16L10 12.5L12.5 15L14.5 13L18 16.5"
        stroke={colors.secondary500}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx={16} cy={8} r={1.5} fill={colors.secondary500} />
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
    paddingVertical: 12,
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
    minHeight: 60,
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
  ageRow: {
    flexDirection: "row",
    gap: 8,
  },
  ageButton: {
    flex: 1,
    height: 26,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  ageButtonSelected: {
    backgroundColor: colors.secondary500,
  },
  ageButtonIdle: {
    backgroundColor: colors.neutral300,
  },
  ageButtonText: {
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 14,
  },
  ageButtonTextSelected: {
    color: colors.white,
  },
  ageButtonTextIdle: {
    color: colors.neutral600,
  },
  posterBox: {
    minHeight: 128,
    borderWidth: 1,
    borderColor: colors.neutral400,
    borderRadius: 5,
    overflow: "hidden",
    backgroundColor: colors.white,
  },
  posterPreview: {
    width: "100%",
    height: 128,
  },
  posterPlaceholder: {
    flex: 1,
    minHeight: 128,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 16,
  },
  posterPlaceholderText: {
    color: colors.neutral500,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 18,
  },
  countText: {
    alignSelf: "flex-end",
    color: colors.neutral400,
    fontSize: 10,
    fontWeight: "500",
    lineHeight: 12,
    marginTop: -22,
    marginRight: 10,
  },
  tagPreview: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tagChip: {
    minHeight: 26,
    borderRadius: 999,
    backgroundColor: colors.secondary100,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 15,
  },
  tagChipText: {
    color: colors.secondary500,
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 14,
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

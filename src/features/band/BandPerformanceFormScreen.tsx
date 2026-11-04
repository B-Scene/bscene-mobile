import { router, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { uploadMediaAsset } from "@/api/media/media";
import {
  DatePickerSheet,
  TimePickerSheet,
} from "@/features/band/BandDateTimeSheets";
import {
  DescriptionInput,
  FormField,
  MAX_TAGS,
  MediaSourceSheet,
  RegisterComplete,
  TagInput,
} from "@/features/band/BandFormParts";
import {
  FormInput,
  SelectField,
  SubmitButton,
} from "@/features/my/MyFormParts";
import {
  useBandPerformanceQuery,
  useCreateBandPerformance,
  useUpdateBandPerformance,
} from "@/hooks/api/band/useBand";
import { useActiveBandId } from "@/hooks/api/user/useMyProfiles";
import { AppHeader } from "@/shared/components/AppHeader";
import { AppIcon } from "@/shared/components/AppIcon";
import { AppState } from "@/shared/components/AppState";
import { ConfirmModal } from "@/shared/components/ConfirmModal";
import { Screen } from "@/shared/components/Screen";
import {
  BAND_GENRE_LABELS,
  BAND_REGION_LABELS,
} from "@/shared/constants/bandLabels";
import { colors, textStyles } from "@/shared/constants/theme";
import { getApiErrorMessage } from "@/shared/utils/getApiErrorMessage";
import type {
  CreatePerformanceRequest,
  PerformanceAgeRating,
  PerformanceResponse,
  UpdatePerformanceRequest,
} from "@/types/band/performance";

type Step = 1 | 2;

const AGE_RATINGS: { label: string; value: PerformanceAgeRating }[] = [
  { label: "전체 관람가", value: "ALL" },
  { label: "12세 이상", value: "AGE_12" },
  { label: "15세 이상", value: "AGE_15" },
  { label: "19세 이상", value: "AGE_19" },
];

const toOptions = (labels: Record<string, string>) =>
  Object.entries(labels).map(([value, label]) => ({ value, label }));

const GENRE_OPTIONS = toOptions(BAND_GENRE_LABELS);
const REGION_OPTIONS = toOptions(BAND_REGION_LABELS);

const formatDateRange = (start: string, end: string) => {
  if (!start) return "";

  const startLabel = start.replaceAll("-", ".");

  if (!end || end === start) return startLabel;

  return `${startLabel} - ${end.replaceAll("-", ".")}`;
};

const parseRouteId = (value?: string | string[]) => {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const parsed = Number(rawValue);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

type SelectedPosterAsset = {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
};

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
        <AppHeader title={isEditMode ? "공연 수정" : "공연 등록"} style={styles.stateHeader} />
        <AppState loading title="공연 정보를 준비하는 중이에요" />
      </Screen>
    );
  }

  if (!bandId) {
    return (
      <Screen contentStyle={styles.container}>
        <AppHeader title={isEditMode ? "공연 수정" : "공연 등록"} style={styles.stateHeader} />
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
        <AppHeader title="공연 수정" style={styles.stateHeader} />
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
  const [endDate, setEndDate] = useState(
    initialPerformance?.performanceDate ?? "",
  );
  const [startTime, setStartTime] = useState(
    initialPerformance?.startTime.slice(0, 5) ?? "",
  );
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
  const posterImageUrl = initialPerformance?.posterImageUrl ?? "";
  const [selectedPoster, setSelectedPoster] =
    useState<SelectedPosterAsset | null>(null);
  const [ageRating, setAgeRating] = useState<PerformanceAgeRating | "">(
    initialPerformance?.ageRating ?? "",
  );
  const [tags, setTags] = useState(initialPerformance?.tags ?? []);
  const [isSourceSheetOpen, setIsSourceSheetOpen] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);
  const [isLeaveConfirmOpen, setIsLeaveConfirmOpen] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [completedPerformanceId, setCompletedPerformanceId] = useState<
    number | null
  >(null);
  const isSubmitting =
    createPerformance.isPending || updatePerformance.isPending || uploading;
  const hasStep1Error = [title, genre, region, ageRating, description].some(
    (value) => !value.trim(),
  );
  const hasStep2Error = [performanceDate, startTime, venue, ticketPrice].some(
    (value) => !value.trim(),
  );
  const posterPreviewUrl = selectedPoster?.uri ?? posterImageUrl.trim();
  const titleError = showErrors && !title.trim();
  const genreError = showErrors && !genre.trim();
  const regionError = showErrors && !region.trim();
  const ageRatingError = showErrors && !ageRating;
  const descriptionError = showErrors && !description.trim();
  const dateError = showErrors && !performanceDate.trim();
  const timeError = showErrors && !startTime.trim();
  const venueError = showErrors && !venue.trim();
  const priceError = showErrors && !ticketPrice.trim();

  const requestPosterPermission = async (camera: boolean) => {
    const permission = camera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "권한 필요",
        camera ? "카메라 권한이 필요해요." : "사진 접근 권한이 필요해요.",
      );

      return false;
    }

    return true;
  };

  const pickPoster = async (camera: boolean) => {
    if (!(await requestPosterPermission(camera))) {
      return;
    }

    const result = camera
      ? await ImagePicker.launchCameraAsync({
          mediaTypes: ["images"],
          allowsEditing: true,
          aspect: [3, 4],
          quality: 0.85,
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          allowsEditing: true,
          aspect: [3, 4],
          quality: 0.85,
        });

    if (result.canceled || !result.assets[0]) {
      return;
    }

    const asset = result.assets[0];

    setSelectedPoster({
      uri: asset.uri,
      fileName: asset.fileName,
      mimeType: asset.mimeType,
    });
  };

  const submit = async () => {
    if (hasStep1Error || hasStep2Error || !ageRating) {
      setShowErrors(true);
      return;
    }

    const onSuccess = (nextPerformanceId: number) => {
      setCompletedPerformanceId(nextPerformanceId);
    };

    try {
      setSubmitError(null);
      setUploading(true);

      const uploadedPosterUrl = selectedPoster
        ? await uploadMediaAsset({
            category: "PERFORMANCE_POSTER",
            uri: selectedPoster.uri,
            fileName: selectedPoster.fileName,
            mimeType: selectedPoster.mimeType,
          })
        : "";

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
        posterImageUrl:
          uploadedPosterUrl || posterImageUrl.trim() || undefined,
        ageRating,
        tags: tags.length > 0 ? tags : undefined,
      };

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
    } catch (error) {
      setSubmitError(
        getApiErrorMessage(error, "저장에 실패했어요. 다시 시도해주세요"),
      );
    } finally {
      setUploading(false);
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

  if (completedPerformanceId !== null) {
    return (
      <Screen contentStyle={styles.completeContainer}>
        <RegisterComplete
          title={isEditMode ? "공연이 수정됐어요" : "공연이 등록됐어요"}
          description={
            isEditMode
              ? "변경사항이 저장됐어요"
              : "팔로워들에게 공연 소식이\n전달됐어요"
          }
          rows={[
            { label: "공연명", value: title },
            { label: "날짜", value: formatDateRange(performanceDate, endDate) },
            { label: "장소", value: venue },
          ]}
          primaryLabel="공연 상세 보기"
          onHome={() => router.replace("/band/home")}
          onPrimary={() =>
            router.replace(
              `/band/home/concerts/${completedPerformanceId}` as Parameters<
                typeof router.replace
              >[0],
            )
          }
        />
      </Screen>
    );
  }

  return (
    <Screen contentStyle={styles.container}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="뒤로가기"
          hitSlop={12}
          onPress={() => setIsLeaveConfirmOpen(true)}
        >
          <AppIcon name="arrowLeft" size={24} />
        </Pressable>
        <Text numberOfLines={1} style={styles.headerTitle}>
          {isEditMode ? "공연 수정" : "공연 등록"}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="닫기"
          hitSlop={12}
          onPress={() => setIsLeaveConfirmOpen(true)}
        >
          <AppIcon name="close" size={24} />
        </Pressable>
      </View>

      <StepIndicator step={step} />

      <View style={styles.body}>
        <View style={styles.formCard}>
          {step === 1 ? (
            <>
              <FormField label="공연명" required error={titleError}>
                <FormInput
                  tone="secondary"
                  value={title}
                  placeholder="공연 제목을 입력해주세요"
                  style={titleError ? styles.inputError : undefined}
                  onChangeText={setTitle}
                />
              </FormField>

              <FormField
                label="장르"
                required
                error={genreError}
                style={styles.genreField}
              >
                <SelectField
                  overlay
                  value={genre}
                  options={GENRE_OPTIONS}
                  placeholder="장르 선택"
                  error={genreError}
                  onChange={setGenre}
                />
              </FormField>

              <FormField
                label="지역"
                required
                error={regionError}
                style={styles.regionField}
              >
                <SelectField
                  overlay
                  value={region}
                  options={REGION_OPTIONS}
                  placeholder="지역 선택"
                  error={regionError}
                  onChange={setRegion}
                />
              </FormField>

              <FormField label="관람 연령" required error={ageRatingError}>
                <View style={styles.ageRow}>
                  {AGE_RATINGS.map((item) => (
                    <Pressable
                      key={item.value}
                      accessibilityRole="button"
                      style={[
                        styles.ageButton,
                        ageRating === item.value
                          ? styles.ageButtonSelected
                          : ageRatingError
                            ? styles.ageButtonError
                            : styles.ageButtonIdle,
                      ]}
                      onPress={() => setAgeRating(item.value)}
                    >
                      <Text
                        numberOfLines={1}
                        style={[
                          styles.ageButtonText,
                          ageRating === item.value &&
                            styles.ageButtonTextSelected,
                          ageRating !== item.value &&
                            ageRatingError &&
                            styles.ageButtonTextError,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </FormField>

              <FormField label="공연 포스터">
                <Pressable
                  accessibilityRole="button"
                  style={styles.posterBox}
                  onPress={() => setIsSourceSheetOpen(true)}
                >
                  {posterPreviewUrl ? (
                    <Image
                      accessibilityLabel="공연 포스터"
                      source={{ uri: posterPreviewUrl }}
                      style={styles.posterPreview}
                    />
                  ) : (
                    <View style={styles.posterPlaceholder}>
                      <AppIcon name="formAddImage" size={24} />
                      <Text style={styles.posterPlaceholderText}>
                        공연 포스터를 업로드해주세요
                      </Text>
                    </View>
                  )}
                </Pressable>
              </FormField>

              <FormField label="공연 소개" required error={descriptionError}>
                <DescriptionInput
                  value={description}
                  placeholder="공연에 대해 소개해주세요"
                  error={descriptionError}
                  onChangeText={setDescription}
                />
              </FormField>

              <FormField label={`태그 (최대 ${MAX_TAGS}개)`}>
                <TagInput tags={tags} onChange={setTags} />
              </FormField>
            </>
          ) : (
            <>
              <FormField label="공연 날짜" required error={dateError}>
                <PickerButton
                  value={formatDateRange(performanceDate, endDate)}
                  placeholder="날짜 선택"
                  icon="formCalendar"
                  error={dateError}
                  onPress={() => setIsDatePickerOpen(true)}
                />
              </FormField>

              <FormField label="공연 시작 시간" required error={timeError}>
                <PickerButton
                  value={startTime}
                  placeholder="시간 선택"
                  icon="formClock"
                  error={timeError}
                  onPress={() => setIsTimePickerOpen(true)}
                />
              </FormField>

              <FormField label="공연 장소" required error={venueError}>
                <FormInput
                  tone="secondary"
                  value={venue}
                  placeholder="공연 장소를 작성해주세요"
                  style={venueError ? styles.inputError : undefined}
                  onChangeText={setVenue}
                />
              </FormField>

              <FormField label="티켓 가격" required error={priceError}>
                <FormInput
                  tone="secondary"
                  value={ticketPrice}
                  placeholder="티켓 가격을 작성해주세요"
                  style={priceError ? styles.inputError : undefined}
                  onChangeText={setTicketPrice}
                />
              </FormField>

              <FormField label="티켓 예매 링크 (선택)">
                <FormInput
                  tone="secondary"
                  value={ticketLink}
                  placeholder="예매 링크 또는 관련 게시글 링크를 첨부해주세요"
                  autoCapitalize="none"
                  onChangeText={setTicketLink}
                />
              </FormField>
            </>
          )}
        </View>
      </View>

      <View style={styles.submitArea}>
        {submitError ? <Text style={styles.submitError}>{submitError}</Text> : null}

        {step === 1 ? (
          <SubmitButton
            tone="secondary"
            label="다음"
            active={!hasStep1Error}
            disabled={false}
            onPress={goNext}
          />
        ) : (
          <SubmitButton
            tone="secondary"
            label={uploading ? "업로드 중..." : isEditMode ? "수정 완료" : "공연 등록"}
            active={!hasStep2Error && !isSubmitting}
            disabled={isSubmitting}
            onPress={() => void submit()}
          />
        )}
      </View>

      <MediaSourceSheet
        open={isSourceSheetOpen}
        onClose={() => setIsSourceSheetOpen(false)}
        onSelect={(camera) => void pickPoster(camera)}
      />

      <DatePickerSheet
        open={isDatePickerOpen}
        startDate={performanceDate}
        endDate={endDate}
        onClose={() => setIsDatePickerOpen(false)}
        onSelect={(range) => {
          setPerformanceDate(range.start);
          setEndDate(range.end);
          setIsDatePickerOpen(false);
        }}
      />

      <TimePickerSheet
        open={isTimePickerOpen}
        value={startTime}
        onClose={() => setIsTimePickerOpen(false)}
        onConfirm={(nextTime) => {
          setStartTime(nextTime);
          setIsTimePickerOpen(false);
        }}
      />

      <ConfirmModal
        open={isLeaveConfirmOpen}
        tone="orange"
        title={isEditMode ? "수정을 취소할까요?" : "공연 등록을 취소할까요?"}
        description={
          isEditMode
            ? "수정한 내용은 저장되지 않고\n사라집니다."
            : "입력한 내용은 저장되지 않고\n사라집니다."
        }
        onCancel={() => setIsLeaveConfirmOpen(false)}
        onConfirm={() => router.replace("/band/home")}
      />
    </Screen>
  );
}

function PickerButton({
  value,
  placeholder,
  icon,
  error,
  onPress,
}: {
  value: string;
  placeholder: string;
  icon: "formCalendar" | "formClock";
  error: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      style={[styles.pickerButton, error && styles.inputError]}
      onPress={onPress}
    >
      <Text style={[styles.pickerText, !value && styles.pickerPlaceholder]}>
        {value || placeholder}
      </Text>
      <AppIcon name={icon} size={16} />
    </Pressable>
  );
}

function StepIndicator({ step }: { step: Step }) {
  return (
    <View style={styles.stepWrap}>
      <View style={[styles.stepItem, styles.stepItemFirst]}>
        <AppIcon name={step > 1 ? "formStepDone" : "formStep1"} size={24} />
        <Text
          style={[styles.stepLabel, step === 1 && styles.stepLabelActive]}
        >
          기본 정보
        </Text>
      </View>
      <View style={[styles.stepLine, step > 1 && styles.stepLineActive]} />
      <View style={styles.stepItem}>
        <AppIcon name={step === 2 ? "formStep2Active" : "formStep2"} size={24} />
        <Text
          style={[styles.stepLabel, step === 2 && styles.stepLabelActive]}
        >
          일정 & 장소
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 24,
    backgroundColor: colors.secondary0,
  },
  completeContainer: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  stateHeader: {
    paddingHorizontal: 15,
  },
  header: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.white,
    paddingHorizontal: 24,
  },
  headerTitle: {
    flexShrink: 1,
    color: colors.neutral900,
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 24,
  },
  stepWrap: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
    gap: 12,
    backgroundColor: colors.secondary0,
    paddingTop: 16,
  },
  stepItem: {
    alignItems: "center",
    gap: 4,
  },
  stepItemFirst: {
    gap: 9,
  },
  stepLine: {
    width: 128,
    height: 2,
    marginTop: 11,
    backgroundColor: colors.secondary300,
  },
  stepLineActive: {
    backgroundColor: colors.secondary500,
  },
  stepLabel: {
    ...textStyles.body4,
    color: colors.neutral400,
    textAlign: "center",
  },
  stepLabelActive: {
    color: colors.secondary500,
  },
  body: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  formCard: {
    gap: 12,
    borderRadius: 16,
    backgroundColor: colors.white,
    paddingHorizontal: 18,
    paddingVertical: 12,
    boxShadow: "0px 0px 8px 0px rgba(0, 0, 0, 0.08)",
  },
  genreField: {
    zIndex: 3,
  },
  regionField: {
    zIndex: 2,
  },
  inputError: {
    borderColor: colors.error,
  },
  ageRow: {
    flexDirection: "row",
    gap: 8,
  },
  ageButton: {
    height: 26,
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  ageButtonSelected: {
    backgroundColor: colors.secondary500,
  },
  ageButtonIdle: {
    backgroundColor: colors.neutral300,
  },
  ageButtonError: {
    borderWidth: 1,
    borderColor: colors.error,
  },
  ageButtonText: {
    ...textStyles.caption3,
    color: colors.neutral600,
    textAlign: "center",
  },
  ageButtonTextSelected: {
    color: colors.white,
  },
  ageButtonTextError: {
    color: colors.error,
  },
  posterBox: {
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
    alignItems: "center",
    gap: 12,
    paddingVertical: 16,
  },
  posterPlaceholderText: {
    ...textStyles.caption2,
    color: colors.neutral500,
  },
  pickerButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.neutral400,
    borderRadius: 5,
    paddingHorizontal: 16,
    paddingVertical: 5,
  },
  pickerText: {
    ...textStyles.caption2,
    flex: 1,
    color: colors.neutral900,
  },
  pickerPlaceholder: {
    color: colors.neutral500,
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
});

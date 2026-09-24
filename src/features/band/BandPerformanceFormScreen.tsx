import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

import {
  useBandPerformanceQuery,
  useCreateBandPerformance,
  useUpdateBandPerformance,
} from "@/hooks/api/band/useBand";
import { useActiveBandId } from "@/hooks/api/user/useMyProfiles";
import { AppButton } from "@/shared/components/AppButton";
import { AppCard } from "@/shared/components/AppCard";
import { AppHeader } from "@/shared/components/AppHeader";
import { AppState } from "@/shared/components/AppState";
import { AppTextInput } from "@/shared/components/AppTextInput";
import { Chip } from "@/shared/components/Chip";
import { Screen } from "@/shared/components/Screen";
import { colors, spacing } from "@/shared/constants/theme";
import type {
  CreatePerformanceRequest,
  PerformanceAgeRating,
  PerformanceResponse,
  UpdatePerformanceRequest,
} from "@/types/band/performance";

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
  const requiredValues = {
    title,
    genre,
    performanceDate,
    startTime,
    region,
    venue,
    description,
    ticketPrice,
  };
  const hasRequiredError = Object.values(requiredValues).some(
    (value) => !value.trim(),
  );

  const submit = async () => {
    if (hasRequiredError) {
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

  return (
    <Screen contentStyle={styles.container}>
      <AppHeader title={isEditMode ? "공연 수정" : "공연 등록"} />

      <AppCard style={styles.formCard}>
        <AppTextInput
          label="공연명"
          value={title}
          placeholder="공연명"
          error={showErrors && !title.trim() ? "공연명을 입력해 주세요." : undefined}
          onChangeText={setTitle}
        />
        <AppTextInput
          label="장르"
          value={genre}
          placeholder="예: ROCK"
          error={showErrors && !genre.trim() ? "장르를 입력해 주세요." : undefined}
          onChangeText={setGenre}
        />
        <View style={styles.rowFields}>
          <AppTextInput
            label="공연일"
            value={performanceDate}
            placeholder="YYYY-MM-DD"
            error={
              showErrors && !performanceDate.trim()
                ? "공연일을 입력해 주세요."
                : undefined
            }
            style={styles.flexInput}
            onChangeText={setPerformanceDate}
          />
          <AppTextInput
            label="시작 시간"
            value={startTime}
            placeholder="HH:mm"
            error={
              showErrors && !startTime.trim()
                ? "시작 시간을 입력해 주세요."
                : undefined
            }
            style={styles.flexInput}
            onChangeText={setStartTime}
          />
        </View>
        <AppTextInput
          label="지역"
          value={region}
          placeholder="예: SEOUL"
          error={showErrors && !region.trim() ? "지역을 입력해 주세요." : undefined}
          onChangeText={setRegion}
        />
        <AppTextInput
          label="장소"
          value={venue}
          placeholder="공연장"
          error={showErrors && !venue.trim() ? "장소를 입력해 주세요." : undefined}
          onChangeText={setVenue}
        />
        <AppTextInput
          label="공연 소개"
          value={description}
          placeholder="공연 소개"
          multiline
          textAlignVertical="top"
          error={
            showErrors && !description.trim()
              ? "공연 소개를 입력해 주세요."
              : undefined
          }
          style={styles.multilineInput}
          onChangeText={setDescription}
        />
        <AppTextInput
          label="티켓 가격"
          value={ticketPrice}
          placeholder="예: 30000원"
          error={
            showErrors && !ticketPrice.trim()
              ? "티켓 가격을 입력해 주세요."
              : undefined
          }
          onChangeText={setTicketPrice}
        />
        <AppTextInput
          label="예매 링크"
          value={ticketLink}
          placeholder="https://"
          autoCapitalize="none"
          onChangeText={setTicketLink}
        />
        <AppTextInput
          label="포스터 URL"
          value={posterImageUrl}
          placeholder="https://"
          autoCapitalize="none"
          onChangeText={setPosterImageUrl}
        />

        <View style={styles.field}>
          <Text style={styles.label}>관람 연령</Text>
          <View style={styles.chips}>
            {AGE_RATINGS.map((item) => (
              <Chip
                key={item.value}
                label={item.label}
                selected={ageRating === item.value}
                onPress={() => setAgeRating(item.value)}
              />
            ))}
          </View>
        </View>

        <AppTextInput
          label="태그"
          value={tags}
          placeholder="쉼표로 구분해서 입력"
          onChangeText={setTags}
        />

        <AppButton
          label={isEditMode ? "수정 완료" : "공연 등록"}
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

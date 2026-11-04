import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import type { BandMemberPart } from "@/api/band/bandManagement";
import { uploadMediaAsset } from "@/api/media/media";
import { BandBanner } from "@/features/my/BandBanner";
import {
  ChipGroup,
  FieldLabel,
  FormInput,
  ProfileImagePicker,
  SelectField,
  SubmitButton,
} from "@/features/my/MyFormParts";
import { MyHeader } from "@/features/my/MyHeader";
import { useProfileImageSelection } from "@/features/my/useProfileImageSelection";
import { useBandQuery } from "@/hooks/api/band/useBand";
import {
  useBandMemberProfileQuery,
  useUpdateBandMemberProfile,
  useUpdateBandProfile,
} from "@/hooks/api/band/useBandManagement";
import { useActiveBandId } from "@/hooks/api/user/useMyProfiles";
import { AppState } from "@/shared/components/AppState";
import { Screen } from "@/shared/components/Screen";
import {
  BAND_GENRE_LABELS,
  BAND_PART_LABELS,
  BAND_REGION_LABELS,
} from "@/shared/constants/bandLabels";
import { colors, textStyles } from "@/shared/constants/theme";

const toOptions = (labels: Record<string, string>) =>
  Object.entries(labels).map(([value, label]) => ({ value, label }));

const GENRE_OPTIONS = toOptions(BAND_GENRE_LABELS);
const REGION_OPTIONS = toOptions(BAND_REGION_LABELS);
const PART_OPTIONS: { value: BandMemberPart; label: string }[] = [
  { value: "VOCAL", label: "보컬" },
  { value: "GUITAR", label: "기타" },
  { value: "BASS", label: "베이스" },
  { value: "DRUM", label: "드럼" },
  { value: "KEYBOARD", label: "키보드" },
];

export function BandProfileEditScreen() {
  const activeBand = useActiveBandId();
  const bandId = activeBand.activeBandId;
  const memberProfileId = activeBand.activeBand?.bandMemberProfileId ?? null;
  const bandQuery = useBandQuery(bandId);
  const memberQuery = useBandMemberProfileQuery(memberProfileId);

  if (activeBand.isLoading || bandQuery.isLoading || memberQuery.isLoading) {
    return (
      <Screen contentStyle={styles.container}>
        <MyHeader title="밴드 프로필 관리" />
        <AppState loading title="밴드 프로필을 불러오는 중이에요" />
      </Screen>
    );
  }

  if (!bandId || bandQuery.isError || !bandQuery.data) {
    return (
      <Screen contentStyle={styles.container}>
        <MyHeader title="밴드 프로필 관리" />
        <AppState title="프로필 정보를 불러오지 못했어요" />
      </Screen>
    );
  }

  return (
    <BandProfileEditForm
      bandId={bandId}
      memberProfileId={memberProfileId}
      band={bandQuery.data}
      member={memberQuery.data ?? null}
    />
  );
}

function BandProfileEditForm({
  bandId,
  memberProfileId,
  band,
  member,
}: {
  bandId: number;
  memberProfileId: number | null;
  band: {
    name: string;
    genre: string;
    region: string;
    profileImageUrl: string | null;
    description: string | null;
  };
  member: {
    nickname: string;
    part: string;
  } | null;
}) {
  const updateBand = useUpdateBandProfile(bandId);
  const updateMember = useUpdateBandMemberProfile(memberProfileId);
  const image = useProfileImageSelection();
  const [name, setName] = useState(band.name);
  const [genre, setGenre] = useState(band.genre);
  const [region, setRegion] = useState(band.region);
  const [description, setDescription] = useState(band.description ?? "");
  const [activityName, setActivityName] = useState(member?.nickname ?? "");
  const [part, setPart] = useState<BandMemberPart | "">(
    (member?.part as BandMemberPart | undefined) ?? "",
  );
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const isValid = Boolean(name.trim() && genre && region);
  const isSubmitting =
    isUploading || updateBand.isPending || updateMember.isPending;
  const displayedImage =
    image.selectedImage?.uri ??
    (image.isDeleted ? null : band.profileImageUrl);
  const partOptions =
    part === "ETC"
      ? [...PART_OPTIONS, { value: part, label: BAND_PART_LABELS.ETC }]
      : PART_OPTIONS;

  const save = async () => {
    if (!isValid) return;

    setErrorMessage("");

    let uploadedUrl: string | undefined;

    if (image.selectedImage) {
      try {
        setIsUploading(true);
        uploadedUrl = await uploadMediaAsset({
          category: "BAND_PROFILE",
          uri: image.selectedImage.uri,
          fileName: image.selectedImage.fileName,
          mimeType: image.selectedImage.mimeType,
        });
      } catch {
        setErrorMessage("이미지 업로드에 실패했어요. 다시 시도해주세요");
        return;
      } finally {
        setIsUploading(false);
      }
    }

    try {
      await updateBand.mutateAsync({
        name: name.trim(),
        genre,
        region,
        description: description.trim() || undefined,
        ...(image.isDeleted
          ? { deleteProfileImage: true }
          : uploadedUrl
            ? { profileImageUrl: uploadedUrl }
            : {}),
      });

      if (memberProfileId && activityName.trim() && part) {
        await updateMember.mutateAsync({
          nickname: activityName.trim(),
          part,
        });
      }

      router.back();
    } catch {
      setErrorMessage("저장에 실패했어요. 다시 시도해주세요");
    }
  };

  return (
    <Screen contentStyle={styles.container}>
      <MyHeader title="밴드 프로필 관리" />

      <View style={styles.banner}>
        <BandBanner
          bandName={`현재 선택된 밴드 · ${name || "밴드"}`}
          description="현재 선택된 밴드의 공개 프로필을 수정합니다"
          profileImageUrl={displayedImage}
        />
      </View>

      <View style={styles.form}>
        <ProfileImagePicker
          imageUrl={displayedImage}
          variant="band"
          tone="secondary"
          label="프로필 이미지 변경"
          onSelectGallery={() => void image.pickFromGallery()}
          onSelectCamera={() => void image.takePhoto()}
          onDelete={image.removeImage}
        />

        <View style={styles.field}>
          <FieldLabel label="밴드명" required />
          <FormInput
            tone="secondary"
            value={name}
            placeholder="밴드 이름을 입력해주세요"
            onChangeText={setName}
          />
        </View>

        <View style={styles.chipField}>
          <FieldLabel label="관심 장르" />
          <ChipGroup
            options={GENRE_OPTIONS}
            tone="secondary"
            isSelected={(value) => value === genre}
            onPress={setGenre}
          />
        </View>

        <View style={styles.chipField}>
          <FieldLabel label="활동 지역" />
          <ChipGroup
            options={REGION_OPTIONS}
            tone="secondary"
            isSelected={(value) => value === region}
            onPress={setRegion}
          />
        </View>

        <View style={styles.field}>
          <FieldLabel label="밴드 소개" />
          <FormInput
            multiline
            tone="secondary"
            value={description}
            maxLength={1000}
            textAlignVertical="top"
            placeholder="밴드 소개글을 입력해주세요"
            style={styles.textArea}
            onChangeText={setDescription}
          />
        </View>
      </View>

      {memberProfileId ? (
        <>
          <View style={styles.sectionBand} />

          <View style={styles.memberSection}>
            <View style={styles.memberHeading}>
              <Text style={styles.memberTitle}>내 프로필 수정</Text>
              <Text style={styles.memberDescription}>
                이 밴드에서 표시되는 내 활동명과 파트를 수정합니다
              </Text>
            </View>

            <View style={styles.field}>
              <FieldLabel label="활동명" required />
              <FormInput
                tone="secondary"
                value={activityName}
                placeholder="활동명을 입력해주세요"
                onChangeText={setActivityName}
              />
            </View>

            <View style={styles.field}>
              <FieldLabel label="파트" required />
              <SelectField
                value={part}
                options={partOptions}
                placeholder="파트를 선택해주세요"
                onChange={setPart}
              />
            </View>
          </View>
        </>
      ) : null}

      <View style={styles.footer}>
        {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

        <SubmitButton
          tone="secondary"
          label={isUploading ? "업로드 중..." : "밴드 프로필 저장"}
          active={isValid && !isSubmitting}
          disabled={isSubmitting}
          onPress={() => void save()}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    backgroundColor: colors.white,
  },
  banner: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  form: {
    gap: 24,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  field: {
    gap: 8,
  },
  chipField: {
    gap: 12,
  },
  textArea: {
    height: 60,
    paddingTop: 9,
    paddingBottom: 9,
    paddingRight: 26,
  },
  sectionBand: {
    height: 16,
    marginVertical: 16,
    backgroundColor: colors.secondary0,
  },
  memberSection: {
    gap: 16,
    paddingHorizontal: 32,
  },
  memberHeading: {
    gap: 4,
  },
  memberTitle: {
    ...textStyles.body6,
    color: colors.neutral900,
  },
  memberDescription: {
    ...textStyles.caption2,
    color: colors.neutral600,
  },
  footer: {
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 32,
  },
  error: {
    ...textStyles.body5,
    color: colors.error,
    textAlign: "center",
  },
});

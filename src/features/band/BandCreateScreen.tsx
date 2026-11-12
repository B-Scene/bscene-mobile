import { router } from "expo-router";
import { useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import type {
  BandMemberPart,
  BandMemberProfile,
} from "@/api/band/bandManagement";
import { uploadMediaAsset } from "@/api/media/media";
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
import {
  useCreateBand,
  useCreateBandMemberProfile,
} from "@/hooks/api/band/useBandManagement";
import { Screen } from "@/shared/components/Screen";
import {
  BAND_GENRE_LABELS,
  BAND_REGION_LABELS,
} from "@/shared/constants/bandLabels";
import { colors, textStyles } from "@/shared/constants/theme";
import { getApiErrorMessage } from "@/shared/utils/getApiErrorMessage";

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

export function BandCreateScreen() {
  const createMemberProfile = useCreateBandMemberProfile();
  const createBand = useCreateBand();
  const image = useProfileImageSelection();
  // 밴드 생성만 실패했을 때 재시도하면서 멤버 프로필이 중복 생성되지 않게 한다.
  const ownerProfileRef = useRef<{
    nickname: string;
    part: BandMemberPart;
    profile: BandMemberProfile;
  } | null>(null);
  const [name, setName] = useState("");
  const [genre, setGenre] = useState("");
  const [region, setRegion] = useState("");
  const [description, setDescription] = useState("");
  const [activityName, setActivityName] = useState("");
  const [part, setPart] = useState<BandMemberPart | "">("");
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const isValid = Boolean(
    name.trim() && genre && region && activityName.trim() && part,
  );
  const isSubmitting =
    isUploading || createMemberProfile.isPending || createBand.isPending;

  const submit = async () => {
    if (!isValid || part === "") return;

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
      const nickname = activityName.trim();
      const cached = ownerProfileRef.current;
      const ownerProfile =
        cached && cached.nickname === nickname && cached.part === part
          ? cached.profile
          : await createMemberProfile.mutateAsync({ nickname, part });

      ownerProfileRef.current = { nickname, part, profile: ownerProfile };

      await createBand.mutateAsync({
        name,
        genre,
        region,
        bandMemberProfileId: ownerProfile.id,
        profileImageUrl: uploadedUrl,
        description: description || undefined,
      });

      ownerProfileRef.current = null;
      router.replace("/band/home");
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, "저장에 실패했어요. 다시 시도해주세요"),
      );
    }
  };

  return (
    <Screen contentStyle={styles.container}>
      <MyHeader title="프로필 생성" />

      <View style={styles.form}>
        <ProfileImagePicker
          imageUrl={image.selectedImage?.uri}
          variant="band"
          tone="secondary"
          label="프로필 이미지 등록"
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

      <View style={styles.sectionBand} />

      <View style={styles.memberSection}>
        <View style={styles.memberHeading}>
          <Text style={styles.memberTitle}>내 프로필</Text>
          <Text style={styles.memberDescription}>
            이 밴드에서 표시될 내 활동명과 파트를 입력해주세요
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
            options={PART_OPTIONS}
            placeholder="파트를 선택해주세요"
            onChange={setPart}
          />
        </View>
      </View>

      <View style={styles.footer}>
        {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

        <SubmitButton
          tone="secondary"
          label={isUploading ? "업로드 중..." : "프로필 생성"}
          active={isValid && !isSubmitting}
          disabled={isSubmitting}
          onPress={() => void submit()}
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

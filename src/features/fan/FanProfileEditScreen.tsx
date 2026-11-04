import { router } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { uploadMediaAsset } from "@/api/media/media";
import {
  ChipGroup,
  FieldLabel,
  FormInput,
  ProfileImagePicker,
  SubmitButton,
} from "@/features/my/MyFormParts";
import { MyHeader } from "@/features/my/MyHeader";
import { useProfileImageSelection } from "@/features/my/useProfileImageSelection";
import { useGenres, useRegions } from "@/hooks/api/onboarding/useOnboarding";
import {
  useFanInformationQuery,
  useUpdateFanInformation,
} from "@/hooks/api/user/useFanInformation";
import { AppState } from "@/shared/components/AppState";
import { Screen } from "@/shared/components/Screen";
import { colors, textStyles } from "@/shared/constants/theme";
import type { CodeName } from "@/types/onboarding/onboarding";

const toOptions = (items: CodeName[]) =>
  items.map((item) => ({ value: item.code, label: item.name }));

const toggleWithMax = (selected: string[], code: string, max: number) => {
  if (selected.includes(code)) {
    return selected.filter((item) => item !== code);
  }

  return selected.length >= max ? selected : [...selected, code];
};

export function FanProfileEditScreen() {
  const query = useFanInformationQuery();

  if (query.isLoading || query.isError || !query.data) {
    return (
      <Screen contentStyle={styles.container}>
        <MyHeader title="내 정보 수정" />
        {query.isLoading ? (
          <AppState loading title="내 정보를 불러오는 중이에요" />
        ) : (
          <AppState
            title="내 정보를 불러오지 못했어요"
            actionLabel="다시 시도"
            onAction={() => void query.refetch()}
          />
        )}
      </Screen>
    );
  }

  return <FanProfileEditForm initialData={query.data} />;
}

function FanProfileEditForm({
  initialData,
}: {
  initialData: {
    nickname: string;
    profileImageUrl: string | null;
    genres: string[];
    regions: string[];
  };
}) {
  const { data: genres = [] } = useGenres();
  const { data: regions = [] } = useRegions();
  const updateMutation = useUpdateFanInformation();
  const image = useProfileImageSelection();
  const [nickname, setNickname] = useState(initialData.nickname);
  const [selectedGenres, setSelectedGenres] = useState(initialData.genres);
  const [selectedRegions, setSelectedRegions] = useState(initialData.regions);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const isValid =
    Boolean(nickname.trim()) &&
    selectedGenres.length > 0 &&
    selectedRegions.length > 0;
  const isSubmitting = isUploading || updateMutation.isPending;
  const displayedImage =
    image.selectedImage?.uri ??
    (image.isDeleted ? null : initialData.profileImageUrl);

  const save = async () => {
    if (!isValid) return;

    setErrorMessage("");

    let uploadedUrl: string | undefined;

    if (image.selectedImage) {
      try {
        setIsUploading(true);
        uploadedUrl = await uploadMediaAsset({
          category: "USER_PROFILE",
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
      await updateMutation.mutateAsync({
        nickname: nickname.trim(),
        genres: selectedGenres,
        regions: selectedRegions,
        ...(image.isDeleted
          ? { deleteProfileImage: true }
          : uploadedUrl
            ? { profileImageUrl: uploadedUrl }
            : {}),
      });
      router.back();
    } catch {
      setErrorMessage("저장에 실패했어요. 다시 시도해주세요");
    }
  };

  return (
    <Screen scroll={false} contentStyle={styles.container}>
      <MyHeader title="내 정보 수정" />

      <ScrollView
        contentContainerStyle={styles.form}
        keyboardShouldPersistTaps="handled"
      >
        <ProfileImagePicker
          imageUrl={displayedImage}
          variant="user"
          tone="primary"
          label="프로필 이미지 변경"
          onSelectGallery={() => void image.pickFromGallery()}
          onSelectCamera={() => void image.takePhoto()}
          onDelete={image.removeImage}
        />

        <View style={styles.field}>
          <FieldLabel label="닉네임" />
          <FormInput
            tone="primary"
            value={nickname}
            maxLength={8}
            placeholder="닉네임을 입력해주세요"
            onChangeText={setNickname}
          />
        </View>

        <View style={styles.chipField}>
          <FieldLabel label="관심 장르 (최대 3개)" />
          <ChipGroup
            options={toOptions(genres)}
            tone="primary"
            isSelected={(code) => selectedGenres.includes(code)}
            onPress={(code) =>
              setSelectedGenres((prev) => toggleWithMax(prev, code, 3))
            }
          />
        </View>

        <View style={styles.chipField}>
          <FieldLabel label="활동 지역 (최대 2개)" />
          <ChipGroup
            options={toOptions(regions)}
            tone="primary"
            isSelected={(code) => selectedRegions.includes(code)}
            onPress={(code) =>
              setSelectedRegions((prev) => toggleWithMax(prev, code, 2))
            }
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

        <SubmitButton
          tone="primary"
          label={
            isUploading
              ? "업로드 중..."
              : updateMutation.isPending
                ? "저장 중..."
                : "프로필 저장"
          }
          active={isValid && !isSubmitting}
          disabled={!isValid || isSubmitting}
          onPress={() => void save()}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 0,
    paddingVertical: 0,
    backgroundColor: colors.white,
  },
  form: {
    gap: 24,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 24,
  },
  field: {
    gap: 8,
  },
  chipField: {
    gap: 12,
  },
  footer: {
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 36,
  },
  error: {
    ...textStyles.body5,
    color: colors.error,
    textAlign: "center",
  },
});

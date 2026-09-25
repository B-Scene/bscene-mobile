import {
    router,
} from "expo-router";

import * as ImagePicker from "expo-image-picker";

import {
    Camera,
    Image as ImageIcon,
    Trash2,
} from "lucide-react-native";

import {
    Alert,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";

import {
    useState,
} from "react";

import {
    useGenres,
    useRegions,
} from "@/hooks/api/onboarding/useOnboarding";

import {
    useFanInformationQuery,
    useUpdateFanInformation,
} from "@/hooks/api/user/useFanInformation";

import {
    uploadMediaAsset,
} from "@/api/media/media";

import { AppButton } from "@/shared/components/AppButton";
import { AppCard } from "@/shared/components/AppCard";
import { AppHeader } from "@/shared/components/AppHeader";
import { AppState } from "@/shared/components/AppState";
import { AppTextInput } from "@/shared/components/AppTextInput";
import { Avatar } from "@/shared/components/Avatar";
import { Chip } from "@/shared/components/Chip";
import { Screen } from "@/shared/components/Screen";

import {
    colors,
    spacing,
} from "@/shared/constants/theme";

import type {
    CodeName,
} from "@/types/onboarding/onboarding";

type SelectedImage = {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
};

export function FanProfileEditScreen() {
  const query =
    useFanInformationQuery();

  if (query.isLoading) {
    return (
      <Screen>
        <AppHeader title="내 정보 수정" />

        <AppState
          loading
          title="내 정보를 불러오는 중이에요"
        />
      </Screen>
    );
  }

  if (
    query.isError ||
    !query.data
  ) {
    return (
      <Screen>
        <AppHeader title="내 정보 수정" />

        <AppState
          title="내 정보를 불러오지 못했어요"
          actionLabel="다시 시도"
          onAction={() =>
            void query.refetch()
          }
        />
      </Screen>
    );
  }

  return (
    <FanProfileEditForm
      initialData={
        query.data
      }
    />
  );
}

function FanProfileEditForm({
  initialData,
}: {
  initialData: {
    nickname: string;
    profileImageUrl:
      | string
      | null;
    genres: string[];
    regions: string[];
  };
}) {
  const {
    data: genres = [],
  } = useGenres();

  const {
    data: regions = [],
  } = useRegions();

  const updateMutation =
    useUpdateFanInformation();

  const [
    nickname,
    setNickname,
  ] = useState(
    initialData.nickname,
  );

  const [
    selectedGenres,
    setSelectedGenres,
  ] = useState<string[]>(
    initialData.genres,
  );

  const [
    selectedRegions,
    setSelectedRegions,
  ] = useState<string[]>(
    initialData.regions,
  );

  const [
    selectedImage,
    setSelectedImage,
  ] =
    useState<SelectedImage | null>(
      null,
    );

  const [
    deleteProfileImage,
    setDeleteProfileImage,
  ] = useState(false);

  const [
    isUploading,
    setIsUploading,
  ] = useState(false);

  const displayedImage =
    selectedImage?.uri ??
    (
      deleteProfileImage
        ? null
        : initialData.profileImageUrl
    );

  const toggleValue = (
    value: string,
    selected: string[],
    max: number,
    setter: React.Dispatch<
      React.SetStateAction<
        string[]
      >
    >,
  ) => {
    if (
      selected.includes(
        value,
      )
    ) {
      setter(
        selected.filter(
          (item) =>
            item !== value,
        ),
      );

      return;
    }

    if (
      selected.length >= max
    ) {
      return;
    }

    setter([
      ...selected,
      value,
    ]);
  };

  const pickFromGallery =
    async () => {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (
        !permission.granted
      ) {
        Alert.alert(
          "사진 접근 권한",
          "프로필 사진을 선택하려면 사진 접근 권한이 필요해요.",
        );

        return;
      }

      const result =
        await ImagePicker.launchImageLibraryAsync(
          {
            mediaTypes: [
              "images",
            ],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.85,
          },
        );

      if (
        result.canceled ||
        !result.assets[0]
      ) {
        return;
      }

      const asset =
        result.assets[0];

      setSelectedImage({
        uri: asset.uri,
        fileName:
          asset.fileName,
        mimeType:
          asset.mimeType,
      });

      setDeleteProfileImage(
        false,
      );
    };

  const takePhoto =
    async () => {
      const permission =
        await ImagePicker.requestCameraPermissionsAsync();

      if (
        !permission.granted
      ) {
        Alert.alert(
          "카메라 권한",
          "프로필 사진을 촬영하려면 카메라 권한이 필요해요.",
        );

        return;
      }

      const result =
        await ImagePicker.launchCameraAsync(
          {
            mediaTypes: [
              "images",
            ],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.85,
          },
        );

      if (
        result.canceled ||
        !result.assets[0]
      ) {
        return;
      }

      const asset =
        result.assets[0];

      setSelectedImage({
        uri: asset.uri,
        fileName:
          asset.fileName,
        mimeType:
          asset.mimeType,
      });

      setDeleteProfileImage(
        false,
      );
    };

  const removeImage =
    () => {
      setSelectedImage(null);

      setDeleteProfileImage(
        true,
      );
    };

  const save =
    async () => {
      if (
        !nickname.trim()
      ) {
        Alert.alert(
          "프로필",
          "닉네임을 입력해 주세요.",
        );

        return;
      }

      if (
        selectedGenres.length ===
        0
      ) {
        Alert.alert(
          "프로필",
          "관심 장르를 하나 이상 선택해 주세요.",
        );

        return;
      }

      if (
        selectedRegions.length ===
        0
      ) {
        Alert.alert(
          "프로필",
          "활동 지역을 하나 이상 선택해 주세요.",
        );

        return;
      }

      try {
        let uploadedUrl:
          | string
          | undefined;

        if (selectedImage) {
          setIsUploading(true);

          uploadedUrl =
            await uploadMediaAsset(
              {
                category:
                  "USER_PROFILE",

                uri:
                  selectedImage.uri,

                fileName:
                  selectedImage.fileName,

                mimeType:
                  selectedImage.mimeType,
              },
            );
        }

        await updateMutation.mutateAsync(
          {
            nickname:
              nickname.trim(),

            genres:
              selectedGenres,

            regions:
              selectedRegions,

            ...(deleteProfileImage
              ? {
                  deleteProfileImage:
                    true,
                }
              : uploadedUrl
                ? {
                    profileImageUrl:
                      uploadedUrl,
                  }
                : {}),
          },
        );

        router.back();
      } catch {
        Alert.alert(
          "프로필 저장",
          "프로필을 저장하지 못했어요.",
        );
      } finally {
        setIsUploading(false);
      }
    };

  return (
    <Screen
      contentStyle={
        styles.container
      }
    >
      <AppHeader title="내 정보 수정" />

      <AppCard
        style={
          styles.imageCard
        }
      >
        <Avatar
          imageUrl={
            displayedImage
          }
          label={
            nickname ||
            "팬"
          }
          size={92}
        />

        <View
          style={
            styles.imageActions
          }
        >
          <ImageAction
            label="앨범"
            icon={
              <ImageIcon
                size={18}
                color={
                  colors.primary600
                }
              />
            }
            onPress={() =>
              void pickFromGallery()
            }
          />

          <ImageAction
            label="카메라"
            icon={
              <Camera
                size={18}
                color={
                  colors.primary600
                }
              />
            }
            onPress={() =>
              void takePhoto()
            }
          />

          <ImageAction
            label="삭제"
            icon={
              <Trash2
                size={18}
                color={
                  colors.error
                }
              />
            }
            onPress={
              removeImage
            }
          />
        </View>
      </AppCard>

      <AppTextInput
        label="닉네임"
        value={nickname}
        maxLength={8}
        placeholder="닉네임을 입력해 주세요"
        onChangeText={
          setNickname
        }
      />

      <SelectionSection
        title="관심 장르"
        description="최대 3개"
        options={genres}
        selected={
          selectedGenres
        }
        onToggle={(code) =>
          toggleValue(
            code,
            selectedGenres,
            3,
            setSelectedGenres,
          )
        }
      />

      <SelectionSection
        title="활동 지역"
        description="최대 2개"
        options={regions}
        selected={
          selectedRegions
        }
        onToggle={(code) =>
          toggleValue(
            code,
            selectedRegions,
            2,
            setSelectedRegions,
          )
        }
      />

      <AppButton
        label={
          isUploading
            ? "이미지 업로드 중..."
            : "프로필 저장"
        }
        loading={
          isUploading ||
          updateMutation.isPending
        }
        onPress={() =>
          void save()
        }
      />
    </Screen>
  );
}

function ImageAction({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      style={
        styles.imageAction
      }
      onPress={onPress}
    >
      {icon}

      <Text
        style={
          styles.imageActionText
        }
      >
        {label}
      </Text>
    </Pressable>
  );
}

function SelectionSection({
  title,
  description,
  options,
  selected,
  onToggle,
}: {
  title: string;
  description: string;
  options: CodeName[];
  selected: string[];
  onToggle: (
    value: string,
  ) => void;
}) {
  return (
    <AppCard
      style={styles.section}
    >
      <View>
        <Text
          style={
            styles.sectionTitle
          }
        >
          {title}
        </Text>

        <Text
          style={styles.helper}
        >
          {description}
        </Text>
      </View>

      <View
        style={styles.chips}
      >
        {options.map(
          (option) => (
            <Chip
              key={
                option.code
              }
              label={
                option.name
              }
              selected={selected.includes(
                option.code,
              )}
              onPress={() =>
                onToggle(
                  option.code,
                )
              }
            />
          ),
        )}
      </View>
    </AppCard>
  );
}

const styles =
  StyleSheet.create({
    container: {
      gap: spacing.lg,
      paddingBottom:
        spacing.xxl,
    },

    imageCard: {
      alignItems: "center",
      gap: spacing.lg,
    },

    imageActions: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent:
        "center",
      gap: spacing.sm,
    },

    imageAction: {
      minHeight: 40,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      paddingHorizontal:
        spacing.md,
    },

    imageActionText: {
      color:
        colors.neutral700,
      fontSize: 13,
      fontWeight: "800",
    },

    section: {
      gap: spacing.md,
    },

    sectionTitle: {
      color:
        colors.neutral900,
      fontSize: 16,
      fontWeight: "900",
    },

    helper: {
      marginTop:
        spacing.xs,
      color:
        colors.neutral500,
      fontSize: 12,
    },

    chips: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
    },
  });
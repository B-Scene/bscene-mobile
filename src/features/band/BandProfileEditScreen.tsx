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
    TextInput,
    View,
} from "react-native";

import {
    useState,
} from "react";

import {
    uploadMediaAsset,
} from "@/api/media/media";

import {
    useBandQuery,
} from "@/hooks/api/band/useBand";

import {
    useBandMemberProfileQuery,
    useUpdateBandMemberProfile,
    useUpdateBandProfile,
} from "@/hooks/api/band/useBandManagement";

import {
    useActiveBandId,
} from "@/hooks/api/user/useMyProfiles";

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
    radius,
    spacing,
} from "@/shared/constants/theme";

import type {
    BandMemberPart,
} from "@/api/band/bandManagement";

const GENRES = [
  ["INDIE", "인디"],
  ["POP", "팝"],
  ["POP_ROCK", "팝록"],
  ["JAZZ", "재즈"],
  ["BLUES", "블루스"],
  [
    "ALTERNATIVE_ROCK",
    "얼터너티브록",
  ],
  [
    "PSYCHEDELIC_ROCK",
    "사이키델릭록",
  ],
  [
    "ELECTRONIC_ROCK",
    "일렉트로닉록",
  ],
  ["FOLK_ROCK", "포크록"],
  ["PUNK_ROCK", "펑크록"],
  ["HARD_ROCK", "하드록"],
  ["METAL", "메탈"],
  ["ETC", "기타"],
] as const;

const REGIONS = [
  ["SEOUL", "서울"],
  ["GYEONGGI", "경기"],
  ["INCHEON", "인천"],
  ["GANGWON", "강원"],
  ["DAEJEON", "대전"],
  ["SEJONG", "세종"],
  ["CHUNGBUK", "충북"],
  ["CHUNGNAM", "충남"],
  ["DAEGU", "대구"],
  ["GYEONGBUK", "경북"],
  ["BUSAN", "부산"],
  ["ULSAN", "울산"],
  ["GYEONGNAM", "경남"],
  ["GWANGJU", "광주"],
  ["JEONBUK", "전북"],
  ["JEONNAM", "전남"],
  ["JEJU", "제주"],
] as const;

const PARTS: [
  BandMemberPart,
  string,
][] = [
  ["VOCAL", "보컬"],
  ["GUITAR", "기타"],
  ["BASS", "베이스"],
  ["KEYBOARD", "키보드"],
  ["DRUM", "드럼"],
  ["ETC", "기타"],
];

type SelectedImage = {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
};

export function BandProfileEditScreen() {
  const activeBand =
    useActiveBandId();

  const bandId =
    activeBand.activeBandId;

  const memberProfileId =
    activeBand.activeBand
      ?.bandMemberProfileId ??
    null;

  const bandQuery =
    useBandQuery(
      bandId,
    );

  const memberQuery =
    useBandMemberProfileQuery(
      memberProfileId,
    );

  if (
    activeBand.isLoading ||
    bandQuery.isLoading ||
    memberQuery.isLoading
  ) {
    return (
      <Screen>
        <AppHeader title="밴드 프로필 관리" />

        <AppState
          loading
          title="밴드 프로필을 불러오는 중이에요"
        />
      </Screen>
    );
  }

  if (
    !bandId ||
    bandQuery.isError ||
    !bandQuery.data
  ) {
    return (
      <Screen>
        <AppHeader title="밴드 프로필 관리" />

        <AppState
          title="밴드 프로필을 불러오지 못했어요"
        />
      </Screen>
    );
  }

  return (
    <BandProfileEditForm
      bandId={bandId}
      memberProfileId={
        memberProfileId
      }
      band={
        bandQuery.data
      }
      member={
        memberQuery.data ??
        null
      }
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

  memberProfileId:
    | number
    | null;

  band: {
    name: string;
    genre: string;
    region: string;
    profileImageUrl:
      | string
      | null;
    description:
      | string
      | null;
  };

  member: {
    nickname: string;
    part: string;
  } | null;
}) {
  const updateBand =
    useUpdateBandProfile(
      bandId,
    );

  const updateMember =
    useUpdateBandMemberProfile(
      memberProfileId,
    );

  const [name, setName] =
    useState(band.name);

  const [genre, setGenre] =
    useState(band.genre);

  const [region, setRegion] =
    useState(band.region);

  const [
    description,
    setDescription,
  ] = useState(
    band.description ?? "",
  );

  const [
    activityName,
    setActivityName,
  ] = useState(
    member?.nickname ?? "",
  );

  const [part, setPart] =
    useState<BandMemberPart>(
      (
        member?.part as BandMemberPart
      ) ?? "VOCAL",
    );

  const [
    selectedImage,
    setSelectedImage,
  ] =
    useState<SelectedImage | null>(
      null,
    );

  const [
    deleteImage,
    setDeleteImage,
  ] = useState(false);

  const [
    uploading,
    setUploading,
  ] = useState(false);


  const imageUrl =
    selectedImage?.uri ??
    (
      deleteImage
        ? null
        : band.profileImageUrl
    );

  const pickImage =
    async (
      camera:
        | boolean,
    ) => {
      const permission =
        camera
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (
        !permission.granted
      ) {
        Alert.alert(
          "권한 필요",
          camera
            ? "카메라 권한이 필요해요."
            : "사진 접근 권한이 필요해요.",
        );

        return;
      }

      const result =
        camera
          ? await ImagePicker.launchCameraAsync(
              {
                mediaTypes: [
                  "images",
                ],
                allowsEditing:
                  true,
                aspect: [
                  1,
                  1,
                ],
                quality:
                  0.85,
              },
            )
          : await ImagePicker.launchImageLibraryAsync(
              {
                mediaTypes: [
                  "images",
                ],
                allowsEditing:
                  true,
                aspect: [
                  1,
                  1,
                ],
                quality:
                  0.85,
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

      setDeleteImage(
        false,
      );
    };

  const save =
    async () => {
      if (
        !name.trim()
      ) {
        Alert.alert(
          "밴드 프로필",
          "밴드명을 입력해 주세요.",
        );

        return;
      }

      try {
        let uploadedUrl:
          | string
          | undefined;

        if (selectedImage) {
          setUploading(true);

          uploadedUrl =
            await uploadMediaAsset(
              {
                category:
                  "BAND_PROFILE",

                uri:
                  selectedImage.uri,

                fileName:
                  selectedImage.fileName,

                mimeType:
                  selectedImage.mimeType,
              },
            );
        }

        await updateBand.mutateAsync(
          {
            name:
              name.trim(),

            genre,

            region,

            description:
              description.trim() ||
              undefined,

            ...(deleteImage
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

        if (
          memberProfileId &&
          activityName.trim()
        ) {
          await updateMember.mutateAsync(
            {
              nickname:
                activityName.trim(),
              part,
            },
          );
        }

        router.back();
      } catch {
        Alert.alert(
          "밴드 프로필",
          "밴드 프로필을 저장하지 못했어요.",
        );
      } finally {
        setUploading(false);
      }
    };

  return (
    <Screen
      contentStyle={
        styles.container
      }
    >
      <AppHeader title="밴드 프로필 관리" />

      <AppCard
        style={styles.imageCard}
      >
        <Avatar
          imageUrl={
            imageUrl
          }
          label={name}
          size={92}
        />

        <View
          style={
            styles.imageActions
          }
        >
          <IconButton
            label="앨범"
            icon={
              <ImageIcon
                size={18}
                color={
                  colors.secondary600
                }
              />
            }
            onPress={() =>
              void pickImage(
                false,
              )
            }
          />

          <IconButton
            label="카메라"
            icon={
              <Camera
                size={18}
                color={
                  colors.secondary600
                }
              />
            }
            onPress={() =>
              void pickImage(
                true,
              )
            }
          />

          <IconButton
            label="삭제"
            icon={
              <Trash2
                size={18}
                color={
                  colors.error
                }
              />
            }
            onPress={() => {
              setSelectedImage(
                null,
              );

              setDeleteImage(
                true,
              );
            }}
          />
        </View>
      </AppCard>

      <AppTextInput
        label="밴드명"
        value={name}
        placeholder="밴드 이름"
        onChangeText={
          setName
        }
      />

      <Selection
        title="장르"
        options={GENRES}
        value={genre}
        onChange={
          setGenre
        }
      />

      <Selection
        title="활동 지역"
        options={REGIONS}
        value={region}
        onChange={
          setRegion
        }
      />

      <View
        style={styles.field}
      >
        <Text
          style={styles.label}
        >
          밴드 소개
        </Text>

        <TextInput
          value={
            description
          }
          multiline
          maxLength={1000}
          textAlignVertical="top"
          placeholder="밴드 소개를 입력해 주세요"
          placeholderTextColor={
            colors.neutral500
          }
          style={
            styles.textArea
          }
          onChangeText={
            setDescription
          }
        />
      </View>

      {memberProfileId ? (
        <AppCard
          style={
            styles.section
          }
        >
          <Text
            style={
              styles.sectionTitle
            }
          >
            내 밴드 프로필
          </Text>

          <AppTextInput
            label="활동명"
            value={
              activityName
            }
            placeholder="활동명"
            onChangeText={
              setActivityName
            }
          />

          <Text
            style={styles.label}
          >
            파트
          </Text>

          <View
            style={styles.chips}
          >
            {PARTS.map(
              ([
                value,
                label,
              ]) => (
                <Chip
                  key={value}
                  label={label}
                  selected={
                    part ===
                    value
                  }
                  onPress={() =>
                    setPart(
                      value,
                    )
                  }
                />
              ),
            )}
          </View>
        </AppCard>
      ) : null}

      <AppButton
        label={
          uploading
            ? "이미지 업로드 중..."
            : "밴드 프로필 저장"
        }
        loading={
          uploading ||
          updateBand.isPending ||
          updateMember.isPending
        }
        onPress={() =>
          void save()
        }
      />
    </Screen>
  );
}

function IconButton({
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
      style={
        styles.iconButton
      }
      onPress={onPress}
    >
      {icon}

      <Text
        style={
          styles.iconButtonText
        }
      >
        {label}
      </Text>
    </Pressable>
  );
}

function Selection({
  title,
  options,
  value,
  onChange,
}: {
  title: string;

  options: readonly (
    readonly [
      string,
      string,
    ]
  )[];

  value: string;

  onChange: (
    value: string,
  ) => void;
}) {
  return (
    <AppCard
      style={styles.section}
    >
      <Text
        style={
          styles.sectionTitle
        }
      >
        {title}
      </Text>

      <View
        style={styles.chips}
      >
        {options.map(
          ([
            optionValue,
            label,
          ]) => (
            <Chip
              key={
                optionValue
              }
              label={label}
              selected={
                value ===
                optionValue
              }
              onPress={() =>
                onChange(
                  optionValue,
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
      gap: spacing.sm,
    },

    iconButton: {
      minHeight: 40,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      paddingHorizontal:
        spacing.md,
    },

    iconButtonText: {
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
      fontSize: 17,
      fontWeight: "900",
    },

    chips: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
    },

    field: {
      gap: spacing.sm,
    },

    label: {
      color:
        colors.neutral800,
      fontSize: 14,
      fontWeight: "700",
    },

    textArea: {
      minHeight: 120,
      borderWidth: 1,
      borderColor:
        colors.neutral300,
      borderRadius:
        radius.md,
      backgroundColor:
        colors.white,
      padding:
        spacing.lg,
      color:
        colors.neutral900,
      fontSize: 15,
      lineHeight: 22,
    },
  });
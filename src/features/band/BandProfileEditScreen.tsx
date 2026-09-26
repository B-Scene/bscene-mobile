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

import { AppHeader } from "@/shared/components/AppHeader";
import { AppState } from "@/shared/components/AppState";
import { Avatar } from "@/shared/components/Avatar";
import { Screen } from "@/shared/components/Screen";

import {
    colors,
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

      <View
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
      </View>

      <FormField
        label="밴드명"
        required
        value={name}
        placeholder="밴드 이름을 입력해주세요"
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

      <View style={styles.field}>
        <FieldLabel label="밴드 소개" />

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
        <View
          style={
            styles.section
          }
        >
          <Text
            style={
              styles.sectionTitle
            }
          >
            내 프로필 수정
          </Text>

          <Text style={styles.sectionDescription}>
            이 밴드에서 표시되는 내 활동명과 파트를 수정합니다
          </Text>

          <FormField
            label="활동명"
            required
            value={
              activityName
            }
            placeholder="활동명을 입력해주세요"
            onChangeText={
              setActivityName
            }
          />

          <FieldLabel label="파트" required />

          <View
            style={styles.chips}
          >
            {PARTS.map(
              ([
                value,
                label,
              ]) => (
                <Pill
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
        </View>
      ) : null}

      <Pressable
        accessibilityRole="button"
        disabled={
          uploading ||
          updateBand.isPending ||
          updateMember.isPending
        }
        style={[
          styles.submitButton,
          (
            uploading ||
            updateBand.isPending ||
            updateMember.isPending
          ) && styles.submitButtonDisabled,
        ]}
        onPress={() =>
          void save()
        }
      >
        <Text style={styles.submitButtonText}>
          {uploading ? "업로드 중..." : "밴드 프로필 저장"}
        </Text>
      </Pressable>
    </Screen>
  );
}

function FormField({
  label,
  required = false,
  value,
  placeholder,
  onChangeText,
}: {
  label: string;
  required?: boolean;
  value: string;
  placeholder: string;
  onChangeText: (value: string) => void;
}) {
  return (
    <View style={styles.field}>
      <FieldLabel label={label} required={required} />
      <TextInput
        value={value}
        placeholder={placeholder}
        placeholderTextColor={colors.neutral500}
        style={styles.input}
        onChangeText={onChangeText}
      />
    </View>
  );
}

function FieldLabel({
  label,
  required = false,
}: {
  label: string;
  required?: boolean;
}) {
  return (
    <View style={styles.labelRow}>
      <Text style={styles.label}>{label}</Text>
      {required ? (
        <Text style={styles.requiredMark}>*</Text>
      ) : null}
    </View>
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
    <View
      style={styles.section}
    >
      <FieldLabel label={title} />

      <View
        style={styles.chips}
      >
        {options.map(
          ([
            optionValue,
            label,
          ]) => (
            <Pill
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
    </View>
  );
}

function Pill({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[
        styles.pill,
        selected ? styles.pillSelected : styles.pillIdle,
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.pillText,
          selected ? styles.pillTextSelected : styles.pillTextIdle,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles =
  StyleSheet.create({
    container: {
      gap: 24,
      paddingHorizontal: 20,
      paddingBottom: 32,
      backgroundColor: colors.white,
    },

    imageCard: {
      alignItems: "center",
      gap: 12,
      paddingTop: 8,
    },

    imageActions: {
      flexDirection: "row",
      gap: 8,
    },

    iconButton: {
      minHeight: 40,
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 12,
    },

    iconButtonText: {
      color:
        colors.neutral700,
      fontSize: 13,
      fontWeight: "800",
    },

    section: {
      gap: 12,
    },

    sectionTitle: {
      color:
        colors.neutral900,
      fontSize: 15,
      fontWeight: "700",
      lineHeight: 20,
    },

    sectionDescription: {
      color: colors.neutral600,
      fontSize: 12,
      fontWeight: "500",
      lineHeight: 18,
      marginTop: -8,
    },

    chips: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },

    field: {
      gap: 8,
    },

    labelRow: {
      flexDirection: "row",
      alignItems: "center",
    },

    label: {
      color:
        colors.neutral900,
      fontSize: 15,
      fontWeight: "500",
      lineHeight: 20,
    },

    requiredMark: {
      color: colors.error,
      fontSize: 15,
      fontWeight: "500",
      lineHeight: 20,
      marginLeft: 4,
    },

    input: {
      height: 52,
      borderWidth: 1,
      borderColor: colors.neutral400,
      borderRadius: 5,
      backgroundColor: colors.white,
      color: colors.neutral900,
      fontSize: 13,
      fontWeight: "500",
      lineHeight: 18,
      paddingHorizontal: 16,
    },

    textArea: {
      height: 96,
      borderWidth: 1,
      borderColor:
        colors.neutral400,
      borderRadius: 5,
      backgroundColor:
        colors.white,
      paddingHorizontal: 16,
      paddingTop: 9,
      paddingBottom: 20,
      color:
        colors.neutral900,
      fontSize: 12,
      fontWeight: "500",
      lineHeight: 18,
    },

    pill: {
      minHeight: 26,
      borderRadius: 999,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 15,
      paddingVertical: 4,
    },

    pillSelected: {
      backgroundColor: colors.secondary500,
    },

    pillIdle: {
      backgroundColor: colors.neutral300,
    },

    pillText: {
      fontSize: 12,
      fontWeight: "500",
      lineHeight: 18,
    },

    pillTextSelected: {
      color: colors.white,
    },

    pillTextIdle: {
      color: colors.neutral600,
    },

    submitButton: {
      height: 52,
      borderRadius: 12,
      backgroundColor: colors.secondary500,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 8,
    },

    submitButtonDisabled: {
      backgroundColor: colors.neutral300,
    },

    submitButtonText: {
      color: colors.white,
      fontSize: 18,
      fontWeight: "700",
      lineHeight: 20,
    },
  });

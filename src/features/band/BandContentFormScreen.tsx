import { router, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { uploadMediaAsset } from "@/api/media/media";
import {
  DescriptionInput,
  FormField,
  MAX_TAGS,
  MediaSourceSheet,
  RegisterComplete,
  TagInput,
} from "@/features/band/BandFormParts";
import { FormInput, SubmitButton } from "@/features/my/MyFormParts";
import {
  useBandPostQuery,
  useCreateBandPost,
  useUpdateBandPost,
} from "@/hooks/api/band/useBand";
import { useActiveBandId } from "@/hooks/api/user/useMyProfiles";
import { AppHeader } from "@/shared/components/AppHeader";
import { AppIcon } from "@/shared/components/AppIcon";
import { AppState } from "@/shared/components/AppState";
import { Screen } from "@/shared/components/Screen";
import { colors, textStyles } from "@/shared/constants/theme";
import { getApiErrorMessage } from "@/shared/utils/getApiErrorMessage";
import type {
  CreatePostRequest,
  PostDetailResponse,
  PostType,
  UpdatePostRequest,
} from "@/types/band/post";

type ContentTypeLabel = "사진" | "글" | "영상";

const CONTENT_TYPES: { label: ContentTypeLabel; value: PostType }[] = [
  { label: "사진", value: "PHOTO" },
  { label: "글", value: "TEXT" },
  { label: "영상", value: "VIDEO" },
];

const TYPE_TO_LABEL: Record<PostType, ContentTypeLabel> = {
  PHOTO: "사진",
  TEXT: "글",
  VIDEO: "영상",
};

const parseRouteId = (value?: string | string[]) => {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const parsed = Number(rawValue);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const splitLines = (value: string) =>
  value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);

const joinLines = (items?: string[]) => items?.join("\n") ?? "";

const MAX_IMAGES = 10;

type SelectedMediaAsset = {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
};

export function BandContentFormScreen() {
  const params = useLocalSearchParams<{ postId?: string }>();
  const postId = parseRouteId(params.postId);
  const isEditMode = Boolean(postId);
  const activeBandQuery = useActiveBandId();
  const postQuery = useBandPostQuery(postId);
  const bandId = activeBandQuery.activeBandId;

  if (activeBandQuery.isLoading || (isEditMode && postQuery.isLoading)) {
    return (
      <Screen contentStyle={styles.container}>
        <AppHeader title={isEditMode ? "콘텐츠 수정" : "콘텐츠 등록"} style={styles.header} />
        <AppState loading title="콘텐츠 정보를 준비하는 중이에요" />
      </Screen>
    );
  }

  if (!bandId) {
    return (
      <Screen contentStyle={styles.container}>
        <AppHeader title={isEditMode ? "콘텐츠 수정" : "콘텐츠 등록"} style={styles.header} />
        <AppState
          title="등록된 밴드를 찾지 못했어요"
          description="밴드 프로필을 먼저 확인해 주세요."
        />
      </Screen>
    );
  }

  if (isEditMode && (postQuery.isError || !postQuery.data)) {
    return (
      <Screen contentStyle={styles.container}>
        <AppHeader title="콘텐츠 수정" style={styles.header} />
        <AppState
          title="콘텐츠를 불러오지 못했어요"
          description="삭제되었거나 네트워크 연결이 불안정할 수 있어요."
          actionLabel="다시 시도"
          onAction={() => void postQuery.refetch()}
        />
      </Screen>
    );
  }

  return (
    <ContentForm
      key={postId ?? "new"}
      bandId={bandId}
      postId={postId}
      initialPost={postQuery.data}
    />
  );
}

function ContentForm({
  bandId,
  postId,
  initialPost,
}: {
  bandId: number;
  postId: number | null;
  initialPost?: PostDetailResponse;
}) {
  const isEditMode = Boolean(postId && initialPost);
  const createPost = useCreateBandPost(bandId);
  const updatePost = useUpdateBandPost(postId);
  const [type, setType] = useState<PostType | null>(initialPost?.type ?? null);
  const [title, setTitle] = useState(initialPost?.title ?? "");
  const [description, setDescription] = useState(initialPost?.description ?? "");
  const [mediaUrls, setMediaUrls] = useState(joinLines(initialPost?.mediaUrls));
  const [thumbnailUrl, setThumbnailUrl] = useState(
    initialPost?.thumbnailUrl ?? "",
  );
  const [hasExistingVideo, setHasExistingVideo] = useState(
    initialPost?.type === "VIDEO" && Boolean(initialPost.mediaUrls?.length),
  );
  const [selectedImages, setSelectedImages] = useState<SelectedMediaAsset[]>([]);
  const [tags, setTags] = useState(initialPost?.tags ?? []);
  const [isSourceSheetOpen, setIsSourceSheetOpen] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [completedPostId, setCompletedPostId] = useState<number | null>(null);
  const existingImageUrls = type === "PHOTO" ? splitLines(mediaUrls) : [];
  const typeError = showErrors && !type;
  const titleError = showErrors && !title.trim();
  const isValid = Boolean(type && title.trim());
  const isSubmitting = createPost.isPending || updatePost.isPending || uploading;
  const imageLimit = MAX_IMAGES - splitLines(mediaUrls).length;

  const requestImagePermission = async (camera: boolean) => {
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

  const pickImages = async (camera: boolean) => {
    const remaining = imageLimit - selectedImages.length;

    if (remaining <= 0 || !(await requestImagePermission(camera))) {
      return;
    }

    const result = camera
      ? await ImagePicker.launchCameraAsync({
          mediaTypes: ["images"],
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.85,
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          allowsMultipleSelection: true,
          selectionLimit: remaining,
          quality: 0.85,
        });

    if (result.canceled || result.assets.length === 0) {
      return;
    }

    const assets = result.assets.map((asset) => ({
      uri: asset.uri,
      fileName: asset.fileName,
      mimeType: asset.mimeType,
    }));

    setSelectedImages((previous) =>
      [...previous, ...assets].slice(0, imageLimit),
    );

    if (!isEditMode) {
      setType((previous) => previous ?? "PHOTO");
    }
  };

  const removeSelectedImage = (uri: string) => {
    setSelectedImages((previous) =>
      previous.filter((asset) => asset.uri !== uri),
    );
  };

  const removeExistingImage = (url: string) => {
    setMediaUrls(
      splitLines(mediaUrls)
        .filter((item) => item !== url)
        .join("\n"),
    );
  };

  const removeExistingVideo = () => {
    setHasExistingVideo(false);
    setMediaUrls("");
    setThumbnailUrl("");
  };

  const submit = async () => {
    if (!type || !title.trim()) {
      setShowErrors(true);
      return;
    }

    const onSuccess = (nextPostId: number) => {
      setCompletedPostId(nextPostId);
    };

    try {
      setSubmitError(null);
      setUploading(true);

      const uploadedMediaUrls =
        type === "TEXT"
          ? []
          : await Promise.all(
              selectedImages.map((asset) =>
                uploadMediaAsset({
                  category: "POST",
                  uri: asset.uri,
                  fileName: asset.fileName,
                  mimeType: asset.mimeType,
                }),
              ),
            );

      const nextMediaUrls =
        type === "TEXT"
          ? []
          : [...splitLines(mediaUrls), ...uploadedMediaUrls];
      const nextThumbnailUrl = thumbnailUrl.trim() || uploadedMediaUrls[0] || "";
      const commonPayload = {
        title: title.trim(),
        description: description.trim() || undefined,
        mediaUrls: nextMediaUrls.length > 0 ? nextMediaUrls : undefined,
        tags: tags.length > 0 ? tags : undefined,
        thumbnailUrl: nextThumbnailUrl || undefined,
      };

      if (isEditMode && postId) {
        const result = await updatePost.mutateAsync(
          commonPayload satisfies UpdatePostRequest,
        );
        onSuccess(result.postId);
        return;
      }

      const result = await createPost.mutateAsync({
        ...commonPayload,
        type,
      } satisfies CreatePostRequest);
      onSuccess(result.postId);
    } catch (error) {
      setSubmitError(
        getApiErrorMessage(error, "저장에 실패했어요. 다시 시도해주세요"),
      );
    } finally {
      setUploading(false);
    }
  };

  if (completedPostId !== null) {
    return (
      <Screen contentStyle={styles.completeContainer}>
        <RegisterComplete
          title={isEditMode ? "콘텐츠가 수정됐어요" : "콘텐츠가 업로드됐어요"}
          description={
            isEditMode ? "변경사항이 저장됐어요" : "콘텐츠 탭에서 확인할 수 있어요"
          }
          rows={[
            { label: "콘텐츠", value: type ? TYPE_TO_LABEL[type] : "" },
            { label: "콘텐츠 제목", value: title },
          ]}
          primaryLabel="콘텐츠 보기"
          onHome={() => router.replace("/band/home")}
          onPrimary={() =>
            router.replace(
              `/band/home/contents/${completedPostId}` as Parameters<
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
      <AppHeader
        title={isEditMode ? "콘텐츠 수정" : "콘텐츠 등록"}
        style={styles.header}
      />

      <View style={styles.body}>
        {hasExistingVideo ? (
          <View style={styles.videoCard}>
            <View style={styles.videoThumbnail}>
              {thumbnailUrl ? (
                <Image
                  source={{ uri: thumbnailUrl }}
                  style={StyleSheet.absoluteFill}
                />
              ) : null}
              <AppIcon name="playButton" size={24} />
            </View>
            <View style={styles.videoTexts}>
              <Text numberOfLines={1} style={styles.videoName}>
                기존 영상
              </Text>
              <Text style={styles.videoMeta}>선택 완료</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="파일 삭제"
              style={styles.videoRemove}
              onPress={removeExistingVideo}
            >
              <AppIcon name="close" size={14} />
            </Pressable>
          </View>
        ) : type !== "VIDEO" ? (
          <View style={styles.upload}>
            <Pressable
              accessibilityRole="button"
              style={styles.uploadPanel}
              onPress={() => setIsSourceSheetOpen(true)}
            >
              <AppIcon name="formUpload" size={36} />
              <View style={styles.uploadTexts}>
                <Text style={styles.uploadTitle}>파일 선택</Text>
                <View style={styles.uploadHints}>
                  <Text style={styles.uploadHint}>JPG · PNG</Text>
                  <Text style={styles.uploadHint}>최대 500MB</Text>
                </View>
              </View>
            </Pressable>

            {existingImageUrls.length > 0 || selectedImages.length > 0 ? (
              <View style={styles.previews}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.previewList}
                >
                  {existingImageUrls.map((url) => (
                    <ImagePreview
                      key={url}
                      uri={url}
                      onRemove={() => removeExistingImage(url)}
                    />
                  ))}
                  {selectedImages.map((asset) => (
                    <ImagePreview
                      key={asset.uri}
                      uri={asset.uri}
                      onRemove={() => removeSelectedImage(asset.uri)}
                    />
                  ))}
                </ScrollView>
                <Text style={styles.previewHint}>
                  사진은 최대 {MAX_IMAGES}장까지 첨부할 수 있어요
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}

        <View style={styles.formFields}>
          <FormField label="콘텐츠" required error={typeError}>
            <View style={styles.typeRow}>
              {CONTENT_TYPES.map((item) => (
                <Pressable
                  key={item.value}
                  accessibilityRole="button"
                  disabled={isEditMode}
                  style={[
                    styles.typeButton,
                    type === item.value
                      ? styles.typeButtonSelected
                      : typeError
                        ? styles.typeButtonError
                        : styles.typeButtonIdle,
                    isEditMode && styles.typeButtonDisabled,
                  ]}
                  onPress={() => setType(item.value)}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      type === item.value && styles.typeButtonTextSelected,
                      type !== item.value &&
                        typeError &&
                        styles.typeButtonTextError,
                    ]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            {isEditMode ? (
              <Text style={styles.helpText}>콘텐츠 타입은 수정할 수 없어요</Text>
            ) : null}
          </FormField>

          <FormField label="콘텐츠 제목" required error={titleError}>
            <FormInput
              tone="secondary"
              value={title}
              placeholder="콘텐츠 제목을 입력하세요"
              style={titleError ? styles.inputError : undefined}
              onChangeText={setTitle}
            />
          </FormField>

          <FormField label="설명">
            <DescriptionInput
              value={description}
              placeholder="콘텐츠에 대한 설명을 입력하세요"
              onChangeText={setDescription}
            />
          </FormField>

          {type === "VIDEO" && !hasExistingVideo ? (
            <>
              <FormField label="영상 URL">
                <FormInput
                  tone="secondary"
                  value={mediaUrls}
                  placeholder="영상 URL을 입력해주세요"
                  autoCapitalize="none"
                  onChangeText={setMediaUrls}
                />
              </FormField>

              <FormField label="썸네일 URL">
                <FormInput
                  tone="secondary"
                  value={thumbnailUrl}
                  placeholder="대표 이미지 URL을 입력해주세요"
                  autoCapitalize="none"
                  onChangeText={setThumbnailUrl}
                />
              </FormField>
            </>
          ) : null}

          <FormField label={`태그 (최대 ${MAX_TAGS}개)`}>
            <TagInput tags={tags} onChange={setTags} />
          </FormField>
        </View>
      </View>

      <View style={styles.submitArea}>
        {submitError ? <Text style={styles.submitError}>{submitError}</Text> : null}

        <SubmitButton
          tone="secondary"
          label={uploading ? "업로드 중..." : isEditMode ? "수정 완료" : "콘텐츠 등록"}
          active={isValid && !isSubmitting}
          disabled={isSubmitting}
          onPress={() => void submit()}
        />
      </View>

      <MediaSourceSheet
        open={isSourceSheetOpen}
        onClose={() => setIsSourceSheetOpen(false)}
        onSelect={(camera) => void pickImages(camera)}
      />
    </Screen>
  );
}

function ImagePreview({ uri, onRemove }: { uri: string; onRemove: () => void }) {
  return (
    <View style={styles.preview}>
      <Image source={{ uri }} style={styles.previewImage} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="사진 삭제"
        hitSlop={6}
        style={styles.previewRemove}
        onPress={onRemove}
      >
        <AppIcon name="formCloseCircle" size={16} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 24,
    backgroundColor: colors.white,
  },
  completeContainer: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  header: {
    paddingHorizontal: 15,
  },
  body: {
    gap: 24,
    paddingHorizontal: 32,
    paddingTop: 24,
  },
  upload: {
    gap: 12,
  },
  uploadPanel: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.secondary300,
    borderRadius: 8,
    backgroundColor: colors.secondary0,
    paddingHorizontal: 20,
    paddingVertical: 35,
  },
  uploadTexts: {
    alignItems: "center",
    gap: 4,
  },
  uploadTitle: {
    ...textStyles.body1,
    color: colors.neutral900,
  },
  uploadHints: {
    alignItems: "center",
  },
  uploadHint: {
    ...textStyles.caption2,
    color: colors.neutral500,
    textAlign: "center",
  },
  previews: {
    gap: 8,
  },
  previewList: {
    gap: 8,
    paddingTop: 4,
    paddingRight: 4,
  },
  preview: {
    width: 52,
    height: 52,
  },
  previewImage: {
    width: 52,
    height: 52,
    borderRadius: 8,
    backgroundColor: colors.neutral300,
  },
  previewRemove: {
    position: "absolute",
    top: -4,
    right: -4,
  },
  previewHint: {
    ...textStyles.caption4,
    color: colors.neutral600,
  },
  videoCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: colors.neutral400,
    borderRadius: 12,
    backgroundColor: colors.neutral200,
    paddingHorizontal: 12,
    paddingVertical: 13,
  },
  videoThumbnail: {
    width: 108,
    height: 60,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderRadius: 8,
    backgroundColor: colors.neutral300,
  },
  videoTexts: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  videoName: {
    ...textStyles.caption3,
    color: colors.neutral900,
  },
  videoMeta: {
    ...textStyles.body5,
    color: colors.neutral500,
  },
  videoRemove: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  formFields: {
    gap: 16,
  },
  typeRow: {
    flexDirection: "row",
    gap: 8,
  },
  typeButton: {
    width: 56,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  typeButtonSelected: {
    backgroundColor: colors.secondary500,
  },
  typeButtonIdle: {
    backgroundColor: colors.neutral300,
  },
  typeButtonError: {
    borderWidth: 1,
    borderColor: colors.error,
  },
  typeButtonDisabled: {
    opacity: 0.6,
  },
  typeButtonText: {
    ...textStyles.caption3,
    color: colors.neutral600,
  },
  typeButtonTextSelected: {
    color: colors.white,
  },
  typeButtonTextError: {
    color: colors.error,
  },
  helpText: {
    ...textStyles.body5,
    color: colors.neutral500,
  },
  inputError: {
    borderColor: colors.error,
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

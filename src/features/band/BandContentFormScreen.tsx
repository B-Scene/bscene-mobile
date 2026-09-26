import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Svg, { Path } from "react-native-svg";

import {
  useBandPostQuery,
  useCreateBandPost,
  useUpdateBandPost,
} from "@/hooks/api/band/useBand";
import { useActiveBandId } from "@/hooks/api/user/useMyProfiles";
import { AppButton } from "@/shared/components/AppButton";
import { AppHeader } from "@/shared/components/AppHeader";
import { AppState } from "@/shared/components/AppState";
import { Screen } from "@/shared/components/Screen";
import { colors } from "@/shared/constants/theme";
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

const splitTags = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim().replace(/^#/, ""))
    .filter(Boolean);

const joinLines = (items?: string[]) => items?.join("\n") ?? "";

const DESCRIPTION_MAX_LENGTH = 500;

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
        <AppHeader title={isEditMode ? "콘텐츠 수정" : "콘텐츠 등록"} />
        <AppState loading title="콘텐츠 정보를 준비하는 중이에요" />
      </Screen>
    );
  }

  if (!bandId) {
    return (
      <Screen contentStyle={styles.container}>
        <AppHeader title={isEditMode ? "콘텐츠 수정" : "콘텐츠 등록"} />
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
        <AppHeader title="콘텐츠 수정" />
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
  const [type, setType] = useState<PostType>(initialPost?.type ?? "PHOTO");
  const [title, setTitle] = useState(initialPost?.title ?? "");
  const [description, setDescription] = useState(initialPost?.description ?? "");
  const [mediaUrls, setMediaUrls] = useState(joinLines(initialPost?.mediaUrls));
  const [thumbnailUrl, setThumbnailUrl] = useState(
    initialPost?.thumbnailUrl ?? "",
  );
  const [tags, setTags] = useState(initialPost?.tags?.join(", ") ?? "");
  const [showErrors, setShowErrors] = useState(false);
  const titleError = showErrors && !title.trim();
  const isSubmitting = createPost.isPending || updatePost.isPending;

  const submit = async () => {
    if (!title.trim()) {
      setShowErrors(true);
      return;
    }

    const nextMediaUrls = type === "TEXT" ? [] : splitLines(mediaUrls);
    const nextTags = splitTags(tags);
    const nextThumbnailUrl = thumbnailUrl.trim();
    const commonPayload = {
      title: title.trim(),
      description: description.trim() || undefined,
      mediaUrls: nextMediaUrls.length > 0 ? nextMediaUrls : undefined,
      tags: nextTags.length > 0 ? nextTags : undefined,
      thumbnailUrl: nextThumbnailUrl || undefined,
    };

    const onSuccess = (nextPostId: number) => {
      router.replace(
        `/band/home/contents/${nextPostId}` as Parameters<
          typeof router.replace
        >[0],
      );
    };

    try {
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
    } catch {
      Alert.alert(
        isEditMode ? "콘텐츠 수정" : "콘텐츠 등록",
        "콘텐츠를 저장하지 못했어요.",
      );
    }
  };

  return (
    <Screen contentStyle={styles.container}>
      <AppHeader title={isEditMode ? "콘텐츠 수정" : "콘텐츠 등록"} />

      <View style={styles.body}>
        {type !== "TEXT" ? (
          <View style={styles.uploadPanel}>
            <UploadIcon />
            <Text style={styles.uploadTitle}>
              {type === "VIDEO" ? "영상 URL 입력" : "이미지 URL 입력"}
            </Text>
            <Text style={styles.uploadDescription}>
              현재 모바일에서는 기존 업로드 API 계약을 유지하며{"\n"}
              URL 입력 방식으로 저장해요
            </Text>
          </View>
        ) : null}

        <View style={styles.formFields}>
          <Field label="콘텐츠" required error={showErrors && !type}>
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
                      : styles.typeButtonIdle,
                    isEditMode && styles.typeButtonDisabled,
                  ]}
                  onPress={() => {
                    if (!isEditMode) setType(item.value);
                  }}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      type === item.value
                        ? styles.typeButtonTextSelected
                        : styles.typeButtonTextIdle,
                    ]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            {isEditMode ? (
              <Text style={styles.helpText}>
                콘텐츠 타입은 수정할 수 없어요. 현재 유형: {TYPE_TO_LABEL[type]}
              </Text>
            ) : null}
          </Field>

          <Field label="콘텐츠 제목" required error={titleError}>
            <NativeInput
              value={title}
              placeholder="콘텐츠 제목을 입력하세요"
              error={titleError}
              onChangeText={setTitle}
            />
          </Field>

          <Field label="설명">
            <NativeInput
              value={description}
              placeholder="콘텐츠에 대한 설명을 입력하세요"
              multiline
              maxLength={DESCRIPTION_MAX_LENGTH}
              onChangeText={setDescription}
            />
            <Text style={styles.countText}>
              {description.length}/{DESCRIPTION_MAX_LENGTH}
            </Text>
          </Field>

          {type !== "TEXT" ? (
            <>
              <Field label="미디어 URL">
                <NativeInput
                  value={mediaUrls}
                  placeholder="한 줄에 하나씩 입력"
                  multiline
                  autoCapitalize="none"
                  onChangeText={setMediaUrls}
                />
              </Field>

              <Field label="썸네일 URL">
                <NativeInput
                  value={thumbnailUrl}
                  placeholder="대표 이미지 URL"
                  autoCapitalize="none"
                  onChangeText={setThumbnailUrl}
                />
              </Field>
            </>
          ) : null}

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
        </View>

        <View style={styles.submitArea}>
          <AppButton
            label={isSubmitting ? "저장 중..." : isEditMode ? "수정 완료" : "콘텐츠 등록"}
            disabled={isSubmitting}
            loading={isSubmitting}
            style={[
              styles.submitButton,
              title.trim() ? styles.submitButtonActive : styles.submitButtonDisabled,
            ]}
            onPress={() => void submit()}
          />
        </View>
      </View>
    </Screen>
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

function UploadIcon() {
  return (
    <Svg width={36} height={36} viewBox="0 0 36 36" fill="none">
      <Path
        d="M18 7V23"
        stroke={colors.secondary500}
        strokeWidth={2.6}
        strokeLinecap="round"
      />
      <Path
        d="M11.5 13.5L18 7L24.5 13.5"
        stroke={colors.secondary500}
        strokeWidth={2.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M8 25.5V27.5C8 29.157 9.343 30.5 11 30.5H25C26.657 30.5 28 29.157 28 27.5V25.5"
        stroke={colors.secondary500}
        strokeWidth={2.6}
        strokeLinecap="round"
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 104,
    backgroundColor: colors.white,
  },
  body: {
    paddingHorizontal: 32,
    paddingTop: 24,
  },
  uploadPanel: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.secondary300,
    borderRadius: 8,
    backgroundColor: colors.secondary0,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 28,
    paddingVertical: 34,
  },
  uploadTitle: {
    color: colors.neutral900,
    fontSize: 15,
    fontWeight: "500",
    lineHeight: 20,
  },
  uploadDescription: {
    color: colors.neutral500,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 18,
    textAlign: "center",
  },
  formFields: {
    gap: 16,
    marginTop: 24,
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
  typeRow: {
    flexDirection: "row",
    gap: 8,
  },
  typeButton: {
    width: 56,
    height: 26,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  typeButtonSelected: {
    backgroundColor: colors.secondary500,
  },
  typeButtonIdle: {
    backgroundColor: colors.neutral300,
  },
  typeButtonDisabled: {
    opacity: 0.65,
  },
  typeButtonText: {
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 14,
  },
  typeButtonTextSelected: {
    color: colors.white,
  },
  typeButtonTextIdle: {
    color: colors.neutral600,
  },
  helpText: {
    color: colors.neutral600,
    fontSize: 12,
    lineHeight: 18,
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

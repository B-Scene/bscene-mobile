import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

import {
  useBandPostQuery,
  useCreateBandPost,
  useUpdateBandPost,
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

      <AppCard style={styles.formCard}>
        <View style={styles.field}>
          <Text style={styles.label}>콘텐츠 유형</Text>
          <View style={styles.chips}>
            {CONTENT_TYPES.map((item) => (
              <Chip
                key={item.value}
                label={item.label}
                selected={type === item.value}
                onPress={() => {
                  if (!isEditMode) setType(item.value);
                }}
              />
            ))}
          </View>
          {isEditMode ? (
            <Text style={styles.helpText}>
              수정에서는 기존 유형({TYPE_TO_LABEL[type]})을 유지해요.
            </Text>
          ) : null}
        </View>

        <AppTextInput
          label="제목"
          value={title}
          placeholder="콘텐츠 제목"
          error={titleError ? "제목을 입력해 주세요." : undefined}
          onChangeText={setTitle}
        />

        <AppTextInput
          label="설명"
          value={description}
          placeholder="팬들에게 보여줄 설명"
          multiline
          textAlignVertical="top"
          style={styles.multilineInput}
          onChangeText={setDescription}
        />

        {type !== "TEXT" ? (
          <>
            <AppTextInput
              label="미디어 URL"
              value={mediaUrls}
              placeholder="한 줄에 하나씩 입력"
              multiline
              autoCapitalize="none"
              textAlignVertical="top"
              style={styles.multilineInput}
              onChangeText={setMediaUrls}
            />
            <AppTextInput
              label="썸네일 URL"
              value={thumbnailUrl}
              placeholder="대표 이미지 URL"
              autoCapitalize="none"
              onChangeText={setThumbnailUrl}
            />
          </>
        ) : null}

        <AppTextInput
          label="태그"
          value={tags}
          placeholder="쉼표로 구분해서 입력"
          onChangeText={setTags}
        />

        <AppButton
          label={isEditMode ? "수정 완료" : "콘텐츠 등록"}
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
  helpText: {
    color: colors.neutral600,
    fontSize: 12,
    lineHeight: 18,
  },
  multilineInput: {
    minHeight: 112,
    paddingTop: spacing.md,
  },
});

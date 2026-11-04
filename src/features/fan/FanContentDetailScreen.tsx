import {
  router,
  useLocalSearchParams,
} from "expo-router";
import {
  useMemo,
  useState,
} from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  useFanExplorePostCommentsInfiniteQuery,
  useUpdateFanPostComment,
} from "@/hooks/api/fan/useFanCommentExtras";

import {
  useCreateFanExplorePostComment,
  useDeleteFanExplorePostComment,
  useFanExplorePostDetailQuery,
  useLikeFanExplorePost,
  useUnlikeFanExplorePost,
} from "@/hooks/api/fan/useFanExplore";

import {
  getPostBackground,
  PostArticle,
  PostAuthor,
  PostBody,
  PostCommentComposer,
  PostCommentError,
  PostCommentGroup,
  PostCommentItem,
  PostCommentMessage,
  PostCommentSection,
  PostDetailError,
  PostDetailSkeleton,
  PostMedia,
  PostStats,
} from "@/features/post/PostDetailParts";
import { AppHeader } from "@/shared/components/AppHeader";
import { Screen } from "@/shared/components/Screen";
import {
  colors,
  textStyles,
} from "@/shared/constants/theme";
import { useAuthStore } from "@/stores/useAuthStore";

import type {
  FanExplorePostDetail,
  NormalizedFanExplorePostComment,
} from "@/types/fan/explore";

const parseRouteId = (
  value?: string | string[],
) => {
  const rawValue =
    Array.isArray(value)
      ? value[0]
      : value;

  const parsed =
    Number(rawValue);

  return Number.isFinite(parsed) &&
    parsed > 0
    ? parsed
    : 0;
};

const normalizeStringList = (
  value?: string[] | string | null,
) => {
  if (
    Array.isArray(value)
  ) {
    return value;
  }

  if (
    typeof value ===
    "string"
  ) {
    return [value];
  }

  return [];
};

const getMediaUrls = (
  post: FanExplorePostDetail,
) =>
  Array.from(
    new Set([
      ...normalizeStringList(
        post.mediaUrls,
      ),

      ...normalizeStringList(
        post.mediaUrl,
      ),

      ...normalizeStringList(
        post.imageUrls,
      ),

      ...normalizeStringList(
        post.images,
      ),
    ]),
  );

export function FanContentDetailScreen() {
  const params =
    useLocalSearchParams<{
      postId?: string;
    }>();

  const postId =
    parseRouteId(
      params.postId,
    );

  const postQuery =
    useFanExplorePostDetailQuery(
      postId,
    );

  const commentsQuery =
    useFanExplorePostCommentsInfiniteQuery(
      postId,
    );

  const likeMutation =
    useLikeFanExplorePost();

  const unlikeMutation =
    useUnlikeFanExplorePost();

  const createCommentMutation =
    useCreateFanExplorePostComment(
      postId,
    );

  const deleteCommentMutation =
    useDeleteFanExplorePostComment(
      postId,
    );

  const updateCommentMutation =
    useUpdateFanPostComment(
      postId,
    );

  const [
    commentText,
    setCommentText,
  ] = useState("");

  const [
    editingCommentId,
    setEditingCommentId,
  ] = useState<number | null>(
    null,
  );

  const [
    editingCommentText,
    setEditingCommentText,
  ] = useState("");

  const [
    commentErrorMessage,
    setCommentErrorMessage,
  ] = useState("");

  const post =
    postQuery.data;

  const currentUserId =
    useAuthStore(
      (state) => state.user?.userId,
    );

  const comments =
    useMemo(() => {
      const allComments =
        commentsQuery.data?.pages.flatMap(
          (page) =>
            page.items,
        ) ?? [];

      const seen =
        new Set<string>();

      return allComments.filter(
        (comment) => {
          const key =
            comment.commentId != null
              ? String(
                  comment.commentId,
                )
              : `${comment.authorId}-${comment.createdAt}-${comment.content}`;

          if (
            seen.has(key)
          ) {
            return false;
          }

          seen.add(key);

          return true;
        },
      );
    }, [
      commentsQuery.data,
    ]);

  const myCommentIds =
    useMemo(() => {
      return new Set(
        comments
          .filter(
            (comment) =>
              comment.isMine ||
              (currentUserId != null &&
                comment.authorId === currentUserId),
          )
          .map((comment) => comment.commentId)
          .filter(
            (
              commentId,
            ): commentId is number =>
              commentId != null,
          ),
      );
    }, [
      comments,
      currentUserId,
    ]);

  const myComments =
    useMemo(() => {
      const firstPageMyComments =
        commentsQuery.data?.pages[0]?.myComments ??
        [];

      const mergedComments = [
        ...firstPageMyComments,

        ...comments.filter(
          (comment) =>
            comment.isMine ||
            (currentUserId != null &&
              comment.authorId === currentUserId),
        ),
      ];

      const seen =
        new Set<string>();

      return mergedComments.filter(
        (comment) => {
          const key =
            comment.commentId != null
              ? String(comment.commentId)
              : `${comment.authorId}-${comment.createdAt}-${comment.content}`;

          if (seen.has(key)) {
            return false;
          }

          seen.add(key);

          return true;
        },
      );
    }, [
      comments,
      commentsQuery.data?.pages,
      currentUserId,
    ]);

  const mediaUrls =
    post
      ? getMediaUrls(post)
      : [];

  const contentText =
    post?.contentText ??
    post?.body ??
    post?.text ??
    (
      typeof post?.content ===
      "string"
        ? post.content
        : ""
    ) ??
    "";

  const isLikePending =
    likeMutation.isPending ||
    unlikeMutation.isPending;

  const toggleLike =
    async () => {
      if (!post) {
        return;
      }

      try {
        if (
          post.isLiked
        ) {
          await unlikeMutation.mutateAsync(
            postId,
          );

          return;
        }

        await likeMutation.mutateAsync(
          postId,
        );
      } catch {
        Alert.alert(
          "콘텐츠 좋아요",
          "좋아요 상태를 변경하지 못했어요.",
        );
      }
    };

  const submitComment =
    async () => {
      const nextContent =
        commentText.trim();

      if (!nextContent) {
        return;
      }

      try {
        setCommentErrorMessage("");

        await createCommentMutation.mutateAsync(
          {
            content:
              nextContent,
          },
        );

        setCommentText("");
      } catch {
        setCommentErrorMessage(
          "댓글을 등록하지 못했어요. 잠시 후 다시 시도해 주세요.",
        );

        Alert.alert(
          "댓글 작성",
          "댓글을 등록하지 못했어요.",
        );
      }
    };

  const beginEditComment = (
    commentId: number | null,
    content: string,
  ) => {
    if (!commentId) {
      return;
    }

    setEditingCommentId(
      commentId,
    );

    setEditingCommentText(
      content,
    );

    setCommentErrorMessage("");
  };

  const cancelEdit =
    () => {
      setEditingCommentId(
        null,
      );

      setEditingCommentText(
        "",
      );
    };

  const saveEdit =
    async () => {
      if (
        !editingCommentId
      ) {
        return;
      }

      const content =
        editingCommentText.trim();

      if (!content) {
        Alert.alert(
          "댓글 수정",
          "댓글 내용을 입력해 주세요.",
        );

        return;
      }

      try {
        setCommentErrorMessage("");

        await updateCommentMutation.mutateAsync(
          {
            commentId:
              editingCommentId,
            content,
          },
        );

        cancelEdit();
      } catch {
        setCommentErrorMessage(
          "댓글을 수정하지 못했어요. 잠시 후 다시 시도해 주세요.",
        );

        Alert.alert(
          "댓글 수정",
          "댓글을 수정하지 못했어요.",
        );
      }
    };

  const deleteComment = (
    commentId:
      | number
      | null,
  ) => {
    if (!commentId) {
      return;
    }

    Alert.alert(
      "댓글 삭제",
      "댓글을 삭제할까요?",
      [
        {
          text: "취소",
          style: "cancel",
        },

        {
          text: "삭제",
          style:
            "destructive",

          onPress: () => {
            setCommentErrorMessage("");

            deleteCommentMutation.mutate(
              commentId,
              {
                onError: () => {
                  setCommentErrorMessage(
                    "댓글을 삭제하지 못했어요. 잠시 후 다시 시도해 주세요.",
                  );

                  Alert.alert(
                    "댓글 삭제",
                    "댓글을 삭제하지 못했어요.",
                  );
                },
              },
            );
          },
        },
      ],
    );
  };

  const loadMoreComments =
    () => {
      if (
        !commentsQuery.hasNextPage ||
        commentsQuery.isFetchingNextPage
      ) {
        return;
      }

      void commentsQuery.fetchNextPage();
    };

  const insets =
    useSafeAreaInsets();

  const mediaType =
    post?.type ??
    post?.mediaType ??
    post?.contentType;

  const commentCount =
    post?.commentCount ??
    comments.length;

  const commentIds =
    new Set(
      comments.map(
        (comment) =>
          comment.commentId,
      ),
    );

  const separateMyComments =
    myComments.filter(
      (comment) =>
        comment.commentId == null ||
        !commentIds.has(
          comment.commentId,
        ),
    );

  const renderComment = (
    comment: NormalizedFanExplorePostComment,
    isEditable: boolean,
  ) => (
    <PostCommentItem
      key={`${comment.commentId}-${comment.createdAt}`}
      tone="fan"
      comment={comment}
      isEditable={isEditable}
      isEditing={
        comment.commentId != null &&
        comment.commentId ===
          editingCommentId
      }
      editValue={
        editingCommentText
      }
      isSavePending={
        updateCommentMutation.isPending
      }
      onStartEdit={() =>
        beginEditComment(
          comment.commentId,
          comment.content,
        )
      }
      onCancelEdit={cancelEdit}
      onEditValueChange={
        setEditingCommentText
      }
      onSubmitEdit={() =>
        void saveEdit()
      }
      onDelete={() =>
        deleteComment(
          comment.commentId,
        )
      }
    />
  );

  return (
    <Screen
      edges={[
        "top",
        "left",
        "right",
      ]}
      contentStyle={{
        ...styles.container,
        paddingBottom:
          insets.bottom,
      }}
    >
      <AppHeader
        title=""
        style={styles.header}
      />

      {postQuery.isLoading ? (
        <PostDetailSkeleton />
      ) : postQuery.isError ||
        !post ? (
        <PostDetailError
          tone="fan"
          description="삭제되었거나 네트워크 연결이 불안정할 수 있어요."
          onRetry={() =>
            void postQuery.refetch()
          }
        />
      ) : (
        <>
          <PostArticle>
            <PostAuthor
              bandName={
                post.bandName ??
                "밴드"
              }
              imageUrl={
                post.profileImageUrl ??
                post.band
                  ?.profileImageUrl
              }
              createdAt={
                post.createdAt
              }
              onPress={
                post.bandId
                  ? () =>
                      router.push(
                        `/fan/bands/${post.bandId}` as Parameters<
                          typeof router.push
                        >[0],
                      )
                  : undefined
              }
            />

            {mediaType !== "TEXT" &&
            mediaUrls.length > 0 ? (
              <PostMedia
                tone="fan"
                imageUrls={
                  mediaUrls
                }
                isVideo={
                  mediaType ===
                  "VIDEO"
                }
                videoPosterUrl={
                  post.thumbnailUrl ??
                  post.videoThumbnailUrl
                }
              />
            ) : null}

            <PostStats
              isLiked={
                post.isLiked
              }
              likeCount={
                post.likeCount ??
                0
              }
              commentCount={
                commentCount
              }
              likeDisabled={
                isLikePending
              }
              onLikePress={() =>
                void toggleLike()
              }
            />

            <PostBody
              tone="fan"
              title={
                post.title ??
                "콘텐츠"
              }
              content={
                contentText
              }
              tags={normalizeStringList(
                post.tags,
              )}
            />
          </PostArticle>

          <PostCommentSection
            tone="fan"
            count={commentCount}
          >
            <PostCommentComposer
              tone="fan"
              value={commentText}
              isPending={
                createCommentMutation.isPending
              }
              onChangeText={
                setCommentText
              }
              onSubmit={() =>
                void submitComment()
              }
            />

            {commentErrorMessage ? (
              <PostCommentError
                message={
                  commentErrorMessage
                }
              />
            ) : null}

            {commentsQuery.isLoading ? (
              <PostCommentMessage
                tone="fan"
                message="댓글을 불러오고 있어요"
              />
            ) : commentsQuery.isError ? (
              <PostCommentMessage
                tone="fan"
                message="댓글을 불러오지 못했어요"
                actionLabel="다시 시도"
                onAction={() =>
                  void commentsQuery.refetch()
                }
              />
            ) : comments.length ===
                0 &&
              separateMyComments.length ===
                0 ? (
              <PostCommentMessage
                tone="fan"
                message="아직 댓글이 없어요"
              />
            ) : (
              <>
                {separateMyComments.length >
                0 ? (
                  <PostCommentGroup title="내 댓글">
                    {separateMyComments.map(
                      (comment) =>
                        renderComment(
                          comment,
                          comment.commentId !=
                            null,
                        ),
                    )}
                  </PostCommentGroup>
                ) : null}

                {comments.length >
                0 ? (
                  <PostCommentGroup
                    title={
                      separateMyComments.length >
                      0
                        ? "전체 댓글"
                        : undefined
                    }
                  >
                    {comments.map(
                      (comment) =>
                        renderComment(
                          comment,
                          comment.isMine ||
                            (comment.commentId !=
                              null &&
                              myCommentIds.has(
                                comment.commentId,
                              )) ||
                            (currentUserId !=
                              null &&
                              comment.authorId ===
                                currentUserId),
                        ),
                    )}
                  </PostCommentGroup>
                ) : null}

                {commentsQuery.isFetchingNextPage ? (
                  <PostCommentMessage
                    tone="fan"
                    message="댓글을 더 불러오고 있어요"
                  />
                ) : commentsQuery.hasNextPage ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={
                      loadMoreComments
                    }
                  >
                    <Text
                      style={
                        styles.loadMore
                      }
                    >
                      댓글 더 보기
                    </Text>
                  </Pressable>
                ) : null}
              </>
            )}
          </PostCommentSection>
        </>
      )}
    </Screen>
  );
}

const styles =
  StyleSheet.create({
    container: {
      paddingHorizontal: 0,
      paddingTop: 0,
      backgroundColor:
        getPostBackground("fan"),
    },

    header: {
      paddingHorizontal: 15,
    },

    loadMore: {
      ...textStyles.caption3,
      color:
        colors.primary400,
      textAlign: "center",
    },
  });

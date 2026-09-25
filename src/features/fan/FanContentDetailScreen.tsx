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
  StyleSheet,
  Text,
  View,
} from "react-native";

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

import { AppButton } from "@/shared/components/AppButton";
import { AppCard } from "@/shared/components/AppCard";
import { AppHeader } from "@/shared/components/AppHeader";
import { AppState } from "@/shared/components/AppState";
import { AppTextInput } from "@/shared/components/AppTextInput";
import { Avatar } from "@/shared/components/Avatar";
import { Badge } from "@/shared/components/Badge";
import { Screen } from "@/shared/components/Screen";
import {
  colors,
  spacing,
} from "@/shared/constants/theme";

import type {
  FanExplorePostDetail,
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
) => [
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
];

const formatDate = (
  value?: string | null,
) => {
  if (!value) {
    return "";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value;
  }

  const year =
    date.getFullYear();

  const month = String(
    date.getMonth() + 1,
  ).padStart(2, "0");

  const day = String(
    date.getDate(),
  ).padStart(2, "0");

  return `${year}.${month}.${day}.`;
};

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

  const post =
    postQuery.data;

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
        await createCommentMutation.mutateAsync(
          {
            content:
              nextContent,
          },
        );

        setCommentText("");
      } catch {
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
        await updateCommentMutation.mutateAsync(
          {
            commentId:
              editingCommentId,
            content,
          },
        );

        cancelEdit();
      } catch {
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
            deleteCommentMutation.mutate(
              commentId,
              {
                onError: () => {
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

  return (
    <Screen
      contentStyle={
        styles.container
      }
    >
      <AppHeader title="콘텐츠 상세" />

      {postQuery.isLoading ? (
        <AppState
          loading
          title="콘텐츠를 불러오는 중이에요"
        />
      ) : postQuery.isError ||
        !post ? (
        <AppState
          title="콘텐츠를 불러오지 못했어요"
          description="삭제되었거나 네트워크 연결이 불안정할 수 있어요."
          actionLabel="다시 시도"
          onAction={() =>
            void postQuery.refetch()
          }
        />
      ) : (
        <>
          <AppCard
            style={
              styles.heroCard
            }
          >
            <View
              style={
                styles.authorRow
              }
            >
              <Avatar
                imageUrl={
                  post.profileImageUrl ??
                  post.band
                    ?.profileImageUrl
                }
                label={
                  post.bandName ??
                  "밴드"
                }
                size={48}
              />

              <View
                style={
                  styles.authorText
                }
              >
                <Text
                  style={
                    styles.bandName
                  }
                >
                  {post.bandName ??
                    "밴드"}
                </Text>

                <Text
                  style={
                    styles.meta
                  }
                >
                  {[
                    post.genre,
                    post.region,
                    formatDate(
                      post.createdAt,
                    ),
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </Text>
              </View>

              {post.bandId ? (
                <AppButton
                  label="밴드"
                  variant="ghost"
                  style={
                    styles.compactButton
                  }
                  onPress={() =>
                    router.push(
                      `/fan/bands/${post.bandId}` as Parameters<
                        typeof router.push
                      >[0],
                    )
                  }
                />
              ) : null}
            </View>

            <Badge
              label={String(
                post.type ??
                  "콘텐츠",
              )}
              tone="yellow"
            />

            <Text
              style={
                styles.title
              }
            >
              {post.title ??
                "콘텐츠"}
            </Text>

            {contentText ? (
              <Text
                style={
                  styles.body
                }
              >
                {contentText}
              </Text>
            ) : null}
          </AppCard>

          {mediaUrls.length >
          0 ? (
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
                미디어
              </Text>

              {mediaUrls.map(
                (url) => (
                  <Text
                    key={url}
                    numberOfLines={
                      1
                    }
                    style={
                      styles.mediaUrl
                    }
                  >
                    {url}
                  </Text>
                ),
              )}
            </AppCard>
          ) : null}

          <View
            style={
              styles.actionRow
            }
          >
            <AppButton
              label={`${
                post.isLiked
                  ? "좋아요 취소"
                  : "좋아요"
              } · ${(
                post.likeCount ??
                0
              ).toLocaleString()}`}
              variant={
                post.isLiked
                  ? "secondary"
                  : "ghost"
              }
              loading={
                isLikePending
              }
              style={
                styles.actionButton
              }
              onPress={() =>
                void toggleLike()
              }
            />

            <AppButton
              label={`댓글 · ${(
                post.commentCount ??
                comments.length
              ).toLocaleString()}`}
              variant="ghost"
              style={
                styles.actionButton
              }
              onPress={() =>
                void commentsQuery.refetch()
              }
            />
          </View>

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
              댓글
            </Text>

            <AppTextInput
              label="댓글 작성"
              value={
                commentText
              }
              placeholder="댓글을 입력하세요"
              multiline
              textAlignVertical="top"
              style={
                styles.commentInput
              }
              onChangeText={
                setCommentText
              }
            />

            <AppButton
              label="댓글 등록"
              loading={
                createCommentMutation.isPending
              }
              onPress={() =>
                void submitComment()
              }
            />

            {commentsQuery.isLoading ? (
              <Text
                style={styles.meta}
              >
                댓글을 불러오는
                중이에요
              </Text>
            ) : comments.length ===
              0 ? (
              <Text
                style={styles.meta}
              >
                아직 댓글이
                없어요.
              </Text>
            ) : (
              <View
                style={
                  styles.commentList
                }
              >
                {comments.map(
                  (comment) => {
                    const isEditing =
                      comment.commentId ===
                      editingCommentId;

                    return (
                      <View
                        key={`${comment.commentId}-${comment.createdAt}`}
                        style={
                          styles.commentRow
                        }
                      >
                        <Avatar
                          imageUrl={
                            comment.profileImageUrl
                          }
                          label={
                            comment.authorName
                          }
                          size={36}
                        />

                        <View
                          style={
                            styles.commentText
                          }
                        >
                          <Text
                            style={
                              styles.commentAuthor
                            }
                          >
                            {
                              comment.authorName
                            }
                          </Text>

                          {isEditing ? (
                            <>
                              <AppTextInput
                                label="댓글 수정"
                                value={
                                  editingCommentText
                                }
                                multiline
                                style={
                                  styles.editInput
                                }
                                onChangeText={
                                  setEditingCommentText
                                }
                              />

                              <View
                                style={
                                  styles.commentActions
                                }
                              >
                                <AppButton
                                  label="취소"
                                  variant="ghost"
                                  style={
                                    styles.smallButton
                                  }
                                  onPress={
                                    cancelEdit
                                  }
                                />

                                <AppButton
                                  label="저장"
                                  loading={
                                    updateCommentMutation.isPending
                                  }
                                  style={
                                    styles.smallButton
                                  }
                                  onPress={() =>
                                    void saveEdit()
                                  }
                                />
                              </View>
                            </>
                          ) : (
                            <>
                              <Text
                                style={
                                  styles.commentBody
                                }
                              >
                                {
                                  comment.content
                                }
                              </Text>

                              {comment.createdAt ? (
                                <Text
                                  style={
                                    styles.meta
                                  }
                                >
                                  {formatDate(
                                    comment.createdAt,
                                  )}
                                </Text>
                              ) : null}

                              {comment.isMine ? (
                                <View
                                  style={
                                    styles.commentActions
                                  }
                                >
                                  <AppButton
                                    label="수정"
                                    variant="ghost"
                                    style={
                                      styles.smallButton
                                    }
                                    onPress={() =>
                                      beginEditComment(
                                        comment.commentId,
                                        comment.content,
                                      )
                                    }
                                  />

                                  <AppButton
                                    label="삭제"
                                    variant="ghost"
                                    style={
                                      styles.smallButton
                                    }
                                    onPress={() =>
                                      deleteComment(
                                        comment.commentId,
                                      )
                                    }
                                  />
                                </View>
                              ) : null}
                            </>
                          )}
                        </View>
                      </View>
                    );
                  },
                )}

                {commentsQuery.hasNextPage ? (
                  <AppButton
                    label={
                      commentsQuery.isFetchingNextPage
                        ? "댓글 불러오는 중..."
                        : "댓글 더 보기"
                    }
                    variant="secondary"
                    loading={
                      commentsQuery.isFetchingNextPage
                    }
                    onPress={
                      loadMoreComments
                    }
                  />
                ) : null}
              </View>
            )}
          </AppCard>
        </>
      )}
    </Screen>
  );
}

const styles =
  StyleSheet.create({
    container: {
      gap: spacing.lg,
    },

    heroCard: {
      gap: spacing.md,
    },

    authorRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
    },

    authorText: {
      flex: 1,
      gap: spacing.xs,
    },

    bandName: {
      color:
        colors.neutral900,
      fontSize: 15,
      fontWeight: "900",
    },

    title: {
      color:
        colors.neutral900,
      fontSize: 24,
      fontWeight: "900",
      lineHeight: 31,
    },

    body: {
      color:
        colors.neutral800,
      fontSize: 14,
      lineHeight: 22,
    },

    meta: {
      color:
        colors.neutral600,
      fontSize: 12,
      lineHeight: 18,
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

    mediaUrl: {
      color:
        colors.neutral600,
      fontSize: 12,
      lineHeight: 18,
    },

    actionRow: {
      flexDirection: "row",
      gap: spacing.sm,
    },

    actionButton: {
      flex: 1,
      minHeight: 44,
      paddingHorizontal:
        spacing.md,
    },

    compactButton: {
      minHeight: 38,
      paddingHorizontal:
        spacing.md,
    },

    commentInput: {
      minHeight: 92,
      paddingTop:
        spacing.md,
    },

    commentList: {
      gap: spacing.lg,
    },

    commentRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: spacing.md,
    },

    commentText: {
      flex: 1,
      gap: spacing.xs,
    },

    commentAuthor: {
      color:
        colors.neutral900,
      fontSize: 13,
      fontWeight: "900",
    },

    commentBody: {
      color:
        colors.neutral800,
      fontSize: 13,
      lineHeight: 19,
    },

    commentActions: {
      flexDirection: "row",
      gap: spacing.sm,
      marginTop:
        spacing.xs,
    },

    smallButton: {
      minHeight: 36,
      paddingHorizontal:
        spacing.md,
    },

    editInput: {
      minHeight: 72,
      paddingTop:
        spacing.md,
    },
  });
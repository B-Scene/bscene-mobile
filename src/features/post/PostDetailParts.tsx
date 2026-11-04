import { useEffect, useState, type ReactNode } from "react";
import {
  Animated,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

import { AppIcon } from "@/shared/components/AppIcon";
import { ProfileImage } from "@/shared/components/ProfileImage";
import { colors, textStyles } from "@/shared/constants/theme";
import { formatRelativeTime } from "@/shared/utils/formatRelativeTime";

import type { NormalizedFanExplorePostComment } from "@/types/fan/explore";

export type PostTone = "fan" | "band";

const ARTICLE_PADDING_X = 25;
const MEDIA_HEIGHT = 422;

const TONES = {
  fan: {
    accent: colors.primary400,
    background: colors.primary0,
    tagBackground: colors.primary50,
  },
  band: {
    accent: colors.secondary500,
    background: colors.secondary0,
    tagBackground: colors.secondary100,
  },
} as const;

export const getPostBackground = (tone: PostTone) => TONES[tone].background;

const getPageIndex = (
  event: NativeSyntheticEvent<NativeScrollEvent>,
  pageWidth: number,
  pageCount: number,
) => {
  const index = Math.round(event.nativeEvent.contentOffset.x / pageWidth);

  return Math.min(pageCount - 1, Math.max(0, index));
};

export function PulseView({
  style,
  children,
}: {
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}) {
  const [opacity] = useState(() => new Animated.Value(1));

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.5,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();

    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View style={[style, { opacity }]}>{children}</Animated.View>
  );
}

export function PostDetailSkeleton() {
  return (
    <PulseView style={styles.skeleton}>
      <View style={styles.author}>
        <View style={styles.skeletonAvatar} />
        <View style={styles.authorText}>
          <View style={styles.skeletonName} />
          <View style={styles.skeletonTime} />
        </View>
      </View>
      <View style={styles.skeletonMedia} />
      <View style={styles.stats}>
        <View style={styles.skeletonStat} />
        <View style={styles.skeletonStat} />
      </View>
      <View style={styles.skeletonTitle} />
      <View style={styles.skeletonBody} />
    </PulseView>
  );
}

export function PostDetailError({
  tone,
  description,
  onRetry,
}: {
  tone: PostTone;
  description: string;
  onRetry: () => void;
}) {
  return (
    <View style={styles.error}>
      <Text style={styles.errorTitle}>콘텐츠를 불러오지 못했어요</Text>
      <Text style={styles.errorDescription}>{description}</Text>
      <Pressable
        accessibilityRole="button"
        style={[styles.retryButton, { backgroundColor: TONES[tone].accent }]}
        onPress={onRetry}
      >
        <Text style={styles.retryText}>다시 시도</Text>
      </Pressable>
    </View>
  );
}

export function PostArticle({ children }: { children: ReactNode }) {
  return <View style={styles.article}>{children}</View>;
}

export function PostAuthor({
  bandName,
  imageUrl,
  createdAt,
  onPress,
}: {
  bandName: string;
  imageUrl?: string | null;
  createdAt?: string | null;
  onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole={onPress ? "button" : undefined}
      disabled={!onPress}
      style={styles.author}
      onPress={onPress}
    >
      <ProfileImage imageUrl={imageUrl} size={42} variant="band" />
      <View style={styles.authorText}>
        <Text numberOfLines={1} style={styles.bandName}>
          {bandName}
        </Text>
        <Text style={styles.timeAgo}>{formatRelativeTime(createdAt)}</Text>
      </View>
    </Pressable>
  );
}

export function PostMedia({
  tone,
  imageUrls,
  videoPosterUrl,
  isVideo,
}: {
  tone: PostTone;
  imageUrls: string[];
  videoPosterUrl?: string | null;
  isVideo: boolean;
}) {
  const { width: windowWidth } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const mediaWidth = windowWidth - ARTICLE_PADDING_X * 2;

  if (isVideo) {
    return (
      <View style={styles.media}>
        {videoPosterUrl ? (
          <Image
            source={{ uri: videoPosterUrl }}
            resizeMode="cover"
            style={styles.mediaImage}
          />
        ) : null}
      </View>
    );
  }

  return (
    <>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        style={styles.media}
        onScroll={(event) =>
          setActiveIndex(getPageIndex(event, mediaWidth, imageUrls.length))
        }
      >
        {imageUrls.map((url, index) => (
          <Pressable
            key={`${url}-${index}`}
            accessibilityRole="imagebutton"
            accessibilityLabel={`콘텐츠 이미지 ${index + 1}`}
            style={{ width: mediaWidth, height: MEDIA_HEIGHT }}
            onPress={() => setLightboxIndex(index)}
          >
            <Image
              source={{ uri: url }}
              resizeMode="cover"
              style={styles.mediaImage}
            />
          </Pressable>
        ))}
      </ScrollView>

      {imageUrls.length > 1 ? (
        <View style={styles.dots}>
          {imageUrls.map((url, index) => (
            <View
              key={`${url}-dot-${index}`}
              style={[
                styles.dot,
                index === activeIndex && {
                  backgroundColor: TONES[tone].accent,
                },
              ]}
            />
          ))}
        </View>
      ) : null}

      {lightboxIndex !== null ? (
        <PostLightbox
          images={imageUrls}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      ) : null}
    </>
  );
}

function PostLightbox({
  images,
  initialIndex,
  onClose,
}: {
  images: string[];
  initialIndex: number;
  onClose: () => void;
}) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  return (
    <Modal
      visible
      transparent
      statusBarTranslucent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.lightbox}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          contentOffset={{ x: initialIndex * width, y: 0 }}
          onScroll={(event) =>
            setCurrentIndex(getPageIndex(event, width, images.length))
          }
        >
          {images.map((url, index) => (
            <Pressable
              key={`${url}-${index}`}
              style={[styles.lightboxPage, { width }]}
              onPress={onClose}
            >
              <Image
                source={{ uri: url }}
                resizeMode="contain"
                style={styles.lightboxImage}
              />
            </Pressable>
          ))}
        </ScrollView>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="닫기"
          style={[styles.lightboxClose, { top: insets.top + 16 }]}
          onPress={onClose}
        >
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path
              d="M6 6L18 18M18 6L6 18"
              stroke={colors.white}
              strokeWidth={2}
              strokeLinecap="round"
            />
          </Svg>
        </Pressable>

        {images.length > 1 ? (
          <View
            style={[styles.lightboxDots, { paddingBottom: insets.bottom + 24 }]}
          >
            {images.map((url, index) => (
              <View
                key={`${url}-lightbox-dot-${index}`}
                style={[
                  styles.lightboxDot,
                  index === currentIndex && styles.lightboxDotActive,
                ]}
              />
            ))}
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

export function PostStats({
  isLiked = false,
  likeCount,
  commentCount,
  likeDisabled,
  onLikePress,
}: {
  isLiked?: boolean;
  likeCount: number;
  commentCount: number;
  likeDisabled?: boolean;
  onLikePress?: () => void;
}) {
  return (
    <View style={styles.stats}>
      <Pressable
        accessibilityRole={onLikePress ? "button" : undefined}
        accessibilityLabel={isLiked ? "좋아요 취소" : "좋아요"}
        accessibilityState={{ selected: isLiked }}
        disabled={likeDisabled || !onLikePress}
        style={styles.stat}
        onPress={onLikePress}
      >
        <AppIcon name={isLiked ? "postHeartLiked" : "postHeart"} size={25} />
        <Text style={styles.statText}>{likeCount}</Text>
      </Pressable>

      <View style={styles.stat}>
        <AppIcon name="postComment" size={20} />
        <Text style={styles.statText}>{commentCount}</Text>
      </View>
    </View>
  );
}

export function PostBody({
  tone,
  title,
  content,
  tags,
}: {
  tone: PostTone;
  title: string;
  content?: string | null;
  tags: string[];
}) {
  const { accent, tagBackground } = TONES[tone];

  return (
    <View style={styles.body}>
      <Text style={styles.title}>{title}</Text>

      {content?.trim() ? <Text style={styles.content}>{content}</Text> : null}

      {tags.length > 0 ? (
        <View style={styles.tags}>
          {tags.map((tag) => (
            <View
              key={tag}
              style={[styles.tag, { backgroundColor: tagBackground }]}
            >
              <Text style={[styles.tagText, { color: accent }]}>{tag}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

export function PostCommentSection({
  tone,
  count,
  children,
}: {
  tone: PostTone;
  count: number;
  children: ReactNode;
}) {
  return (
    <View
      style={[
        styles.comments,
        { backgroundColor: TONES[tone].background },
      ]}
    >
      <Text style={styles.commentHeading}>댓글 {count}</Text>
      {children}
    </View>
  );
}

function PostCommentInput({
  tone,
  value,
  placeholder,
  onChangeText,
}: {
  tone: PostTone;
  value: string;
  placeholder?: string;
  onChangeText: (value: string) => void;
}) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <TextInput
      multiline
      value={value}
      maxLength={500}
      placeholder={placeholder}
      placeholderTextColor={colors.neutral500}
      textAlignVertical="top"
      style={[
        styles.commentInput,
        isFocused && { borderColor: TONES[tone].accent },
      ]}
      onBlur={() => setIsFocused(false)}
      onChangeText={onChangeText}
      onFocus={() => setIsFocused(true)}
    />
  );
}

export function PostCommentComposer({
  tone,
  value,
  isPending,
  onChangeText,
  onSubmit,
}: {
  tone: PostTone;
  value: string;
  isPending: boolean;
  onChangeText: (value: string) => void;
  onSubmit: () => void;
}) {
  const isDisabled = !value.trim() || isPending;

  return (
    <View style={styles.composer}>
      <PostCommentInput
        tone={tone}
        value={value}
        placeholder="댓글을 입력해주세요"
        onChangeText={onChangeText}
      />
      <View style={styles.composerFooter}>
        <Text style={styles.counter}>{value.length}/500</Text>
        <Pressable
          accessibilityRole="button"
          disabled={isDisabled}
          style={[
            styles.submitButton,
            {
              backgroundColor: isDisabled
                ? colors.neutral400
                : TONES[tone].accent,
            },
          ]}
          onPress={onSubmit}
        >
          <Text style={styles.submitText}>등록</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function PostCommentMessage({
  tone,
  message,
  actionLabel,
  onAction,
}: {
  tone: PostTone;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.commentMessage}>
      <Text style={styles.commentMessageText}>{message}</Text>
      {actionLabel ? (
        <Pressable accessibilityRole="button" onPress={onAction}>
          <Text style={[styles.textAction, { color: TONES[tone].accent }]}>
            {actionLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function PostCommentError({ message }: { message: string }) {
  return <Text style={styles.commentError}>{message}</Text>;
}

export function PostCommentGroup({
  title,
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.commentGroup}>
      {title ? <Text style={styles.commentGroupTitle}>{title}</Text> : null}
      {children}
    </View>
  );
}

export function PostCommentItem({
  tone,
  comment,
  isEditable,
  isEditing,
  editValue,
  isSavePending,
  onStartEdit,
  onCancelEdit,
  onEditValueChange,
  onSubmitEdit,
  onDelete,
}: {
  tone: PostTone;
  comment: NormalizedFanExplorePostComment;
  isEditable: boolean;
  isEditing: boolean;
  editValue: string;
  isSavePending: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onEditValueChange: (value: string) => void;
  onSubmitEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <View style={styles.comment}>
      <ProfileImage imageUrl={comment.profileImageUrl} size={35} />

      <View style={styles.commentMain}>
        <View style={styles.commentMeta}>
          <Text style={styles.commentAuthor}>{comment.authorName}</Text>
          {comment.writerMode === "BAND" ? (
            <AppIcon name="officialBadge" size={14} />
          ) : null}
          {comment.createdAt ? (
            <Text style={styles.commentTime}>
              {formatRelativeTime(comment.createdAt)}
            </Text>
          ) : null}
        </View>

        {isEditing ? (
          <View style={styles.editForm}>
            <PostCommentInput
              tone={tone}
              value={editValue}
              onChangeText={onEditValueChange}
            />
            <View style={styles.editActions}>
              <Pressable accessibilityRole="button" onPress={onCancelEdit}>
                <Text style={[styles.textAction, styles.cancelText]}>취소</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                disabled={isSavePending}
                onPress={onSubmitEdit}
              >
                <Text
                  style={[
                    styles.textAction,
                    {
                      color:
                        isSavePending || !editValue.trim()
                          ? colors.neutral500
                          : TONES[tone].accent,
                    },
                  ]}
                >
                  저장
                </Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <Text style={styles.commentContent}>{comment.content}</Text>
        )}

        {!isEditing && isEditable ? (
          <View style={styles.commentActions}>
            <Pressable
              accessibilityRole="button"
              hitSlop={8}
              onPress={onStartEdit}
            >
              <Text style={styles.commentAction}>수정</Text>
            </Pressable>
            <Pressable accessibilityRole="button" hitSlop={8} onPress={onDelete}>
              <Text style={styles.commentAction}>삭제</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    paddingHorizontal: ARTICLE_PADDING_X,
    paddingTop: 24,
  },
  skeletonAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.neutral300,
  },
  skeletonName: {
    width: 120,
    height: 18,
    borderRadius: 4,
    backgroundColor: colors.neutral300,
  },
  skeletonTime: {
    width: 72,
    height: 12,
    marginTop: 8,
    borderRadius: 4,
    backgroundColor: colors.neutral300,
  },
  skeletonMedia: {
    width: "100%",
    height: MEDIA_HEIGHT,
    marginTop: 24,
    backgroundColor: colors.neutral300,
  },
  skeletonStat: {
    width: 48,
    height: 20,
    borderRadius: 4,
    backgroundColor: colors.neutral300,
  },
  skeletonTitle: {
    width: 220,
    height: 20,
    marginTop: 16,
    borderRadius: 4,
    backgroundColor: colors.neutral300,
  },
  skeletonBody: {
    width: "100%",
    height: 56,
    marginTop: 12,
    borderRadius: 4,
    backgroundColor: colors.neutral300,
  },
  error: {
    minHeight: 420,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: ARTICLE_PADDING_X,
  },
  errorTitle: {
    ...textStyles.label1,
    color: colors.neutral900,
    textAlign: "center",
  },
  errorDescription: {
    ...textStyles.caption2,
    marginTop: 8,
    color: colors.neutral600,
    textAlign: "center",
  },
  retryButton: {
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    borderRadius: 8,
    paddingHorizontal: 20,
  },
  retryText: {
    ...textStyles.body1,
    color: colors.white,
  },
  article: {
    backgroundColor: colors.white,
    paddingHorizontal: ARTICLE_PADDING_X,
    paddingVertical: 24,
  },
  author: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  authorText: {
    flex: 1,
    minWidth: 0,
  },
  bandName: {
    ...textStyles.label1,
    color: colors.neutral900,
  },
  timeAgo: {
    ...textStyles.caption3,
    marginTop: 4,
    color: colors.neutral600,
  },
  media: {
    width: "100%",
    height: MEDIA_HEIGHT,
    flexGrow: 0,
    marginTop: 24,
    backgroundColor: colors.neutral300,
  },
  mediaImage: {
    width: "100%",
    height: "100%",
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 4,
    marginTop: 8,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.neutral400,
  },
  lightbox: {
    flex: 1,
    backgroundColor: colors.neutral900,
  },
  lightboxPage: {
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  lightboxImage: {
    width: "100%",
    height: "100%",
  },
  lightboxClose: {
    position: "absolute",
    right: 16,
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: "rgba(41, 41, 41, 0.6)",
  },
  lightboxDots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  lightboxDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
  },
  lightboxDotActive: {
    backgroundColor: colors.white,
  },
  stats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 24,
    marginTop: 24,
  },
  stat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    ...textStyles.caption3,
    color: colors.neutral900,
  },
  body: {
    marginTop: 16,
  },
  title: {
    ...textStyles.body1,
    color: colors.neutral900,
  },
  content: {
    ...textStyles.caption2,
    marginTop: 8,
    color: colors.neutral900,
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 16,
  },
  tag: {
    height: 26,
    minWidth: 51,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    paddingHorizontal: 15,
  },
  tagText: {
    ...textStyles.caption3,
  },
  comments: {
    flexGrow: 1,
    gap: 16,
    paddingLeft: 25,
    paddingRight: 26,
    paddingTop: 16,
    paddingBottom: 24,
  },
  commentHeading: {
    ...textStyles.caption3,
    color: colors.neutral900,
  },
  composer: {
    gap: 8,
  },
  commentInput: {
    ...textStyles.caption2,
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.neutral300,
    borderRadius: 8,
    backgroundColor: colors.white,
    color: colors.neutral900,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  composerFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  counter: {
    ...textStyles.caption4,
    color: colors.neutral500,
  },
  submitButton: {
    height: 32,
    minWidth: 68,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    paddingHorizontal: 14,
  },
  submitText: {
    ...textStyles.caption3,
    color: colors.white,
  },
  commentError: {
    ...textStyles.caption3,
    color: colors.secondary500,
  },
  commentMessage: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  commentMessageText: {
    ...textStyles.caption2,
    color: colors.neutral600,
  },
  textAction: {
    ...textStyles.caption3,
  },
  cancelText: {
    color: colors.neutral600,
  },
  commentGroup: {
    gap: 12,
  },
  commentGroupTitle: {
    ...textStyles.caption3,
    color: colors.neutral700,
  },
  comment: {
    flexDirection: "row",
    gap: 16,
  },
  commentMain: {
    flex: 1,
    minWidth: 0,
  },
  commentMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  commentAuthor: {
    ...textStyles.caption3,
    color: colors.neutral900,
  },
  commentTime: {
    ...textStyles.caption4,
    color: colors.neutral500,
  },
  commentContent: {
    ...textStyles.caption2,
    color: colors.neutral700,
  },
  commentActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 6,
  },
  commentAction: {
    ...textStyles.caption4,
    color: colors.neutral600,
  },
  editForm: {
    gap: 8,
    marginTop: 6,
  },
  editActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
});

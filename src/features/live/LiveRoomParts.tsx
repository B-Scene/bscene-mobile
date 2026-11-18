import { useQuery } from "@tanstack/react-query";
import {
  useEffect,
  useRef,
  useState,
  type ComponentRef,
} from "react";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";

import { getLiveMembers } from "@/api/live/live";
import { LiveWaveform } from "@/features/live/LiveWaveform";
import { AppIcon } from "@/shared/components/AppIcon";
import { ProfileImage } from "@/shared/components/ProfileImage";
import { getPartLabel } from "@/shared/constants/bandLabels";
import { colors, shadows, textStyles } from "@/shared/constants/theme";
import type { LiveChatMessage, LiveMemberItem } from "@/types/live/live";
import { BottomSheetModal } from "@/shared/components/BottomSheetModal";

export type LiveRoomTone = "band" | "fan";

const getAccent = (tone: LiveRoomTone) =>
  tone === "band" ? colors.secondary500 : colors.primary400;

const parseServerDate = (value: string) =>
  new Date(value.includes("T") ? value : value.replace(" ", "T"));

const formatElapsed = (totalSeconds: number) => {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const pad = (value: number) => String(value).padStart(2, "0");

  return [
    Math.floor(safeSeconds / 3600),
    Math.floor((safeSeconds % 3600) / 60),
    safeSeconds % 60,
  ]
    .map(pad)
    .join(":");
};

const formatChatTime = (value: string) => {
  const date = parseServerDate(value);

  if (Number.isNaN(date.getTime())) return "";

  const pad = (part: number) => String(part).padStart(2, "0");

  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

function ElapsedTime({ startedAt }: { startedAt?: string | null }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);

    return () => clearInterval(timer);
  }, []);

  const startedTime = startedAt ? parseServerDate(startedAt).getTime() : NaN;

  return (
    <Text style={styles.headerText}>
      {formatElapsed(
        Number.isNaN(startedTime) ? 0 : (now - startedTime) / 1000,
      )}
    </Text>
  );
}

export function LiveRoomHeader({
  tone,
  startedAt,
  viewerCount,
  exitLabel,
  exitDisabled,
  onExit,
}: {
  tone: LiveRoomTone;
  startedAt?: string | null;
  viewerCount: number;
  exitLabel: string;
  exitDisabled: boolean;
  onExit: () => void;
}) {
  return (
    <View style={styles.header}>
      <View style={styles.headerInfo}>
        <View style={[styles.liveBadge, { backgroundColor: getAccent(tone) }]}>
          <Text style={styles.liveBadgeText}>· LIVE</Text>
        </View>
        <ElapsedTime startedAt={startedAt} />
        <View style={styles.listeners}>
          <AppIcon name="headsetDark" size={16} />
          <Text numberOfLines={1} style={styles.headerText}>
            {viewerCount.toLocaleString()}명 청취 중
          </Text>
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        disabled={exitDisabled}
        style={styles.exitButton}
        onPress={onExit}
      >
        <Text style={styles.exitText}>{exitLabel}</Text>
      </Pressable>
    </View>
  );
}

export function LiveRoomBanner({
  message,
  backgroundColor,
}: {
  message: string;
  backgroundColor: string;
}) {
  return (
    <Text style={[styles.banner, { backgroundColor }]}>{message}</Text>
  );
}

export function LiveRoomPill({
  label,
  disabled = false,
  onPress,
}: {
  label: string;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      style={[styles.pill, disabled && styles.dimmed]}
      onPress={onPress}
    >
      <Text style={styles.pillText}>{label}</Text>
    </Pressable>
  );
}

export function LiveRoomStage({
  tone,
  isAudioActive,
  imageUrl,
  bandName,
  title,
  description,
  onPress,
}: {
  tone: LiveRoomTone;
  isAudioActive: boolean;
  imageUrl?: string | null;
  bandName: string;
  title: string;
  description?: string | null;
  onPress?: () => void;
}) {
  return (
    <Pressable style={styles.hero} onPress={onPress}>
      <View style={styles.stage}>
        <LiveWaveform isActive={isAudioActive} side="left" tone={tone} />
        <View
          style={[
            styles.profile,
            tone === "band" ? styles.profileBand : styles.profileFan,
          ]}
        >
          <ProfileImage imageUrl={imageUrl} size={156} variant="band" />
        </View>
        <LiveWaveform isActive={isAudioActive} side="right" tone={tone} />
      </View>

      <View style={styles.heroText}>
        <View style={styles.bandRow}>
          <Text numberOfLines={1} style={styles.bandName}>
            {bandName}
          </Text>
          <AppIcon name="verifiedBadge" />
        </View>
        <Text numberOfLines={1} style={styles.title}>
          {title}
        </Text>
        {description ? (
          <Text numberOfLines={1} style={styles.description}>
            {description}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

function ChatRow({
  tone,
  message,
  highlighted,
}: {
  tone: LiveRoomTone;
  message: LiveChatMessage;
  highlighted: boolean;
}) {
  const time = formatChatTime(message.sentAt);

  if (highlighted) {
    return (
      <View style={styles.chatRow}>
        <View>
          <View
            style={[
              styles.highlightAvatar,
              tone === "band"
                ? styles.highlightBorderBand
                : styles.highlightBorderFan,
            ]}
          >
            <ProfileImage
              imageUrl={message.senderProfileImageUrl}
              size={38}
              variant="band"
            />
          </View>
          <View style={styles.micBadge}>
            <AppIcon
              name={tone === "band" ? "micBand" : "volume"}
              size={10}
            />
          </View>
        </View>

        <View
          style={[
            styles.highlightBubble,
            tone === "band"
              ? styles.highlightBubbleBand
              : styles.highlightBubbleFan,
          ]}
        >
          <Text numberOfLines={1} style={styles.chatName}>
            {message.senderName}
          </Text>
          <Text style={styles.chatBody}>{message.content}</Text>
          <Text style={styles.highlightTime}>{time}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.chatRow}>
      <ProfileImage imageUrl={message.senderProfileImageUrl} size={40} />

      <View style={styles.chatContent}>
        <Text numberOfLines={1} style={styles.chatName}>
          {message.senderName}
        </Text>
        <View style={styles.bubble}>
          <Text style={styles.chatBody}>{message.content}</Text>
        </View>
      </View>

      <Text style={styles.chatTime}>{time}</Text>
    </View>
  );
}

export function LiveRoomChatList({
  tone,
  messages,
  composerOpen,
  expanded,
  onToggleExpanded,
  onMessageLongPress,
  isHighlighted,
}: {
  tone: LiveRoomTone;
  messages: LiveChatMessage[];
  composerOpen: boolean;
  expanded: boolean;
  onToggleExpanded: () => void;
  onMessageLongPress?: (message: LiveChatMessage) => void;
  isHighlighted: (message: LiveChatMessage) => boolean;
}) {
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const minChatTop = 173;
  const maxChatTop = Math.max(
    minChatTop + 80,
    Math.min(
      438 - insets.top,
      height - insets.top - insets.bottom - 180,
    ),
  );
  const [chatTop, setChatTop] = useState(
    expanded ? minChatTop : maxChatTop,
  );
  const dragStartTopRef = useRef(chatTop);
  const dragStartYRef = useRef(0);
  const didDragRef = useRef(false);

  useEffect(() => {
    if (messages.length === 0) return;

    const timer = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 50);

    return () => clearTimeout(timer);
  }, [composerOpen, expanded, messages.length]);

  return (
    <View
      style={[
        styles.chatArea,
        { top: chatTop },
        tone === "band" ? styles.chatAreaBand : styles.chatAreaFan,
      ]}
    >
      <View
        accessibilityRole="button"
        accessibilityLabel={expanded ? "댓글창 줄이기" : "댓글창 늘리기"}
        hitSlop={10}
        style={styles.chatHandleButton}
        onAccessibilityTap={onToggleExpanded}
        onStartShouldSetResponder={() => true}
        onResponderTerminationRequest={() => false}
        onResponderGrant={(event) => {
          didDragRef.current = false;
          dragStartTopRef.current = chatTop;
          dragStartYRef.current = event.nativeEvent.pageY;
        }}
        onResponderMove={(event) => {
          const distance = event.nativeEvent.pageY - dragStartYRef.current;
          if (Math.abs(distance) > 3) didDragRef.current = true;

          setChatTop(
            Math.min(
              maxChatTop,
              Math.max(minChatTop, dragStartTopRef.current + distance),
            ),
          );
        }}
        onResponderRelease={() => {
          if (!didDragRef.current) onToggleExpanded();
        }}
      >
        <View style={styles.chatHandle} />
      </View>

      {messages.length === 0 && tone === "fan" ? (
        <View style={styles.chatEmpty}>
          <View style={styles.chatEmptyIcon}>
            <AppIcon name="chat" size={52} />
          </View>
          <View>
            <Text style={styles.chatEmptyTitle}>아직 채팅이 없어요</Text>
            <Text style={styles.chatEmptyDescription}>
              첫 번째로 응원 메시지를 보내보세요!
            </Text>
          </View>
        </View>
      ) : (
        <ScrollView
          ref={scrollRef}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.chatList,
            { paddingBottom: composerOpen ? 190 : 110 },
          ]}
          onContentSizeChange={() =>
            scrollRef.current?.scrollToEnd({ animated: true })
          }
        >
          {messages.map((message) => (
            <Pressable
              key={message.messageId}
              accessibilityRole={onMessageLongPress ? "button" : undefined}
              accessibilityHint={
                onMessageLongPress ? "댓글 신고 및 차단 메뉴 열기" : undefined
              }
              delayLongPress={450}
              onPress={
                onMessageLongPress
                  ? () => onMessageLongPress(message)
                  : undefined
              }
              onLongPress={
                onMessageLongPress
                  ? () => onMessageLongPress(message)
                  : undefined
              }
            >
              <ChatRow
                tone={tone}
                message={message}
                highlighted={isHighlighted(message)}
              />
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

export function LiveRoomComposer({
  tone,
  value,
  errorMessage,
  onChangeText,
  onSend,
  onFocus,
  onBlur,
}: {
  tone: LiveRoomTone;
  value: string;
  errorMessage?: string | null;
  onChangeText: (value: string) => void;
  onSend: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
}) {
  const [focused, setFocused] = useState(false);
  const canSend = Boolean(value.trim());

  return (
    <View style={styles.composerWrap}>
      {errorMessage ? (
        <Text style={styles.composerError}>{errorMessage}</Text>
      ) : null}

      <View style={styles.composer}>
        <TextInput
          value={value}
          maxLength={500}
          accessibilityLabel="메시지 입력"
          placeholder="메시지 입력하기"
          placeholderTextColor={
            tone === "band" ? colors.neutral400 : colors.neutral500
          }
          returnKeyType="send"
          style={[
            styles.composerInput,
            focused && {
              borderColor:
                tone === "band" ? colors.secondary400 : colors.primary300,
            },
          ]}
          onChangeText={onChangeText}
          onSubmitEditing={onSend}
          onFocus={() => {
            setFocused(true);
            onFocus?.();
          }}
          onBlur={() => {
            setFocused(false);
            onBlur?.();
          }}
        />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="메시지 보내기"
          disabled={!canSend}
          style={[styles.sendButton, !canSend && styles.dimmed]}
          onPress={onSend}
        >
          <View
            style={[
              styles.sendBackground,
              tone === "fan" && styles.sendBackgroundFan,
            ]}
          >
            {tone === "band" ? (
              <AppIcon name="sendButton" size={36} />
            ) : null}
          </View>
          <View style={styles.sendIcon}>
            <AppIcon name="airplane" size={32} />
          </View>
        </Pressable>
      </View>
    </View>
  );
}

function ActionItem({
  tone,
  icon,
  label,
  onPress,
}: {
  tone: LiveRoomTone;
  icon: "users" | "chat";
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      hitSlop={8}
      style={tone === "band" ? styles.actionBand : styles.actionFan}
      onPress={onPress}
    >
      <AppIcon name={icon} size={tone === "band" ? 23 : 24} />
      <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
  );
}

export function LiveRoomActionBar({
  tone,
  center,
  onOpenMembers,
  onToggleChat,
}: {
  tone: LiveRoomTone;
  center: React.ReactNode;
  onOpenMembers: () => void;
  onToggleChat: () => void;
}) {
  return (
    <View pointerEvents="box-none" style={styles.actionBarLayer}>
      <View style={styles.actionBar}>
        <ActionItem
          tone={tone}
          icon="users"
          label="멤버"
          onPress={onOpenMembers}
        />
        <ActionItem
          tone={tone}
          icon="chat"
          label="채팅"
          onPress={onToggleChat}
        />
      </View>
      <View pointerEvents="box-none" style={styles.actionCenter}>
        {center}
      </View>
    </View>
  );
}

export function LiveRoomMicButton({
  label,
  isLive,
  isMuted,
  disabled,
  onPress,
}: {
  label: string;
  isLive: boolean;
  isMuted: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      style={[
        styles.centerButton,
        styles.centerButtonBand,
        disabled && styles.centerConnecting,
      ]}
      onPress={onPress}
    >
      <View style={isLive ? undefined : styles.micIdle}>
        <AppIcon name={isMuted ? "micMuted" : "micBand"} size={42} />
      </View>
    </Pressable>
  );
}

export function LiveRoomSoundIndicator({
  tone,
  muted,
  onPress,
}: {
  tone: LiveRoomTone;
  muted: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={muted ? "라이브 소리 켜기" : "라이브 소리 끄기"}
      style={[
        styles.centerButton,
        tone === "band" ? styles.centerButtonBand : styles.centerButtonFan,
      ]}
      onPress={onPress}
    >
      {tone === "fan" ? <View style={styles.centerButtonSolidFill} /> : null}
      <View style={styles.centerButtonIcon}>
        <AppIcon name={muted ? "mute" : "volume"} size={42} />
      </View>
    </Pressable>
  );
}

export function LiveRoomMessageActions({
  open,
  onClose,
  onReport,
  onBlock,
}: {
  open: boolean;
  onClose: () => void;
  onReport: () => void;
  onBlock: () => void;
}) {
  return (
    <BottomSheetModal open={open} maxHeight="48%" onClose={onClose}>
      <View style={styles.messageActionSheet}>
        <View style={styles.sheetHandle} />
        <View style={styles.messageActionGroup}>
          <Pressable style={styles.messageAction} onPress={onReport}>
            <Text style={styles.reportActionText}>댓글 신고하기</Text>
          </Pressable>
          <View style={styles.messageActionDivider} />
          <Pressable style={styles.messageAction} onPress={onBlock}>
            <Text style={styles.blockActionText}>사용자 차단하기</Text>
          </Pressable>
        </View>
        <Pressable style={styles.cancelAction} onPress={onClose}>
          <Text style={styles.cancelActionText}>취소</Text>
        </Pressable>
      </View>
    </BottomSheetModal>
  );
}

const REPORT_REASONS = [
  ["SPAM", "스팸 또는 홍보성 게시물", "의도와 관계없이 반복적인 홍보, 광고, 도배성 메시지"],
  ["ABUSE", "욕설 및 혐오 표현", "특정 개인이나 집단에 대한 욕설, 비하, 혐오 표현"],
  ["SEXUAL", "성적으로 불쾌한 내용", "성적이거나 선정적으로 불쾌감을 주는 표현"],
  ["DANGER", "폭력적이거나 위험한 내용", "폭력, 자해, 범죄 조장 등 위험한 행동을 유도하는 내용"],
  ["COPYRIGHT", "저작권 침해", "무단으로 사용된 음원, 영상, 이미지 등 저작권 침해"],
  ["OTHER", "기타", "위 항목에 해당하지 않는 기타 문제"],
] as const;

export function LiveRoomReportModal({
  open,
  onClose,
  onSubmit,
  onBlock,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (reason: string, detail: string) => void;
  onBlock: () => void;
}) {
  const [reason, setReason] = useState<(typeof REPORT_REASONS)[number][0]>("SEXUAL");
  const [detail, setDetail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const reportScrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const detailSectionYRef = useRef(0);

  return (
    <Modal
      visible={open}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
      onShow={() => setSubmitted(false)}
    >
      <SafeAreaView edges={["top", "bottom"]} style={styles.reportScreen}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.reportKeyboardAvoider}
        >
          {submitted ? (
            <View style={styles.reportSuccessContent}>
              <View style={styles.reportSuccessCheck}>
                <Text style={styles.reportSuccessCheckText}>✓</Text>
              </View>
              <Text style={styles.reportSuccessTitle}>신고가 접수됐어요</Text>
              <Text style={styles.reportSuccessDescription}>
                검토 후 운영 정책에 따라{"\n"}처리될 예정이에요
              </Text>
              <Text style={styles.reportSuccessHint}>
                같은 사용자의 메시지를 더 이상 보고 싶지 않다면{"\n"}
                해당 사용자를 차단할 수 있어요
              </Text>
              <View style={styles.reportSuccessActions}>
                <Pressable style={styles.reportBlockButton} onPress={onBlock}>
                  <Text style={styles.reportBlockButtonText}>이 사용자 차단하기</Text>
                </Pressable>
                <Pressable style={styles.reportReturnButton} onPress={onClose}>
                  <Text style={styles.reportReturnButtonText}>라이브로 돌아가기</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <>
              <View style={styles.reportHeader}>
                <Pressable hitSlop={12} onPress={onClose}>
                  <AppIcon name="arrowLeft" size={24} />
                </Pressable>
                <Text style={styles.reportHeaderTitle}>댓글 신고</Text>
                <View style={styles.reportHeaderSpacer} />
              </View>

              <ScrollView
                ref={reportScrollRef}
                keyboardDismissMode="interactive"
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.reportContent}
              >
              <Text style={styles.reportTitle}>신고 사유 선택</Text>
              <Text style={styles.reportCaption}>허위 신고는 서비스 이용에 제한이 생길 수 있어요.</Text>

              <View style={styles.reasonList}>
                {REPORT_REASONS.map(([id, title, description]) => {
                  const selected = reason === id;

                  return (
                    <Pressable key={id} style={styles.reasonRow} onPress={() => setReason(id)}>
                      <View style={[styles.radio, selected && styles.radioSelected]}>
                        {selected ? <View style={styles.radioDot} /> : null}
                      </View>
                      <View style={styles.reasonCopy}>
                        <Text style={styles.reasonTitle}>{title}</Text>
                        <Text style={styles.reasonDescription}>{description}</Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>

              <View
                onLayout={(event) => {
                  detailSectionYRef.current = event.nativeEvent.layout.y;
                }}
              >
                <Text style={styles.detailTitle}>자세히 적기 (선택)</Text>
                <Text style={styles.detailCaption}>어떤 내용이 문제였는지 자세히 설명해 주세요.</Text>
                <View style={styles.detailBox}>
                  <TextInput
                    multiline
                    maxLength={500}
                    value={detail}
                    placeholder="최대 500자까지 입력할 수 있어요."
                    placeholderTextColor={colors.neutral400}
                    style={styles.detailInput}
                    onChangeText={setDetail}
                    onFocus={() => {
                      setTimeout(() => {
                        reportScrollRef.current?.scrollTo({
                          y: Math.max(0, detailSectionYRef.current - 12),
                          animated: true,
                        });
                      }, 150);
                    }}
                  />
                  <Text style={styles.detailCount}>{detail.length}/500</Text>
                </View>
              </View>

              <Pressable
                style={styles.reportSubmit}
                onPress={() => {
                  onSubmit(reason, detail.trim());
                  setSubmitted(true);
                }}
              >
                <Text style={styles.reportSubmitText}>신고하기</Text>
              </Pressable>
              </ScrollView>
            </>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

export function LiveRoomMemberSheet({
  tone,
  liveId,
  open,
  isDesignPreview = false,
  onClose,
}: {
  tone: LiveRoomTone;
  liveId: number;
  open: boolean;
  isDesignPreview?: boolean;
  onClose: () => void;
}) {
  const query = useQuery({
    queryKey: ["live", "members", liveId],
    queryFn: () => getLiveMembers(liveId),
    enabled: open && liveId > 0 && !isDesignPreview,
  });
  const previewMembers: LiveMemberItem[] = [
    {
      bandProfileImageUrl: null,
      nickname: "김웨이",
      bandName: "WAVY",
      part: ["VOCAL"],
      isLeader: true,
    },
    {
      bandProfileImageUrl: null,
      nickname: "박민준",
      bandName: "WAVY",
      part: ["GUITAR"],
      isLeader: false,
    },
    {
      bandProfileImageUrl: null,
      nickname: "이서연",
      bandName: "WAVY",
      part: ["BASS"],
      isLeader: false,
    },
  ];
  const members = isDesignPreview
    ? previewMembers
    : query.data?.members ?? [];

  return (
    <BottomSheetModal open={open} maxHeight="72%" onClose={onClose}>
      <View style={styles.sheet}>
        <View style={styles.sheetHandle} />
        <Text style={styles.sheetTitle}>멤버</Text>

        {!isDesignPreview && query.isLoading ? (
          <Text style={styles.sheetMessage}>멤버를 불러오는 중이에요.</Text>
        ) : !isDesignPreview && query.isError ? (
          <Text style={styles.sheetMessage}>멤버를 불러오지 못했어요.</Text>
        ) : members.length === 0 ? (
          <Text style={styles.sheetMessage}>표시할 멤버가 없어요.</Text>
        ) : (
          <ScrollView contentContainerStyle={styles.sheetList}>
            {members.map((member, index) => (
              <View key={`${member.nickname}-${index}`} style={styles.member}>
                <ProfileImage
                  imageUrl={
                    member.profileImageUrl ?? member.bandProfileImageUrl
                  }
                  size={36}
                  variant="band"
                />
                <View style={styles.memberText}>
                  <View style={styles.memberNameRow}>
                    <Text numberOfLines={1} style={styles.memberName}>
                      {member.nickname}
                    </Text>
                    {member.isLeader ? (
                      <View
                        style={[
                          styles.leaderBadge,
                          tone === "fan" && styles.leaderBadgeFan,
                        ]}
                      >
                        <Text
                          style={[
                            styles.leaderText,
                            tone === "fan" && styles.leaderTextFan,
                          ]}
                        >
                          리더
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  <Text numberOfLines={1} style={styles.memberPart}>
                    {member.part.length > 0
                      ? member.part.map(getPartLabel).join(" · ")
                      : "포지션 미정"}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  header: {
    position: "relative",
    zIndex: 60,
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginTop: 10,
    paddingLeft: 31,
    paddingRight: 24,
  },
  headerInfo: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  liveBadge: {
    height: 22,
    justifyContent: "center",
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 2,
  },
  liveBadgeText: {
    ...textStyles.caption3,
    color: colors.white,
  },
  headerText: {
    ...textStyles.caption2,
    flexShrink: 1,
    color: colors.neutral900,
  },
  listeners: {
    flexShrink: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  exitButton: {
    zIndex: 61,
    flexShrink: 0,
    borderRadius: 999,
    backgroundColor: colors.white,
    paddingHorizontal: 8,
    paddingVertical: 4,
    boxShadow: "0px 2px 8px 0px rgba(198, 40, 40, 0.18)",
  },
  exitText: {
    ...textStyles.caption3,
    color: colors.error,
  },
  banner: {
    ...textStyles.caption3,
    alignSelf: "center",
    width: "90%",
    maxWidth: 353,
    overflow: "hidden",
    borderRadius: 8,
    color: colors.white,
    marginTop: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    textAlign: "center",
  },
  pill: {
    alignSelf: "flex-end",
    borderRadius: 999,
    backgroundColor: colors.secondary500,
    marginRight: 20,
    marginTop: 4,
    paddingHorizontal: 16,
    paddingVertical: 8,
    boxShadow: "0px 2px 10px 0px rgba(20, 20, 20, 0.15)",
  },
  pillText: {
    ...textStyles.caption3,
    color: colors.white,
  },
  dimmed: {
    opacity: 0.6,
  },
  hero: {
    marginTop: 32,
  },
  stage: {
    height: 160,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    overflow: "visible",
  },
  profile: {
    width: 160,
    height: 160,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.white,
    borderRadius: 80,
    backgroundColor: colors.white,
  },
  profileBand: {
    boxShadow: "0px 0px 28px 0px rgba(251, 177, 14, 0.55)",
  },
  profileFan: {
    boxShadow:
      "0px 0px 11px 0px rgba(252, 213, 224, 0.9), 0px 0px 12px 0px rgba(240, 69, 121, 0.45)",
  },
  heroText: {
    alignItems: "center",
    gap: 5,
    marginTop: 32,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  bandRow: {
    height: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  bandName: {
    ...textStyles.label1,
    flexShrink: 1,
    color: colors.neutral900,
  },
  title: {
    ...textStyles.h4,
    color: colors.neutral900,
    textAlign: "center",
  },
  description: {
    ...textStyles.caption2,
    color: colors.neutral600,
    textAlign: "center",
  },
  chatArea: {
    position: "absolute",
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 20,
    minHeight: 0,
  },
  chatAreaBand: {
    backgroundColor: "rgba(255, 250, 240, 0.7)",
  },
  chatAreaFan: {
    backgroundColor: "rgba(255, 245, 248, 0.7)",
  },
  chatList: {
    alignSelf: "center",
    width: "100%",
    maxWidth: 386,
    gap: 12,
    paddingHorizontal: 24,
    paddingTop: 4,
  },
  chatHandleButton: {
    height: 28,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  chatHandle: {
    width: 42,
    height: 4,
    borderRadius: 4,
    backgroundColor: colors.neutral300,
  },
  chatRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 15,
  },
  chatContent: {
    flex: 1,
    minWidth: 0,
    alignItems: "flex-start",
  },
  chatName: {
    ...textStyles.caption3,
    color: colors.neutral900,
  },
  bubble: {
    minHeight: 28,
    maxWidth: 191,
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: colors.white,
    marginTop: 4,
    paddingHorizontal: 11,
    paddingVertical: 4,
  },
  chatBody: {
    ...textStyles.body3,
    color: colors.neutral900,
  },
  chatTime: {
    ...textStyles.caption4,
    width: 28,
    color: colors.neutral600,
    marginRight: 11,
    marginTop: 13,
  },
  highlightAvatar: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 20,
  },
  highlightBorderBand: {
    borderColor: colors.secondary300,
  },
  highlightBorderFan: {
    borderColor: colors.primary300,
  },
  micBadge: {
    position: "absolute",
    top: -2,
    left: -2,
    width: 14,
    height: 14,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 7,
    backgroundColor: colors.white,
  },
  highlightBubble: {
    flex: 1,
    minWidth: 0,
    minHeight: 73,
    borderWidth: 1,
    borderRadius: 16,
    paddingLeft: 11,
    paddingRight: 44,
    paddingVertical: 7,
  },
  highlightBubbleBand: {
    borderColor: colors.secondary300,
    backgroundColor: colors.secondary100,
  },
  highlightBubbleFan: {
    borderColor: colors.primary300,
    backgroundColor: colors.primary50,
  },
  highlightTime: {
    ...textStyles.caption4,
    position: "absolute",
    right: 11,
    top: "50%",
    color: colors.neutral600,
  },
  chatEmpty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
    paddingBottom: 110,
    paddingHorizontal: 48,
  },
  chatEmptyIcon: {
    opacity: 0.15,
  },
  chatEmptyTitle: {
    ...textStyles.label1,
    color: colors.neutral900,
    textAlign: "center",
  },
  chatEmptyDescription: {
    ...textStyles.caption1,
    color: colors.neutral600,
    marginTop: 10,
    textAlign: "center",
  },
  composerWrap: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 112,
    zIndex: 30,
  },
  composerError: {
    ...textStyles.caption4,
    color: colors.error,
    marginBottom: 8,
    textAlign: "center",
  },
  composer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 17,
  },
  composerInput: {
    ...textStyles.caption2,
    flex: 1,
    height: 36,
    minWidth: 0,
    borderWidth: 1,
    borderColor: colors.neutral400,
    borderRadius: 999,
    backgroundColor: colors.white,
    color: colors.neutral900,
    paddingHorizontal: 20,
    paddingVertical: 0,
  },
  sendButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 36,
    height: 36,
  },
  sendBackgroundFan: {
    borderRadius: 18,
    backgroundColor: colors.primary400,
  },
  sendIcon: {
    transform: [{ translateX: 2 }],
  },
  actionBarLayer: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 24,
    zIndex: 30,
    height: 62,
  },
  actionBar: {
    ...shadows.card,
    height: 62,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 24,
    backgroundColor: colors.white,
    paddingHorizontal: 40,
    paddingVertical: 12,
  },
  actionBand: {
    width: 40,
    alignItems: "center",
    gap: 4,
  },
  actionFan: {
    width: 32,
    alignItems: "center",
    gap: 2,
  },
  actionLabel: {
    ...textStyles.label4,
    color: colors.neutral900,
  },
  actionCenter: {
    position: "absolute",
    top: -18,
    left: 0,
    right: 0,
    zIndex: 50,
    alignItems: "center",
  },
  centerButton: {
    width: 66,
    height: 66,
    zIndex: 50,
    elevation: 12,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 33,
  },
  centerButtonBand: {
    backgroundColor: colors.secondary0,
    boxShadow: "0px 0px 20px 0px rgba(251, 177, 14, 0.5)",
  },
  centerButtonFan: {
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    opacity: 1,
    boxShadow: "0px 0px 20px 0px rgba(240, 69, 121, 0.5)",
  },
  centerButtonSolidFill: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: 33,
    backgroundColor: "#FFFFFF",
  },
  centerButtonIcon: {
    zIndex: 1,
  },
  centerConnecting: {
    opacity: 0.7,
  },
  micIdle: {
    opacity: 0.45,
  },
  messageActionSheet: {
    gap: 8,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: colors.white,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 48,
  },
  messageActionGroup: {
    overflow: "hidden",
    borderRadius: 12,
    backgroundColor: colors.neutral100,
    marginTop: 20,
  },
  messageAction: {
    height: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  messageActionDivider: {
    height: 1,
    backgroundColor: colors.neutral300,
  },
  reportActionText: {
    ...textStyles.label2,
    color: "#007AFF",
  },
  blockActionText: {
    ...textStyles.label2,
    color: colors.error,
  },
  cancelAction: {
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: colors.neutral300,
  },
  cancelActionText: {
    ...textStyles.label2,
    color: colors.neutral700,
  },
  reportScreen: {
    flex: 1,
    backgroundColor: colors.white,
  },
  reportKeyboardAvoider: {
    flex: 1,
  },
  reportHeader: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  reportHeaderTitle: {
    ...textStyles.label2,
    color: colors.neutral900,
  },
  reportHeaderSpacer: {
    width: 24,
  },
  reportContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  reportTitle: {
    ...textStyles.h4,
    color: colors.neutral900,
  },
  reportCaption: {
    ...textStyles.caption2,
    color: colors.neutral600,
    marginTop: 4,
  },
  reasonList: {
    marginTop: 28,
  },
  reasonRow: {
    minHeight: 55,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral300,
  },
  radio: {
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.neutral500,
    borderRadius: 10,
  },
  radioSelected: {
    borderColor: colors.primary400,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary400,
  },
  reasonCopy: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 9,
  },
  reasonTitle: {
    ...textStyles.body1,
    color: colors.neutral900,
  },
  reasonDescription: {
    ...textStyles.caption4,
    color: colors.neutral600,
    marginTop: 2,
  },
  detailTitle: {
    ...textStyles.label2,
    color: colors.neutral900,
    marginTop: 18,
  },
  detailCaption: {
    ...textStyles.caption4,
    color: colors.neutral600,
    marginTop: 4,
  },
  detailBox: {
    height: 96,
    borderWidth: 1,
    borderColor: colors.neutral400,
    borderRadius: 8,
    marginTop: 12,
    padding: 12,
  },
  detailInput: {
    ...textStyles.caption2,
    flex: 1,
    color: colors.neutral900,
    padding: 0,
    textAlignVertical: "top",
  },
  detailCount: {
    ...textStyles.caption5,
    color: colors.neutral600,
    textAlign: "right",
  },
  reportSubmit: {
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: colors.primary400,
    marginTop: 38,
  },
  reportSubmitText: {
    ...textStyles.label2,
    color: colors.white,
  },
  reportSuccessContent: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 28,
    paddingTop: 110,
  },
  reportSuccessCheck: {
    width: 72,
    height: 72,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 36,
    backgroundColor: colors.primary400,
  },
  reportSuccessCheckText: {
    color: colors.white,
    fontSize: 42,
    fontWeight: "700",
    lineHeight: 48,
  },
  reportSuccessTitle: {
    ...textStyles.h3,
    color: colors.neutral900,
    marginTop: 28,
    textAlign: "center",
  },
  reportSuccessDescription: {
    ...textStyles.caption1,
    color: colors.neutral700,
    marginTop: 12,
    textAlign: "center",
  },
  reportSuccessHint: {
    ...textStyles.caption2,
    color: colors.neutral600,
    marginTop: 48,
    textAlign: "center",
  },
  reportSuccessActions: {
    width: "100%",
    gap: 10,
    marginTop: 20,
  },
  reportBlockButton: {
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.primary400,
    borderRadius: 8,
    backgroundColor: colors.white,
  },
  reportBlockButtonText: {
    ...textStyles.body1,
    color: colors.primary400,
  },
  reportReturnButton: {
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: colors.primary400,
  },
  reportReturnButtonText: {
    ...textStyles.body1,
    color: colors.white,
  },
  sheet: {
    minHeight: 236,
    flexShrink: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: colors.white,
    paddingBottom: 32,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  sheetHandle: {
    alignSelf: "center",
    width: 42,
    height: 4,
    borderRadius: 4,
    backgroundColor: colors.neutral300,
  },
  sheetTitle: {
    ...textStyles.label1,
    color: colors.neutral900,
    marginTop: 16,
    textAlign: "center",
  },
  sheetMessage: {
    ...textStyles.caption2,
    color: colors.neutral600,
    paddingVertical: 40,
    textAlign: "center",
  },
  sheetList: {
    gap: 12,
    paddingTop: 16,
    paddingHorizontal: 4,
    paddingBottom: 4,
  },
  member: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 8,
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    boxShadow: "0px 2px 8px 0px rgba(20, 20, 20, 0.1)",
  },
  memberText: {
    flex: 1,
    minWidth: 0,
  },
  memberNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  memberName: {
    ...textStyles.caption3,
    flexShrink: 1,
    color: colors.neutral900,
  },
  leaderBadge: {
    borderRadius: 999,
    backgroundColor: colors.secondary100,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  leaderBadgeFan: {
    backgroundColor: colors.primary50,
  },
  leaderText: {
    ...textStyles.caption4,
    color: colors.secondary600,
  },
  leaderTextFan: {
    color: colors.primary400,
  },
  memberPart: {
    ...textStyles.caption2,
    color: colors.neutral600,
  },
});

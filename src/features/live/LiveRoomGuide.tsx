import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Line, Polyline } from "react-native-svg";

import { AppIcon } from "@/shared/components/AppIcon";
import { colors, shadows, textStyles } from "@/shared/constants/theme";
import { useAuthStore } from "@/stores/useAuthStore";

const seenInSession = new Set<string>();

function useFirstEntryGuide(
  kind: "room" | "replay",
  ready: boolean,
  preview = false,
) {
  const userId = useAuthStore((state) => state.user?.userId);
  const key = preview
    ? `bscene.preview.guide.live-${kind}`
    : `bscene.guide.${userId ?? "guest"}.live-${kind}`;
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (
      !ready ||
      (preview ? dismissed : seenInSession.has(key))
    ) return;

    let active = true;
    const read = async () => {
      if (preview) {
        if (active && !seenInSession.has(key)) setOpen(true);
        return;
      }

      const seen = Platform.OS === "web"
        ? window.localStorage.getItem(key)
        : await SecureStore.getItemAsync(key);

      if (active && !seen && !seenInSession.has(key)) setOpen(true);
    };

    void read().catch(() => {
      if (active && !seenInSession.has(key)) setOpen(true);
    });

    return () => {
      active = false;
    };
  }, [dismissed, key, preview, ready]);

  const dismiss = () => {
    setDismissed(true);
    setOpen(false);

    if (preview) return;

    seenInSession.add(key);

    if (Platform.OS === "web") {
      try {
        window.localStorage.setItem(key, "1");
      } catch {
        // The in-memory marker still prevents the guide from reopening this session.
      }
      return;
    }

    void SecureStore.setItemAsync(key, "1").catch(() => undefined);
  };

  return { open, dismiss };
}

export function useLiveRoomGuide(ready: boolean, preview = false) {
  return useFirstEntryGuide("room", ready, preview);
}

export function useLiveReplayGuide(ready: boolean, preview = false) {
  return useFirstEntryGuide("replay", ready, preview);
}

function Arrow({
  style,
  direction = "down",
  height = 28,
}: {
  style: object;
  direction?: "up" | "down";
  height?: number;
}) {
  const isDown = direction === "down";

  return (
    <Svg
      pointerEvents="none"
      width={12}
      height={height}
      viewBox={`0 0 12 ${height}`}
      style={[styles.arrow, style]}
    >
      <Line
        x1="6"
        y1={isDown ? 0 : height}
        x2="6"
        y2={isDown ? height - 2 : 2}
        stroke={colors.white}
        strokeWidth="1.5"
      />
      <Polyline
        points={
          isDown
            ? `1,${height - 7} 6,${height - 2} 11,${height - 7}`
            : "1,7 6,2 11,7"
        }
        fill="none"
        stroke={colors.white}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function LiveRoomGuide({ onClose }: { onClose: () => void }) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const scale = Math.min(width / 393, height / 852);
  const bottomShift = insets.bottom / scale;
  const topShift = Math.max(0, insets.top - 52) / scale;

  return (
    <Modal
      visible
      transparent
      statusBarTranslucent
      navigationBarTranslucent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="라이브 안내 닫기"
        style={styles.guideBackdrop}
        onPress={onClose}
      >
        <View
          pointerEvents="none"
          style={[
            styles.guideCanvas,
            {
              left: (width - 393) / 2,
              top: (height - 852) / 2,
              transform: [{ scale }],
            },
          ]}
        >
          <View style={[styles.exitPreview, { left: 321, top: 73 + topShift }]}>
            <Text style={styles.exitPreviewText}>나가기</Text>
          </View>
          <View style={[styles.closePreview, { top: 49 + topShift }]}>
            <View style={[styles.closeLine, styles.closeLineForward]} />
            <View style={[styles.closeLine, styles.closeLineBackward]} />
          </View>
          <Text style={[styles.guideText, { left: 231, top: 133 + topShift, width: 150 }]}>
            라이브를 종료하고{"\n"}이전 화면으로 돌아갈 수 있어요
          </Text>
          <Arrow
            direction="up"
            height={18}
            style={{ left: 334, top: 107 + topShift }}
          />

          <View style={[styles.handlePreview, { left: 160, top: 431, width: 73 }]}>
            <View style={styles.handle} />
          </View>
          <Text
            numberOfLines={1}
            style={[styles.guideText, { left: 101, top: 502, width: 191 }]}
          >
            댓글창을 늘리고 줄일 수 있어요
          </Text>
          <Arrow direction="up" height={18} style={{ left: 191, top: 476 }} />

          <GuideAction icon="users" label="멤버" left={51} top={770 - bottomShift} />
          <Text style={[styles.guideText, { left: 28, top: 680 - bottomShift, width: 96 }]}>
            라이브에 참여한{"\n"}밴드 멤버를{"\n"}확인할 수 있어요
          </Text>
          <Arrow height={20} style={{ left: 71, top: 742 - bottomShift }} />

          <View style={[styles.soundPreview, { left: 163, top: 748 - bottomShift }]}>
            <View style={styles.soundPreviewSolidFill} />
            <View style={styles.soundPreviewIcon}>
              <AppIcon name="volume" size={42} />
            </View>
          </View>
          <Text style={[styles.guideText, { left: 151, top: 630 - bottomShift, width: 90 }]}>
            스피커 버튼을 눌러{"\n"}라이브 소리를{"\n"}조절할 수 있어요
          </Text>
          <Arrow height={48} style={{ left: 191, top: 692 - bottomShift }} />

          <GuideAction icon="chat" label="채팅" left={292} top={770 - bottomShift} />
          <Text style={[styles.guideText, { left: 271, top: 680 - bottomShift, width: 90 }]}>
            채팅으로{"\n"}밴드와 실시간으로{"\n"}소통할 수 있어요
          </Text>
          <Arrow height={20} style={{ left: 313, top: 742 - bottomShift }} />
        </View>
      </Pressable>
    </Modal>
  );
}

function GuideAction({
  icon,
  label,
  left,
  top,
}: {
  icon: "users" | "chat";
  label: string;
  left: number;
  top: number;
}) {
  return (
    <View style={[styles.actionPreview, { left, top }]}>
      <AppIcon name={icon} size={24} />
      <Text style={styles.actionLabel}>{label}</Text>
    </View>
  );
}

export function LiveReplayGuide({ onClose }: { onClose: () => void }) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const scale = Math.min(width / 393, height / 852);
  const topShift = Math.max(0, insets.top - 52);

  return (
    <Modal
      visible
      transparent
      statusBarTranslucent
      navigationBarTranslucent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="다시보기 안내 닫기"
        style={styles.guideBackdrop}
        onPress={onClose}
      >
        <View
          pointerEvents="none"
          style={[
            styles.guideCanvas,
            {
              left: (width - 393) / 2,
              top: (height - 852) / 2 + topShift,
              transform: [{ scale }],
            },
          ]}
        >
          <View style={[styles.exitPreview, { left: 321, top: 73 }]}>
            <Text style={styles.exitPreviewText}>나가기</Text>
          </View>
          <View style={styles.closePreview}>
            <View style={[styles.closeLine, styles.closeLineForward]} />
            <View style={[styles.closeLine, styles.closeLineBackward]} />
          </View>
          <Text style={[styles.guideText, { left: 228, top: 133, width: 160 }]}>
            다시보기를 종료하고{"\n"}이전 화면으로 돌아갈 수 있어요
          </Text>
          <Arrow direction="up" height={18} style={{ left: 334, top: 107 }} />

          <Text style={[styles.guideText, { left: 65, top: 465, width: 108 }]}>
            원하는 구간으로{"\n"}바로 이동할 수 있어요
          </Text>
          <Arrow height={15} style={{ left: 113, top: 509 }} />
          <View style={styles.timelinePreview}>
            <View style={styles.timelineTrack} />
            <View style={styles.timelineProgress} />
            <View style={styles.timelineThumb} />
          </View>

          <View style={[styles.seekPreview, { left: 91, top: 593 }]}>
            <AppIcon name="moveLeft" width={27} height={32} />
            <Text style={styles.seekPreviewLabel}>10</Text>
          </View>
          <Text style={[styles.guideText, { left: 63, top: 659, width: 95 }]}>
            10초 뒤로{"\n"}이동할 수 있어요
          </Text>
          <Arrow direction="up" height={15} style={{ left: 105, top: 639 }} />

          <View style={styles.playPreview}>
            <AppIcon name="playWhite" size={32} />
          </View>
          <Text style={[styles.guideText, { left: 146, top: 712, width: 100 }]}>
            재생/일시정지
          </Text>
          <Arrow direction="up" height={48} style={{ left: 190, top: 656 }} />

          <View style={[styles.seekPreview, { left: 265, top: 593 }]}>
            <AppIcon name="moveRight" width={27} height={32} />
            <Text style={styles.seekPreviewLabel}>10</Text>
          </View>
          <Text style={[styles.guideText, { left: 237, top: 659, width: 95 }]}>
            10초 앞으로{"\n"}이동할 수 있어요
          </Text>
          <Arrow direction="up" height={15} style={{ left: 279, top: 639 }} />
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  guideBackdrop: {
    flex: 1,
    backgroundColor: "rgba(20, 20, 20, 0.8)",
  },
  guideCanvas: {
    position: "absolute",
    width: 393,
    height: 852,
  },
  closePreview: {
    position: "absolute",
    left: 345,
    top: 49,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  closeLine: {
    position: "absolute",
    width: 20,
    height: 1.5,
    borderRadius: 1,
    backgroundColor: colors.white,
  },
  closeLineForward: {
    transform: [{ rotate: "45deg" }],
  },
  closeLineBackward: {
    transform: [{ rotate: "-45deg" }],
  },
  guideText: {
    ...textStyles.caption3,
    position: "absolute",
    color: colors.white,
    textAlign: "center",
  },
  exitPreview: {
    ...shadows.card,
    position: "absolute",
    height: 26,
    justifyContent: "center",
    borderRadius: 999,
    backgroundColor: colors.white,
    paddingHorizontal: 8,
  },
  exitPreviewText: {
    ...textStyles.caption3,
    color: colors.error,
  },
  handlePreview: {
    ...shadows.card,
    position: "absolute",
    height: 37,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: colors.white,
  },
  handle: {
    width: 42,
    height: 4,
    borderRadius: 4,
    backgroundColor: colors.neutral300,
  },
  actionPreview: {
    ...shadows.card,
    position: "absolute",
    width: 50,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    borderRadius: 12,
    backgroundColor: colors.white,
  },
  actionLabel: {
    ...textStyles.label4,
    color: colors.neutral900,
  },
  soundPreview: {
    position: "absolute",
    width: 66,
    height: 66,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 33,
    backgroundColor: colors.white,
    opacity: 1,
    boxShadow: "0px 0px 20px rgba(240, 69, 121, 0.7)",
  },
  soundPreviewSolidFill: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: 33,
    backgroundColor: "#FFFFFF",
  },
  soundPreviewIcon: {
    zIndex: 1,
  },
  timelinePreview: {
    position: "absolute",
    left: 10,
    top: 532,
    width: 373,
    height: 32,
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    boxShadow: "0px 0px 12px rgba(240, 69, 121, 0.8)",
  },
  timelineTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.neutral300,
  },
  timelineProgress: {
    position: "absolute",
    left: 14,
    width: 94,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary300,
  },
  timelineThumb: {
    position: "absolute",
    left: 102,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.primary400,
  },
  seekPreview: {
    position: "absolute",
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 19,
    backgroundColor: colors.white,
    boxShadow: "0px 0px 12px rgba(240, 69, 121, 0.8)",
  },
  seekPreviewLabel: {
    ...textStyles.body4,
    position: "absolute",
    top: 15,
    color: colors.neutral800,
  },
  playPreview: {
    position: "absolute",
    left: 160,
    top: 576,
    width: 72,
    height: 72,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: colors.white,
    borderRadius: 36,
    backgroundColor: colors.primary400,
    boxShadow: "0px 0px 12px rgba(240, 69, 121, 0.8)",
  },
  arrow: {
    position: "absolute",
  },
  dismissHint: {
    ...textStyles.caption3,
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 12,
    color: colors.neutral300,
    textAlign: "center",
  },
  replayBackdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(20, 20, 20, 0.8)",
    paddingHorizontal: 24,
  },
  replayGuideContent: {
    width: "100%",
    maxWidth: 353,
    gap: 16,
    borderWidth: 1,
    borderColor: colors.primary200,
    borderRadius: 20,
    backgroundColor: colors.white,
    padding: 24,
  },
  replayGuideTitle: {
    ...textStyles.h4,
    color: colors.neutral900,
    textAlign: "center",
  },
  replayGuideItem: {
    ...textStyles.body2,
    color: colors.neutral700,
  },
  replayDismiss: {
    ...textStyles.label2,
    color: colors.primary400,
    marginTop: 8,
    textAlign: "center",
  },
});

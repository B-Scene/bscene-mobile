import { useEffect, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";

import { colors, textStyles } from "@/shared/constants/theme";

type ToastProps = {
  open: boolean;
  message: ReactNode;
  onClose: () => void;
  tone?: "success" | "error";
  durationMs?: number;
};

// 화면 루트(스크롤 바깥)에 렌더링해야 하단에 고정된다.
export function Toast({
  open,
  message,
  onClose,
  tone = "success",
  durationMs = 2000,
}: ToastProps) {
  useEffect(() => {
    if (!open) return;

    const timerId = setTimeout(onClose, durationMs);

    return () => clearTimeout(timerId);
  }, [durationMs, message, onClose, open]);

  if (!open) return null;

  return (
    <View style={styles.toast}>
      <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
        <Circle cx={12} cy={12} r={12} fill={colors.white} />
        <Path
          d={tone === "error" ? "M9 9L15 15M15 9L9 15" : "M16 9L10.8 14.2L8 11.4"}
          stroke={colors.neutral900}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>

      <Text style={styles.message}>{message}</Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="닫기"
        hitSlop={8}
        style={styles.close}
        onPress={onClose}
      >
        <Svg width={18} height={18} viewBox="0 0 14 14" fill="none">
          <Path
            d="M3.5 3.5L10.5 10.5M10.5 3.5L3.5 10.5"
            stroke={colors.white}
            strokeWidth={1.3}
            strokeLinecap="round"
          />
        </Svg>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 28,
    zIndex: 50,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 12,
    backgroundColor: colors.neutral900,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  message: {
    ...textStyles.body1,
    flex: 1,
    color: colors.white,
  },
  close: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
});

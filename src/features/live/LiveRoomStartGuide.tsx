import {
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";

import {
    colors,
    textStyles,
} from "@/shared/constants/theme";

export function LiveRoomStartGuide({
  onClose,
}: {
  onClose: () => void;
}) {
  return (
    <View
      pointerEvents="box-none"
      style={styles.container}
    >
      <View style={styles.bubble}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="안내 닫기"
          hitSlop={10}
          style={styles.closeButton}
          onPress={onClose}
        >
          <Text style={styles.closeText}>
            ×
          </Text>
        </Pressable>

        <Text style={styles.title}>
          라이브를 시작할 준비가 되셨나요?
        </Text>

        <Text style={styles.description}>
          마이크 버튼을 누르면 라이브 방송이{"\n"}
          시작돼요
        </Text>

        <View style={styles.arrow} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 142,
    zIndex: 25,
    alignItems: "center",
  },

  bubble: {
    width: 264,
    minHeight: 116,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: colors.white,
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 18,
    boxShadow:
      "0px 4px 15px 0px rgba(20, 20, 20, 0.08)",
  },

  closeButton: {
    position: "absolute",
    top: 10,
    right: 14,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },

  closeText: {
    fontSize: 28,
    fontWeight: "300",
    lineHeight: 28,
    color: colors.neutral400,
  },

  title: {
    ...textStyles.body1,
    color: colors.neutral900,
    textAlign: "center",
  },

  description: {
    ...textStyles.caption2,
    color: colors.neutral600,
    marginTop: 12,
    textAlign: "center",
  },

  arrow: {
    position: "absolute",
    bottom: -14,
    width: 0,
    height: 0,
    borderLeftWidth: 14,
    borderRightWidth: 14,
    borderTopWidth: 14,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: colors.white,
  },
});

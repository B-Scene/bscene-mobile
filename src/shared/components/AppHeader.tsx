import { router } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View, type ViewStyle } from "react-native";

import { colors } from "@/shared/constants/theme";

type AppHeaderProps = {
  title: string;
  showBack?: boolean;
  rightContent?: React.ReactNode;
  onBack?: () => void;
  style?: ViewStyle;
};

export function AppHeader({
  title,
  showBack = true,
  rightContent,
  onBack,
  style,
}: AppHeaderProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.side}>
        {showBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="뒤로가기"
            hitSlop={12}
            onPress={onBack ?? router.back}
            style={styles.iconButton}
          >
            <ChevronLeft size={24} color={colors.neutral900} />
          </Pressable>
        ) : null}
      </View>

      <Text numberOfLines={1} style={styles.title}>
        {title}
      </Text>

      <View style={[styles.side, styles.rightSide]}>{rightContent}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.white,
  },
  side: {
    width: 48,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  rightSide: {
    alignItems: "flex-end",
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    flex: 1,
    color: colors.neutral900,
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
  },
});

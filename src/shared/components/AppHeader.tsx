import { router } from "expo-router";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";

import { AppIcon } from "@/shared/components/AppIcon";
import { colors, textStyles } from "@/shared/constants/theme";

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
            onPress={() => {
              if (onBack) {
                onBack();
                return;
              }

              router.back();
            }}
            style={styles.iconButton}
          >
            <AppIcon name="arrowLeft" size={24} />
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
    height: 48,
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
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    flex: 1,
    ...textStyles.label2,
    color: colors.neutral900,
    textAlign: "center",
  },
});

import { StyleSheet, View, type ViewProps } from "react-native";

import { colors, radius, spacing } from "@/shared/constants/theme";

export function AppCard({ style, ...props }: ViewProps) {
  return <View style={[styles.card, style]} {...props} />;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.neutral300,
    backgroundColor: colors.white,
    padding: spacing.lg,
  },
});

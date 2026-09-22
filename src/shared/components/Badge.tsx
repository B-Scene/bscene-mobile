import { StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing } from "@/shared/constants/theme";

type BadgeProps = {
  label: string;
  tone?: "pink" | "yellow" | "neutral";
};

export function Badge({ label, tone = "neutral" }: BadgeProps) {
  return (
    <View style={[styles.badge, styles[tone]]}>
      <Text style={[styles.label, styles[`${tone}Label`]]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  pink: {
    backgroundColor: colors.primary50,
  },
  yellow: {
    backgroundColor: colors.secondary100,
  },
  neutral: {
    backgroundColor: colors.neutral200,
  },
  label: {
    fontSize: 12,
    fontWeight: "800",
  },
  pinkLabel: {
    color: colors.primary600,
  },
  yellowLabel: {
    color: colors.secondary600,
  },
  neutralLabel: {
    color: colors.neutral700,
  },
});

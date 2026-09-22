import { Pressable, StyleSheet, Text } from "react-native";

import { colors, radius, spacing } from "@/shared/constants/theme";

type ChipProps = {
  label: string;
  selected?: boolean;
  onPress: () => void;
};

export function Chip({ label, selected, onPress }: ChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.chip, selected && styles.selected]}
    >
      <Text style={[styles.label, selected && styles.selectedLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 44,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.neutral300,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
  },
  selected: {
    borderColor: colors.primary500,
    backgroundColor: colors.primary50,
  },
  label: {
    color: colors.neutral700,
    fontSize: 15,
    fontWeight: "600",
  },
  selectedLabel: {
    color: colors.primary600,
  },
});

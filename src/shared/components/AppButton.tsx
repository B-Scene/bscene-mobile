import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
} from "react-native";

import { colors, radius, spacing } from "@/shared/constants/theme";

type AppButtonProps = PressableProps & {
  label: string;
  variant?: "primary" | "secondary" | "ghost";
  loading?: boolean;
};

export function AppButton({
  label,
  variant = "primary",
  loading,
  disabled,
  style,
  ...props
}: AppButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      style={(state) => {
        const { pressed } = state;

        return [
          styles.base,
          styles[variant],
          isDisabled && styles.disabled,
          pressed && !isDisabled && styles.pressed,
          typeof style === "function" ? style(state) : style,
        ];
      }}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" ? colors.white : colors.primary500} />
      ) : (
        <Text style={[styles.label, styles[`${variant}Label`]]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  primary: {
    backgroundColor: colors.primary500,
  },
  secondary: {
    backgroundColor: colors.primary50,
  },
  ghost: {
    backgroundColor: "transparent",
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.82,
  },
  label: {
    fontSize: 16,
    fontWeight: "700",
  },
  primaryLabel: {
    color: colors.white,
  },
  secondaryLabel: {
    color: colors.primary600,
  },
  ghostLabel: {
    color: colors.neutral700,
  },
});

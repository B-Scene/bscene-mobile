import { StyleSheet, Text, TextInput, type TextInputProps, View } from "react-native";

import { colors, radius, spacing } from "@/shared/constants/theme";

type AppTextInputProps = TextInputProps & {
  label: string;
  error?: string;
};

export function AppTextInput({ label, error, style, ...props }: AppTextInputProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        autoCapitalize="none"
        placeholderTextColor={colors.neutral500}
        style={[styles.input, error && styles.inputError, style]}
        {...props}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  label: {
    color: colors.neutral800,
    fontSize: 14,
    fontWeight: "700",
  },
  input: {
    minHeight: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.neutral300,
    color: colors.neutral900,
    fontSize: 16,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.white,
  },
  inputError: {
    borderColor: colors.error,
  },
  error: {
    color: colors.error,
    fontSize: 13,
  },
});

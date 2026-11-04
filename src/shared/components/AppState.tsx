import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/shared/components/AppButton";
import { colors, spacing, textStyles } from "@/shared/constants/theme";

type AppStateProps = {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  loading?: boolean;
};

export function AppState({
  title,
  description,
  actionLabel,
  onAction,
  loading,
}: AppStateProps) {
  return (
    <View style={styles.container}>
      {loading ? <ActivityIndicator color={colors.primary500} /> : null}
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
      {actionLabel && onAction ? (
        <AppButton label={actionLabel} variant="secondary" onPress={onAction} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 180,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    padding: spacing.xl,
  },
  title: {
    ...textStyles.label1,
    color: colors.neutral900,
    textAlign: "center",
  },
  description: {
    ...textStyles.caption1,
    color: colors.neutral600,
    textAlign: "center",
  },
});

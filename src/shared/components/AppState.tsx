import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/shared/components/AppButton";
import { colors, spacing } from "@/shared/constants/theme";

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
    color: colors.neutral900,
    fontSize: 17,
    fontWeight: "800",
    textAlign: "center",
  },
  description: {
    color: colors.neutral600,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
});

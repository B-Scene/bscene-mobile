import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { ProfileImage } from "@/shared/components/ProfileImage";
import { colors, textStyles } from "@/shared/constants/theme";

export function BandBanner({
  bandName,
  description,
  profileImageUrl,
  action,
}: {
  bandName: string;
  description: string;
  profileImageUrl?: string | null;
  action?: ReactNode;
}) {
  return (
    <View style={styles.banner}>
      <ProfileImage imageUrl={profileImageUrl} size={36} variant="band" />

      <View style={styles.text}>
        <Text numberOfLines={1} style={styles.name}>
          {bandName}
        </Text>
        <Text numberOfLines={1} style={styles.description}>
          {description}
        </Text>
      </View>

      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: colors.secondary300,
    borderRadius: 12,
    backgroundColor: colors.secondary0,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  text: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    ...textStyles.caption3,
    color: colors.neutral900,
  },
  description: {
    ...textStyles.caption2,
    color: colors.neutral600,
  },
});

import { Image, StyleSheet, Text, View } from "react-native";

import { colors } from "@/shared/constants/theme";

type AvatarProps = {
  imageUrl?: string | null;
  label?: string;
  size?: number;
};

export function Avatar({ imageUrl, label = "B", size = 48 }: AvatarProps) {
  if (imageUrl) {
    return (
      <Image
        source={{ uri: imageUrl }}
        style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}
      />
    );
  }

  return (
    <View style={[styles.fallback, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.label, { fontSize: Math.max(12, size * 0.34) }]}>
        {label.slice(0, 1)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: colors.neutral200,
  },
  fallback: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary50,
  },
  label: {
    color: colors.primary600,
    fontWeight: "900",
  },
});

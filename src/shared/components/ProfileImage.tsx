import { Image, StyleSheet } from "react-native";

import { AppIcon } from "@/shared/components/AppIcon";
import { colors } from "@/shared/constants/theme";

type ProfileImageProps = {
  imageUrl?: string | null;
  size: number;
  variant?: "user" | "band";
};

const PLACEHOLDER_HOSTS = /^https?:\/\/(www\.)?example\.com(\/|$)/i;

const getRenderableUrl = (value?: string | null) => {
  const url = value?.trim();

  if (!url || PLACEHOLDER_HOSTS.test(url)) return null;

  return /^(https?:|file:|content:|ph:|data:)/i.test(url) ? url : null;
};

export function ProfileImage({
  imageUrl,
  size,
  variant = "user",
}: ProfileImageProps) {
  const url = getRenderableUrl(imageUrl);

  if (!url) {
    return (
      <AppIcon
        name={variant === "band" ? "bandDefaultProfile" : "userDefaultProfile"}
        size={size}
      />
    );
  }

  return (
    <Image
      source={{ uri: url }}
      style={[
        styles.image,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: colors.neutral300,
  },
});

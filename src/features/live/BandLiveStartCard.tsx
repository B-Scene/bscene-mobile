import { router } from "expo-router";
import {
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";

<LiveIcon
  width={62}
  height={62}
/>

import {
    colors,
    textStyles,
} from "@/shared/constants/theme";
import LiveIcon from "./icons/LiveIcon";

export function BandLiveStartCard() {
  return (
    <View style={styles.card}>
      <LiveIcon
        width={62}
        height={62}
      />

      <View style={styles.copy}>
        <Text
          numberOfLines={1}
          style={styles.title}
        >
          오디오 라이브
        </Text>

        <Text
          numberOfLines={1}
          style={styles.description}
        >
          팬들과 실시간으로 소통해요
        </Text>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="라이브 시작"
        style={({ pressed }) => [
          styles.button,
          pressed && styles.pressed,
        ]}
        onPress={() =>
          router.push(
            "/band/live/create" as Parameters<
              typeof router.push
            >[0],
          )
        }
      >
        <Text style={styles.buttonText}>
          라이브 시작
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 86,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    backgroundColor: colors.white,
    marginTop: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    boxShadow:
      "0px 0px 8px 0px rgba(0, 0, 0, 0.10)",
  },

  copy: {
    flex: 1,
    minWidth: 0,
    marginLeft: 16,
    marginRight: 10,
  },

  title: {
    ...textStyles.body1,
    color: colors.neutral900,
  },

  description: {
    ...textStyles.caption2,
    color: colors.neutral600,
    marginTop: 4,
  },

  button: {
    width: 96,
    height: 40,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: colors.secondary500,
  },

  buttonText: {
    ...textStyles.caption3,
    color: colors.white,
  },

  pressed: {
    opacity: 0.72,
  },
});

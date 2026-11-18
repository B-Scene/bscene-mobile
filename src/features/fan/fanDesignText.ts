import type { TextStyle } from "react-native";

import { textStyles } from "@/shared/constants/theme";

const families = {
  "400": "Pretendard-Medium",
  "500": "Pretendard-Medium",
  "600": "Pretendard-SemiBold",
  "700": "Pretendard-Bold",
} as const;

export const fanDesignText = Object.fromEntries(
  Object.entries(textStyles).map(([key, { fontWeight, ...metrics }]) => [
    key,
    { ...metrics, fontFamily: families[fontWeight], fontWeight: "normal", includeFontPadding: false },
  ]),
) as Record<keyof typeof textStyles, TextStyle>;

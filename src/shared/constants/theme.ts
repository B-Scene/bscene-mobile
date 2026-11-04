import type { TextStyle, ViewStyle } from "react-native";

export const colors = {
  primary0: "#fff5f8",
  primary50: "#fee5ed",
  primary100: "#fcd5e0",
  primary200: "#f49e4a",
  primary300: "#f4769c",
  primary400: "#f04579",
  primary500: "#ec1858",
  primary600: "#c11046",
  primary700: "#920c35",
  secondary0: "#fffaf0",
  secondary100: "#fef2d7",
  secondary200: "#fee2a5",
  secondary300: "#fdd272",
  secondary400: "#fcc13f",
  secondary500: "#fbb10e",
  secondary600: "#d39203",
  error: "#c62828",
  white: "#ffffff",
  neutral100: "#fafafa",
  neutral200: "#f5f5f5",
  neutral300: "#ececec",
  neutral400: "#d4d4d4",
  neutral500: "#a3a3a3",
  neutral600: "#737373",
  neutral700: "#525252",
  neutral800: "#2e2e2e",
  neutral900: "#141414",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 18,
  pill: 999,
} as const;

export const typography = {
  title: 28,
  heading: 22,
  body: 16,
  caption: 13,
} as const;

// 웹 styles/tokens/typography.css 와 동일한 텍스트 토큰
export const textStyles = {
  h3: { fontSize: 24, fontWeight: "700", lineHeight: 38 },
  h4: { fontSize: 20, fontWeight: "600", lineHeight: 28 },
  label1: { fontSize: 18, fontWeight: "700", lineHeight: 20 },
  label2: { fontSize: 18, fontWeight: "600", lineHeight: 20 },
  body1: { fontSize: 15, fontWeight: "600", lineHeight: 20 },
  body2: { fontSize: 15, fontWeight: "500", lineHeight: 20 },
  body3: { fontSize: 12, fontWeight: "400", lineHeight: 18 },
  body4: { fontSize: 10, fontWeight: "700", lineHeight: 12 },
  body5: { fontSize: 10, fontWeight: "500", lineHeight: 12 },
  body6: { fontSize: 15, fontWeight: "700", lineHeight: 20 },
  caption1: { fontSize: 14, fontWeight: "500", lineHeight: 20 },
  caption2: { fontSize: 12, fontWeight: "500", lineHeight: 18 },
  caption3: { fontSize: 12, fontWeight: "600", lineHeight: 18 },
  caption4: { fontSize: 8, fontWeight: "500", lineHeight: 10 },
  caption5: { fontSize: 6, fontWeight: "600", lineHeight: 10 },
  label4: { fontSize: 7, fontWeight: "600", lineHeight: 10 },
} as const satisfies Record<string, TextStyle>;

export const shadows = {
  card: { boxShadow: "0px 0px 8px 0px rgba(0, 0, 0, 0.1)" },
} as const satisfies Record<string, ViewStyle>;

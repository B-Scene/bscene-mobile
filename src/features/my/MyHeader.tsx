import type { ComponentProps } from "react";
import { StyleSheet } from "react-native";

import { AppHeader } from "@/shared/components/AppHeader";

// 웹 Header의 좌우 여백(15px)을 그대로 쓴다. 화면 콘텐츠는 패딩 없이 전체 폭으로 배치한다.
export function MyHeader({
  style,
  ...props
}: ComponentProps<typeof AppHeader>) {
  return <AppHeader {...props} style={{ ...styles.header, ...style }} />;
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 15,
  },
});

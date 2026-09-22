import { Slot } from "expo-router";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";

import {
  BottomNavigation,
  BOTTOM_NAV_HEIGHT,
} from "@/features/navigation/BottomNavigation";
import { colors } from "@/shared/constants/theme";
import type { AppMode } from "@/stores/useModeStore";
import { useModeStore } from "@/stores/useModeStore";

type ModeTabLayoutProps = {
  mode: AppMode;
};

export function ModeTabLayout({ mode }: ModeTabLayoutProps) {
  const setMode = useModeStore((state) => state.setMode);

  useEffect(() => {
    setMode(mode);
  }, [mode, setMode]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Slot />
      </View>
      <BottomNavigation mode={mode} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    flex: 1,
    paddingBottom: BOTTOM_NAV_HEIGHT,
  },
});

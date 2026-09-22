import { router, usePathname } from "expo-router";
import {
  Home,
  Radio,
  Search,
  User,
  Users,
  type LucideIcon,
} from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, spacing } from "@/shared/constants/theme";
import type { AppMode } from "@/stores/useModeStore";

type BottomNavTab = {
  id: string;
  label: string;
  path: string;
  Icon: LucideIcon;
  activePrefixes?: string[];
};

const FAN_NAV_TABS: BottomNavTab[] = [
  { id: "home", label: "홈", path: "/fan/home", Icon: Home },
  {
    id: "explore",
    label: "탐색",
    path: "/fan/explore",
    Icon: Search,
    activePrefixes: ["/fan/explore", "/fan/bands"],
  },
  { id: "live", label: "라이브", path: "/fan/live", Icon: Radio },
  { id: "my", label: "마이", path: "/fan/my", Icon: User },
];

const BAND_NAV_TABS: BottomNavTab[] = [
  {
    id: "band",
    label: "내 밴드",
    path: "/band/home",
    Icon: Users,
    activePrefixes: [
      "/band/home",
      "/band/profile",
      "/band/concerts",
      "/band/videos",
      "/band/music",
      "/band/register",
      "/band/contents",
    ],
  },
  { id: "session", label: "세션", path: "/band/session", Icon: Search },
  { id: "live", label: "라이브", path: "/band/live", Icon: Radio },
  { id: "my", label: "마이", path: "/band/my", Icon: User },
];

const ACTIVE_COLOR = {
  fan: colors.primary500,
  band: colors.secondary500,
} as const;

type BottomNavigationProps = {
  mode: AppMode;
};

export function BottomNavigation({ mode }: BottomNavigationProps) {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const tabs = mode === "fan" ? FAN_NAV_TABS : BAND_NAV_TABS;
  const activeColor = ACTIVE_COLOR[mode];

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {tabs.map((tab) => {
        const isLiveRoute = pathname.includes("/live") && tab.id === "live";
        const isActive =
          isLiveRoute ||
          (tab.activePrefixes ?? [tab.path]).some((prefix) =>
            pathname.startsWith(prefix),
          );
        const color = isActive ? activeColor : colors.neutral800;

        return (
          <Pressable
            key={tab.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            onPress={() =>
              router.push(tab.path as Parameters<typeof router.push>[0])
            }
            style={styles.tab}
          >
            <tab.Icon size={24} color={color} strokeWidth={isActive ? 2.8 : 2.2} />
            <Text style={[styles.label, { color }]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export const BOTTOM_NAV_HEIGHT = 78;

const styles = StyleSheet.create({
  container: {
    minHeight: BOTTOM_NAV_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: colors.neutral200,
    backgroundColor: colors.white,
    paddingHorizontal: 24,
    paddingTop: 10,
    shadowColor: colors.neutral900,
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 10,
  },
  tab: {
    minWidth: 56,
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
  },
});

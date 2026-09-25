import {
  router,
  usePathname,
} from "expo-router";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  BandNavIcon,
  LiveNavIcon,
  MyNavIcon,
  SessionNavIcon,
} from "@/features/navigation/BSceneNavigationIcons";
import { colors } from "@/shared/constants/theme";
import type { AppMode } from "@/stores/useModeStore";

type NavigationIconProps = {
  color: string;
  active: boolean;
  size?: number;
};

type BottomNavTab = {
  id: string;
  label: string;
  path: string;
  Icon: React.ComponentType<NavigationIconProps>;
  activePrefixes?: string[];
};

const FAN_NAV_TABS: BottomNavTab[] = [
  {
    id: "home",
    label: "홈",
    path: "/fan/home",
    Icon: BandNavIcon,
  },
  {
    id: "explore",
    label: "탐색",
    path: "/fan/explore",
    Icon: SessionNavIcon,
    activePrefixes: [
      "/fan/explore",
      "/fan/bands",
    ],
  },
  {
    id: "live",
    label: "라이브",
    path: "/fan/live",
    Icon: LiveNavIcon,
  },
  {
    id: "my",
    label: "마이",
    path: "/fan/my",
    Icon: MyNavIcon,
  },
];

const BAND_NAV_TABS: BottomNavTab[] = [
  {
    id: "band",
    label: "내 밴드",
    path: "/band/home",
    Icon: BandNavIcon,
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
  {
    id: "session",
    label: "세션",
    path: "/band/session",
    Icon: SessionNavIcon,
  },
  {
    id: "live",
    label: "라이브",
    path: "/band/live",
    Icon: LiveNavIcon,
  },
  {
    id: "my",
    label: "마이",
    path: "/band/my",
    Icon: MyNavIcon,
  },
];

const ACTIVE_COLOR = {
  fan: colors.primary500,
  band: colors.secondary500,
} as const;

type BottomNavigationProps = {
  mode: AppMode;
};

export function BottomNavigation({
  mode,
}: BottomNavigationProps) {
  const pathname =
    usePathname();

  const insets =
    useSafeAreaInsets();

  const tabs =
    mode === "fan"
      ? FAN_NAV_TABS
      : BAND_NAV_TABS;

  const activeColor =
    ACTIVE_COLOR[mode];

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom:
            Math.max(
              insets.bottom,
              10,
            ),
        },
      ]}
    >
      {tabs.map((tab) => {
        const isLiveRoute =
          pathname.includes(
            "/live",
          ) &&
          tab.id === "live";

        const isActive =
          isLiveRoute ||
          (
            tab.activePrefixes ??
            [tab.path]
          ).some((prefix) =>
            pathname.startsWith(
              prefix,
            ),
          );

        const color =
          isActive
            ? activeColor
            : colors.neutral900;

        const Icon =
          tab.Icon;

        return (
          <Pressable
            key={tab.id}
            accessibilityRole="tab"
            accessibilityState={{
              selected:
                isActive,
            }}
            style={
              styles.tab
            }
            onPress={() =>
              router.push(
                tab.path as Parameters<
                  typeof router.push
                >[0],
              )
            }
          >
            <Icon
              size={24}
              color={color}
              active={
                isActive
              }
            />

            <Text
              style={[
                styles.label,
                {
                  color,
                },
              ]}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export const BOTTOM_NAV_HEIGHT =
  72;

const styles =
  StyleSheet.create({
    container: {
      minHeight:
        BOTTOM_NAV_HEIGHT,
      flexDirection: "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",

      borderTopWidth: 0,

      backgroundColor:
        colors.white,

      paddingHorizontal: 30,
      paddingTop: 16,

      shadowColor:
        "#000000",
      shadowOffset: {
        width: 0,
        height: -5,
      },
      shadowOpacity: 0.03,
      shadowRadius: 20,

      elevation: 8,
    },

    tab: {
      minWidth: 48,
      alignItems:
        "center",
      justifyContent:
        "center",
      gap: 8,
    },

    label: {
      fontSize: 12,
      fontWeight: "500",
      lineHeight: 18,
    },
  });
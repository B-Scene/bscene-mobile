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
import { FanDesignIcon } from "@/features/fan/FanDesignIcon";
import { fanDesignText } from "@/features/fan/fanDesignText";
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

const FAN_TAB_CONTENT_BOTTOM = 15;
const TAB_ICON_SIZE = 24;

const ACTIVE_COLOR = {
  fan: colors.primary500,
  band: colors.secondary500,
} as const;

// 웹에서 하단 탭을 표시하지 않는 경로
const HIDDEN_NAV_PREFIXES = [
  "/fan/home/notifications",
  "/band/home/notifications",
  "/fan/home/concerts/",
  "/fan/explore/contents/",
  "/band/live/now",
  "/band/live/scheduled",
  "/band/live/room",
  "/fan/live/room",
  "/fan/live/replays/",
  "/band/my/recruit-alert",
  "/band/my/live-alert",
  "/band/my/applications",
  "/band/my/postings",
  "/band/my/members",
  "/band/my/profile",
  "/fan/my/profile",
];

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

  const usesFanDesign =
    pathname === "/fan/home" ||
    pathname.startsWith("/fan/home/") ||
    pathname === "/fan/explore" ||
    pathname.startsWith("/fan/explore/") ||
    pathname.startsWith("/fan/bands/");
  const activeColor = usesFanDesign ? colors.primary400 : ACTIVE_COLOR[mode];
  const isFanMode = mode === "fan";
  const paddingBottom = Math.max(insets.bottom, isFanMode ? FAN_TAB_CONTENT_BOTTOM : 10);

  if (pathname === "/fan/explore/search") return null;

  if (
    pathname !== "/fan/home/concerts/calendar" &&
    HIDDEN_NAV_PREFIXES.some((prefix) =>
      pathname.startsWith(prefix),
    )
  ) {
    return null;
  }

  return (
    <View
      style={[
        styles.container,
        isFanMode && styles.fanContainer,
        isFanMode && { paddingLeft: insets.left, paddingRight: insets.right },
        { paddingBottom },
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
            style={[styles.tab, isFanMode && styles.fanTab]}
            onPress={() =>
              router.push(
                tab.path as Parameters<
                  typeof router.push
                >[0],
              )
            }
          >
            <View style={styles.iconSlot} pointerEvents="none">
              {usesFanDesign ? (
                <FanNavigationIcon id={tab.id} active={isActive} />
              ) : (
                <Icon size={TAB_ICON_SIZE} color={color} active={isActive} />
              )}
            </View>

            <Text
              numberOfLines={isFanMode ? 1 : undefined}
              style={[
                styles.label,
                isFanMode && styles.fanLabel,
                usesFanDesign && fanDesignText.caption3,
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

function FanNavigationIcon({ id, active }: { id: string; active: boolean }) {
  if (id === "home") {
    return <FanDesignIcon name={active ? "tabHomeActive" : "tabHome"} />;
  }

  if (id === "explore") {
    return (
      <View>
        <FanDesignIcon name={active ? "tabExploreActive" : "tabExplore"} />
        <FanDesignIcon
          name={active ? "tabMusicActive" : "tabMusic"}
          style={styles.musicNote}
        />
      </View>
    );
  }

  return <FanDesignIcon name={id === "live" ? "tabLive" : "tabMy"} />;
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

    fanContainer: {
      alignItems: "flex-start",
    },
    fanTab: {
      flex: 1,
      minWidth: 0,
      minHeight: 44,
      gap: 7,
    },
    iconSlot: {
      width: TAB_ICON_SIZE,
      height: TAB_ICON_SIZE,
      alignItems: "center",
      justifyContent: "center",
    },
    fanLabel: {
      alignSelf: "stretch",
      textAlign: "center",
    },
    musicNote: {
      position: "absolute",
      top: 5,
      left: 7,
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
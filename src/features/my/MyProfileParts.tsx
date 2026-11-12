import type { ReactNode } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Svg, { Path } from "react-native-svg";

import { AppIcon } from "@/shared/components/AppIcon";
import { ProfileImage } from "@/shared/components/ProfileImage";
import { colors, shadows, textStyles } from "@/shared/constants/theme";

const clamp = (min: number, value: number, max: number) =>
  Math.min(Math.max(value, min), max);

export function ProfileSummary({
  name,
  subtitle,
  profileImageUrl,
  variant,
  switchLabel,
  onSwitch,
}: {
  name: string;
  subtitle: string;
  profileImageUrl?: string | null;
  variant: "user" | "band";
  switchLabel?: string;
  onSwitch?: () => void;
}) {
  return (
    <View style={styles.profileRow}>
      <View style={styles.profileMain}>
        <ProfileImage imageUrl={profileImageUrl} size={62} variant={variant} />
        <View style={styles.profileText}>
          <Text numberOfLines={1} style={styles.name}>
            {name}
          </Text>
          <Text numberOfLines={1} style={styles.subtitle}>
            {subtitle}
          </Text>
        </View>
      </View>

      {switchLabel ? (
        <Pressable
          accessibilityRole="button"
          style={styles.switchButton}
          onPress={onSwitch}
        >
          <Text style={styles.switchText}>{switchLabel}</Text>
          <Svg width={10} height={6} viewBox="0 0 10 6" fill="none">
            <Path
              d="M1 1L5 5L9 1"
              stroke={colors.white}
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </Pressable>
      ) : null}
    </View>
  );
}

export type StatItem = {
  label: string;
  value: number;
  onPress?: () => void;
};

export function StatRow({ stats }: { stats: StatItem[] }) {
  const { width } = useWindowDimensions();
  const paddingHorizontal = clamp(16, width * 0.06, 40);
  const dividerMargin = clamp(16, width * 0.04, 38);

  return (
    <View style={[styles.statRow, { paddingHorizontal }]}>
      {stats.map((stat, index) => (
        <View key={stat.label} style={styles.statGroup}>
          {index > 0 ? (
            <View
              style={[styles.statDivider, { marginHorizontal: dividerMargin }]}
            />
          ) : null}

          <Pressable
            accessibilityRole={stat.onPress ? "button" : undefined}
            disabled={!stat.onPress}
            style={styles.statButton}
            onPress={stat.onPress}
          >
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text numberOfLines={1} style={styles.statLabel}>
              {stat.label}
            </Text>
          </Pressable>
        </View>
      ))}
    </View>
  );
}

export type MenuItem = {
  label: string;
  onPress: () => void;
};

export function MenuSection({
  title,
  items,
}: {
  title: string;
  items: MenuItem[];
}) {
  return (
    <View style={styles.menuSection}>
      <Text style={styles.menuTitle}>{title}</Text>

      <View style={styles.menuRows}>
        {items.map((item) => (
          <Pressable
            key={item.label}
            accessibilityRole="button"
            style={styles.menuRow}
            onPress={item.onPress}
          >
            <Text style={styles.menuLabel}>{item.label}</Text>
            <AppIcon name="arrowRight" />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export function MenuDivider() {
  return <View style={styles.menuDivider} />;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: ReactNode;
  description?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>{title}</Text>
      {description ? (
        <Text style={styles.emptyDescription}>{description}</Text>
      ) : null}
      {actionLabel ? (
        <Pressable
          accessibilityRole="button"
          style={styles.emptyAction}
          onPress={onAction}
        >
          <Text style={styles.emptyActionText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  profileMain: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  profileText: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  name: {
    ...textStyles.label1,
    color: colors.neutral900,
  },
  subtitle: {
    ...textStyles.caption2,
    color: colors.neutral700,
  },
  switchButton: {
    flexShrink: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 999,
    backgroundColor: colors.secondary400,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  switchText: {
    ...textStyles.caption3,
    color: colors.white,
  },
  statRow: {
    ...shadows.card,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    backgroundColor: colors.white,
    paddingVertical: 16,
  },
  statGroup: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  statButton: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.neutral300,
  },
  statValue: {
    ...textStyles.label1,
    color: colors.neutral900,
  },
  statLabel: {
    ...textStyles.body5,
    color: colors.neutral600,
  },
  menuSection: {
    gap: 16,
  },
  menuTitle: {
    ...textStyles.caption3,
    color: colors.neutral600,
    paddingHorizontal: 20,
  },
  menuRows: {
    gap: 20,
    paddingHorizontal: 20,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  menuLabel: {
    ...textStyles.body2,
    color: colors.neutral900,
  },
  menuDivider: {
    height: 1,
    backgroundColor: colors.neutral400,
  },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  emptyTitle: {
    ...textStyles.label1,
    color: colors.neutral900,
    textAlign: "center",
  },
  emptyDescription: {
    ...textStyles.caption1,
    color: colors.neutral600,
    textAlign: "center",
  },
  emptyAction: {
    height: 38,
    minWidth: 110,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: colors.secondary400,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  emptyActionText: {
    ...textStyles.body1,
    color: colors.white,
  },
});

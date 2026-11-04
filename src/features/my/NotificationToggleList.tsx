import { Fragment } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, textStyles } from "@/shared/constants/theme";

type Tone = "primary" | "secondary";

export type NotificationToggleItem = {
  id: string;
  title: string;
  description: string;
};

function ToggleSwitch({
  checked,
  label,
  tone,
  disabled,
  onChange,
}: {
  checked: boolean;
  label: string;
  tone: Tone;
  disabled: boolean;
  onChange: (checked: boolean) => void;
}) {
  const activeColor =
    tone === "primary" ? colors.primary400 : colors.secondary500;

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked, disabled }}
      disabled={disabled}
      style={[
        styles.track,
        { backgroundColor: checked ? activeColor : colors.neutral400 },
        disabled && styles.disabled,
      ]}
      onPress={() => onChange(!checked)}
    >
      <View style={[styles.thumb, checked && styles.thumbOn]} />
    </Pressable>
  );
}

export function NotificationToggleList({
  items,
  values,
  tone,
  disabled,
  onToggle,
}: {
  items: NotificationToggleItem[];
  values: Record<string, boolean>;
  tone: Tone;
  disabled: boolean;
  onToggle: (id: string, checked: boolean) => void;
}) {
  return (
    <View style={styles.list}>
      {items.map((item) => (
        <Fragment key={item.id}>
          <View style={styles.row}>
            <View style={styles.text}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.description}>{item.description}</Text>
            </View>

            <ToggleSwitch
              checked={values[item.id] ?? false}
              label={item.title}
              tone={tone}
              disabled={disabled}
              onChange={(checked) => onToggle(item.id, checked)}
            />
          </View>

          <View style={styles.divider} />
        </Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    paddingHorizontal: 12,
  },
  text: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  title: {
    ...textStyles.body6,
    color: colors.neutral900,
  },
  description: {
    ...textStyles.caption2,
    color: colors.neutral600,
  },
  divider: {
    height: 2,
    backgroundColor: colors.neutral300,
  },
  track: {
    width: 44,
    height: 24,
    flexShrink: 0,
    justifyContent: "center",
    borderRadius: 999,
    padding: 2,
  },
  thumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.white,
    boxShadow: "0px 1px 2px 0px rgba(0, 0, 0, 0.25)",
  },
  thumbOn: {
    transform: [{ translateX: 20 }],
  },
  disabled: {
    opacity: 0.5,
  },
});

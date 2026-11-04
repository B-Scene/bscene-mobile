import { useRef, useState, type ComponentRef } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";

import { AppIcon } from "@/shared/components/AppIcon";
import { ProfileImage } from "@/shared/components/ProfileImage";
import type { SvgIconName } from "@/shared/constants/svgIcons";
import { colors, textStyles } from "@/shared/constants/theme";

type Tone = "primary" | "secondary";

const getToneColor = (tone: Tone) =>
  tone === "primary" ? colors.primary400 : colors.secondary500;

export function FieldLabel({
  label,
  required = false,
}: {
  label: string;
  required?: boolean;
}) {
  return (
    <Text style={styles.label}>
      {label}
      {required ? <Text style={styles.required}> *</Text> : null}
    </Text>
  );
}

export function FormInput({
  tone,
  style,
  ...props
}: TextInputProps & { tone: Tone }) {
  const [focused, setFocused] = useState(false);

  return (
    <TextInput
      placeholderTextColor={colors.neutral500}
      {...props}
      style={[
        styles.input,
        focused && { borderColor: getToneColor(tone) },
        style,
      ]}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
}

export function ChipGroup<T extends string>({
  options,
  isSelected,
  tone,
  onPress,
}: {
  options: readonly { value: T; label: string }[];
  isSelected: (value: T) => boolean;
  tone: Tone;
  onPress: (value: T) => void;
}) {
  return (
    <View style={styles.chips}>
      {options.map((option) => {
        const selected = isSelected(option.value);

        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            style={[
              styles.chip,
              {
                backgroundColor: selected
                  ? getToneColor(tone)
                  : colors.neutral300,
              },
            ]}
            onPress={() => onPress(option.value)}
          >
            <Text
              style={[styles.chipText, selected && styles.chipTextSelected]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function SelectField<T extends string>({
  value,
  options,
  placeholder,
  onChange,
}: {
  value: T | "";
  options: readonly { value: T; label: string }[];
  placeholder: string;
  onChange: (value: T) => void;
}) {
  const [open, setOpen] = useState(false);
  const label = options.find((option) => option.value === value)?.label;

  return (
    <View style={styles.select}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        style={[styles.selectButton, open && styles.selectButtonOpen]}
        onPress={() => setOpen((prev) => !prev)}
      >
        <Text style={[styles.selectText, !label && styles.selectPlaceholder]}>
          {label ?? placeholder}
        </Text>
        <AppIcon
          name={open ? "arrowDownYellow" : "arrowDownGray"}
          width={10}
          height={6}
        />
      </Pressable>

      {open ? (
        <View style={styles.selectMenu}>
          {options.map((option) => (
            <Pressable
              key={option.value}
              accessibilityRole="button"
              onPress={() => {
                onChange(option.value);
                setOpen(false);
              }}
            >
              <Text style={styles.selectOption}>{option.label}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const POPOVER_WIDTH = 160;

function PopoverAction({
  icon,
  label,
  danger = false,
  onPress,
}: {
  icon: SvgIconName;
  label: string;
  danger?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      style={styles.popoverAction}
      onPress={onPress}
    >
      <AppIcon name={icon} />
      <Text style={[styles.popoverText, danger && styles.popoverTextDanger]}>
        {label}
      </Text>
    </Pressable>
  );
}

export function ProfileImagePicker({
  imageUrl,
  variant,
  tone,
  label,
  onSelectGallery,
  onSelectCamera,
  onDelete,
}: {
  imageUrl?: string | null;
  variant: "user" | "band";
  tone: Tone;
  label: string;
  onSelectGallery: () => void;
  onSelectCamera: () => void;
  onDelete: () => void;
}) {
  const avatarRef = useRef<ComponentRef<typeof View>>(null);
  const [anchor, setAnchor] = useState<{ top: number; left: number } | null>(
    null,
  );

  const closeThen = (action: () => void) => () => {
    setAnchor(null);
    action();
  };

  const toggleMenu = () => {
    if (anchor) {
      setAnchor(null);
      return;
    }

    avatarRef.current?.measureInWindow((x, y, width, height) => {
      setAnchor({
        top: y + height + 12,
        left: x + width / 2 - POPOVER_WIDTH / 2,
      });
    });
  };

  return (
    <View style={styles.picker}>
      <View ref={avatarRef} collapsable={false}>
        <ProfileImage imageUrl={imageUrl} size={72} variant={variant} />
      </View>

      <Pressable accessibilityRole="button" hitSlop={8} onPress={toggleMenu}>
        <Text style={[styles.pickerText, { color: getToneColor(tone) }]}>
          {label}
        </Text>
      </Pressable>

      <Modal
        transparent
        statusBarTranslucent
        visible={anchor !== null}
        onRequestClose={() => setAnchor(null)}
      >
        <Pressable
          style={styles.popoverBackdrop}
          onPress={() => setAnchor(null)}
        >
          <Pressable style={[styles.popover, anchor]}>
            <PopoverAction
              icon="gallery"
              label="사진 보관함"
              onPress={closeThen(onSelectGallery)}
            />
            <PopoverAction
              icon="camera"
              label="사진 찍기"
              onPress={closeThen(onSelectCamera)}
            />
            <PopoverAction
              danger
              icon="deleteImage"
              label="삭제"
              onPress={closeThen(onDelete)}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

export function SubmitButton({
  label,
  tone,
  active,
  disabled,
  onPress,
}: {
  label: string;
  tone: Tone;
  active: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      style={[
        styles.submit,
        { backgroundColor: active ? getToneColor(tone) : colors.neutral300 },
      ]}
      onPress={onPress}
    >
      <Text style={[styles.submitText, active && styles.submitTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  label: {
    ...textStyles.body1,
    color: colors.neutral900,
  },
  required: {
    color: colors.error,
  },
  input: {
    ...textStyles.caption2,
    width: "100%",
    borderWidth: 1,
    borderColor: colors.neutral400,
    borderRadius: 5,
    backgroundColor: colors.white,
    color: colors.neutral900,
    paddingHorizontal: 16,
    paddingVertical: 5,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 15,
    paddingVertical: 4,
  },
  chipText: {
    ...textStyles.caption3,
    color: colors.neutral600,
  },
  chipTextSelected: {
    color: colors.white,
  },
  select: {
    gap: 4,
  },
  selectButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: colors.neutral400,
    borderRadius: 5,
    paddingHorizontal: 16,
    paddingVertical: 5,
  },
  selectButtonOpen: {
    borderColor: colors.secondary500,
  },
  selectText: {
    ...textStyles.caption2,
    color: colors.neutral900,
  },
  selectPlaceholder: {
    color: colors.neutral500,
  },
  selectMenu: {
    gap: 4,
    borderWidth: 1,
    borderColor: colors.secondary500,
    borderRadius: 5,
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  selectOption: {
    ...textStyles.caption3,
    color: colors.neutral600,
  },
  picker: {
    alignItems: "center",
    gap: 12,
  },
  pickerText: {
    ...textStyles.caption2,
  },
  popoverBackdrop: {
    flex: 1,
  },
  popover: {
    position: "absolute",
    width: POPOVER_WIDTH,
    gap: 16,
    borderRadius: 24,
    backgroundColor: "rgba(250, 250, 250, 0.96)",
    paddingLeft: 24,
    paddingRight: 16,
    paddingVertical: 20,
    boxShadow: "0px 8px 40px 0px rgba(0, 0, 0, 0.12)",
  },
  popoverAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  popoverText: {
    ...textStyles.body1,
    color: colors.neutral900,
  },
  popoverTextDanger: {
    color: colors.error,
  },
  submit: {
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  submitText: {
    ...textStyles.label1,
    color: colors.neutral600,
  },
  submitTextActive: {
    color: colors.white,
  },
});

import { useState, type ReactNode } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ViewStyle,
} from "react-native";

import { FormInput } from "@/features/my/MyFormParts";
import { AppIcon } from "@/shared/components/AppIcon";
import { BottomSheetModal } from "@/shared/components/BottomSheetModal";
import { colors, shadows, textStyles } from "@/shared/constants/theme";

export const DESCRIPTION_MAX_LENGTH = 500;
export const MAX_TAGS = 8;

// iOS에서 시트가 닫히는 중에 이미지 피커를 띄우면 표시되지 않아, 닫힘 애니메이션 후 실행한다.
const SHEET_CLOSE_DELAY_MS = 350;

const hasBatchim = (text: string) => {
  const code = text.trim().slice(-1).charCodeAt(0) - 0xac00;

  return code >= 0 && code <= 11171 && code % 28 !== 0;
};

export function FormField({
  label,
  required = false,
  error = false,
  style,
  children,
}: {
  label: string;
  required?: boolean;
  error?: boolean;
  style?: ViewStyle;
  children: ReactNode;
}) {
  return (
    <View style={[styles.field, style]}>
      <Text style={styles.label}>
        {label} {required ? <Text style={styles.required}>*</Text> : null}
      </Text>
      {children}
      {error ? (
        <Text style={styles.errorText}>
          {label}
          {hasBatchim(label) ? "은" : "는"} 필수 항목이에요
        </Text>
      ) : null}
    </View>
  );
}

export function DescriptionInput({
  value,
  placeholder,
  error = false,
  onChangeText,
}: {
  value: string;
  placeholder: string;
  error?: boolean;
  onChangeText: (value: string) => void;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <View
      style={[
        styles.description,
        error && styles.inputError,
        focused && styles.descriptionFocused,
      ]}
    >
      <TextInput
        multiline
        value={value}
        placeholder={placeholder}
        placeholderTextColor={colors.neutral500}
        maxLength={DESCRIPTION_MAX_LENGTH}
        textAlignVertical="top"
        style={styles.descriptionInput}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      <Text style={styles.count}>
        {value.length}/{DESCRIPTION_MAX_LENGTH}
      </Text>
    </View>
  );
}

export function TagInput({
  tags,
  onChange,
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
}) {
  const [tagInput, setTagInput] = useState("");

  const addTag = () => {
    const trimmed = tagInput.trim();

    if (!trimmed || tags.includes(trimmed) || tags.length >= MAX_TAGS) return;

    onChange([...tags, trimmed]);
    setTagInput("");
  };

  return (
    <View style={styles.tags}>
      <FormInput
        tone="secondary"
        value={tagInput}
        placeholder="태그를 입력해주세요"
        editable={tags.length < MAX_TAGS}
        returnKeyType="done"
        submitBehavior="submit"
        onChangeText={setTagInput}
        onSubmitEditing={addTag}
      />

      {tags.length > 0 ? (
        <View style={styles.tagList}>
          {tags.map((tag) => (
            <View key={tag} style={styles.tagChip}>
              <Text style={styles.tagText}>{tag}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${tag} 태그 삭제`}
                hitSlop={8}
                onPress={() => onChange(tags.filter((item) => item !== tag))}
              >
                <AppIcon name="close" size={10} />
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

export function MediaSourceSheet({
  open,
  onClose,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (camera: boolean) => void;
}) {
  const select = (camera: boolean) => {
    onClose();
    setTimeout(() => onSelect(camera), SHEET_CLOSE_DELAY_MS);
  };

  return (
    <BottomSheetModal open={open} closeLabel="파일 선택 닫기" onClose={onClose}>
      <View style={styles.sheet}>
        <Pressable
          accessibilityRole="button"
          style={styles.sheetOption}
          onPress={() => select(false)}
        >
          <AppIcon name="gallery" />
          <Text style={styles.sheetText}>사진 보관함</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          style={styles.sheetOption}
          onPress={() => select(true)}
        >
          <AppIcon name="camera" />
          <Text style={styles.sheetText}>사진 찍기</Text>
        </Pressable>
      </View>
    </BottomSheetModal>
  );
}

export function RegisterComplete({
  title,
  description,
  rows,
  primaryLabel,
  onHome,
  onPrimary,
}: {
  title: string;
  description: string;
  rows: { label: string; value: string }[];
  primaryLabel: string;
  onHome: () => void;
  onPrimary: () => void;
}) {
  return (
    <View style={styles.complete}>
      <View style={styles.completeHeading}>
        <AppIcon name="bandRegisterComplete" size={120} />
        <View style={styles.completeTexts}>
          <Text style={styles.completeTitle}>{title}</Text>
          <Text style={styles.completeDescription}>{description}</Text>
        </View>
      </View>

      <View style={styles.completeBody}>
        <View style={styles.completeCard}>
          {rows.map((row, index) => (
            <View key={row.label} style={styles.completeRowGroup}>
              {index > 0 ? <View style={styles.completeDivider} /> : null}
              <View style={styles.completeRow}>
                <Text style={styles.completeRowLabel}>{row.label}</Text>
                <Text style={styles.completeRowValue}>{row.value}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.completeActions}>
          <Pressable
            accessibilityRole="button"
            style={[styles.completeButton, styles.completeHome]}
            onPress={onHome}
          >
            <Text style={styles.completeHomeText}>내 밴드로</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            style={[styles.completeButton, styles.completePrimary]}
            onPress={onPrimary}
          >
            <Text style={styles.completePrimaryText}>{primaryLabel}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: 8,
  },
  label: {
    ...textStyles.body1,
    color: colors.neutral900,
  },
  required: {
    color: colors.error,
  },
  errorText: {
    ...textStyles.body5,
    color: colors.error,
  },
  inputError: {
    borderColor: colors.error,
  },
  description: {
    height: 60,
    borderWidth: 1,
    borderColor: colors.neutral400,
    borderRadius: 5,
    backgroundColor: colors.white,
    paddingTop: 6,
    paddingRight: 13,
    paddingBottom: 8,
    paddingLeft: 16,
  },
  descriptionFocused: {
    borderColor: colors.secondary500,
  },
  descriptionInput: {
    ...textStyles.caption2,
    flex: 1,
    color: colors.neutral900,
    padding: 0,
  },
  count: {
    ...textStyles.caption4,
    alignSelf: "flex-end",
    color: colors.neutral400,
  },
  tags: {
    gap: 10,
  },
  tagList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tagChip: {
    height: 26,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 999,
    backgroundColor: colors.secondary100,
    paddingHorizontal: 15,
  },
  tagText: {
    ...textStyles.caption3,
    color: colors.secondary500,
  },
  sheet: {
    gap: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: colors.white,
    paddingHorizontal: 30,
    paddingTop: 32,
    paddingBottom: 48,
  },
  sheetOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sheetText: {
    ...textStyles.label2,
    color: colors.neutral900,
  },
  complete: {
    flexGrow: 1,
    alignItems: "center",
    gap: 48,
    backgroundColor: colors.white,
    paddingHorizontal: 20,
    paddingTop: 124,
    paddingBottom: 96,
  },
  completeHeading: {
    alignItems: "center",
    gap: 24,
  },
  completeTexts: {
    alignItems: "center",
    gap: 12,
  },
  completeTitle: {
    fontSize: 32,
    fontWeight: "700",
    lineHeight: 38,
    color: colors.neutral900,
    textAlign: "center",
  },
  completeDescription: {
    ...textStyles.body2,
    color: colors.neutral600,
    textAlign: "center",
  },
  completeBody: {
    width: "100%",
    alignItems: "center",
    gap: 24,
  },
  completeCard: {
    ...shadows.card,
    width: "100%",
    maxWidth: 330,
    gap: 8,
    borderRadius: 8,
    backgroundColor: colors.white,
    padding: 16,
  },
  completeRowGroup: {
    gap: 8,
  },
  completeDivider: {
    height: 1,
    backgroundColor: "#E4E4E7",
  },
  completeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  completeRowLabel: {
    ...textStyles.caption2,
    color: colors.neutral700,
  },
  completeRowValue: {
    ...textStyles.caption3,
    flexShrink: 1,
    color: colors.neutral900,
    textAlign: "right",
  },
  completeActions: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
  },
  completeButton: {
    height: 48,
    flex: 1,
    maxWidth: 155,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
  },
  completeHome: {
    borderWidth: 1.5,
    borderColor: colors.secondary500,
    backgroundColor: colors.white,
  },
  completePrimary: {
    backgroundColor: colors.secondary500,
  },
  completeHomeText: {
    ...textStyles.label2,
    color: colors.secondary500,
  },
  completePrimaryText: {
    ...textStyles.label2,
    color: colors.white,
  },
});

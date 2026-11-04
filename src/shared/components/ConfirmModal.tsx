import type { ReactNode } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { colors, textStyles } from "@/shared/constants/theme";

type ConfirmModalProps = {
  open: boolean;
  tone?: "pink" | "orange";
  title: ReactNode;
  description?: ReactNode;
  cancelLabel?: string;
  confirmLabel?: string;
  confirmDisabled?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  onBackdropPress?: () => void;
};

export function ConfirmModal({
  open,
  tone = "pink",
  title,
  description,
  cancelLabel = "취소",
  confirmLabel = "확인",
  confirmDisabled = false,
  onCancel,
  onConfirm,
  onBackdropPress = onCancel,
}: ConfirmModalProps) {
  const toneColor = tone === "pink" ? colors.primary400 : colors.secondary500;

  return (
    <Modal
      transparent
      statusBarTranslucent
      animationType="fade"
      visible={open}
      onRequestClose={onBackdropPress}
    >
      <Pressable style={styles.overlay} onPress={onBackdropPress}>
        <Pressable accessibilityViewIsModal style={styles.panel}>
          <View style={styles.texts}>
            <Text style={styles.title}>{title}</Text>
            {description ? (
              <Text style={styles.description}>{description}</Text>
            ) : null}
          </View>

          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              style={[styles.button, { borderColor: toneColor }]}
              onPress={onCancel}
            >
              <Text style={[styles.buttonText, { color: toneColor }]}>
                {cancelLabel}
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              disabled={confirmDisabled}
              style={[
                styles.button,
                { backgroundColor: toneColor, borderColor: toneColor },
                confirmDisabled && styles.disabled,
              ]}
              onPress={onConfirm}
            >
              <Text style={[styles.buttonText, styles.confirmText]}>
                {confirmLabel}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(20, 20, 20, 0.8)",
  },
  panel: {
    width: 313,
    maxWidth: "90%",
    alignItems: "center",
    borderRadius: 16,
    backgroundColor: colors.white,
    paddingHorizontal: 32,
    paddingVertical: 24,
  },
  texts: {
    alignItems: "center",
    gap: 10,
  },
  title: {
    ...textStyles.label1,
    color: colors.neutral900,
    textAlign: "center",
  },
  description: {
    ...textStyles.caption1,
    color: colors.neutral600,
    textAlign: "center",
  },
  actions: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginTop: 20,
  },
  button: {
    flex: 1,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    borderWidth: 1.5,
    backgroundColor: colors.white,
  },
  buttonText: {
    ...textStyles.label2,
  },
  confirmText: {
    color: colors.white,
  },
  disabled: {
    opacity: 0.6,
  },
});

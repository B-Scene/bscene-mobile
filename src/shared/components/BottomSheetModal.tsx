import { useEffect, useState, type ReactNode } from "react";
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
  type DimensionValue,
} from "react-native";

type BottomSheetModalProps = {
  open: boolean;
  onClose: () => void;
  closeLabel?: string;
  closeOnBackdrop?: boolean;
  backdropColor?: string;
  maxHeight?: DimensionValue;
  children: ReactNode;
};

// 배경은 제자리에서 페이드되고 패널만 아래에서 올라온다.
// 자식 패널에는 maxHeight 대신 flexShrink: 1을 준다.
export function BottomSheetModal({
  open,
  onClose,
  closeLabel = "닫기",
  closeOnBackdrop = true,
  backdropColor = "rgba(20, 20, 20, 0.5)",
  maxHeight = "95%",
  children,
}: BottomSheetModalProps) {
  const { height } = useWindowDimensions();
  const [rendered, setRendered] = useState(open);
  const [progress] = useState(() => new Animated.Value(0));

  if (open && !rendered) setRendered(true);

  useEffect(() => {
    if (!rendered) return;

    const animation = Animated.timing(progress, {
      toValue: open ? 1 : 0,
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });

    animation.start(({ finished }) => {
      if (finished && !open) setRendered(false);
    });

    return () => animation.stop();
  }, [open, progress, rendered]);

  if (!rendered) return null;

  return (
    <Modal
      visible
      transparent
      statusBarTranslucent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: backdropColor, opacity: progress },
          ]}
        >
          {closeOnBackdrop ? (
            <Pressable
              accessibilityLabel={closeLabel}
              style={styles.fill}
              onPress={onClose}
            />
          ) : null}
        </Animated.View>

        <Animated.View
          style={[
            styles.panel,
            {
              maxHeight,
              transform: [
                {
                  translateY: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [height, 0],
                  }),
                },
              ],
            },
          ]}
        >
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "flex-end",
  },
  fill: {
    flex: 1,
  },
  panel: {
    flexShrink: 1,
  },
});

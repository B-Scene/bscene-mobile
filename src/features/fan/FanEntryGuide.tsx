import * as SecureStore from "expo-secure-store";
import { useEffect, useRef, useState, type ComponentRef, type RefObject } from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  type LayoutChangeEvent,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

import { FanDesignIcon } from "@/features/fan/FanDesignIcon";
import { fanDesignText } from "@/features/fan/fanDesignText";
import { colors } from "@/shared/constants/theme";
import { useAuthStore } from "@/stores/useAuthStore";

type Area = { x: number; y: number; width: number; height: number };
type GuideViewport = Pick<Area, "width" | "height">;
type GuideMeasurement = {
  viewport: GuideViewport;
  steps: (Area | null)[][];
};
export type FanGuideAnchor = RefObject<ComponentRef<typeof View> | null>;

export function useFanGuideAnchor(): FanGuideAnchor {
  return useRef<ComponentRef<typeof View>>(null);
}
type Highlight = {
  anchor: FanGuideAnchor;
  extendAfter?: FanGuideAnchor;
  padding?: number;
  paddingX?: number;
  paddingY?: number;
  radius: number;
  label: string;
  labelPosition: "above" | "below" | "left";
  labelWidth: number;
  trailingInset?: number;
  arrowRatio?: number;
  labelOffsetX?: number;
  labelOffsetY?: number;
  circleIcon?: "search" | "swap" | "calendar";
  exploreArrow?: boolean;
  arrowOffsetY?: number;
  concertArrow?: boolean;
};

const seenGuides = new Set<string>();

export function useFanEntryGuide(screen: "home" | "explore", ready: boolean, preview: boolean) {
  const userId = useAuthStore((state) => state.user?.userId);
  const key = preview ? `preview.${screen}` : userId == null ? null : `bscene.guide.${userId}.${screen}`;
  const [unseenKey, setUnseenKey] = useState<string | null>(null);

  useEffect(() => {
    if (!ready || !key || seenGuides.has(key)) return;

    let active = true;
    const read = async () => {
      const seen = preview
        ? null
        : Platform.OS === "web"
          ? window.localStorage.getItem(key)
          : await SecureStore.getItemAsync(key);

      if (active && !seen && !seenGuides.has(key)) setUnseenKey(key);
    };

    void read().catch(() => {
      if (active && !seenGuides.has(key)) setUnseenKey(key);
    });

    return () => {
      active = false;
    };
  }, [key, preview, ready]);

  const dismiss = () => {
    if (!key) return;
    seenGuides.add(key);
    setUnseenKey(null);
    if (preview) return;

    if (Platform.OS === "web") {
      try {
        window.localStorage.setItem(key, "1");
      } catch {
        // The session still remembers the dismissal.
      }
    } else {
      void SecureStore.setItemAsync(key, "1").catch(() => undefined);
    }
  };

  return { open: ready && key !== null && unseenKey === key, dismiss };
}

function measure(ref: FanGuideAnchor): Promise<Area | null> {
  return new Promise((resolve) => {
    if (!ref.current) {
      resolve(null);
      return;
    }

    ref.current.measureInWindow((x, y, width, height) => {
      resolve(width && height ? { x, y, width, height } : null);
    });
  });
}

function GuideLabel({
  spot,
  area,
  safeLeft,
  safeRight,
  safeBottom,
}: {
  spot: Highlight;
  area: Area;
  safeLeft: number;
  safeRight: number;
  safeBottom: number;
}) {
  const {
    label, labelPosition, labelWidth, arrowRatio = 0.5,
    labelOffsetX = 0, labelOffsetY = 0, arrowOffsetY = 0, exploreArrow,
  } = spot;
  const x = area.x + area.width * arrowRatio;
  const left = Math.max(safeLeft, Math.min(safeRight - labelWidth, x + labelOffsetX - labelWidth / 2));
  const labelLeft = Math.max(safeLeft, area.x - labelWidth - 28);
  const above = labelPosition === "above" || area.y + area.height > safeBottom - 70;

  if (labelPosition === "left") {
    return (
      <>
        <Text
          style={[
            styles.label,
            styles.positionedLabel,
            { left: labelLeft, width: labelWidth, top: area.y + area.height / 2 - 18 + labelOffsetY },
          ]}
        >
          {label}
        </Text>
        <FanDesignIcon
          name="exploreGuideSearchArrow"
          style={[styles.arrow, { left: area.x - 25, top: area.y + area.height / 2 - 7.36395 }]}
        />
      </>
    );
  }

  return (
    <>
      <FanDesignIcon
        name={above ? (spot.concertArrow ? "homeGuideConcertArrow" : "guideDown") : exploreArrow ? "guideArrow" : "guideUp"}
        style={[
          styles.arrow,
          above ? styles.arrowDown : styles.arrowUp,
          {
            left: x - (above || exploreArrow ? 10 : 8.5),
            top: (above ? area.y - 25 : area.y + area.height + (exploreArrow ? 10.63605 : 7)) + arrowOffsetY,
          },
        ]}
      />
      <Text
        style={[
          styles.label,
          styles.positionedLabel,
          { left, width: labelWidth, top: (above ? area.y - 68 : area.y + area.height + 26) + labelOffsetY },
        ]}
      >
        {label}
      </Text>
    </>
  );
}

function roundedCutout({ x, y, width, height }: Area, radius: number) {
  const right = x + width;
  const bottom = y + height;
  const r = Math.min(radius, width / 2, height / 2);
  const corner = `A${r} ${r} 0 0 1`;

  return [
    `M${x + r} ${y} H${right - r} ${corner} ${right} ${y + r}`,
    `V${bottom - r} ${corner} ${right - r} ${bottom}`,
    `H${x + r} ${corner} ${x} ${bottom - r}`,
    `V${y + r} ${corner} ${x + r} ${y} Z`,
  ].join(" ");
}

export function FanEntryGuide({
  steps,
  onClose,
}: {
  steps: readonly (readonly Highlight[])[];
  onClose: () => void;
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const canvas = useFanGuideAnchor();
  const [viewport, setViewport] = useState<GuideViewport | null>(null);
  const [measurement, setMeasurement] = useState<GuideMeasurement | null>(null);
  const { fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const step = steps[stepIndex];
  const hasPages = steps.length > 1;

  const captureViewport = ({ nativeEvent: { layout } }: LayoutChangeEvent) => {
    const { width, height } = layout;
    setViewport((current) =>
      current?.width === width && current.height === height ? current : { width, height },
    );
  };

  useEffect(() => {
    if (!viewport) return;

    let active = true;
    const frame = requestAnimationFrame(async () => {
      const origin = await measure(canvas);
      if (!active) return;

      const measuredSteps = await Promise.all(
        steps.map((targets) => Promise.all(targets.map(async ({
          anchor, extendAfter, padding = 0, paddingX = padding, paddingY = padding,
          trailingInset = 0,
        }) => {
          const [area, previous] = await Promise.all([
            measure(anchor),
            extendAfter ? measure(extendAfter) : null,
          ]);
          if (!area || !origin) return null;

          const left = previous ? previous.x + previous.width : area.x;
          const width = area.x + area.width - left + paddingX * 2 - trailingInset;
          const height = area.height + paddingY * 2;
          if (width <= 0 || height <= 0) return null;

          return {
            x: left - origin.x - paddingX,
            y: area.y - origin.y - paddingY,
            width,
            height,
          };
        }))),
      );

      if (active) setMeasurement({ viewport, steps: measuredSteps });
    });

    return () => {
      active = false;
      cancelAnimationFrame(frame);
    };
  }, [canvas, steps, viewport, fontScale, insets.top, insets.bottom, insets.left, insets.right]);

  const areas = measurement?.viewport === viewport ? measurement?.steps[stepIndex] : undefined;
  const width = viewport?.width ?? 0;
  const height = viewport?.height ?? 0;
  const safeLeft = insets.left + 4;
  const safeRight = width - insets.right - 4;
  const safeBottom = height - insets.bottom;
  const useCompactGuide = areas && (
    safeRight - safeLeft < 352 ||
    fontScale > 1.05 ||
    height < 530 ||
    areas.some((area) => !area || area.y + area.height > safeBottom - 56)
  );

  const firstHeaderSpot = measurement?.steps[0]?.[0];
  const closeTop = Math.max(8, insets.top - 1, (firstHeaderSpot?.y ?? 0) - 16);

  return (
    <Modal
      visible
      transparent
      presentationStyle="overFullScreen"
      statusBarTranslucent
      navigationBarTranslucent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View
        ref={canvas}
        collapsable={false}
        onLayout={captureViewport}
        style={styles.fill}
        accessibilityViewIsModal
      >
        {useCompactGuide ? (
          <View style={[
            styles.compactBackdrop,
            {
              paddingTop: Math.max(16, insets.top),
              paddingBottom: Math.max(16, insets.bottom),
              paddingLeft: insets.left + 16,
              paddingRight: insets.right + 16,
            },
          ]}>
            <View style={styles.compactPanel}>
              <ScrollView style={styles.compactScroll} contentContainerStyle={styles.compactContent}>
                <Text accessibilityRole="header" style={styles.compactTitle}>
                  {hasPages ? `홈 안내 ${stepIndex + 1}/${steps.length}` : "탐색 안내"}
                </Text>
                {step.map(({ label }) => (
                  <Text key={label} style={styles.compactLabel}>{label.replace("\n", " ")}</Text>
                ))}
              </ScrollView>
              <View style={styles.compactActions}>
                {hasPages && stepIndex > 0 ? (
                  <Pressable accessibilityRole="button" style={styles.compactButton} onPress={() => setStepIndex(stepIndex - 1)}>
                    <Text style={styles.compactActionText}>이전</Text>
                  </Pressable>
                ) : null}
                <Pressable accessibilityRole="button" style={styles.compactButton} onPress={onClose}>
                  <Text style={styles.compactActionText}>닫기</Text>
                </Pressable>
                {stepIndex < steps.length - 1 ? (
                  <Pressable accessibilityRole="button" style={styles.compactButton} onPress={() => setStepIndex(stepIndex + 1)}>
                    <Text style={styles.compactActionText}>다음</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          </View>
        ) : areas ? (
          <>
            {!hasPages ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="탐색 안내 닫기"
                style={StyleSheet.absoluteFill}
                onPress={onClose}
              />
            ) : null}
            <View pointerEvents="none" style={StyleSheet.absoluteFill}>
              <Svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
                <Path
                  d={[
                    `M0 0 H${width} V${height} H0 Z`,
                    ...areas.flatMap((area, index) => area ? [roundedCutout(area, step[index].radius)] : []),
                  ].join(" ")}
                  fill={colors.neutral900}
                  fillOpacity={0.8}
                  fillRule="evenodd"
                />
              </Svg>

              {areas.map((area, index) => {
                if (!area) return null;

                const spot = step[index];

                return (
                  <View key={spot.label} style={StyleSheet.absoluteFill} pointerEvents="none">
                    {spot.circleIcon ? (
                      <>
                        <FanDesignIcon
                          name="guideCircleGlow"
                          style={[styles.arrow, { left: area.x - 12, top: area.y - 12 }]}
                        />
                        <FanDesignIcon
                          name={spot.circleIcon}
                          style={[styles.arrow, { left: area.x + 7, top: area.y + 7 }]}
                        />
                      </>
                    ) : (
                      <View
                        style={[
                          styles.glow,
                          { left: area.x, top: area.y, width: area.width, height: area.height, borderRadius: spot.radius },
                        ]}
                      />
                    )}
                    <GuideLabel
                      spot={spot}
                      area={area}
                      safeLeft={safeLeft}
                      safeRight={safeRight}
                      safeBottom={safeBottom}
                    />
                  </View>
                );
              })}
            </View>

            {hasPages ? (
              <>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="홈 안내 닫기"
                  hitSlop={12}
                  style={[styles.close, { top: closeTop, right: 26 + insets.right }]}
                  onPress={onClose}
                >
                  <FanDesignIcon name="guideClose" />
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={stepIndex === 0 ? "다음 안내" : "이전 안내"}
                  hitSlop={12}
                  style={[
                    styles.pageButton,
                    stepIndex === 0
                      ? { right: 22.66665 + insets.right }
                      : { left: 26.66665 + insets.left },
                  ]}
                  onPress={() => setStepIndex(1 - stepIndex)}
                >
                  <FanDesignIcon name={stepIndex === 0 ? "guideNext" : "guidePrevious"} />
                </Pressable>

                <View style={[styles.dots, { bottom: Math.max(height * 0.168, insets.bottom + 16) }]}>
                  {steps.map((_, index) => (
                    <FanDesignIcon key={index} name={stepIndex === index ? "homeGuideDotActive" : "homeGuideDot"} />
                  ))}
                </View>
          </>
        ) : null}
          </>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  glow: {
    position: "absolute",
    boxShadow: "0px 0px 12px rgba(240, 69, 121, 0.8)",
  },
  label: {
    ...fanDesignText.caption3,
    color: colors.white,
    textAlign: "center",
  },
  positionedLabel: { position: "absolute" },
  arrow: { position: "absolute" },
  arrowDown: { transform: [{ rotate: "90deg" }] },
  arrowUp: { transform: [{ rotate: "-90deg" }] },
  close: { position: "absolute", right: 26 },
  pageButton: { position: "absolute", top: "50%", marginTop: -13.33335 },
  compactBackdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(20, 20, 20, 0.8)",
  },
  compactPanel: {
    width: "100%",
    maxWidth: 400,
    maxHeight: "100%",
    flexShrink: 1,
    borderRadius: 20,
    backgroundColor: colors.white,
  },
  compactScroll: { flexGrow: 0, flexShrink: 1 },
  compactContent: { padding: 20, gap: 12 },
  compactTitle: { ...fanDesignText.label1, color: colors.neutral900 },
  compactLabel: { ...fanDesignText.body2, color: colors.neutral700 },
  compactActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-end",
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  compactButton: {
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  compactActionText: { ...fanDesignText.body1, color: colors.primary500 },
  dots: { position: "absolute", alignSelf: "center", flexDirection: "row", gap: 12 },
});

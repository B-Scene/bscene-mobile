import { useEffect, useState } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";

import { colors } from "@/shared/constants/theme";

const WAVE_HEIGHTS = [5, 5, 15, 35, 65, 100, 65, 35, 15, 5, 5];
const BAR_WIDTH = 3;

type WaveTone = "band" | "fan";

const WAVE_COLORS: Record<WaveTone, readonly [string, string, string]> = {
  band: [colors.secondary100, colors.secondary300, colors.secondary500],
  fan: [colors.primary100, colors.primary300, colors.primary400],
};

function WaveBar({
  height,
  index,
  side,
  isActive,
  tone,
}: {
  height: number;
  index: number;
  side: "left" | "right";
  isActive: boolean;
  tone: WaveTone;
}) {
  const [progress] = useState(() => new Animated.Value(0));
  const sideOffset = side === "right" ? 1 : 0;
  const duration = 620 + ((index * 137 + sideOffset * 90) % 480);
  const delay = (index * 113 + sideOffset * 170) % 760;

  useEffect(() => {
    if (!isActive) {
      progress.stopAnimation();
      progress.setValue(0);
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(progress, {
          toValue: 1,
          duration,
          delay,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(progress, {
          toValue: 0,
          duration,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();

    return () => animation.stop();
  }, [delay, duration, isActive, progress]);

  // 웹 live-audio-wave-pulse 키프레임과 동일한 값
  const scaleY = isActive
    ? progress.interpolate({
        inputRange: [0, 0.38, 0.68, 1],
        outputRange: [0.32, 0.82, 0.48, 1.08],
      })
    : 0.45;
  const opacity = isActive
    ? progress.interpolate({
        inputRange: [0, 0.38, 0.68, 1],
        outputRange: [0.62, 0.9, 0.72, 1],
      })
    : 0.55;
  const gradientId = `wave-${tone}-${side}-${index}`;
  const [topColor, middleColor, bottomColor] = WAVE_COLORS[tone];

  return (
    <Animated.View
      style={[styles.bar, { height, opacity, transform: [{ scaleY }] }]}
    >
      <Svg width={BAR_WIDTH} height={height}>
        <Defs>
          <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={topColor} />
            <Stop offset="0.5" stopColor={middleColor} />
            <Stop offset="1" stopColor={bottomColor} />
          </LinearGradient>
        </Defs>
        <Rect
          width={BAR_WIDTH}
          height={height}
          fill={`url(#${gradientId})`}
        />
      </Svg>
    </Animated.View>
  );
}

export function LiveWaveform({
  isActive,
  side,
  tone = "fan",
}: {
  isActive: boolean;
  side: "left" | "right";
  tone?: WaveTone;
}) {
  return (
    <View style={styles.wave}>
      {WAVE_HEIGHTS.map((height, index) => (
        <WaveBar
          key={index}
          height={height}
          index={index}
          side={side}
          isActive={isActive}
          tone={tone}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wave: {
    width: 103,
    height: 100,
    flexShrink: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    overflow: "hidden",
  },
  bar: {
    width: BAR_WIDTH,
    flexShrink: 0,
    overflow: "hidden",
    borderRadius: 999,
  },
});

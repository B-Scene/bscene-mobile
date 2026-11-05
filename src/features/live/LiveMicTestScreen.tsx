import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";
import { useEffect, useRef, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppHeader } from "@/shared/components/AppHeader";
import { AppIcon } from "@/shared/components/AppIcon";
import { colors, textStyles } from "@/shared/constants/theme";

const VOLUME_BAR_COUNT = 28;
const TEST_DURATION_SECONDS = 5;
const METER_INTERVAL_MS = 100;

const VOLUME_BAR_COLORS = [
  colors.secondary0,
  colors.secondary200,
  colors.secondary400,
  colors.secondary500,
];

const RECORDING_OPTIONS = {
  ...RecordingPresets.HIGH_QUALITY,
  isMeteringEnabled: true,
};

const formatSeconds = (seconds: number) =>
  `0:${String(seconds).padStart(2, "0")}`;

// 웹은 RMS * 310으로 레벨을 구한다. 네이티브 미터는 dB라서 RMS로 되돌려 같은 식을 쓴다.
const toVolumeLevel = (metering?: number) => {
  if (metering === undefined) return 0;

  const level = Math.round(10 ** (metering / 20) * 310);

  return level < 2 ? 0 : Math.min(VOLUME_BAR_COUNT, level);
};

export function LiveMicTestScreen({
  onBack,
  onClose,
  onComplete,
}: {
  onBack: () => void;
  onClose: () => void;
  onComplete: () => void;
}) {
  const recorder = useAudioRecorder(RECORDING_OPTIONS);
  const recorderState = useAudioRecorderState(recorder, METER_INTERVAL_MS);
  const [isTesting, setIsTesting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef = useRef(0);
  // 권한 요청 중에 멈춤을 누르면 늦게 시작되지 않도록 시도를 구분한다.
  const attemptRef = useRef(0);

  const volumeLevel = isTesting ? toVolumeLevel(recorderState.metering) : 0;
  const progressPercent = Math.min(
    100,
    (elapsedSeconds / TEST_DURATION_SECONDS) * 100,
  );

  const updateElapsed = (seconds: number) => {
    elapsedRef.current = seconds;
    setElapsedSeconds(seconds);
  };

  const clearTimer = () => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const stopRecording = () => {
    attemptRef.current += 1;
    clearTimer();

    if (recorder.isRecording) {
      void recorder.stop().catch(() => undefined);
    }
  };

  const pauseTest = () => {
    stopRecording();
    setIsTesting(false);
  };

  const finishTest = () => {
    stopRecording();
    setIsTesting(false);
    setIsCompleted(true);
    updateElapsed(TEST_DURATION_SECONDS);
  };

  const startTest = async (reset: boolean) => {
    stopRecording();

    const attempt = attemptRef.current;

    if (reset || elapsedRef.current >= TEST_DURATION_SECONDS) {
      updateElapsed(0);
    }

    setIsTesting(true);
    setIsCompleted(false);
    setErrorMessage("");

    try {
      const permission = await requestRecordingPermissionsAsync();

      if (!permission.granted) {
        throw new Error("permission denied");
      }

      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });
      await recorder.prepareToRecordAsync();

      if (attempt !== attemptRef.current) return;

      recorder.record();

      timerRef.current = setInterval(() => {
        const nextSeconds = Math.min(
          TEST_DURATION_SECONDS,
          elapsedRef.current + 1,
        );

        updateElapsed(nextSeconds);

        if (nextSeconds >= TEST_DURATION_SECONDS) {
          finishTest();
        }
      }, 1000);
    } catch {
      if (attempt !== attemptRef.current) return;

      stopRecording();
      setIsTesting(false);
      setErrorMessage(
        "마이크 권한을 허용해야 테스트할 수 있어요. 설정에서 마이크 권한을 허용해주세요.",
      );
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
      }

      void setAudioModeAsync({ allowsRecording: false }).catch(() => undefined);
    };
  }, []);

  const togglePlayback = () => {
    if (isTesting) {
      pauseTest();
      return;
    }

    void startTest(isCompleted);
  };

  const leave = (action: () => void) => {
    stopRecording();
    action();
  };

  const toggleLabel = isTesting ? "마이크 테스트 멈춤" : "마이크 테스트 시작";

  return (
    <Modal visible animationType="none" onRequestClose={() => leave(onBack)}>
      <SafeAreaView style={styles.safeArea}>
        <AppHeader
          title="마이크 테스트"
          style={styles.header}
          rightContent={
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="닫기"
              hitSlop={12}
              onPress={() => leave(onClose)}
            >
              <AppIcon name="closeHeader" size={28} />
            </Pressable>
          }
          onBack={() => leave(onBack)}
        />

        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.heading}>
            <Text style={styles.title}>마이크 볼륨을 테스트해 보세요</Text>
            <Text style={styles.description}>
              {"마이크 버튼을 누르고,\n아래 레벨이 움직이는지 확인해 주세요"}
            </Text>
          </View>

          <View style={styles.micArea}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={toggleLabel}
              style={({ pressed }) => [
                styles.micButton,
                !isTesting && pressed && styles.micButtonPressed,
              ]}
              onPress={togglePlayback}
            >
              <View
                style={[styles.micCircle, !isTesting && styles.micCircleIdle]}
              />
              <AppIcon name="micTestMic" size={77} />
            </Pressable>

            <Text style={styles.micTime}>
              {isTesting || isCompleted || elapsedSeconds > 0
                ? formatSeconds(elapsedSeconds)
                : ""}
            </Text>
          </View>

          <View style={styles.meterCard}>
            <View style={styles.bars}>
              {Array.from({ length: VOLUME_BAR_COUNT }, (_, index) => {
                const isActive = index < volumeLevel;
                const colorIndex = Math.min(
                  VOLUME_BAR_COLORS.length - 1,
                  Math.floor(
                    (index / VOLUME_BAR_COUNT) * VOLUME_BAR_COLORS.length,
                  ),
                );

                return (
                  <View
                    key={index}
                    style={[
                      styles.bar,
                      isActive && {
                        height:
                          8 +
                          Math.round((index / (VOLUME_BAR_COUNT - 1)) * 26),
                        backgroundColor: VOLUME_BAR_COLORS[colorIndex],
                        boxShadow: `0px 0px 8px 0px ${colors.secondary300}`,
                      },
                    ]}
                  />
                );
              })}
            </View>

            <View style={styles.meterLabels}>
              <Text style={styles.meterLabel}>너무 작아요</Text>
              <Text style={[styles.meterLabel, styles.meterLabelGood]}>적정</Text>
              <Text style={styles.meterLabel}>너무 커요</Text>
            </View>
          </View>

          {errorMessage ? (
            <Text style={styles.error}>{errorMessage}</Text>
          ) : null}

          <View style={styles.playback}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={toggleLabel}
              hitSlop={8}
              onPress={togglePlayback}
            >
              <AppIcon
                name={isTesting ? "liveTestStart" : "liveTestStop"}
                size={24}
              />
            </Pressable>

            <Text style={styles.playbackTime}>
              {formatSeconds(elapsedSeconds)} /{" "}
              {formatSeconds(TEST_DURATION_SECONDS)}
            </Text>

            <View style={styles.progressTrack}>
              <View
                style={[styles.progressFill, { width: `${progressPercent}%` }]}
              />
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            accessibilityRole="button"
            disabled={!isCompleted}
            style={[styles.complete, isCompleted && styles.completeActive]}
            onPress={() => leave(onComplete)}
          >
            <Text
              style={[
                styles.completeText,
                isCompleted && styles.completeTextActive,
              ]}
            >
              테스트 완료
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    paddingLeft: 15,
    paddingRight: 20,
  },
  content: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 46,
    paddingBottom: 24,
  },
  heading: {
    width: "100%",
    maxWidth: 300,
    alignItems: "center",
    gap: 8,
  },
  title: {
    ...textStyles.h4,
    color: colors.neutral900,
    fontWeight: "700",
    textAlign: "center",
  },
  description: {
    ...textStyles.body2,
    color: colors.neutral600,
    lineHeight: 20,
    textAlign: "center",
  },
  micArea: {
    alignItems: "center",
    marginTop: 42,
  },
  micButton: {
    width: 135,
    height: 135,
    alignItems: "center",
    justifyContent: "center",
  },
  micButtonPressed: {
    transform: [{ scale: 0.95 }],
  },
  micCircle: {
    position: "absolute",
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: "#FFFAF0",
    boxShadow: "0px 0px 25px 0px rgba(251, 177, 14, 0.35)",
  },
  micCircleIdle: {
    opacity: 0.8,
  },
  micTime: {
    ...textStyles.caption4,
    height: 16,
    marginTop: 12,
    color: colors.secondary500,
    fontWeight: "700",
  },
  meterCard: {
    width: "100%",
    maxWidth: 335,
    borderRadius: 12,
    backgroundColor: colors.white,
    marginTop: 22,
    paddingHorizontal: 24,
    paddingVertical: 20,
    boxShadow: "0px 4px 15px 0px rgba(20, 20, 20, 0.08)",
  },
  bars: {
    height: 36,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  bar: {
    width: 7,
    height: 8,
    borderRadius: 999,
    backgroundColor: colors.neutral300,
  },
  meterLabels: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
  },
  meterLabel: {
    ...textStyles.caption4,
    color: colors.neutral600,
    fontWeight: "700",
  },
  meterLabelGood: {
    color: colors.secondary500,
  },
  error: {
    ...textStyles.caption2,
    maxWidth: 320,
    marginTop: 16,
    color: colors.error,
    textAlign: "center",
  },
  playback: {
    width: "100%",
    maxWidth: 353,
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    backgroundColor: colors.secondary0,
    marginTop: 24,
    paddingHorizontal: 20,
    boxShadow: "0px 4px 15px 0px rgba(20, 20, 20, 0.04)",
  },
  playbackTime: {
    ...textStyles.caption4,
    marginLeft: 12,
    color: colors.secondary500,
    fontWeight: "700",
  },
  progressTrack: {
    height: 4,
    flex: 1,
    overflow: "hidden",
    borderRadius: 999,
    backgroundColor: colors.neutral300,
    marginLeft: 12,
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: colors.secondary500,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
  },
  complete: {
    width: "100%",
    maxWidth: 353,
    height: 52,
    alignItems: "center",
    alignSelf: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: colors.neutral300,
  },
  completeActive: {
    backgroundColor: colors.secondary500,
  },
  completeText: {
    ...textStyles.label1,
    color: colors.neutral600,
  },
  completeTextActive: {
    color: colors.white,
  },
});

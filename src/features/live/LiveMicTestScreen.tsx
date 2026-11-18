import {
    AudioModule,
    RecordingPresets,
    setAudioModeAsync,
    useAudioRecorder,
    useAudioRecorderState,
} from "expo-audio";
import {
    useEffect,
    useMemo,
    useState,
} from "react";
import {
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { AppHeader } from "@/shared/components/AppHeader";
import { AppIcon } from "@/shared/components/AppIcon";
import { Screen } from "@/shared/components/Screen";
import {
    colors,
    shadows,
    textStyles,
} from "@/shared/constants/theme";

const TEST_DURATION_SECONDS =
  5;

const VOLUME_BAR_COUNT =
  28;

const recorderOptions = {
  ...RecordingPresets.HIGH_QUALITY,
  isMeteringEnabled: true,
};

const formatSeconds = (
  seconds: number,
) =>
  `0:${String(
    seconds,
  ).padStart(
    2,
    "0",
  )}`;

const getVolumeLevel = (
  metering?: number,
) => {
  if (
    typeof metering !==
    "number"
  ) {
    return 0;
  }

  const normalized =
    Math.max(
      0,
      Math.min(
        1,
        (metering + 60) / 60,
      ),
    );

  return Math.round(
    normalized *
      VOLUME_BAR_COUNT,
  );
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
  const recorder =
    useAudioRecorder(
      recorderOptions,
    );

  const recorderState =
    useAudioRecorderState(
      recorder,
      100,
    );

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const elapsedSeconds =
    Math.min(
      TEST_DURATION_SECONDS,
      Math.floor(
        recorderState.durationMillis /
          1000,
      ),
    );

  const volumeLevel =
    useMemo(
      () =>
        recorderState.isRecording
          ? getVolumeLevel(
              recorderState.metering,
            )
          : 0,
      [
        recorderState.isRecording,
        recorderState.metering,
      ],
    );

  const isCompleted =
    !recorderState.isRecording &&
    recorderState.durationMillis >=
      TEST_DURATION_SECONDS * 1000;

  useEffect(() => {
    if (!isCompleted) {
      return;
    }

    void setAudioModeAsync({
      allowsRecording:
        false,
      playsInSilentMode:
        true,
    });
  }, [isCompleted]);

  useEffect(() => {
    return () => {
      const status =
        recorder.getStatus();

      if (
        status.isRecording
      ) {
        void recorder.stop();
      }

      void setAudioModeAsync({
        allowsRecording:
          false,
        playsInSilentMode:
          true,
      });
    };
  }, [recorder]);

  const startTest =
    async () => {
      try {
        setErrorMessage("");

        const permission =
          await AudioModule.requestRecordingPermissionsAsync();

        if (
          !permission.granted
        ) {
          setErrorMessage(
            "마이크 권한을 허용해야 테스트할 수 있어요.",
          );
          return;
        }

        await setAudioModeAsync(
          {
            allowsRecording:
              true,
            playsInSilentMode:
              true,
          },
        );

        await recorder.prepareToRecordAsync();

        recorder.record({
          forDuration:
            TEST_DURATION_SECONDS,
        });
      } catch {
        setErrorMessage(
          "마이크 테스트를 시작하지 못했어요.",
        );

        await setAudioModeAsync(
          {
            allowsRecording:
              false,
            playsInSilentMode:
              true,
          },
        ).catch(
          () => {},
        );
      }
    };

  const stopTest =
    async () => {
      try {
        if (
          recorderState.isRecording
        ) {
          await recorder.stop();
        }
      } finally {
        await setAudioModeAsync(
          {
            allowsRecording:
              false,
            playsInSilentMode:
              true,
          },
        ).catch(
          () => {},
        );
      }
    };

  const toggleTest =
    async () => {
      if (
        recorderState.isRecording
      ) {
        await stopTest();
        return;
      }

      await startTest();
    };

  const leaveScreen =
    async (
      callback: () => void,
    ) => {
      await stopTest();
      callback();
    };

  const rightContent = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="닫기"
      hitSlop={12}
      onPress={() =>
        void leaveScreen(
          onClose,
        )
      }
    >
      <AppIcon
        name="closeHeader"
        size={28}
      />
    </Pressable>
  );

  return (
    <Screen
      scroll={false}
      edges={["top"]}
      contentStyle={
        styles.container
      }
    >
      <AppHeader
        title="마이크 테스트"
        showBack
        rightContent={
          rightContent
        }
        onBack={() =>
          void leaveScreen(
            onBack,
          )
        }
      />

      <View
        style={
          styles.content
        }
      >
        <View
          style={
            styles.descriptionWrap
          }
        >
          <Text
            style={
              styles.title
            }
          >
            마이크 볼륨을 테스트해 보세요
          </Text>

          <Text
            style={
              styles.description
            }
          >
            마이크 버튼을 누르고,{"\n"}
            아래 레벨이 움직이는지 확인해 주세요
          </Text>
        </View>

        <View
          style={
            styles.micSection
          }
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              recorderState.isRecording
                ? "마이크 테스트 멈춤"
                : "마이크 테스트 시작"
            }
            style={[
              styles.micButton,
              recorderState.isRecording &&
                styles.micButtonActive,
            ]}
            onPress={() =>
              void toggleTest()
            }
          >
            <View
              style={
                styles.micInner
              }
            >
              <AppIcon
                name="micBand"
                size={72}
              />
            </View>
          </Pressable>

          <Text
            style={
              styles.timer
            }
          >
            {recorderState.isRecording ||
            isCompleted ||
            recorderState.durationMillis >
              0
              ? formatSeconds(
                  isCompleted
                    ? TEST_DURATION_SECONDS
                    : elapsedSeconds,
                )
              : ""}
          </Text>
        </View>

        <View
          style={
            styles.meterCard
          }
        >
          <View
            style={
              styles.meterBars
            }
          >
            {Array.from({
              length:
                VOLUME_BAR_COUNT,
            }).map(
              (_, index) => {
                const active =
                  index <
                  volumeLevel;

                const height =
                  8 +
                  Math.round(
                    (index /
                      (VOLUME_BAR_COUNT -
                        1)) *
                      26,
                  );

                const backgroundColor =
                  !active
                    ? colors.neutral200
                    : index < 7
                      ? colors.secondary100
                      : index < 14
                        ? colors.secondary200
                        : index < 21
                          ? colors.secondary400
                          : colors.secondary500;

                return (
                  <View
                    key={
                      index
                    }
                    style={[
                      styles.meterBar,
                      {
                        height,
                        backgroundColor,
                      },
                    ]}
                  />
                );
              },
            )}
          </View>

          <Text
            style={
              styles.meterLabel
            }
          >
            {recorderState.isRecording
              ? "목소리를 내서 입력 레벨을 확인해 주세요"
              : isCompleted
                ? "마이크 테스트가 완료됐어요"
                : "테스트를 시작하면 마이크 레벨이 표시돼요"}
          </Text>
        </View>

        {errorMessage ? (
          <Text
            style={
              styles.error
            }
          >
            {errorMessage}
          </Text>
        ) : null}

        <View
          style={
            styles.actions
          }
        >
          <Pressable
            accessibilityRole="button"
            disabled={
              recorderState.isRecording
            }
            style={[
              styles.retryButton,
              recorderState.isRecording &&
                styles.retryButtonDisabled,
            ]}
            onPress={() =>
              void startTest()
            }
          >
            <Text
              style={
                styles.retryText
              }
            >
              {recorderState.isRecording
                ? "테스트 중"
                : isCompleted
                  ? "다시 테스트"
                  : "테스트 시작"}
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            style={
              styles.completeButton
            }
            onPress={() =>
              void leaveScreen(
                onComplete,
              )
            }
          >
            <Text
              style={
                styles.completeText
              }
            >
              확인
            </Text>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: 0,
      paddingVertical: 0,
      backgroundColor:
        colors.white,
    },

    content: {
      flex: 1,
      alignItems: "center",
      paddingHorizontal: 20,
      paddingTop: 46,
      paddingBottom: 28,
    },

    descriptionWrap: {
      width: "100%",
      maxWidth: 320,
      alignItems: "center",
    },

    title: {
      ...textStyles.h4,
      color:
        colors.neutral900,
      textAlign: "center",
    },

    description: {
      ...textStyles.body2,
      color:
        colors.neutral600,
      marginTop: 8,
      textAlign: "center",
    },

    micSection: {
      alignItems: "center",
      marginTop: 42,
    },

    micButton: {
      width: 135,
      height: 135,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 68,
      backgroundColor:
        colors.secondary0,
      boxShadow:
        "0px 0px 22px rgba(251, 177, 14, 0.22)",
    },

    micButtonActive: {
      boxShadow:
        "0px 0px 30px rgba(251, 177, 14, 0.52)",
    },

    micInner: {
      width: 96,
      height: 96,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 48,
      backgroundColor:
        colors.white,
    },

    timer: {
      ...textStyles.caption4,
      minHeight: 16,
      color:
        colors.secondary500,
      marginTop: 12,
    },

    meterCard: {
      ...shadows.card,
      width: "100%",
      maxWidth: 335,
      borderRadius: 12,
      backgroundColor:
        colors.white,
      marginTop: 22,
      paddingHorizontal: 20,
      paddingVertical: 20,
    },

    meterBars: {
      height: 38,
      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent: "space-between",
      gap: 2,
    },

    meterBar: {
      flex: 1,
      maxWidth: 7,
      minWidth: 3,
      borderRadius: 999,
    },

    meterLabel: {
      ...textStyles.caption2,
      color:
        colors.neutral600,
      marginTop: 16,
      textAlign: "center",
    },

    error: {
      ...textStyles.caption2,
      color:
        colors.error,
      marginTop: 16,
      textAlign: "center",
    },

    actions: {
      width: "100%",
      maxWidth: 335,
      gap: 10,
      marginTop: "auto",
    },

    retryButton: {
      height: 44,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor:
        colors.secondary500,
      borderRadius: 10,
      backgroundColor:
        colors.white,
    },

    retryButtonDisabled: {
      opacity: 0.5,
    },

    retryText: {
      ...textStyles.label2,
      color:
        colors.secondary500,
    },

    completeButton: {
      height: 48,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 10,
      backgroundColor:
        colors.secondary500,
    },

    completeText: {
      ...textStyles.label2,
      color:
        colors.white,
    },
  });

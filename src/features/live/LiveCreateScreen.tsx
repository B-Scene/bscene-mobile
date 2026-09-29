import {
  router,
  useLocalSearchParams,
} from "expo-router";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  useCancelLiveReservationMutation,
  useCreateLiveMutation,
  useLiveReservationQuery,
  useUpdateLiveReservationMutation,
} from "@/hooks/api/live/useLive";
import { AppHeader } from "@/shared/components/AppHeader";
import { AppState } from "@/shared/components/AppState";
import { Screen } from "@/shared/components/Screen";
import {
  colors,
  radius,
  spacing,
} from "@/shared/constants/theme";

type LiveCreateMode =
  | "instant"
  | "reserve";

const DATE_PATTERN =
  /^\d{4}-\d{2}-\d{2}$/;

const TIME_PATTERN =
  /^\d{2}:\d{2}$/;

const getTomorrowDateString =
  () => {
    const date =
      new Date();
    date.setDate(
      date.getDate() + 1,
    );

    return formatDateInput(
      date,
    );
  };

const formatDateInput =
  (
    date: Date,
  ) => {
    const year =
      date.getFullYear();
    const month =
      String(
        date.getMonth() + 1,
      ).padStart(
        2,
        "0",
      );
    const day =
      String(
        date.getDate(),
      ).padStart(
        2,
        "0",
      );

    return `${year}-${month}-${day}`;
  };

const formatTimeInput =
  (
    date: Date,
  ) => {
    const hours =
      String(
        date.getHours(),
      ).padStart(
        2,
        "0",
      );
    const minutes =
      String(
        date.getMinutes(),
      ).padStart(
        2,
        "0",
      );

    return `${hours}:${minutes}`;
  };

const splitScheduledAt =
  (
    scheduledAt?:
      | string
      | null,
  ) => {
    if (!scheduledAt) {
      return {
        date:
          getTomorrowDateString(),
        time:
          "20:00",
      };
    }

    const normalizedValue =
      scheduledAt.replace(
        " ",
        "T",
      );
    const date =
      new Date(
        normalizedValue,
      );

    if (
      Number.isNaN(
        date.getTime(),
      )
    ) {
      const [
        dateValue,
        timeValue,
      ] =
        scheduledAt.split(
          /[T ]/,
        );

      return {
        date:
          dateValue ||
          getTomorrowDateString(),
        time:
          timeValue?.slice(
            0,
            5,
          ) ?? "20:00",
      };
    }

    return {
      date:
        formatDateInput(
          date,
        ),
      time:
        formatTimeInput(
          date,
        ),
    };
  };

const toScheduledAt =
  (
    date: string,
    time: string,
  ) => `${date}T${time}:00`;

const isFutureSchedule =
  (
    date: string,
    time: string,
  ) => {
    const scheduledAt =
      new Date(
        toScheduledAt(
          date,
          time,
        ),
      );

    return (
      !Number.isNaN(
        scheduledAt.getTime(),
      ) &&
      scheduledAt.getTime() >
        Date.now()
    );
  };

export function LiveCreateScreen() {
  const params =
    useLocalSearchParams<{
      reservationLiveId?: string;
    }>();
  const reservationLiveId =
    Number(
      params.reservationLiveId,
    );
  const isEdit =
    Number.isFinite(
      reservationLiveId,
    ) &&
    reservationLiveId > 0;

  const [
    mode,
    setMode,
  ] =
    useState<LiveCreateMode>(
      isEdit
        ? "reserve"
        : "instant",
    );
  const [
    title,
    setTitle,
  ] = useState("");
  const [
    description,
    setDescription,
  ] = useState("");
  const [
    reservedDate,
    setReservedDate,
  ] = useState(
    getTomorrowDateString,
  );
  const [
    reservedTime,
    setReservedTime,
  ] = useState("20:00");

  const createMutation =
    useCreateLiveMutation();
  const updateReservationMutation =
    useUpdateLiveReservationMutation();
  const cancelReservationMutation =
    useCancelLiveReservationMutation();
  const reservationQuery =
    useLiveReservationQuery(
      isEdit
        ? reservationLiveId
        : 0,
    );

  useEffect(() => {
    if (
      !reservationQuery.data
    ) {
      return;
    }

    const reservation =
      reservationQuery.data;
    const schedule =
      splitScheduledAt(
        reservation.scheduledAt,
      );

    const timer =
      setTimeout(() => {
        setMode("reserve");
        setTitle(
          reservation.title ?? "",
        );
        setDescription(
          reservation.description ?? "",
        );
        setReservedDate(
          schedule.date,
        );
        setReservedTime(
          schedule.time,
        );
      }, 0);

    return () =>
      clearTimeout(timer);
  }, [
    reservationQuery.data,
  ]);

  const titleText =
    isEdit
      ? "라이브 예약 수정"
      : "라이브 시작";
  const heroTitle =
    isEdit
      ? "예약된 라이브를\n수정할까요?"
      : "라이브 방송을\n시작해볼까요?";
  const heroDescription =
    isEdit
      ? "예약 시간과 라이브 정보를 다시 확인해 주세요"
      : "밴드의 순간을 팬들과 실시간으로 나눠보세요";

  const scheduleError =
    useMemo(() => {
      if (
        mode !== "reserve"
      ) {
        return null;
      }

      if (
        !DATE_PATTERN.test(
          reservedDate,
        )
      ) {
        return "날짜는 YYYY-MM-DD 형식으로 입력해 주세요.";
      }

      if (
        !TIME_PATTERN.test(
          reservedTime,
        )
      ) {
        return "시간은 HH:mm 형식으로 입력해 주세요.";
      }

      if (
        !isFutureSchedule(
          reservedDate,
          reservedTime,
        )
      ) {
        return "현재보다 이후 시간을 선택해 주세요.";
      }

      return null;
    }, [
      mode,
      reservedDate,
      reservedTime,
    ]);

  const isPending =
    createMutation.isPending ||
    updateReservationMutation.isPending ||
    cancelReservationMutation.isPending;
  const canSubmit =
    Boolean(
      title.trim(),
    ) &&
    !scheduleError &&
    !isPending;

  const submit =
    async () => {
      if (
        !title.trim()
      ) {
        Alert.alert(
          "라이브",
          "라이브 제목을 입력해 주세요.",
        );
        return;
      }

      if (scheduleError) {
        Alert.alert(
          "라이브 예약",
          scheduleError,
        );
        return;
      }

      const payload = {
        title:
          title.trim(),
        description:
          description.trim() ||
          null,
        scheduledAt:
          mode === "reserve"
            ? toScheduledAt(
                reservedDate,
                reservedTime,
              )
            : null,
      };

      try {
        if (isEdit) {
          await updateReservationMutation.mutateAsync(
            {
              liveId:
                reservationLiveId,
              body: {
                ...payload,
                scheduledAt:
                  toScheduledAt(
                    reservedDate,
                    reservedTime,
                  ),
              },
            },
          );

          Alert.alert(
            "라이브 예약",
            "예약을 수정했어요.",
          );
          router.replace(
            "/band/live" as Parameters<
              typeof router.replace
            >[0],
          );
          return;
        }

        const result =
          await createMutation.mutateAsync(
            payload,
          );

        if (
          mode === "reserve"
        ) {
          Alert.alert(
            "라이브 예약",
            "라이브 예약이 완료됐어요.",
          );
          router.replace(
            "/band/live" as Parameters<
              typeof router.replace
            >[0],
          );
          return;
        }

        const liveId =
          result.liveId ??
          result.audioStreamId;

        router.replace(
          `/band/live/room/${liveId}` as Parameters<
            typeof router.replace
          >[0],
        );
      } catch {
        Alert.alert(
          "라이브",
          isEdit
            ? "라이브 예약을 수정하지 못했어요."
            : mode === "reserve"
              ? "라이브를 예약하지 못했어요."
              : "라이브를 시작하지 못했어요.",
        );
      }
    };

  const cancelReservation =
    () => {
      if (!isEdit) {
        return;
      }

      Alert.alert(
        "라이브 예약 취소",
        "예약된 라이브를 취소할까요?",
        [
          {
            text: "아니요",
            style: "cancel",
          },
          {
            text: "취소하기",
            style: "destructive",
            onPress: () => {
              void (async () => {
                try {
                  await cancelReservationMutation.mutateAsync(
                    reservationLiveId,
                  );

                  Alert.alert(
                    "라이브 예약",
                    "예약을 취소했어요.",
                  );
                  router.replace(
                    "/band/live" as Parameters<
                      typeof router.replace
                    >[0],
                  );
                } catch {
                  Alert.alert(
                    "라이브 예약",
                    "예약을 취소하지 못했어요.",
                  );
                }
              })();
            },
          },
        ],
      );
    };

  if (
    isEdit &&
    reservationQuery.isLoading
  ) {
    return (
      <Screen
        contentStyle={
          styles.container
        }
      >
        <AppHeader
          title={titleText}
        />
        <AppState
          loading
          title="예약 정보를 불러오는 중이에요"
        />
      </Screen>
    );
  }

  if (
    isEdit &&
    reservationQuery.isError
  ) {
    return (
      <Screen
        contentStyle={
          styles.container
        }
      >
        <AppHeader
          title={titleText}
        />
        <AppState
          title="예약 정보를 불러오지 못했어요"
          actionLabel="다시 시도"
          onAction={() =>
            void reservationQuery.refetch()
          }
        />
      </Screen>
    );
  }

  return (
    <Screen
      contentStyle={
        styles.container
      }
    >
      <AppHeader title={titleText} />

      <View style={styles.hero}>
        <Text style={styles.heroTitle}>
          {heroTitle}
        </Text>
        <Text style={styles.heroDescription}>
          {heroDescription}
        </Text>
      </View>

      <View style={styles.formCard}>
        <Text style={styles.cardTitle}>
          라이브 시간 설정
        </Text>

        <View style={styles.choiceList}>
          {!isEdit ? (
            <ScheduleChoice
              selected={
                mode === "instant"
              }
              title="지금 바로 시작"
              description="입력 완료 후 바로 라이브 룸으로 이동해요"
              onPress={() =>
                setMode("instant")
              }
            />
          ) : null}

          <ScheduleChoice
            selected={
              mode === "reserve"
            }
            title="라이브 예약"
            description="정해둔 시간에 팬들에게 예정 라이브로 보여줘요"
            onPress={() =>
              setMode("reserve")
            }
          />
        </View>

        {mode === "reserve" ? (
          <View style={styles.scheduleFields}>
            <View style={styles.scheduleInputGroup}>
              <Text style={styles.smallLabel}>
                날짜
              </Text>
              <TextInput
                value={reservedDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={
                  colors.neutral500
                }
                style={styles.scheduleInput}
                onChangeText={
                  setReservedDate
                }
              />
            </View>

            <View style={styles.scheduleInputGroup}>
              <Text style={styles.smallLabel}>
                시간
              </Text>
              <TextInput
                value={reservedTime}
                placeholder="HH:mm"
                placeholderTextColor={
                  colors.neutral500
                }
                style={styles.scheduleInput}
                onChangeText={
                  setReservedTime
                }
              />
            </View>

            {scheduleError ? (
              <Text style={styles.errorText}>
                {scheduleError}
              </Text>
            ) : (
              <Text style={styles.helperText}>
                예약 시간은 현재보다 이후여야 해요.
              </Text>
            )}
          </View>
        ) : null}
      </View>

      <View style={styles.formCard}>
        <Text style={styles.cardTitle}>
          라이브 정보
        </Text>

        <View style={styles.fields}>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>
              라이브 제목
              <Text style={styles.required}>
                {" "}*
              </Text>
            </Text>

            <TextInput
              value={title}
              maxLength={50}
              placeholder="라이브 제목을 입력해주세요"
              placeholderTextColor={
                colors.neutral500
              }
              style={styles.input}
              onChangeText={
                setTitle
              }
            />
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>
              라이브 소개
            </Text>

            <TextInput
              value={
                description
              }
              multiline
              maxLength={100}
              textAlignVertical="top"
              placeholder="라이브에 대해 소개해주세요 (선택)"
              placeholderTextColor={
                colors.neutral500
              }
              style={
                styles.textArea
              }
              onChangeText={
                setDescription
              }
            />
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <Pressable
          accessibilityRole="button"
          disabled={!canSubmit}
          style={({ pressed }) => [
            styles.submitButton,
            !canSubmit
              ? styles.submitButtonDisabled
              : null,
            pressed && canSubmit
              ? styles.submitButtonPressed
              : null,
          ]}
          onPress={() =>
            void submit()
          }
        >
          <Text style={styles.submitButtonText}>
            {isPending
              ? "저장 중..."
              : isEdit
                ? "예약 수정"
                : mode === "reserve"
                  ? "라이브 예약"
                  : "라이브 시작"}
          </Text>
        </Pressable>

        {isEdit ? (
          <Pressable
            accessibilityRole="button"
            disabled={isPending}
            style={({ pressed }) => [
              styles.cancelButton,
              pressed && !isPending
                ? styles.submitButtonPressed
                : null,
            ]}
            onPress={
              cancelReservation
            }
          >
            <Text style={styles.cancelButtonText}>
              예약 취소
            </Text>
          </Pressable>
        ) : null}
      </View>
    </Screen>
  );
}

function ScheduleChoice({
  selected,
  title,
  description,
  onPress,
}: {
  selected: boolean;
  title: string;
  description: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.choiceCard,
        selected
          ? styles.choiceCardSelected
          : null,
        pressed
          ? styles.submitButtonPressed
          : null,
      ]}
      onPress={onPress}
    >
      <View
        style={[
          styles.radio,
          selected
            ? styles.radioSelected
            : null,
        ]}
      />
      <View style={styles.choiceTextWrap}>
        <Text
          style={[
            styles.choiceTitle,
            selected
              ? styles.choiceTitleSelected
              : null,
          ]}
        >
          {title}
        </Text>
        <Text style={styles.choiceDescription}>
          {description}
        </Text>
      </View>
    </Pressable>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flexGrow: 1,
      gap: spacing.lg,
      backgroundColor:
        colors.neutral100,
    },

    hero: {
      gap: spacing.sm,
      paddingTop:
        spacing.sm,
      paddingBottom:
        spacing.sm,
    },

    heroTitle: {
      color:
        colors.neutral900,
      fontSize: 28,
      lineHeight: 38,
      fontWeight: "800",
      letterSpacing: 0,
    },

    heroDescription: {
      color:
        colors.neutral600,
      fontSize: 15,
      lineHeight: 20,
      fontWeight: "500",
      letterSpacing: 0,
    },

    formCard: {
      gap: spacing.lg,
      borderRadius: 14,
      backgroundColor:
        colors.white,
      paddingHorizontal: 18,
      paddingVertical:
        spacing.md,
      shadowColor:
        colors.neutral900,
      shadowOpacity: 0.08,
      shadowRadius: 15,
      shadowOffset: {
        width: 0,
        height: 4,
      },
      elevation: 3,
    },

    cardTitle: {
      color:
        colors.neutral900,
      fontSize: 16,
      lineHeight: 22,
      fontWeight: "700",
      letterSpacing: 0,
    },

    choiceList: {
      gap: spacing.sm,
    },

    choiceCard: {
      minHeight: 66,
      flexDirection: "row",
      alignItems: "flex-start",
      gap: spacing.md,
      borderWidth: 1,
      borderColor:
        colors.neutral300,
      borderRadius:
        radius.sm,
      backgroundColor:
        colors.white,
      paddingHorizontal:
        spacing.md,
      paddingVertical:
        spacing.md,
    },

    choiceCardSelected: {
      borderColor:
        colors.secondary500,
      backgroundColor:
        colors.secondary0,
    },

    radio: {
      width: 12,
      height: 12,
      marginTop: 2,
      borderWidth: 1,
      borderColor:
        colors.neutral400,
      borderRadius:
        radius.pill,
      backgroundColor:
        colors.white,
    },

    radioSelected: {
      borderColor:
        colors.secondary500,
      backgroundColor:
        colors.secondary500,
    },

    choiceTextWrap: {
      flex: 1,
      minWidth: 0,
    },

    choiceTitle: {
      color:
        colors.neutral700,
      fontSize: 13,
      lineHeight: 18,
      fontWeight: "700",
      letterSpacing: 0,
    },

    choiceTitleSelected: {
      color:
        colors.neutral900,
    },

    choiceDescription: {
      marginTop: 2,
      color:
        colors.neutral500,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "500",
      letterSpacing: 0,
    },

    scheduleFields: {
      gap: spacing.sm,
    },

    scheduleInputGroup: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
    },

    smallLabel: {
      width: 44,
      color:
        colors.neutral900,
      fontSize: 13,
      lineHeight: 18,
      fontWeight: "700",
      letterSpacing: 0,
    },

    scheduleInput: {
      height: 38,
      flex: 1,
      borderWidth: 1,
      borderColor:
        colors.neutral300,
      borderRadius: 6,
      backgroundColor:
        colors.white,
      paddingHorizontal:
        spacing.md,
      color:
        colors.neutral900,
      fontSize: 13,
      lineHeight: 18,
      fontWeight: "500",
      letterSpacing: 0,
    },

    helperText: {
      color:
        colors.neutral500,
      fontSize: 12,
      lineHeight: 18,
      fontWeight: "500",
      letterSpacing: 0,
    },

    errorText: {
      color:
        colors.error,
      fontSize: 12,
      lineHeight: 18,
      fontWeight: "600",
      letterSpacing: 0,
    },

    fields: {
      gap: spacing.lg,
    },

    fieldRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: spacing.sm,
    },

    fieldLabel: {
      width: 76,
      paddingTop: 5,
      color:
        colors.neutral900,
      fontSize: 13,
      lineHeight: 18,
      fontWeight: "700",
      letterSpacing: 0,
    },

    required: {
      color:
        colors.error,
    },

    input: {
      height: 32,
      flex: 1,
      minWidth: 0,
      borderWidth: 1,
      borderColor:
        colors.neutral300,
      borderRadius: 4,
      backgroundColor:
        colors.white,
      paddingHorizontal:
        spacing.lg,
      color:
        colors.neutral900,
      fontSize: 13,
      lineHeight: 18,
      fontWeight: "500",
      letterSpacing: 0,
    },

    textArea: {
      minHeight: 64,
      flex: 1,
      minWidth: 0,
      borderWidth: 1,
      borderColor:
        colors.neutral300,
      borderRadius: 4,
      backgroundColor:
        colors.white,
      paddingHorizontal:
        spacing.lg,
      paddingVertical:
        spacing.sm,
      color:
        colors.neutral900,
      fontSize: 13,
      lineHeight: 18,
      fontWeight: "500",
      letterSpacing: 0,
    },

    footer: {
      marginTop: "auto",
      gap: spacing.sm,
      paddingTop:
        spacing.md,
    },

    submitButton: {
      height: 52,
      alignItems: "center",
      justifyContent: "center",
      borderRadius:
        radius.md,
      backgroundColor:
        colors.secondary500,
    },

    submitButtonDisabled: {
      backgroundColor:
        colors.neutral400,
    },

    submitButtonPressed: {
      opacity: 0.84,
    },

    submitButtonText: {
      color:
        colors.white,
      fontSize: 16,
      lineHeight: 22,
      fontWeight: "800",
      letterSpacing: 0,
    },

    cancelButton: {
      height: 48,
      alignItems: "center",
      justifyContent: "center",
      borderRadius:
        radius.md,
      borderWidth: 1,
      borderColor:
        colors.error,
      backgroundColor:
        colors.white,
    },

    cancelButtonText: {
      color:
        colors.error,
      fontSize: 15,
      lineHeight: 20,
      fontWeight: "800",
      letterSpacing: 0,
    },
  });

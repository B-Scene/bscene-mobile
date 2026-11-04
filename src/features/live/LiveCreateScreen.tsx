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

import type {
  BandMemberItem,
} from "@/api/band/bandManagement";
import { LiveCoHostSelector } from "@/features/live/LiveCoHostSelector";
import { useBandMembersQuery } from "@/hooks/api/band/useBandManagement";
import {
  useCancelLiveReservationMutation,
  useCreateLiveMutation,
  useLiveReservationQuery,
  useUpdateLiveReservationMutation,
} from "@/hooks/api/live/useLive";
import { useActiveBandId } from "@/hooks/api/user/useMyProfiles";
import { AppHeader } from "@/shared/components/AppHeader";
import { AppIcon } from "@/shared/components/AppIcon";
import { AppState } from "@/shared/components/AppState";
import { ConfirmModal } from "@/shared/components/ConfirmModal";
import { Screen } from "@/shared/components/Screen";
import {
  colors,
  radius,
  textStyles,
} from "@/shared/constants/theme";
import { useAuthStore } from "@/stores/useAuthStore";
import type {
  LiveReservationCoHostCandidate,
} from "@/types/live/live";

type LiveCreateMode =
  | "instant"
  | "reserve";

const DATE_PATTERN =
  /^\d{4}-\d{2}-\d{2}$/;

const TIME_PATTERN =
  /^\d{2}:\d{2}$/;

const INACTIVE_MEMBER_STATUSES =
  new Set([
    "PENDING",
    "INVITED",
    "WAITING",
    "REJECTED",
    "REMOVED",
    "DELETED",
    "WITHDRAWN",
    "CANCELED",
    "CANCELLED",
  ]);

const toCoHostCandidate = (
  member: BandMemberItem,
  currentUserId:
    | number
    | null,
): LiveReservationCoHostCandidate | null => {
  if (
    !member.id ||
    !member.userId ||
    !member.bandMemberProfileId ||
    !member.profileNickname ||
    INACTIVE_MEMBER_STATUSES.has(
      member.status?.toUpperCase(),
    )
  ) {
    return null;
  }

  return {
    bandMemberId:
      member.id,
    bandMemberProfileId:
      member.bandMemberProfileId,
    bandMemberProfileImageUrl:
      null,
    nickname:
      member.profileNickname,
    part:
      member.part ??
      member.memberType,
    status:
      member.userId ===
      currentUserId
        ? "OWNER"
        : null,
    userId:
      member.userId,
  };
};

const getInitialCoHostIds = (
  candidates:
    LiveReservationCoHostCandidate[],
) =>
  candidates
    .filter(
      (candidate) =>
        candidate.status ===
          "APPROVED" ||
        candidate.status ===
          "INVITED",
    )
    .map(
      (candidate) =>
        candidate.bandMemberId,
    );

const isSameIds = (
  left: number[],
  right: number[],
) =>
  [...left]
    .sort((a, b) => a - b)
    .join() ===
  [...right]
    .sort((a, b) => a - b)
    .join();

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
  const [
    selectedCoHostIds,
    setSelectedCoHostIds,
  ] = useState<number[]>([]);
  const [
    initialCoHostIds,
    setInitialCoHostIds,
  ] = useState<number[]>([]);

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

  const currentUserId =
    useAuthStore(
      (state) =>
        state.user?.userId ??
        null,
    );
  const activeBandQuery =
    useActiveBandId();
  const bandMembersQuery =
    useBandMembersQuery(
      activeBandQuery.activeBandId,
    );

  const coHostCandidates =
    useMemo(() => {
      if (isEdit) {
        return (
          reservationQuery.data
            ?.cohostCandidates ?? []
        );
      }

      return (
        bandMembersQuery.data ?? []
      )
        .map((member) =>
          toCoHostCandidate(
            member,
            currentUserId,
          ),
        )
        .filter(
          (
            candidate,
          ): candidate is LiveReservationCoHostCandidate =>
            Boolean(candidate),
        );
    }, [
      bandMembersQuery.data,
      currentUserId,
      isEdit,
      reservationQuery.data,
    ]);

  const coHostErrorMessage =
    !isEdit &&
    !activeBandQuery.isLoading &&
    !activeBandQuery.activeBandId
      ? "현재 선택된 밴드 정보를 찾을 수 없어요."
      : !isEdit &&
          bandMembersQuery.isError
        ? "공동 진행 후보를 불러오지 못했어요."
        : "";

  const getSubmitCoHostIds =
    () =>
      selectedCoHostIds.flatMap(
        (bandMemberId) => {
          const candidate =
            coHostCandidates.find(
              (item) =>
                item.bandMemberId ===
                bandMemberId,
            );

          return candidate &&
            candidate.status !==
              "OWNER"
            ? [
                candidate.userId ??
                  bandMembersQuery.data?.find(
                    (member) =>
                      member.id ===
                      bandMemberId,
                  )?.userId ??
                  candidate.bandMemberProfileId,
              ]
            : [];
        },
      );

  const toggleCoHost =
    (bandMemberId: number) => {
      setSelectedCoHostIds(
        (previous) =>
          previous.includes(
            bandMemberId,
          )
            ? previous.filter(
                (id) =>
                  id !==
                  bandMemberId,
              )
            : [
                ...previous,
                bandMemberId,
              ],
      );
    };

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

        const coHostIds =
          getInitialCoHostIds(
            reservation.cohostCandidates ??
              [],
          );

        setSelectedCoHostIds(
          coHostIds,
        );
        setInitialCoHostIds(
          coHostIds,
        );
      }, 0);

    return () =>
      clearTimeout(timer);
  }, [
    reservationQuery.data,
  ]);

  const [
    isCancelConfirmOpen,
    setIsCancelConfirmOpen,
  ] = useState(false);

  const closeButton = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="닫기"
      hitSlop={12}
      onPress={() => router.back()}
    >
      <AppIcon name="closeHeader" size={28} />
    </Pressable>
  );

  const titleText =
    isEdit
      ? "라이브 예약 수정"
      : "라이브 시작";
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
                thumbnailImageUrl:
                  reservationQuery.data
                    ?.thumbnailImageUrl ??
                  null,
                coHost:
                  isSameIds(
                    selectedCoHostIds,
                    initialCoHostIds,
                  )
                    ? null
                    : getSubmitCoHostIds(),
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
            {
              ...payload,
              coHost:
                getSubmitCoHostIds(),
            },
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
    async () => {
      if (!isEdit) {
        return;
      }

      setIsCancelConfirmOpen(false);

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
      edges={["top"]}
      contentStyle={
        styles.container
      }
    >
      <AppHeader
        title={titleText}
        rightContent={closeButton}
        style={styles.header}
      />

      <View style={styles.content}>
        {!isEdit ? (
          <View style={styles.formCard}>
            <Text style={styles.cardTitle}>
              라이브 시간 설정
            </Text>

            <View style={styles.choiceList}>
              <ScheduleChoice
                selected={
                  mode === "instant"
                }
                title="지금 바로 시작"
                description="즉시 라이브를 시작합니다"
                onPress={() =>
                  setMode("instant")
                }
              />

              <ScheduleChoice
                selected={
                  mode === "reserve"
                }
                title="예약 설정"
                description={"원하는 시간에\n라이브를 시작합니다"}
                onPress={() =>
                  setMode("reserve")
                }
              />
            </View>
          </View>
        ) : null}

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
                  colors.neutral400
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
                  colors.neutral400
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

        {mode === "reserve" ? (
          <View style={styles.formCard}>
            <Text style={styles.cardTitle}>
              예약 일시 설정
            </Text>

            <View style={styles.scheduleBox}>
              <View style={styles.scheduleRow}>
                <AppIcon name="calendarDark" />
                <Text style={styles.scheduleLabel}>
                  날짜 선택
                </Text>
                <TextInput
                  value={reservedDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={
                    colors.neutral400
                  }
                  style={styles.scheduleInput}
                  onChangeText={
                    setReservedDate
                  }
                />
              </View>

              <View style={styles.scheduleDivider} />

              <View style={styles.scheduleRow}>
                <AppIcon name="clockDark" />
                <Text style={styles.scheduleLabel}>
                  시작 시간
                </Text>
                <TextInput
                  value={reservedTime}
                  placeholder="HH:mm"
                  placeholderTextColor={
                    colors.neutral400
                  }
                  style={styles.scheduleInput}
                  onChangeText={
                    setReservedTime
                  }
                />
              </View>
            </View>

            {scheduleError ? (
              <Text style={styles.errorText}>
                {scheduleError}
              </Text>
            ) : null}
          </View>
        ) : null}

        <LiveCoHostSelector
          candidates={
            coHostCandidates
          }
          selectedIds={
            selectedCoHostIds
          }
          isLoading={
            !isEdit &&
            (activeBandQuery.isLoading ||
              bandMembersQuery.isLoading)
          }
          errorMessage={
            coHostErrorMessage
          }
          onToggle={toggleCoHost}
        />

        <View
          style={[
            styles.footer,
            isEdit && styles.footerRow,
          ]}
        >
          <Pressable
            accessibilityRole="button"
            disabled={!canSubmit}
            style={[
              styles.submitButton,
              isEdit && styles.footerRowButton,
              !canSubmit && styles.buttonDisabled,
            ]}
            onPress={() =>
              void submit()
            }
          >
            <Text
              style={
                mode === "reserve"
                  ? styles.submitReserveText
                  : styles.submitButtonText
              }
            >
              {isPending
                ? "저장 중"
                : mode === "reserve"
                  ? "저장"
                  : "라이브 시작하기"}
            </Text>
          </Pressable>

          {isEdit ? (
            <Pressable
              accessibilityRole="button"
              disabled={isPending}
              style={[
                styles.cancelButton,
                isPending && styles.buttonDisabled,
              ]}
              onPress={() =>
                setIsCancelConfirmOpen(
                  true,
                )
              }
            >
              <Text style={styles.cancelButtonText}>
                예약 취소
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      <ConfirmModal
        open={isCancelConfirmOpen}
        tone="orange"
        title="예약을 취소할까요?"
        description={"취소된 라이브 예약은\n복구할 수 없어요"}
        onCancel={() =>
          setIsCancelConfirmOpen(
            false,
          )
        }
        onConfirm={() =>
          void cancelReservation()
        }
      />
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
      >
        {selected ? (
          <View style={styles.radioDot} />
        ) : null}
      </View>
      <View style={styles.choiceTextWrap}>
        <Text style={styles.choiceTitle}>
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
      paddingHorizontal: 0,
      paddingVertical: 0,
      backgroundColor:
        colors.secondary0,
    },

    header: {
      paddingHorizontal: 20,
    },

    content: {
      flexGrow: 1,
      gap: 12,
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 24,
    },

    formCard: {
      gap: 16,
      borderRadius: 14,
      backgroundColor:
        colors.white,
      paddingHorizontal: 18,
      paddingVertical: 12,
      boxShadow:
        "0px 4px 15px 0px rgba(20, 20, 20, 0.08)",
    },

    cardTitle: {
      ...textStyles.body1,
      color:
        colors.neutral900,
    },

    choiceList: {
      flexDirection: "row",
      gap: 20,
    },

    choiceCard: {
      flex: 1,
      height: 66,
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
      borderWidth: 1,
      borderColor:
        colors.neutral300,
      borderRadius:
        radius.sm,
      backgroundColor:
        colors.white,
      paddingHorizontal: 12,
      paddingVertical: 12,
    },

    submitButtonPressed: {
      opacity: 0.84,
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
      alignItems: "center",
      justifyContent: "center",
      marginTop: 2,
      borderWidth: 1,
      borderColor:
        colors.neutral300,
      borderRadius:
        radius.pill,
      backgroundColor:
        colors.white,
    },

    radioSelected: {
      borderColor:
        colors.secondary500,
      backgroundColor:
        colors.secondary0,
    },

    radioDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor:
        colors.secondary500,
    },

    choiceTextWrap: {
      flex: 1,
      minWidth: 0,
    },

    choiceTitle: {
      ...textStyles.caption3,
      color:
        colors.neutral900,
    },

    choiceDescription: {
      ...textStyles.caption4,
      color:
        colors.neutral500,
      lineHeight: 12,
      marginTop: 2,
    },

    scheduleBox: {
      borderWidth: 1,
      borderColor:
        colors.neutral300,
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },

    scheduleRow: {
      height: 36,
      flexDirection: "row",
      alignItems: "center",
      gap: 16,
    },

    scheduleLabel: {
      ...textStyles.caption2,
      color:
        colors.neutral500,
    },

    scheduleInput: {
      ...textStyles.body2,
      flex: 1,
      minWidth: 0,
      color:
        colors.neutral900,
      paddingVertical: 0,
      textAlign: "right",
    },

    scheduleDivider: {
      height: 1,
      backgroundColor:
        colors.neutral300,
      marginVertical: 8,
    },

    errorText: {
      ...textStyles.caption2,
      color:
        colors.error,
      textAlign: "center",
    },

    fields: {
      gap: 16,
    },

    fieldRow: {
      flexDirection: "row",
      alignItems: "flex-start",
    },

    fieldLabel: {
      ...textStyles.caption3,
      width: 76,
      paddingTop: 4,
      color:
        colors.neutral900,
    },

    required: {
      color:
        colors.error,
    },

    input: {
      ...textStyles.caption2,
      height: 28,
      flex: 1,
      minWidth: 0,
      borderWidth: 1,
      borderColor:
        colors.neutral300,
      borderRadius: 4,
      backgroundColor:
        colors.white,
      color:
        colors.neutral900,
      paddingHorizontal: 16,
      paddingVertical: 0,
    },

    textArea: {
      ...textStyles.caption2,
      height: 56,
      flex: 1,
      minWidth: 0,
      borderWidth: 1,
      borderColor:
        colors.neutral300,
      borderRadius: 4,
      backgroundColor:
        colors.white,
      color:
        colors.neutral900,
      paddingHorizontal: 16,
      paddingVertical: 4,
    },

    footer: {
      marginTop: 16,
    },

    footerRow: {
      flexDirection: "row",
      gap: 20,
    },

    footerRowButton: {
      flex: 1,
      height: 48,
    },

    submitButton: {
      height: 52,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 10,
      backgroundColor:
        colors.secondary500,
    },

    buttonDisabled: {
      opacity: 0.6,
    },

    submitButtonText: {
      ...textStyles.label1,
      color:
        colors.white,
    },

    submitReserveText: {
      ...textStyles.label2,
      color:
        colors.white,
    },

    cancelButton: {
      flex: 1,
      height: 48,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 10,
      borderWidth: 1,
      borderColor:
        colors.secondary500,
      backgroundColor:
        colors.white,
    },

    cancelButtonText: {
      ...textStyles.label2,
      color:
        colors.secondary500,
    },
  });

import * as ImagePicker from "expo-image-picker";
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
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import type {
  BandMemberItem,
} from "@/api/band/bandManagement";
import { uploadMediaAsset } from "@/api/media/media";
import {
  DatePickerSheet,
  TimePickerSheet,
} from "@/features/band/BandDateTimeSheets";
import { LiveCoHostSelector } from "@/features/live/LiveCoHostSelector";
import { LiveMicTestScreen } from "@/features/live/LiveMicTestScreen";
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
import { ConfirmModal } from "@/shared/components/ConfirmModal";
import { Screen } from "@/shared/components/Screen";
import {
  colors,
  radius,
  textStyles,
} from "@/shared/constants/theme";
import { getApiErrorMessage } from "@/shared/utils/getApiErrorMessage";
import { useAuthStore } from "@/stores/useAuthStore";
import type {
  LiveReservationCoHostCandidate,
  LiveReservationResponse,
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

type ThumbnailAsset = {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
};

const getReservationThumbnailUrl = (
  reservation?: LiveReservationResponse,
) =>
  reservation?.thumbnailImageUrl ||
  reservation?.thumbnailUrl ||
  reservation?.liveThumbnailImageUrl ||
  reservation?.liveThumbnailUrl ||
  "";

const formatDateLabel = (
  dateValue: string,
) => {
  if (!dateValue) {
    return "날짜 선택";
  }

  const [
    year,
    month,
    day,
  ] = dateValue
    .split("-")
    .map(Number);

  if (
    !year ||
    !month ||
    !day
  ) {
    return dateValue;
  }

  const weekDay = [
    "일",
    "월",
    "화",
    "수",
    "목",
    "금",
    "토",
  ][
    new Date(
      year,
      month - 1,
      day,
    ).getDay()
  ];

  return `${year}.${String(month).padStart(2, "0")}.${String(day).padStart(2, "0")}. (${weekDay})`;
};

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
  const [
    thumbnail,
    setThumbnail,
  ] = useState<ThumbnailAsset | null>(
    null,
  );
  const [
    isUploadingThumbnail,
    setIsUploadingThumbnail,
  ] = useState(false);
  const [
    isDatePickerOpen,
    setIsDatePickerOpen,
  ] = useState(false);
  const [
    isTimePickerOpen,
    setIsTimePickerOpen,
  ] = useState(false);
  const [
    isMicTestOpen,
    setIsMicTestOpen,
  ] = useState(false);
  const [
    isLeaveConfirmOpen,
    setIsLeaveConfirmOpen,
  ] = useState(false);
  const [
    submitErrorMessage,
    setSubmitErrorMessage,
  ] = useState("");

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

  const isReservationMode =
    mode === "reserve";

  const requestLeave =
    () => {
      if (isReservationMode) {
        setIsLeaveConfirmOpen(true);
        return;
      }

      router.back();
    };

  const pickThumbnail =
    async () => {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "사진 접근 권한",
          "썸네일을 선택하려면 사진 접근 권한이 필요해요.",
        );
        return;
      }

      const result =
        await ImagePicker.launchImageLibraryAsync(
          {
            mediaTypes: ["images"],
            quality: 0.85,
          },
        );
      const asset =
        result.assets?.[0];

      if (
        result.canceled ||
        !asset
      ) {
        return;
      }

      setThumbnail({
        uri: asset.uri,
        fileName: asset.fileName,
        mimeType: asset.mimeType,
      });
    };

  const savedThumbnailUrl =
    getReservationThumbnailUrl(
      reservationQuery.data,
    );
  const thumbnailPreviewUrl =
    thumbnail?.uri ||
    savedThumbnailUrl;

  const uploadThumbnailIfNeeded =
    async () => {
      if (!thumbnail) {
        return savedThumbnailUrl;
      }

      setIsUploadingThumbnail(true);

      try {
        return await uploadMediaAsset(
          {
            category:
              "STREAM_THUMBNAIL",
            uri: thumbnail.uri,
            fileName:
              thumbnail.fileName,
            mimeType:
              thumbnail.mimeType,
          },
        );
      } finally {
        setIsUploadingThumbnail(false);
      }
    };

  const closeButton = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="닫기"
      hitSlop={12}
      onPress={requestLeave}
    >
      <AppIcon name="closeHeader" size={28} />
    </Pressable>
  );

  const titleText =
    isReservationMode
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

  const isReservationLoading =
    isEdit &&
    reservationQuery.isLoading;
  const isPending =
    isUploadingThumbnail ||
    isReservationLoading ||
    createMutation.isPending ||
    updateReservationMutation.isPending ||
    cancelReservationMutation.isPending;
  const errorMessage =
    submitErrorMessage ||
    (isEdit &&
    reservationQuery.isError
      ? "라이브 예약 정보를 불러오지 못했어요."
      : "");

  const submitLabel =
    (() => {
      if (isReservationLoading) {
        return "불러오는 중";
      }

      if (isUploadingThumbnail) {
        return "이미지 업로드 중";
      }

      if (
        cancelReservationMutation.isPending
      ) {
        return "취소 중";
      }

      if (
        createMutation.isPending ||
        updateReservationMutation.isPending
      ) {
        return isReservationMode
          ? "저장 중"
          : "라이브 준비 중";
      }

      return isReservationMode
        ? "저장"
        : "라이브 시작하기";
    })();

  const submit =
    async () => {
      setSubmitErrorMessage("");

      if (
        !title.trim()
      ) {
        setSubmitErrorMessage(
          "라이브 제목을 입력해주세요.",
        );
        return;
      }

      if (scheduleError) {
        return;
      }

      try {
        const thumbnailImageUrl =
          await uploadThumbnailIfNeeded();

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
                  thumbnailImageUrl ||
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
              thumbnailImageUrl:
                thumbnailImageUrl ||
                undefined,
              coHost:
                getSubmitCoHostIds(),
            },
          );

        if (
          mode === "reserve"
        ) {
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
      } catch (error) {
        setSubmitErrorMessage(
          getApiErrorMessage(
            error,
            isEdit
              ? "라이브 예약 수정에 실패했어요. 잠시 후 다시 시도해주세요."
              : "라이브 생성에 실패했어요. 잠시 후 다시 시도해주세요.",
          ),
        );
      }
    };

  const cancelReservation =
    async () => {
      if (!isEdit) {
        setIsCancelConfirmOpen(false);
        router.back();
        return;
      }

      setSubmitErrorMessage("");

      try {
        await cancelReservationMutation.mutateAsync(
          reservationLiveId,
        );

        setIsCancelConfirmOpen(false);
        router.replace(
          "/band/live" as Parameters<
            typeof router.replace
          >[0],
        );
      } catch (error) {
        setIsCancelConfirmOpen(false);
        setSubmitErrorMessage(
          getApiErrorMessage(
            error,
            "라이브 예약 취소에 실패했어요. 잠시 후 다시 시도해주세요.",
          ),
        );
      }
    };

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
        onBack={requestLeave}
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

            <View style={styles.thumbnailRow}>
              <Text style={styles.thumbnailLabel}>
                썸네일 이미지
              </Text>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="썸네일 이미지 추가"
                style={styles.thumbnailBox}
                onPress={() =>
                  void pickThumbnail()
                }
              >
                {thumbnailPreviewUrl ? (
                  <Image
                    source={{
                      uri: thumbnailPreviewUrl,
                    }}
                    style={styles.thumbnailImage}
                  />
                ) : (
                  <AppIcon
                    name="formAddImage"
                    size={24}
                  />
                )}
              </Pressable>

              <Text style={styles.thumbnailHint}>
                {"라이브를 대표할 이미지에요.\n"}
                <Text style={styles.thumbnailHintSize}>
                  권장 사이즈 16:9 (1280*720)
                </Text>
              </Text>
            </View>
          </View>
        </View>

        {mode === "reserve" ? (
          <View style={styles.formCard}>
            <Text style={styles.cardTitle}>
              예약 일시 설정
            </Text>

            <View style={styles.scheduleBox}>
              <Pressable
                accessibilityRole="button"
                style={styles.scheduleRow}
                onPress={() => {
                  setIsTimePickerOpen(
                    false,
                  );
                  setIsDatePickerOpen(
                    true,
                  );
                }}
              >
                <AppIcon name="calendarDark" />
                <View style={styles.scheduleTexts}>
                  <Text style={styles.scheduleLabel}>
                    날짜 선택
                  </Text>
                  <Text style={styles.scheduleValue}>
                    {formatDateLabel(
                      reservedDate,
                    )}
                  </Text>
                </View>
                <AppIcon
                  name="arrowDownGray"
                  size={16}
                />
              </Pressable>

              <View style={styles.scheduleDivider} />

              <Pressable
                accessibilityRole="button"
                style={styles.scheduleRow}
                onPress={() => {
                  setIsDatePickerOpen(
                    false,
                  );
                  setIsTimePickerOpen(
                    true,
                  );
                }}
              >
                <AppIcon name="clockDark" />
                <View style={styles.scheduleTexts}>
                  <Text style={styles.scheduleLabel}>
                    시작 시간
                  </Text>
                  <Text style={styles.scheduleValue}>
                    {reservedTime ||
                      "시간 선택"}
                  </Text>
                </View>
                <AppIcon
                  name="arrowDownGray"
                  size={16}
                />
              </Pressable>
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

        {!isReservationMode ? (
          <View style={styles.micCard}>
            <View>
              <Text style={styles.cardTitle}>
                마이크 테스트
              </Text>
              <Text style={styles.micDescription}>
                {"방송 전에 음질과 마이크를\n테스트해보세요"}
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              style={styles.micButton}
              onPress={() =>
                setIsMicTestOpen(true)
              }
            >
              <Text style={styles.micButtonText}>
                테스트 시작
              </Text>
            </Pressable>
          </View>
        ) : null}

        {errorMessage ? (
          <Text style={styles.errorText}>
            {errorMessage}
          </Text>
        ) : null}

        <View
          style={[
            styles.footer,
            isReservationMode && styles.footerRow,
          ]}
        >
          <Pressable
            accessibilityRole="button"
            disabled={isPending}
            style={[
              styles.submitButton,
              isReservationMode && styles.footerRowButton,
              isPending && styles.buttonDisabled,
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
              {submitLabel}
            </Text>
          </Pressable>

          {isReservationMode ? (
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
        confirmLabel={
          cancelReservationMutation.isPending
            ? "취소 중"
            : "확인"
        }
        onCancel={() =>
          setIsCancelConfirmOpen(
            false,
          )
        }
        onConfirm={() =>
          void cancelReservation()
        }
      />

      <ConfirmModal
        open={isLeaveConfirmOpen}
        tone="orange"
        title="수정을 취소할까요?"
        description={"저장하지 않은 변경 사항은\n모두 사라집니다"}
        onCancel={() =>
          setIsLeaveConfirmOpen(
            false,
          )
        }
        onConfirm={() => {
          setIsLeaveConfirmOpen(
            false,
          );
          router.back();
        }}
      />

      <DatePickerSheet
        open={isDatePickerOpen}
        startDate={reservedDate}
        endDate=""
        selectionMode="single"
        onClose={() =>
          setIsDatePickerOpen(
            false,
          )
        }
        onSelect={({ start }) => {
          setReservedDate(start);
          setIsDatePickerOpen(
            false,
          );
        }}
      />

      <TimePickerSheet
        open={isTimePickerOpen}
        value={reservedTime}
        title="라이브 시작 시간"
        onClose={() =>
          setIsTimePickerOpen(
            false,
          )
        }
        onConfirm={(time) => {
          setReservedTime(time);
          setIsTimePickerOpen(
            false,
          );
        }}
      />

      {isMicTestOpen ? (
        <LiveMicTestScreen
          onBack={() =>
            setIsMicTestOpen(false)
          }
          onClose={() =>
            setIsMicTestOpen(false)
          }
          onComplete={() =>
            setIsMicTestOpen(false)
          }
        />
      ) : null}
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
        "#FFFAF0",
    },

    radioDot: {
      width: 4,
      height: 4,
      borderRadius: 2,
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

    scheduleTexts: {
      flex: 1,
      minWidth: 0,
    },

    scheduleValue: {
      ...textStyles.body2,
      color:
        colors.neutral900,
    },

    scheduleLabel: {
      ...textStyles.caption2,
      color:
        colors.neutral500,
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

    thumbnailRow: {
      flexDirection: "row",
      alignItems: "center",
    },

    thumbnailLabel: {
      ...textStyles.body3,
      width: 76,
      color:
        colors.neutral900,
      fontWeight: "600",
    },

    thumbnailBox: {
      width: 56,
      height: 56,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      borderWidth: 1,
      borderColor:
        colors.neutral300,
      borderRadius: 4,
      backgroundColor:
        colors.white,
    },

    thumbnailImage: {
      width: "100%",
      height: "100%",
    },

    thumbnailHint: {
      ...textStyles.caption2,
      flex: 1,
      minWidth: 0,
      marginLeft: 12,
      color:
        colors.neutral500,
    },

    thumbnailHintSize: {
      ...textStyles.caption4,
      lineHeight: 13,
    },

    micCard: {
      height: 88,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderRadius: 14,
      backgroundColor:
        colors.white,
      paddingHorizontal: 18,
      boxShadow:
        "0px 4px 15px 0px rgba(20, 20, 20, 0.08)",
    },

    micDescription: {
      ...textStyles.caption2,
      marginTop: 8,
      color:
        colors.neutral600,
    },

    micButton: {
      width: 82,
      height: 32,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 8,
      backgroundColor:
        colors.secondary0,
    },

    micButtonText: {
      ...textStyles.caption3,
      color:
        colors.secondary500,
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

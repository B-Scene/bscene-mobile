import { useState, type ReactNode } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import type { BandMemberPart } from "@/api/band/bandManagement";
import { FormInput, SelectField } from "@/features/my/MyFormParts";
import { formatNotificationTime } from "@/features/notification/NotificationList";
import { AppIcon } from "@/shared/components/AppIcon";
import { ProfileImage } from "@/shared/components/ProfileImage";
import { getGenreLabel, getRegionLabel } from "@/shared/constants/bandLabels";
import { colors, shadows, textStyles } from "@/shared/constants/theme";
import type {
  NotificationBandInvite,
  NotificationItem,
} from "@/types/notification";

const INVITE_ALERT_IMAGE = require("../../../assets/images/band/invite-alert.png");

const PART_OPTIONS: readonly { value: BandMemberPart; label: string }[] = [
  { value: "VOCAL", label: "보컬" },
  { value: "GUITAR", label: "기타" },
  { value: "BASS", label: "베이스" },
  { value: "DRUM", label: "드럼" },
  { value: "KEYBOARD", label: "키보드" },
];

export const isSelectablePart = (value?: string): value is BandMemberPart =>
  PART_OPTIONS.some((option) => option.value === value);

const getStringField = (
  value: NotificationBandInvite | null | undefined,
  field: string,
) => {
  const fieldValue: unknown = value ? Reflect.get(value, field) : undefined;

  return typeof fieldValue === "string" && fieldValue.length > 0
    ? fieldValue
    : null;
};

const getNumberField = (
  value: NotificationBandInvite | null | undefined,
  field: string,
) => {
  const fieldValue: unknown = value ? Reflect.get(value, field) : undefined;

  return typeof fieldValue === "number" && Number.isFinite(fieldValue)
    ? fieldValue
    : null;
};

export const getBandInviteBandId = (notification: NotificationItem) =>
  getNumberField(notification.bandInvite, "bandId");

export const getBandInviteBandName = (notification: NotificationItem) =>
  getStringField(notification.bandInvite, "bandName") ?? "밴드";

const formatBandTag = (bandInvite: NotificationBandInvite | null | undefined) => {
  const genre = getStringField(bandInvite, "genre");
  const region = getStringField(bandInvite, "region");
  const memberCount =
    getNumberField(bandInvite, "memberCount") ??
    getNumberField(bandInvite, "acceptedMemberCount");

  return [
    genre ? getGenreLabel(genre) : null,
    region ? getRegionLabel(region) : null,
    memberCount != null ? `멤버 ${memberCount}명` : null,
  ]
    .filter(Boolean)
    .join(" · ");
};

function UnreadDot() {
  return <View accessibilityLabel="읽지 않은 알림" style={styles.unreadDot} />;
}

function ActionButtons({
  disabled,
  wide = false,
  onReject,
  onAccept,
}: {
  disabled: boolean;
  wide?: boolean;
  onReject: () => void;
  onAccept: () => void;
}) {
  return (
    <View style={[styles.actions, wide && styles.actionsWide]}>
      <Pressable
        accessibilityRole="button"
        disabled={disabled}
        style={[
          styles.actionButton,
          styles.rejectButton,
          disabled && styles.disabled,
        ]}
        onPress={onReject}
      >
        <Text style={styles.rejectText}>거절</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        disabled={disabled}
        style={[
          styles.actionButton,
          styles.acceptButton,
          disabled && styles.disabled,
        ]}
        onPress={onAccept}
      >
        <Text style={styles.acceptText}>수락</Text>
      </Pressable>
    </View>
  );
}

export function BandInviteCard({
  notification,
  disabled,
  onPress,
  onReject,
  onAccept,
}: {
  notification: NotificationItem;
  disabled: boolean;
  onPress: () => void;
  onReject: () => void;
  onAccept: () => void;
}) {
  const { bandInvite } = notification;
  const bandName = getBandInviteBandName(notification);
  const position =
    getStringField(bandInvite, "position") ??
    getStringField(bandInvite, "part");
  const role =
    getStringField(bandInvite, "role") ??
    (position ? `밴드 멤버 · ${position}` : "밴드 멤버");
  const bandTag = formatBandTag(bandInvite);
  const imageUrl =
    getStringField(bandInvite, "profileImageUrl") ??
    getStringField(bandInvite, "bandProfileImageUrl");

  return (
    <Pressable
      accessibilityRole="button"
      style={[styles.inviteCard, notification.isRead && styles.cardRead]}
      onPress={onPress}
    >
      <View style={[styles.inviteRow, styles.inviteHeader]}>
        <Image source={INVITE_ALERT_IMAGE} style={styles.inviteIcon} />

        <View style={styles.inviteTexts}>
          <Text numberOfLines={2} style={styles.title}>
            {notification.title || `${bandName}에서 멤버 초대를 보냈어요`}
          </Text>
          {notification.body || position ? (
            <Text style={styles.inviteCaption}>
              {notification.body || `${position} 포지션으로 함께 활동해 주세요`}
            </Text>
          ) : null}
          <Text style={styles.inviteCaption}>
            {formatNotificationTime(notification.createdAt)}
          </Text>
        </View>

        {!notification.isRead ? <UnreadDot /> : null}
      </View>

      <View style={styles.divider} />

      <View style={[styles.inviteRow, styles.bandRow]}>
        <ProfileImage imageUrl={imageUrl} size={40} variant="band" />
        <View style={styles.bandTexts}>
          <Text style={styles.bandName}>{bandName}</Text>
          {bandTag ? (
            <Text numberOfLines={1} style={styles.inviteCaption}>
              {bandTag}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={[styles.inviteRow, styles.roleBox]}>
        <Text style={styles.roleLabel}>역할</Text>
        <Text style={styles.roleValue}>{role}</Text>
      </View>

      {notification.actionable ? (
        <ActionButtons
          wide
          disabled={disabled}
          onReject={onReject}
          onAccept={onAccept}
        />
      ) : null}
    </Pressable>
  );
}

export function ActionNotificationCard({
  notification,
  disabled,
  onReject,
  onAccept,
}: {
  notification: NotificationItem;
  disabled: boolean;
  onReject: () => void;
  onAccept: () => void;
}) {
  const time = formatNotificationTime(notification.createdAt);

  return (
    <View style={[styles.actionCard, notification.isRead && styles.cardRead]}>
      <View style={styles.actionCardHeader}>
        <Image source={INVITE_ALERT_IMAGE} style={styles.inviteIcon} />

        <View style={styles.actionCardTexts}>
          <View style={styles.actionTitleRow}>
            <Text numberOfLines={2} style={[styles.title, styles.actionTitle]}>
              {notification.title}
            </Text>
            {!notification.isRead ? <UnreadDot /> : null}
          </View>
          {notification.body ? (
            <Text numberOfLines={2} style={styles.actionBody}>
              {notification.body}
            </Text>
          ) : null}
          {time ? <Text style={styles.actionTime}>{time}</Text> : null}
        </View>
      </View>

      {!notification.isRead ? (
        <ActionButtons
          disabled={disabled}
          onReject={onReject}
          onAccept={onAccept}
        />
      ) : null}
    </View>
  );
}

function ModalShell({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <Modal
      transparent
      statusBarTranslucent
      animationType="fade"
      visible={open}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView behavior="padding" style={styles.modalFill}>
        <Pressable style={styles.modalOverlay} onPress={onClose}>
          <Pressable accessibilityViewIsModal style={styles.modalPanel}>
            {children}
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function RoleModalFields({
  initialActivityName,
  initialPart,
  submitting,
  onClose,
  onConfirm,
}: {
  initialActivityName: string;
  initialPart: BandMemberPart | "";
  submitting: boolean;
  onClose: () => void;
  onConfirm: (activityName: string, part: BandMemberPart) => void;
}) {
  const [activityName, setActivityName] = useState(initialActivityName);
  const [part, setPart] = useState<BandMemberPart | "">(initialPart);
  const trimmedName = activityName.trim();
  const canConfirm = trimmedName.length > 0 && part !== "";

  return (
    <>
      <View style={styles.modalHeading}>
        <Text style={styles.modalTitle}>활동명과 파트를 입력해주세요</Text>
        <Text style={styles.modalDescription}>
          {
            "밴드 프로필에 표시될 정보를 입력해 주세요\n밴드 프로필 관리에서 활동명과 파트를 수정할 수 있어요"
          }
        </Text>
      </View>

      <View style={styles.modalFields}>
        <View style={styles.modalField}>
          <Text style={styles.modalLabel}>활동명</Text>
          <FormInput
            tone="secondary"
            value={activityName}
            placeholder="활동명을 입력해주세요"
            onChangeText={setActivityName}
          />
        </View>

        <View style={styles.modalField}>
          <Text style={styles.modalLabel}>파트</Text>
          <SelectField
            overlay
            value={part}
            options={PART_OPTIONS}
            placeholder="파트를 선택해주세요"
            onChange={setPart}
          />
        </View>
      </View>

      <View style={styles.modalActions}>
        <Pressable
          accessibilityRole="button"
          style={[styles.modalButton, styles.modalCancel]}
          onPress={onClose}
        >
          <Text style={styles.modalCancelText}>취소</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          disabled={!canConfirm || submitting}
          style={[
            styles.modalButton,
            styles.modalConfirm,
            (!canConfirm || submitting) && styles.disabled,
          ]}
          onPress={() => {
            if (part !== "") onConfirm(trimmedName, part);
          }}
        >
          <Text style={styles.modalConfirmText}>확인</Text>
        </Pressable>
      </View>
    </>
  );
}

export function RoleInputModal({
  open,
  initialActivityName,
  initialPart,
  submitting,
  onClose,
  onConfirm,
}: {
  open: boolean;
  initialActivityName: string;
  initialPart: BandMemberPart | "";
  submitting: boolean;
  onClose: () => void;
  onConfirm: (activityName: string, part: BandMemberPart) => void;
}) {
  return (
    <ModalShell open={open} onClose={onClose}>
      {open ? (
        <RoleModalFields
          initialActivityName={initialActivityName}
          initialPart={initialPart}
          submitting={submitting}
          onClose={onClose}
          onConfirm={onConfirm}
        />
      ) : null}
    </ModalShell>
  );
}

export function RoleCompleteModal({
  open,
  kind,
  bandName,
  onClose,
}: {
  open: boolean;
  kind: "bandInvite" | "sessionFinalize";
  bandName: string;
  onClose: () => void;
}) {
  const isBandInvite = kind === "bandInvite";

  return (
    <ModalShell open={open} onClose={onClose}>
      <View style={styles.completeBody}>
        <AppIcon name="bandInviteComplete" size={62} />

        <View style={styles.completeTexts}>
          <Text style={styles.modalTitle}>
            {isBandInvite
              ? "초대가 완료되었습니다"
              : "세션 참여가 확정되었습니다"}
          </Text>
          <Text style={styles.modalDescription}>
            {isBandInvite
              ? `이제 ${bandName}의 멤버로 활동할 수 있어요.`
              : "이제 밴드 멤버로 활동할 수 있어요."}
            {"\n내 밴드와 밴드 프로필 관리에서 확인해 주세요."}
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          style={[styles.modalButton, styles.modalConfirm, styles.completeButton]}
          onPress={onClose}
        >
          <Text style={styles.modalConfirmText}>확인</Text>
        </Pressable>
      </View>
    </ModalShell>
  );
}

const styles = StyleSheet.create({
  inviteCard: {
    ...shadows.card,
    gap: 16,
    borderRadius: 12,
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  cardRead: {
    opacity: 0.8,
  },
  inviteRow: {
    width: "100%",
    maxWidth: 286,
    flexDirection: "row",
    alignSelf: "center",
  },
  inviteHeader: {
    alignItems: "flex-start",
    gap: 16,
  },
  inviteIcon: {
    width: 41,
    height: 41,
  },
  inviteTexts: {
    flex: 1,
    minWidth: 0,
    gap: 8,
  },
  title: {
    ...textStyles.body1,
    color: colors.neutral900,
  },
  inviteCaption: {
    ...textStyles.caption2,
    color: colors.neutral600,
  },
  unreadDot: {
    width: 8,
    height: 8,
    marginTop: 4,
    borderRadius: 4,
    backgroundColor: colors.secondary500,
  },
  divider: {
    height: 1,
    backgroundColor: colors.neutral400,
  },
  bandRow: {
    alignItems: "center",
    gap: 12,
  },
  bandTexts: {
    flex: 1,
    minWidth: 0,
  },
  bandName: {
    ...textStyles.body6,
    color: colors.neutral900,
  },
  roleBox: {
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: colors.neutral300,
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  roleLabel: {
    ...textStyles.caption3,
    color: colors.neutral500,
  },
  roleValue: {
    ...textStyles.body6,
    flexShrink: 1,
    color: colors.secondary500,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
  },
  actionsWide: {
    width: "100%",
    maxWidth: 300,
    alignSelf: "center",
    gap: 20,
  },
  actionButton: {
    height: 30,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
  },
  rejectButton: {
    borderWidth: 1,
    borderColor: colors.secondary500,
    backgroundColor: colors.white,
  },
  acceptButton: {
    backgroundColor: colors.secondary500,
  },
  rejectText: {
    ...textStyles.caption3,
    color: colors.secondary500,
  },
  acceptText: {
    ...textStyles.caption3,
    color: colors.white,
  },
  disabled: {
    opacity: 0.6,
  },
  actionCard: {
    ...shadows.card,
    gap: 12,
    borderRadius: 12,
    backgroundColor: colors.white,
    padding: 16,
  },
  actionCardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  actionCardTexts: {
    flex: 1,
    minWidth: 0,
  },
  actionTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  actionTitle: {
    flex: 1,
  },
  actionBody: {
    ...textStyles.caption2,
    marginTop: 4,
    color: colors.neutral700,
  },
  actionTime: {
    ...textStyles.caption2,
    marginTop: 4,
    color: colors.neutral600,
  },
  modalFill: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(29, 26, 26, 0.8)",
    paddingHorizontal: 16,
  },
  modalPanel: {
    width: "100%",
    maxWidth: 354,
    gap: 24,
    borderRadius: 16,
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  modalHeading: {
    alignItems: "center",
    gap: 8,
  },
  modalTitle: {
    ...textStyles.label1,
    color: colors.neutral900,
    textAlign: "center",
  },
  modalDescription: {
    ...textStyles.caption2,
    color: colors.neutral600,
    textAlign: "center",
  },
  modalFields: {
    gap: 12,
    zIndex: 1,
  },
  modalField: {
    gap: 8,
  },
  modalLabel: {
    ...textStyles.body6,
    color: colors.neutral900,
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
  },
  modalButton: {
    height: 38,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
  },
  modalCancel: {
    borderWidth: 1,
    borderColor: colors.secondary500,
    backgroundColor: colors.white,
  },
  modalConfirm: {
    backgroundColor: colors.secondary500,
  },
  modalCancelText: {
    ...textStyles.body1,
    color: colors.secondary500,
  },
  modalConfirmText: {
    ...textStyles.body1,
    color: colors.white,
  },
  completeBody: {
    alignItems: "center",
    gap: 16,
  },
  completeTexts: {
    gap: 8,
  },
  completeButton: {
    width: "100%",
    flex: 0,
  },
});

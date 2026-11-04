import { useState } from "react";
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
import { ProfileImage } from "@/shared/components/ProfileImage";
import {
  colors,
  textStyles,
} from "@/shared/constants/theme";
import type {
  LiveReservationCoHostCandidate,
} from "@/types/live/live";

const PART_LABELS: Record<string, string> = {
  VOCAL: "보컬",
  GUITAR: "기타",
  BASS: "베이스",
  DRUM: "드럼",
  KEYBOARD: "키보드",
  SESSION: "세션",
  MEMBER: "멤버",
  ETC: "기타",
};

const getPartLabel =
  (part?: string | null) => {
    if (!part) {
      return "멤버";
    }

    return (
      PART_LABELS[
        part.toUpperCase()
      ] ?? part
    );
  };

export function LiveCoHostSelector({
  candidates,
  selectedIds,
  isLoading,
  errorMessage,
  onToggle,
}: {
  candidates:
    LiveReservationCoHostCandidate[];
  selectedIds: number[];
  isLoading: boolean;
  errorMessage: string;
  onToggle: (
    bandMemberId: number,
  ) => void;
}) {
  const [
    isOpen,
    setIsOpen,
  ] = useState(false);

  const close =
    () => setIsOpen(false);

  return (
    <>
      <Pressable
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.card,
          pressed
            ? styles.pressed
            : null,
        ]}
        onPress={() =>
          setIsOpen(true)
        }
      >
        <AppIcon name="coHostIcon" size={36} />

        <View style={styles.cardText}>
          <Text style={styles.cardTitle}>
            공동 진행 (선택)
          </Text>
          <Text style={styles.cardDescription}>
            멤버와 함께 라이브를 진행할 수 있어요.
          </Text>
        </View>

        <Text style={styles.chevron}>›</Text>
      </Pressable>

      {isLoading ? (
        <Text style={styles.countLoading}>
          공동 진행 후보 불러오는 중
        </Text>
      ) : selectedIds.length > 0 ? (
        <Text style={styles.countSelected}>
          공동 진행자 {selectedIds.length}명 선택됨
        </Text>
      ) : null}

      <Modal
        visible={isOpen}
        animationType="slide"
        onRequestClose={close}
      >
        <SafeAreaView style={styles.modal}>
          <AppHeader
            title="공동 진행"
            rightContent={
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="닫기"
                hitSlop={12}
                onPress={close}
              >
                <AppIcon
                  name="closeHeader"
                  size={28}
                />
              </Pressable>
            }
            onBack={close}
            style={styles.modalHeader}
          />

          <ScrollView
            contentContainerStyle={
              styles.list
            }
          >
            {isLoading ? (
              <Text style={styles.message}>
                공동 진행자를 불러오는 중이에요.
              </Text>
            ) : errorMessage ? (
              <Text style={styles.errorMessage}>
                {errorMessage}
              </Text>
            ) : candidates.length === 0 ? (
              <Text style={styles.message}>
                초대할 수 있는 공동 진행자가 없어요.
              </Text>
            ) : (
              candidates.map(
                (candidate) => (
                  <CandidateRow
                    key={
                      candidate.bandMemberId
                    }
                    candidate={candidate}
                    selected={selectedIds.includes(
                      candidate.bandMemberId,
                    )}
                    onToggle={() =>
                      onToggle(
                        candidate.bandMemberId,
                      )
                    }
                  />
                ),
              )
            )}
          </ScrollView>

          <View style={styles.footer}>
            <Pressable
              accessibilityRole="button"
              style={styles.confirmButton}
              onPress={close}
            >
              <Text style={styles.confirmText}>
                확인
              </Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </Modal>
    </>
  );
}

function CandidateRow({
  candidate,
  selected,
  onToggle,
}: {
  candidate:
    LiveReservationCoHostCandidate;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <View style={styles.row}>
      <ProfileImage
        imageUrl={
          candidate.bandMemberProfileImageUrl
        }
        size={36}
        variant="band"
      />

      <View style={styles.rowText}>
        <Text
          numberOfLines={1}
          style={styles.nickname}
        >
          {candidate.nickname}
        </Text>
        <Text
          numberOfLines={1}
          style={styles.part}
        >
          {getPartLabel(
            candidate.part,
          )}
        </Text>
      </View>

      {candidate.status ===
      "OWNER" ? (
        <Text style={styles.ownerLabel}>
          진행자
        </Text>
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityState={{
            selected,
          }}
          hitSlop={8}
          onPress={onToggle}
        >
          <Text
            style={[
              styles.inviteLabel,
              selected
                ? styles.inviteLabelSelected
                : null,
            ]}
          >
            {selected
              ? "초대됨"
              : "초대"}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles =
  StyleSheet.create({
    card: {
      minHeight: 64,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      borderRadius: 14,
      backgroundColor:
        colors.white,
      paddingHorizontal: 18,
      paddingVertical: 8,
      boxShadow:
        "0px 4px 15px 0px rgba(20, 20, 20, 0.08)",
    },

    pressed: {
      opacity: 0.85,
    },

    cardText: {
      flex: 1,
      gap: 2,
    },

    cardTitle: {
      ...textStyles.caption3,
      color:
        colors.neutral900,
    },

    cardDescription: {
      ...textStyles.caption2,
      color:
        colors.neutral600,
    },

    chevron: {
      color:
        colors.neutral300,
      fontSize: 32,
      lineHeight: 32,
    },

    countLoading: {
      ...textStyles.caption2,
      color:
        colors.neutral500,
      marginTop: -4,
      textAlign: "right",
    },

    countSelected: {
      ...textStyles.caption2,
      color:
        colors.secondary500,
      marginTop: -4,
      textAlign: "right",
    },

    modal: {
      flex: 1,
      backgroundColor:
        colors.white,
    },

    modalHeader: {
      height: 52,
      paddingHorizontal: 20,
    },

    list: {
      gap: 16,
      paddingHorizontal: 28,
      paddingTop: 36,
    },

    message: {
      ...textStyles.caption2,
      color:
        colors.neutral500,
      paddingVertical: 40,
      textAlign: "center",
    },

    errorMessage: {
      ...textStyles.caption2,
      color:
        colors.error,
      paddingVertical: 40,
      textAlign: "center",
    },

    row: {
      minHeight: 60,
      flexDirection: "row",
      alignItems: "center",
      borderRadius: 8,
      backgroundColor:
        colors.white,
      paddingHorizontal: 12,
      boxShadow:
        "0px 0px 8px 0px rgba(20, 20, 20, 0.08)",
    },

    rowText: {
      flex: 1,
      gap: 2,
      marginLeft: 12,
    },

    nickname: {
      ...textStyles.caption3,
      color:
        colors.neutral900,
    },

    part: {
      ...textStyles.caption2,
      color:
        colors.neutral600,
    },

    ownerLabel: {
      ...textStyles.caption3,
      color:
        colors.neutral900,
    },

    inviteLabel: {
      ...textStyles.caption3,
      color:
        colors.secondary500,
    },

    inviteLabelSelected: {
      color:
        colors.secondary600,
    },

    footer: {
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 20,
    },

    confirmButton: {
      height: 52,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 10,
      backgroundColor:
        colors.secondary500,
      boxShadow:
        "0px 4px 12px 0px rgba(251, 177, 14, 0.24)",
    },

    confirmText: {
      ...textStyles.label2,
      color:
        colors.white,
    },
  });

import {
  ChevronRight,
  Users,
} from "lucide-react-native";
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

import { AppButton } from "@/shared/components/AppButton";
import { AppHeader } from "@/shared/components/AppHeader";
import { Avatar } from "@/shared/components/Avatar";
import {
  colors,
  spacing,
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
        <View style={styles.cardIcon}>
          <Users
            size={20}
            color={
              colors.secondary600
            }
          />
        </View>

        <View style={styles.cardText}>
          <Text style={styles.cardTitle}>
            공동 진행 (선택)
          </Text>
          <Text style={styles.cardDescription}>
            {selectedIds.length > 0
              ? `공동 진행자 ${selectedIds.length}명 선택됨`
              : "멤버와 함께 라이브를 진행할 수 있어요."}
          </Text>
        </View>

        <ChevronRight
          size={22}
          color={
            colors.neutral400
          }
        />
      </Pressable>

      <Modal
        visible={isOpen}
        animationType="slide"
        onRequestClose={close}
      >
        <SafeAreaView style={styles.modal}>
          <AppHeader
            title="공동 진행"
            onBack={close}
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
            <AppButton
              label="확인"
              onPress={close}
            />
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
      <Avatar
        imageUrl={
          candidate.bandMemberProfileImageUrl
        }
        label={
          candidate.nickname
        }
        size={36}
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
      gap: spacing.sm,
      borderRadius: 14,
      backgroundColor:
        colors.white,
      paddingHorizontal: 18,
      paddingVertical:
        spacing.sm,
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

    pressed: {
      opacity: 0.85,
    },

    cardIcon: {
      width: 36,
      height: 36,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 18,
      backgroundColor:
        colors.secondary100,
    },

    cardText: {
      flex: 1,
      gap: 2,
    },

    cardTitle: {
      color:
        colors.neutral900,
      fontSize: 13,
      lineHeight: 18,
      fontWeight: "700",
      letterSpacing: 0,
    },

    cardDescription: {
      color:
        colors.neutral600,
      fontSize: 12,
      lineHeight: 18,
      fontWeight: "500",
      letterSpacing: 0,
    },

    modal: {
      flex: 1,
      backgroundColor:
        colors.white,
    },

    list: {
      gap: spacing.md,
      padding: spacing.lg,
    },

    message: {
      color:
        colors.neutral500,
      fontSize: 12,
      lineHeight: 18,
      textAlign: "center",
      paddingVertical:
        spacing.xl,
    },

    errorMessage: {
      color:
        colors.error,
      fontSize: 12,
      lineHeight: 18,
      textAlign: "center",
      paddingVertical:
        spacing.xl,
    },

    row: {
      minHeight: 60,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      borderRadius: 8,
      backgroundColor:
        colors.white,
      paddingHorizontal:
        spacing.sm,
      shadowColor:
        colors.neutral900,
      shadowOpacity: 0.08,
      shadowRadius: 8,
      shadowOffset: {
        width: 0,
        height: 0,
      },
      elevation: 2,
    },

    rowText: {
      flex: 1,
      gap: 2,
    },

    nickname: {
      color:
        colors.neutral900,
      fontSize: 14,
      fontWeight: "600",
      letterSpacing: 0,
    },

    part: {
      color:
        colors.neutral600,
      fontSize: 12,
      fontWeight: "500",
      letterSpacing: 0,
    },

    ownerLabel: {
      color:
        colors.neutral900,
      fontSize: 14,
      fontWeight: "600",
      letterSpacing: 0,
    },

    inviteLabel: {
      color:
        colors.secondary500,
      fontSize: 14,
      fontWeight: "600",
      letterSpacing: 0,
    },

    inviteLabelSelected: {
      color:
        colors.secondary600,
    },

    footer: {
      paddingHorizontal:
        spacing.lg,
      paddingVertical:
        spacing.sm,
    },
  });

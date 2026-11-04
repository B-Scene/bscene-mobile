import { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useMySessionApplicationSummaryQuery } from "@/hooks/api/session/useSessionApplication";
import { AppIcon } from "@/shared/components/AppIcon";
import { colors, textStyles } from "@/shared/constants/theme";
import type { SessionApplicationSummaryItem } from "@/types/session/sessionApplication";

const formatApplicationDate = (value?: string) => {
  if (!value) return "";

  const dateValue = value.includes("T")
    ? value.split("T")[0]
    : value.slice(0, 10);

  return `${dateValue} 수정`;
};

function ApplicationSelectCard({
  application,
  selected,
  onSelect,
  onPreview,
  onEdit,
}: {
  application: SessionApplicationSummaryItem;
  selected: boolean;
  onSelect: () => void;
  onPreview: () => void;
  onEdit: () => void;
}) {
  return (
    <View style={[styles.card, selected && styles.cardSelected]}>
      <Pressable
        accessibilityRole="radio"
        accessibilityState={{ checked: selected }}
        onPress={onSelect}
      >
        <View style={styles.cardTop}>
          <Text style={styles.cardDate}>
            {formatApplicationDate(application.displayDate)}
          </Text>
          <AppIcon name={selected ? "checkCircleBand" : "checkEmpty"} size={20} />
        </View>

        <Text numberOfLines={1} style={styles.cardTitle}>
          <Text style={styles.cardTitleAccent}>
            [{application.title || "기본"}]
          </Text>{" "}
          {application.purpose}
        </Text>
      </Pressable>

      <View style={styles.cardActions}>
        <Pressable
          accessibilityRole="button"
          style={[styles.cardAction, styles.previewAction]}
          onPress={onPreview}
        >
          <Text style={styles.cardActionText}>미리보기</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          style={[styles.cardAction, styles.editAction]}
          onPress={onEdit}
        >
          <Text style={styles.cardActionText}>수정하기</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function ApplicationSelectModal({
  open,
  applying,
  onClose,
  onCreateApplication,
  onPreviewApplication,
  onEditApplication,
  onApplyApplication,
}: {
  open: boolean;
  applying: boolean;
  onClose: () => void;
  onCreateApplication: () => void;
  onPreviewApplication: (sessionApplicationId: number) => void;
  onEditApplication: (sessionApplicationId: number) => void;
  onApplyApplication: (sessionApplicationId: number) => void;
}) {
  const summaryQuery = useMySessionApplicationSummaryQuery();
  const applications = summaryQuery.data?.applications ?? [];
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const activeId = applications.some(
    (application) => application.sessionApplicationId === selectedId,
  )
    ? selectedId
    : (summaryQuery.data?.sessionApplicationId ??
      applications[0]?.sessionApplicationId ??
      null);
  const canApply = activeId !== null && !applying;

  return (
    <Modal
      transparent
      statusBarTranslucent
      animationType="fade"
      visible={open}
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable accessibilityViewIsModal style={styles.panel}>
          <Text style={styles.title}>지원서 선택</Text>
          <Text style={styles.description}>
            {
              "지원할 지원서를 고르면 아래에 전체 내용이 표시돼요\n선택 즉시 지원이 완료돼요"
            }
          </Text>

          <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
            {summaryQuery.isLoading ? (
              <View style={styles.state}>
                <Text style={styles.stateText}>지원서를 불러오고 있어요</Text>
              </View>
            ) : summaryQuery.isError ? (
              <View style={styles.state}>
                <Text style={styles.stateText}>지원서를 불러오지 못했어요</Text>
                <Pressable
                  accessibilityRole="button"
                  style={styles.stateButton}
                  onPress={() => void summaryQuery.refetch()}
                >
                  <Text style={styles.stateButtonText}>다시 시도</Text>
                </Pressable>
              </View>
            ) : applications.length === 0 ? (
              <View style={styles.state}>
                <Text style={styles.emptyTitle}>등록된 지원서가 없어요</Text>
                <Text style={styles.emptyDescription}>
                  {"지원서를 먼저 작성한 후\n모집 공고에 지원해주세요"}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  style={styles.stateButton}
                  onPress={onCreateApplication}
                >
                  <Text style={styles.stateButtonText}>지원서 작성하기</Text>
                </Pressable>
              </View>
            ) : (
              applications.map((application) => {
                const id = application.sessionApplicationId;

                return (
                  <ApplicationSelectCard
                    key={id}
                    application={application}
                    selected={activeId === id}
                    onSelect={() => setSelectedId(id)}
                    onPreview={() => onPreviewApplication(id)}
                    onEdit={() => onEditApplication(id)}
                  />
                );
              })
            )}
          </ScrollView>

          <View style={styles.footer}>
            <Pressable
              accessibilityRole="button"
              style={[styles.footerButton, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.cancelText}>취소</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={!canApply}
              style={[
                styles.footerButton,
                canApply ? styles.applyButton : styles.applyButtonDisabled,
              ]}
              onPress={() => {
                if (activeId !== null) onApplyApplication(activeId);
              }}
            >
              <Text style={[styles.applyText, !canApply && styles.applyTextDisabled]}>
                {applying ? "지원 중" : "선택한 지원서로 지원"}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  panel: {
    width: "100%",
    maxWidth: 354,
    maxHeight: "100%",
    overflow: "hidden",
    borderRadius: 16,
    backgroundColor: colors.white,
    paddingHorizontal: 15,
    paddingTop: 24,
    paddingBottom: 16,
  },
  title: {
    ...textStyles.label1,
    color: colors.neutral900,
  },
  description: {
    ...textStyles.caption2,
    marginTop: 4,
    color: colors.neutral600,
  },
  list: {
    flexGrow: 0,
    flexShrink: 1,
    marginTop: 16,
  },
  listContent: {
    gap: 12,
  },
  state: {
    minHeight: 260,
    alignItems: "center",
    justifyContent: "center",
  },
  stateText: {
    ...textStyles.caption2,
    color: colors.neutral500,
  },
  stateButton: {
    marginTop: 12,
    borderRadius: 8,
    backgroundColor: colors.secondary500,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  stateButtonText: {
    ...textStyles.caption3,
    color: colors.white,
  },
  emptyTitle: {
    ...textStyles.body1,
    color: colors.neutral900,
  },
  emptyDescription: {
    ...textStyles.caption2,
    marginTop: 8,
    color: colors.neutral600,
    textAlign: "center",
  },
  card: {
    borderWidth: 1,
    borderColor: colors.neutral400,
    borderRadius: 12,
    backgroundColor: colors.white,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  cardSelected: {
    borderColor: colors.secondary500,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  cardDate: {
    ...textStyles.caption3,
    color: colors.neutral500,
  },
  cardTitle: {
    ...textStyles.label1,
    marginTop: 10,
    color: colors.neutral900,
  },
  cardTitleAccent: {
    color: colors.secondary500,
  },
  cardActions: {
    flexDirection: "row",
    gap: 14,
    marginTop: 12,
  },
  cardAction: {
    height: 30,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 5,
  },
  previewAction: {
    backgroundColor: colors.secondary0,
  },
  editAction: {
    backgroundColor: colors.neutral300,
  },
  cardActionText: {
    ...textStyles.caption3,
    color: colors.neutral600,
  },
  footer: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  footerButton: {
    height: 40,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: colors.secondary500,
    backgroundColor: colors.white,
  },
  cancelText: {
    ...textStyles.caption3,
    color: colors.secondary500,
  },
  applyButton: {
    backgroundColor: colors.secondary500,
  },
  applyButtonDisabled: {
    backgroundColor: colors.neutral300,
  },
  applyText: {
    ...textStyles.caption3,
    color: colors.white,
  },
  applyTextDisabled: {
    color: colors.neutral500,
  },
});

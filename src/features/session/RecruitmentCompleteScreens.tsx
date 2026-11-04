import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { AppIcon } from "@/shared/components/AppIcon";
import { Screen } from "@/shared/components/Screen";
import { colors, shadows, textStyles } from "@/shared/constants/theme";

export function RecruitmentCreatedScreen({
  rows,
  onBackToSession,
  onConfirmPost,
}: {
  rows: readonly (readonly [string, string])[];
  onBackToSession: () => void;
  onConfirmPost: () => void;
}) {
  return (
    <Screen scroll={false} contentStyle={styles.container}>
      <ScrollView contentContainerStyle={styles.createdContent}>
        <AppIcon name="sessionApprove" size={120} />
        <Text style={styles.createdTitle}>세션 모집 공고가 등록됐어요</Text>
        <Text style={styles.createdDescription}>
          {"조건에 맞는 세션 뮤지션들이\n공고를 볼 수 있어요"}
        </Text>

        <View style={styles.createdCard}>
          {rows.map(([label, value], index) => (
            <View
              key={label}
              style={[
                styles.createdRow,
                index < rows.length - 1 && styles.rowDivider,
              ]}
            >
              <Text style={styles.createdLabel}>{label}</Text>
              <Text numberOfLines={1} style={styles.createdValue}>
                {value}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.createdActions}>
          <Pressable
            accessibilityRole="button"
            style={[styles.createdButton, styles.outlineButton]}
            onPress={onBackToSession}
          >
            <Text style={styles.createdOutlineText}>세션 탭으로</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            style={[styles.createdButton, styles.filledButton]}
            onPress={onConfirmPost}
          >
            <Text style={styles.createdFilledText}>공고 확인하기</Text>
          </Pressable>
        </View>
      </ScrollView>
    </Screen>
  );
}

export function ApplicationSubmittedScreen({
  recruitmentTitle,
  bandName,
  applicationTitle,
  messaging,
  onSendMessage,
  onViewApplication,
  onGoToSessionHome,
}: {
  recruitmentTitle: string;
  bandName: string;
  applicationTitle: string;
  messaging: boolean;
  onSendMessage: () => void;
  onViewApplication: () => void;
  onGoToSessionHome: () => void;
}) {
  const rows = [
    ["공고 제목", recruitmentTitle],
    ["밴드", bandName],
    ["지원서", applicationTitle || "기본"],
  ];

  return (
    <Screen scroll={false} contentStyle={styles.container}>
      <ScrollView contentContainerStyle={styles.submittedContent}>
        <AppIcon name="sessionApplyComplete" size={100} />
        <Text style={styles.submittedTitle}>지원이 완료되었어요</Text>
        <Text style={styles.submittedDescription}>
          {
            "선택한 지원서가 밴드에게 전달됐어요\n추가 대화는 쪽지로 이어갈 수 있어요"
          }
        </Text>

        <View style={styles.submittedCard}>
          {rows.map(([label, value], index) => (
            <View
              key={label}
              style={[
                styles.submittedRow,
                index < rows.length - 1 && styles.rowDivider,
              ]}
            >
              <Text style={styles.submittedLabel}>{label}</Text>
              <Text numberOfLines={1} style={styles.submittedValue}>
                {value}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.submittedActions}>
          <Pressable
            accessibilityRole="button"
            disabled={messaging}
            style={[styles.submittedButton, styles.outlineButton]}
            onPress={onSendMessage}
          >
            <Text style={styles.submittedOutlineText}>쪽지 보내기</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            style={[styles.submittedButton, styles.viewButton]}
            onPress={onViewApplication}
          >
            <Text style={styles.submittedFilledText}>지원서 보기</Text>
          </Pressable>
        </View>

        <Pressable
          accessibilityRole="button"
          hitSlop={8}
          style={styles.homeLink}
          onPress={onGoToSessionHome}
        >
          <Text style={styles.homeLinkText}>세션 홈으로</Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    backgroundColor: colors.white,
  },
  createdContent: {
    alignItems: "center",
    paddingHorizontal: 30,
    paddingTop: 96,
    paddingBottom: 30,
  },
  createdTitle: {
    width: "100%",
    maxWidth: 328,
    marginTop: 58,
    color: "#111111",
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: 0.84,
    lineHeight: 38,
    textAlign: "center",
  },
  createdDescription: {
    ...textStyles.body1,
    marginTop: 16,
    color: colors.neutral600,
    textAlign: "center",
  },
  createdCard: {
    width: "100%",
    maxWidth: 330,
    borderRadius: 8,
    backgroundColor: colors.white,
    marginTop: 58,
    padding: 16,
    boxShadow: "0px 0px 8px 0px rgba(0, 0, 0, 0.08)",
  },
  createdRow: {
    height: 31,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral300,
  },
  createdLabel: {
    ...textStyles.body1,
    color: colors.neutral600,
  },
  createdValue: {
    ...textStyles.body1,
    flexShrink: 1,
    color: colors.neutral900,
    textAlign: "right",
  },
  createdActions: {
    width: "100%",
    maxWidth: 330,
    flexDirection: "row",
    gap: 20,
    marginTop: 34,
  },
  createdButton: {
    height: 48,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
  },
  outlineButton: {
    borderWidth: 1.5,
    borderColor: colors.secondary500,
    backgroundColor: colors.white,
  },
  filledButton: {
    backgroundColor: colors.secondary500,
  },
  createdOutlineText: {
    ...textStyles.label2,
    color: colors.secondary500,
  },
  createdFilledText: {
    ...textStyles.label2,
    color: colors.white,
  },
  submittedContent: {
    minHeight: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  submittedTitle: {
    marginTop: 32,
    color: colors.neutral900,
    fontSize: 28,
    fontWeight: "700",
    lineHeight: 38,
    textAlign: "center",
  },
  submittedDescription: {
    ...textStyles.body2,
    marginTop: 12,
    color: colors.neutral600,
    textAlign: "center",
  },
  submittedCard: {
    ...shadows.card,
    width: "100%",
    maxWidth: 330,
    borderRadius: 8,
    backgroundColor: colors.white,
    marginTop: 32,
    padding: 16,
  },
  submittedRow: {
    minHeight: 32,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  submittedLabel: {
    ...textStyles.caption2,
    color: colors.neutral700,
  },
  submittedValue: {
    ...textStyles.caption3,
    flexShrink: 1,
    color: colors.neutral900,
    textAlign: "right",
  },
  submittedActions: {
    width: "100%",
    maxWidth: 330,
    flexDirection: "row",
    gap: 18,
    marginTop: 20,
  },
  submittedButton: {
    height: 48,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
  },
  viewButton: {
    backgroundColor: colors.secondary400,
  },
  submittedOutlineText: {
    ...textStyles.body6,
    color: colors.secondary500,
  },
  submittedFilledText: {
    ...textStyles.body6,
    color: colors.white,
  },
  homeLink: {
    marginTop: 20,
  },
  homeLinkText: {
    ...textStyles.caption2,
    color: colors.neutral600,
    textDecorationLine: "underline",
  },
});

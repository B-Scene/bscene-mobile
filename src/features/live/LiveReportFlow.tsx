import { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Svg, { Path } from "react-native-svg";

import type { LiveReportType } from "@/api/live/liveRoomActions";
import { AppHeader } from "@/shared/components/AppHeader";
import { BottomSheetModal } from "@/shared/components/BottomSheetModal";
import { Screen } from "@/shared/components/Screen";
import { colors, textStyles } from "@/shared/constants/theme";

const REPORT_REASONS: readonly {
  type: LiveReportType;
  title: string;
  description: string;
}[] = [
  {
    type: "SPAM",
    title: "스팸 또는 홍보성 게시물",
    description: "의도와 관계없이 반복적인 홍보, 광고, 도배성 메시지",
  },
  {
    type: "ABUSE",
    title: "욕설 및 혐오 표현",
    description: "특정 개인이나 집단에 대한 욕설, 비하, 혐오 표현",
  },
  {
    type: "SEXUAL",
    title: "성적으로 불쾌한 내용",
    description: "선정적이거나 성적으로 불쾌감을 주는 표현",
  },
  {
    type: "VIOLENCE",
    title: "폭력적이거나 위험한 내용",
    description: "폭력, 자해, 범죄 조장 등 위험한 행동을 유도하는 내용",
  },
  {
    type: "COPYRIGHT",
    title: "저작권 침해",
    description: "무단으로 사용된 음원, 영상, 이미지 등 저작권 침해",
  },
  {
    type: "ETC",
    title: "기타",
    description: "위 항목에 해당하지 않는 기타 문제",
  },
];

export function LiveReportPage({
  isSubmitting,
  onBack,
  onSubmit,
}: {
  isSubmitting: boolean;
  onBack: () => void;
  onSubmit: (request: {
    reportType: LiveReportType;
    comment: string | null;
  }) => void;
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [details, setDetails] = useState("");
  const [focused, setFocused] = useState(false);

  return (
    <Screen contentStyle={styles.container}>
      <AppHeader
        title="댓글 신고"
        style={styles.header}
        onBack={() => {
          if (!isSubmitting) onBack();
        }}
      />

      <View style={styles.form}>
        <Text style={styles.sectionTitle}>신고 사유 선택</Text>
        <Text style={styles.sectionDescription}>
          허위 신고는 서비스 이용에 제한이 생길 수 있어요.
        </Text>

        <View style={styles.reasons}>
          {REPORT_REASONS.map((reason, index) => {
            const selected = selectedIndex === index;

            return (
              <Pressable
                key={reason.type}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                style={styles.reason}
                onPress={() => setSelectedIndex(index)}
              >
                <View style={[styles.radio, selected && styles.radioSelected]}>
                  {selected ? <View style={styles.radioDot} /> : null}
                </View>

                <View style={styles.reasonText}>
                  <Text style={styles.reasonTitle}>{reason.title}</Text>
                  <Text numberOfLines={1} style={styles.sectionDescription}>
                    {reason.description}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        <Text style={[styles.sectionTitle, styles.detailsTitle]}>
          자세히 적기 (선택)
        </Text>
        <Text style={styles.sectionDescription}>
          어떤 내용이 문제였는지 자세히 설명해 주세요.
        </Text>

        <View style={styles.detailsBox}>
          <TextInput
            multiline
            value={details}
            maxLength={500}
            accessibilityLabel="신고 내용"
            placeholder="최대 500자까지 입력할 수 있어요."
            placeholderTextColor={colors.neutral400}
            textAlignVertical="top"
            style={[styles.details, focused && styles.detailsFocused]}
            onChangeText={setDetails}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          />
          <Text style={styles.detailsCount}>{details.length}/500</Text>
        </View>

        <Pressable
          accessibilityRole="button"
          disabled={isSubmitting}
          style={[styles.submit, isSubmitting && styles.submitDisabled]}
          onPress={() =>
            onSubmit({
              reportType: REPORT_REASONS[selectedIndex].type,
              comment: details.trim() || null,
            })
          }
        >
          <Text style={styles.submitText}>
            {isSubmitting ? "신고 중" : "신고하기"}
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}

export function LiveReportCompletePage({
  onBackToLive,
  onBlockUser,
}: {
  onBackToLive: () => void;
  onBlockUser: () => void;
}) {
  return (
    <Screen contentStyle={styles.container}>
      <View style={styles.complete}>
        <View style={styles.completeIcon}>
          <Svg width={52} height={52} viewBox="0 0 52 52" fill="none">
            <Path
              d="M15 27.5L23 35.5L38 20.5"
              stroke={colors.white}
              strokeWidth={6}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </View>

        <Text style={styles.completeTitle}>신고가 접수됐어요</Text>
        <Text style={styles.completeDescription}>
          {"검토 후 운영 정책에 따라\n처리될 예정이에요"}
        </Text>
        <Text style={styles.completeHint}>
          {
            "같은 사용자의 메시지를 더 이상 보고 싶지 않다면\n해당 사용자를 차단할 수 있어요"
          }
        </Text>

        <View style={styles.completeActions}>
          <Pressable
            accessibilityRole="button"
            style={[styles.submit, styles.outlineButton]}
            onPress={onBlockUser}
          >
            <Text style={styles.outlineText}>이 사용자 차단하기</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            style={styles.submit}
            onPress={onBackToLive}
          >
            <Text style={styles.submitText}>라이브로 돌아가기</Text>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}

export function LiveChatProfileActionSheet({
  open,
  isBlocked,
  isBlockPending,
  onBlockToggle,
  onClose,
  onReport,
}: {
  open: boolean;
  isBlocked: boolean;
  isBlockPending: boolean;
  onBlockToggle: () => void;
  onClose: () => void;
  onReport: () => void;
}) {
  return (
    <BottomSheetModal
      open={open}
      closeLabel="사용자 메뉴 닫기"
      onClose={onClose}
    >
      <View style={styles.sheet}>
        <View style={styles.sheetHandle} />

        <View style={styles.sheetGroup}>
          <Pressable
            accessibilityRole="button"
            style={[styles.sheetAction, styles.sheetActionDivider]}
            onPress={onReport}
          >
            <Text style={styles.sheetReportText}>댓글 신고하기</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            disabled={isBlockPending}
            style={styles.sheetAction}
            onPress={onBlockToggle}
          >
            <Text style={styles.sheetBlockText}>
              {isBlockPending
                ? "처리 중"
                : isBlocked
                  ? "차단 해제하기"
                  : "사용자 차단하기"}
            </Text>
          </Pressable>
        </View>

        <Pressable
          accessibilityRole="button"
          style={styles.sheetCancel}
          onPress={onClose}
        >
          <Text style={styles.sheetCancelText}>취소</Text>
        </Pressable>
      </View>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    backgroundColor: colors.white,
  },
  header: {
    paddingHorizontal: 15,
  },
  form: {
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 20,
  },
  sectionTitle: {
    ...textStyles.body1,
    color: colors.neutral900,
  },
  sectionDescription: {
    ...textStyles.body5,
    color: colors.neutral600,
  },
  reasons: {
    marginTop: 32,
  },
  reason: {
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral400,
  },
  radio: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.neutral600,
    borderRadius: 12,
  },
  radioSelected: {
    borderColor: colors.secondary500,
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.secondary500,
  },
  reasonText: {
    flex: 1,
    minWidth: 0,
  },
  reasonTitle: {
    ...textStyles.body1,
    color: colors.neutral900,
  },
  detailsTitle: {
    marginTop: 16,
  },
  detailsBox: {
    height: 100,
    marginTop: 8,
  },
  details: {
    ...textStyles.body5,
    height: "100%",
    borderWidth: 1,
    borderColor: colors.neutral400,
    borderRadius: 8,
    backgroundColor: colors.white,
    color: colors.neutral900,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  detailsFocused: {
    borderColor: colors.secondary500,
  },
  detailsCount: {
    ...textStyles.caption5,
    position: "absolute",
    right: 8,
    bottom: 8,
    color: colors.neutral600,
  },
  submit: {
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    borderRadius: 12,
    backgroundColor: colors.secondary500,
  },
  submitDisabled: {
    backgroundColor: colors.secondary300,
  },
  submitText: {
    ...textStyles.label1,
    color: colors.white,
  },
  complete: {
    alignItems: "center",
    paddingHorizontal: 20,
  },
  completeIcon: {
    width: 100,
    height: 100,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 126,
    borderRadius: 50,
    backgroundColor: colors.secondary500,
  },
  completeTitle: {
    marginTop: 20,
    color: colors.neutral900,
    fontSize: 32,
    fontWeight: "700",
    lineHeight: 38,
    textAlign: "center",
  },
  completeDescription: {
    ...textStyles.body2,
    marginTop: 12,
    color: colors.neutral700,
    textAlign: "center",
  },
  completeHint: {
    ...textStyles.caption2,
    marginTop: 32,
    color: colors.neutral600,
    textAlign: "center",
  },
  completeActions: {
    alignSelf: "stretch",
    marginTop: 8,
  },
  outlineButton: {
    borderWidth: 1,
    borderColor: colors.secondary500,
    backgroundColor: colors.white,
  },
  outlineText: {
    ...textStyles.label1,
    color: colors.secondary500,
  },
  sheet: {
    height: 268,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: colors.white,
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 48,
  },
  sheetHandle: {
    position: "absolute",
    top: 7,
    alignSelf: "center",
    width: 42,
    height: 4,
    borderRadius: 4,
    backgroundColor: colors.neutral300,
  },
  sheetGroup: {
    overflow: "hidden",
    borderRadius: 12,
    backgroundColor: "rgba(245, 245, 245, 0.7)",
  },
  sheetAction: {
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  sheetActionDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral300,
  },
  sheetReportText: {
    ...textStyles.label2,
    color: "#007AFF",
  },
  sheetBlockText: {
    ...textStyles.label2,
    color: "#FF3B30",
  },
  sheetCancel: {
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    borderRadius: 12,
    backgroundColor: colors.neutral400,
  },
  sheetCancelText: {
    ...textStyles.label2,
    color: colors.neutral700,
  },
});

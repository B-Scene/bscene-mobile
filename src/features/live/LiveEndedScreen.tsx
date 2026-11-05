import { router, useLocalSearchParams, type Href } from "expo-router";
import { useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import {
  useLiveSummaryQuery,
  useRequestLiveReplayMutation,
} from "@/hooks/api/live/useLiveRoomActions";
import { ConfirmModal } from "@/shared/components/ConfirmModal";
import { Screen } from "@/shared/components/Screen";
import { colors, textStyles } from "@/shared/constants/theme";

const LOVE_IMAGE = require("../../../assets/images/live/love.png");

const formatDuration = (seconds: number) => {
  const pad = (value: number) => String(value).padStart(2, "0");

  return [
    Math.floor(seconds / 3600),
    Math.floor((seconds % 3600) / 60),
    seconds % 60,
  ]
    .map(pad)
    .join(" : ");
};

function SummaryRow({
  label,
  value,
  last = false,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.row, !last && styles.rowDivider]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text numberOfLines={1} style={styles.rowValue}>
        {value}
      </Text>
    </View>
  );
}

export function LiveEndedScreen() {
  const params = useLocalSearchParams<{ liveId?: string }>();
  const parsedLiveId = Number(params.liveId);
  const liveId =
    Number.isFinite(parsedLiveId) && parsedLiveId > 0 ? parsedLiveId : 0;
  const summaryQuery = useLiveSummaryQuery(liveId);
  const replayMutation = useRequestLiveReplayMutation();
  const [isReplayConfirmOpen, setIsReplayConfirmOpen] = useState(false);
  const [message, setMessage] = useState("");
  const summary = summaryQuery.data;
  const isReplayDisabled = !liveId || replayMutation.isPending;

  const confirmReplay = async () => {
    setIsReplayConfirmOpen(false);

    try {
      await replayMutation.mutateAsync(liveId);
      setMessage("다시보기 저장 요청이 접수되었어요.");
    } catch {
      setMessage("다시보기 요청에 실패했어요.");
    }
  };

  return (
    <Screen contentStyle={styles.container}>
      <View style={styles.content}>
        <Image source={LOVE_IMAGE} resizeMode="contain" style={styles.image} />

        <Text style={styles.title}>라이브가 종료되었어요!</Text>
        <Text style={styles.subtitle}>오늘도 팬들과 함께해줘서 고마워요</Text>

        <View style={styles.summary}>
          <SummaryRow
            label="라이브 제목"
            value={
              summaryQuery.isLoading
                ? "불러오는 중"
                : (summary?.title ?? "라이브 제목")
            }
          />
          <SummaryRow
            label="진행 시간"
            value={formatDuration(summary?.durationSec ?? 0)}
          />
          <SummaryRow
            last
            label="총 청취자"
            value={`${summary?.closedViewerCount ?? 0}명`}
          />
        </View>

        {message ? <Text style={styles.message}>{message}</Text> : null}

        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            style={[styles.action, styles.actionOutline]}
            onPress={() => router.replace("/band/live" as Href)}
          >
            <Text style={styles.actionOutlineText}>라이브 탭으로</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            disabled={isReplayDisabled}
            style={[
              styles.action,
              styles.actionFilled,
              isReplayDisabled && styles.disabled,
            ]}
            onPress={() => setIsReplayConfirmOpen(true)}
          >
            <Text style={styles.actionFilledText}>
              {replayMutation.isPending ? "요청 중" : "다시보기 허용하기"}
            </Text>
          </Pressable>
        </View>
      </View>

      <ConfirmModal
        open={isReplayConfirmOpen}
        tone="orange"
        title="다시보기를 허용할까요?"
        description={"라이브를 종료한 후에도\n72시간 동안 다시 볼 수 있어요"}
        onCancel={() => setIsReplayConfirmOpen(false)}
        onConfirm={() => void confirmReplay()}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    backgroundColor: colors.white,
  },
  content: {
    alignItems: "center",
    paddingHorizontal: 32,
    paddingTop: 118,
    paddingBottom: 24,
  },
  image: {
    width: 150,
    height: 150,
  },
  title: {
    marginTop: 52,
    color: colors.neutral900,
    fontSize: 32,
    fontWeight: "700",
    lineHeight: 38,
    textAlign: "center",
  },
  subtitle: {
    ...textStyles.body2,
    marginTop: 12,
    color: colors.neutral900,
    textAlign: "center",
  },
  summary: {
    alignSelf: "stretch",
    marginTop: 48,
    borderRadius: 8,
    backgroundColor: colors.white,
    paddingHorizontal: 28,
    paddingVertical: 8,
    boxShadow: "0px 4px 15px 0px rgba(20, 20, 20, 0.08)",
  },
  row: {
    height: 34,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral300,
  },
  rowLabel: {
    ...textStyles.body3,
    color: colors.neutral600,
    fontWeight: "500",
  },
  rowValue: {
    ...textStyles.body3,
    flexShrink: 1,
    color: colors.neutral900,
    fontWeight: "600",
  },
  message: {
    ...textStyles.caption2,
    marginTop: 16,
    color: colors.secondary500,
    textAlign: "center",
  },
  actions: {
    alignSelf: "stretch",
    flexDirection: "row",
    gap: 16,
    marginTop: 32,
  },
  action: {
    height: 52,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
  },
  actionOutline: {
    borderWidth: 1,
    borderColor: colors.secondary500,
    backgroundColor: colors.white,
  },
  actionFilled: {
    backgroundColor: colors.secondary500,
  },
  actionOutlineText: {
    ...textStyles.label2,
    color: colors.secondary500,
  },
  actionFilledText: {
    ...textStyles.label2,
    color: colors.white,
  },
  disabled: {
    opacity: 0.6,
  },
});

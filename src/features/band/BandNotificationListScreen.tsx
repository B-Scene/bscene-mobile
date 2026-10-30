import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import type { BandMemberPart } from "@/api/band/bandManagement";
import { liveKeys, useRespondCoHostInvitationMutation } from "@/hooks/api/live/useLive";
import { notificationKeys, useMarkNotificationAsRead, useNotificationsInfiniteQuery, useRespondBandNotificationInvite } from "@/hooks/api/notification/useNotification";
import { useFinalizeApplicationSubmissionMutation } from "@/hooks/api/session/useSessionApplication";
import { AppHeader } from "@/shared/components/AppHeader";
import { AppState } from "@/shared/components/AppState";
import { Screen } from "@/shared/components/Screen";
import { colors } from "@/shared/constants/theme";
import { getNotificationDeepLink } from "@/shared/utils/notificationDeepLink";
import type { NotificationItem } from "@/types/notification";
import { getBandNotificationAction, isBandNotification, type NotificationAction } from "./notificationActions";

const parts: { value: BandMemberPart; label: string }[] = [
  { value: "VOCAL", label: "보컬" }, { value: "GUITAR", label: "기타" },
  { value: "BASS", label: "베이스" }, { value: "DRUM", label: "드럼" },
  { value: "KEYBOARD", label: "키보드" },
];

export function BandNotificationListScreen() {
  const query = useNotificationsInfiniteQuery();
  const queryClient = useQueryClient();
  const read = useMarkNotificationAsRead();
  const bandInvite = useRespondBandNotificationInvite();
  const coHost = useRespondCoHostInvitationMutation();
  const finalize = useFinalizeApplicationSubmissionMutation();
  const [selected, setSelected] = useState<{ item: NotificationItem; action: NotificationAction } | null>(null);
  const [nickname, setNickname] = useState("");
  const [part, setPart] = useState<BandMemberPart | null>(null);
  const [busy, setBusy] = useState(false);
  const [completed, setCompleted] = useState<number[]>([]);
  const items = query.data?.pages.flatMap((page) => page.items).filter(isBandNotification) ?? [];

  const respond = async (item: NotificationItem, action: NotificationAction, accept: boolean) => {
    if (busy) return;
    if (accept && action.kind !== "coHostInvite" && (!nickname.trim() || !part)) return;
    setBusy(true);
    try {
      if (action.kind === "bandInvite") {
        await bandInvite.mutateAsync({
          bandId: action.targetId,
          profile: accept && part ? { nickname: nickname.trim(), part } : undefined,
        });
      } else if (action.kind === "coHostInvite") {
        await coHost.mutateAsync({ liveId: action.targetId, isAccepted: accept });
        void queryClient.invalidateQueries({ queryKey: liveKeys.all });
      } else {
        await finalize.mutateAsync({ applySubmissionId: action.targetId,
          body: accept && part ? { isAccepted: true, nickname: nickname.trim(), part } : { isAccepted: false },
        });
      }
      setCompleted((current) => [...current, item.notificationId]);
      setSelected(null);
      try {
        await read.mutateAsync(item.notificationId);
      } catch {
        Alert.alert("처리는 완료됐어요", "읽음 상태를 저장하지 못했어요. 새로고침 후 확인해주세요.");
      }
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      void query.refetch();
      Alert.alert("알림", accept ? "수락했어요." : "거절했어요.");
    } catch (error) {
      Alert.alert("처리 실패", error instanceof Error ? error.message : "잠시 후 다시 시도해주세요.");
    } finally {
      setBusy(false);
    }
  };

  const open = (item: NotificationItem) => {
    if (getBandNotificationAction(item) && !completed.includes(item.notificationId)) return;
    if (!item.isRead) read.mutate(item.notificationId, {
      onError: () => Alert.alert("알림", "읽음 상태를 저장하지 못했어요."),
    });
    const target = getNotificationDeepLink({ ...item }, "band");
    if (target && target.split(/[?#]/)[0] !== "/band/notifications") {
      router.push(target as Parameters<typeof router.push>[0]);
    }
  };

  return (
    <Screen contentStyle={styles.screen}>
      <AppHeader title="알림" onBack={() => router.canGoBack() ? router.back() : router.replace("/band/home")} />
      {query.isLoading ? <AppState loading title="알림을 불러오는 중이에요" /> :
        query.isError ? <AppState title="알림을 불러오지 못했어요" actionLabel="다시 시도" onAction={() => void query.refetch()} /> :
        <>
          <Pressable accessibilityRole="button" disabled={query.isFetching} onPress={() => void query.refetch()}><Text style={styles.link}>새로고침</Text></Pressable>
          {items.length === 0 ? <AppState title="밴드 알림이 없어요" /> : null}
          {items.map((item) => {
            const action = completed.includes(item.notificationId) ? null : getBandNotificationAction(item);
            return (
              <View key={item.notificationId} style={[styles.card, !item.isRead && styles.unread]}>
                <Pressable accessibilityRole="button" onPress={() => open(item)}>
                  <Text style={styles.title}>{item.title}</Text>
                  <Text style={styles.body}>{item.body}</Text>
                  {item.bandInvite?.bandName ? <Text style={styles.title}>{item.bandInvite.bandName}</Text> : null}
                </Pressable>
                {action ? <View style={styles.row}>
                  <Pressable accessibilityRole="button" disabled={busy} style={styles.button} onPress={() => Alert.alert("거절", "이 요청을 거절할까요?", [
                    { text: "취소", style: "cancel" }, { text: "거절", style: "destructive", onPress: () => void respond(item, action, false) },
                  ])}><Text style={styles.link}>거절</Text></Pressable>
                  <Pressable accessibilityRole="button" disabled={busy} style={styles.button} onPress={() => {
                    if (action.kind === "coHostInvite") {
                      Alert.alert("공동 진행 초대", "초대를 수락할까요?", [
                        { text: "취소", style: "cancel" }, { text: "수락", onPress: () => void respond(item, action, true) },
                      ]);
                    } else { setNickname(""); setPart(null); setSelected({ item, action }); }
                  }}><Text style={styles.link}>{busy ? "처리 중" : "수락"}</Text></Pressable>
                </View> : null}
              </View>
            );
          })}
          {query.hasNextPage ? <Pressable accessibilityRole="button" disabled={query.isFetchingNextPage} style={styles.button} onPress={() => void query.fetchNextPage()}>
            <Text style={styles.link}>{query.isFetchingNextPage ? "불러오는 중" : "더보기"}</Text>
          </Pressable> : null}
        </>}
      <Modal visible={selected !== null} transparent animationType="fade" onRequestClose={() => { if (!busy) setSelected(null); }}>
        <Screen contentStyle={styles.overlay}>
          <View style={styles.dialog}>
            <Text style={styles.title}>활동 정보</Text>
            <TextInput accessibilityLabel="활동명" placeholder="활동명" value={nickname} onChangeText={setNickname} editable={!busy} style={styles.input} />
            <View style={styles.row}>{parts.map((option) => <Pressable key={option.value} accessibilityRole="radio" accessibilityState={{ checked: part === option.value }} disabled={busy} onPress={() => setPart(option.value)}>
              <Text style={[styles.part, part === option.value && styles.link]}>{option.label}</Text>
            </Pressable>)}</View>
            <View style={styles.row}>
              <Pressable accessibilityRole="button" disabled={busy} onPress={() => setSelected(null)} style={styles.button}><Text>취소</Text></Pressable>
              <Pressable accessibilityRole="button" disabled={busy || !nickname.trim() || !part} style={styles.button} onPress={() => { if (selected) void respond(selected.item, selected.action, true); }}>
                <Text style={!nickname.trim() || !part || busy ? styles.body : styles.link}>{busy ? "처리 중" : "수락"}</Text>
              </Pressable>
            </View>
          </View>
        </Screen>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { paddingTop: 0, paddingBottom: 104, gap: 12 },
  card: { padding: 16, borderRadius: 12, gap: 12, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.neutral300 },
  unread: { backgroundColor: colors.primary0 },
  title: { fontSize: 16, fontWeight: "600", color: colors.neutral900 },
  body: { fontSize: 14, color: colors.neutral600, marginTop: 6 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  button: { padding: 12, borderRadius: 6, borderWidth: 1, borderColor: colors.neutral300, alignItems: "center", flexGrow: 1 },
  link: { color: colors.primary500, fontWeight: "600" },
  part: { paddingVertical: 12, color: colors.neutral600 },
  input: { padding: 12, borderWidth: 1, borderColor: colors.neutral300, borderRadius: 6 },
  overlay: { flexGrow: 1, justifyContent: "center", backgroundColor: "rgba(0,0,0,0.4)" },
  dialog: { padding: 20, backgroundColor: colors.white, borderRadius: 12, gap: 16 },
});

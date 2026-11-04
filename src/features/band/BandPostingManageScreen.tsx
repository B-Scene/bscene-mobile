import { useQueryClient } from "@tanstack/react-query";
import { router, useFocusEffect, type Href } from "expo-router";
import { useCallback, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { BandBanner } from "@/features/my/BandBanner";
import { MyHeader } from "@/features/my/MyHeader";
import { useDeleteSessionRecruitment } from "@/hooks/api/session/useSessionRecruitment";
import { useActiveBandId } from "@/hooks/api/user/useMyProfiles";
import {
  postingManagementKeys,
  usePostingManagementQuery,
} from "@/hooks/api/user/usePostingManagement";
import { AppState } from "@/shared/components/AppState";
import { ConfirmModal } from "@/shared/components/ConfirmModal";
import { Screen } from "@/shared/components/Screen";
import { colors, shadows, textStyles } from "@/shared/constants/theme";
import { formatDDayLabel } from "@/shared/utils/dDay";
import type { PostingManagementItem } from "@/types/user/postingManagement";

export function BandPostingManageScreen() {
  const queryClient = useQueryClient();
  const { activeBandId } = useActiveBandId();
  const query = usePostingManagementQuery(activeBandId);
  const deleteMutation = useDeleteSessionRecruitment();
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [deleteFailed, setDeleteFailed] = useState(false);
  const firstPage = query.data?.pages[0];
  const postings = query.data?.pages.flatMap((page) => page.content) ?? [];

  // 수정 화면에서 돌아왔을 때 변경 내용을 반영한다.
  useFocusEffect(
    useCallback(() => {
      void queryClient.invalidateQueries({
        queryKey: postingManagementKeys.all,
      });
    }, [queryClient]),
  );

  const openDeleteModal = (recruitmentId: number) => {
    setDeleteFailed(false);
    setDeleteTargetId(recruitmentId);
  };

  const closeDeleteModal = () => {
    if (!deleteMutation.isPending) setDeleteTargetId(null);
  };

  const confirmDelete = async () => {
    if (deleteTargetId === null) return;

    try {
      await deleteMutation.mutateAsync(deleteTargetId);
      await queryClient.invalidateQueries({
        queryKey: postingManagementKeys.all,
      });
      setDeleteTargetId(null);
    } catch {
      setDeleteFailed(true);
    }
  };

  return (
    <Screen scroll={false} contentStyle={styles.container}>
      <MyHeader title="모집 공고 관리" />

      <FlatList
        data={postings}
        keyExtractor={(item) => String(item.sessionRecruitmentId)}
        contentContainerStyle={styles.list}
        ListHeaderComponentStyle={styles.listHeader}
        ListHeaderComponent={
          <BandBanner
            bandName={firstPage?.bandName ?? ""}
            description="현재 선택된 밴드의 모집 공고"
            profileImageUrl={firstPage?.bandProfileImageUrl}
          />
        }
        ItemSeparatorComponent={Separator}
        renderItem={({ item }) => (
          <PostingCard posting={item} onDelete={openDeleteModal} />
        )}
        onEndReached={() => {
          if (query.hasNextPage && !query.isFetchingNextPage) {
            void query.fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.35}
        ListEmptyComponent={
          query.isLoading ? (
            <AppState loading title="모집 공고를 불러오는 중이에요" />
          ) : query.isError ? (
            <AppState
              title="모집 공고를 불러오지 못했어요"
              description="잠시 후 다시 시도해 주세요."
              actionLabel="다시 시도"
              onAction={() => void query.refetch()}
            />
          ) : (
            <AppState title="등록된 모집 공고가 없어요" />
          )
        }
      />

      <ConfirmModal
        open={deleteTargetId !== null}
        tone="orange"
        title="해당 모집 공고를 삭제할까요?"
        description={
          <>
            {
              "공고를 삭제하면 더 이상 지원을\n받을 수 없으며,\n삭제된 내용은 복구할 수 없어요"
            }
            {deleteFailed ? (
              <Text style={styles.deleteError}>
                {
                  "\n모집 공고 삭제에 실패했어요. 잠시 후 다시 시도해주세요."
                }
              </Text>
            ) : null}
          </>
        }
        confirmLabel={deleteMutation.isPending ? "삭제 중" : "확인"}
        confirmDisabled={deleteMutation.isPending}
        onCancel={closeDeleteModal}
        onConfirm={() => void confirmDelete()}
      />
    </Screen>
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

function PostingCard({
  posting,
  onDelete,
}: {
  posting: PostingManagementItem;
  onDelete: (recruitmentId: number) => void;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardBody}>
        <View style={styles.dDayChip}>
          <Text style={styles.dDayText}>{formatDDayLabel(posting.dDay)}</Text>
        </View>

        <View style={styles.cardTexts}>
          <View style={styles.cardTitleBlock}>
            <Text style={styles.cardTitle}>{posting.recruitmentTitle}</Text>
            <Text style={styles.cardMeta}>
              {`${posting.bandName} · ${posting.bandGenre} · ${posting.bandRegion}`}
              <Text style={styles.metaDivider}>{"  |  "}</Text>
              <Text style={styles.postedAgo}>
                {posting.postedAgo === 0 ? "오늘" : `${posting.postedAgo}일 전`}
              </Text>
            </Text>
          </View>
          <Text style={styles.summary}>{posting.summary}</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          style={[styles.actionButton, styles.editButton]}
          onPress={() =>
            router.push(
              `/band/session/recruitments/form?recruitmentId=${posting.sessionRecruitmentId}` as Href,
            )
          }
        >
          <Text style={styles.actionText}>수정</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => onDelete(posting.sessionRecruitmentId)}
        >
          <Text style={styles.actionText}>삭제</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 0,
    paddingVertical: 0,
    backgroundColor: colors.white,
  },
  list: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  listHeader: {
    marginBottom: 24,
  },
  separator: {
    height: 12,
  },
  card: {
    ...shadows.card,
    gap: 10,
    borderRadius: 8,
    backgroundColor: colors.white,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  cardBody: {
    gap: 12,
  },
  dDayChip: {
    alignSelf: "flex-start",
    borderRadius: 999,
    backgroundColor: colors.secondary500,
    paddingHorizontal: 12,
    paddingVertical: 2,
  },
  dDayText: {
    ...textStyles.caption3,
    color: colors.white,
    textAlign: "center",
  },
  cardTexts: {
    gap: 8,
  },
  cardTitleBlock: {
    gap: 4,
  },
  cardTitle: {
    ...textStyles.label1,
    color: colors.neutral900,
  },
  cardMeta: {
    ...textStyles.caption3,
    color: colors.neutral600,
  },
  metaDivider: {
    color: colors.neutral300,
  },
  postedAgo: {
    ...textStyles.caption2,
    color: colors.secondary500,
  },
  summary: {
    ...textStyles.caption2,
    color: colors.neutral800,
  },
  actions: {
    flexDirection: "row",
    gap: 20,
  },
  actionButton: {
    flex: 1,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
  },
  editButton: {
    backgroundColor: colors.secondary0,
  },
  deleteButton: {
    backgroundColor: colors.neutral300,
  },
  actionText: {
    ...textStyles.caption3,
    color: colors.neutral600,
  },
  deleteError: {
    color: colors.error,
  },
});

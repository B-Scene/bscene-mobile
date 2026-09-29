import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useReceivedApplicationsQuery } from "@/hooks/api/user/useReceivedApplications";
import { AppHeader } from "@/shared/components/AppHeader";
import { AppState } from "@/shared/components/AppState";
import { Avatar } from "@/shared/components/Avatar";
import { Screen } from "@/shared/components/Screen";
import { colors } from "@/shared/constants/theme";
import type {
  ApplicantStatus,
  ReceivedApplicant,
  ReceivedRecruitmentPost,
  RecruitmentStatusFilter,
} from "@/types/user/receivedApplications";

const TABS: { code: RecruitmentStatusFilter; label: string }[] = [
  { code: "OPEN", label: "진행중" },
  { code: "CLOSE", label: "마감" },
];

const STATUS_LABEL: Record<ApplicantStatus, string> = {
  PENDING: "검토 대기",
  BAND_ACCEPTED: "확정 대기",
  ACCEPTED: "참여 확정",
  REJECTED: "거절",
};

const formatDate = (value: string) => {
  const dateValue = value.split(" ")[0] ?? value;
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${month}.${day} 마감`;
};

export function BandApplicationsScreen() {
  const [status, setStatus] = useState<RecruitmentStatusFilter>("OPEN");
  const query = useReceivedApplicationsQuery(status);
  const posts = useMemo(
    () => query.data?.pages.flatMap((page) => page.items) ?? [],
    [query.data],
  );
  const applicantCount = posts.reduce(
    (sum, post) => sum + post.totalApplicants,
    0,
  );

  return (
    <Screen scroll={false} contentStyle={styles.container}>
      <AppHeader title="받은 지원 관리" />

      <View style={styles.tabs}>
        {TABS.map((tab) => {
          const selected = status === tab.code;

          return (
            <Pressable
              key={tab.code}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              style={[
                styles.tab,
                selected ? styles.tabSelected : styles.tabIdle,
              ]}
              onPress={() => setStatus(tab.code)}
            >
              <Text
                style={[
                  styles.tabText,
                  selected ? styles.tabTextSelected : styles.tabTextIdle,
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>지원 현황 요약</Text>
        <Text style={styles.summaryValue}>
          공고 {posts.length.toLocaleString()} · 지원자{" "}
          {applicantCount.toLocaleString()}
        </Text>
      </View>

      {query.isLoading ? (
        <AppState loading title="받은 지원을 불러오는 중이에요" />
      ) : query.isError ? (
        <AppState
          title="받은 지원을 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요."
          actionLabel="다시 시도"
          onAction={() => void query.refetch()}
        />
      ) : posts.length === 0 ? (
        <AppState
          title={status === "OPEN" ? "진행중인 공고가 없어요" : "마감된 공고가 없어요"}
          description={
            status === "OPEN"
              ? "진행중인 모집 공고 지원자가 여기에 표시돼요."
              : "마감된 모집 공고 지원자가 여기에 표시돼요."
          }
        />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => String(item.recruitmentPostId)}
          contentContainerStyle={styles.listContent}
          onEndReached={() => {
            if (query.hasNextPage && !query.isFetchingNextPage) {
              void query.fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.4}
          renderItem={({ item }) => (
            <RecruitmentApplicationCard
              post={item}
              isOpen={status === "OPEN"}
            />
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListFooterComponent={
            query.isFetchingNextPage ? (
              <Text style={styles.footerText}>다음 지원자를 불러오는 중이에요</Text>
            ) : null
          }
        />
      )}
    </Screen>
  );
}

function RecruitmentApplicationCard({
  post,
  isOpen,
}: {
  post: ReceivedRecruitmentPost;
  isOpen: boolean;
}) {
  return (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <Text
          style={[
            styles.deadlineBadge,
            isOpen ? styles.deadlineOpen : styles.deadlineClosed,
          ]}
        >
          {formatDate(post.dueDate)}
        </Text>
        <Text style={styles.countBadge}>지원자 {post.totalApplicants}명</Text>
      </View>

      <Text numberOfLines={1} style={styles.postTitle}>
        {post.title}
      </Text>

      <Text numberOfLines={1} style={styles.postMeta}>
        {[post.part, post.genre, post.region].filter(Boolean).join(" · ")}
      </Text>

      <View style={styles.applicants}>
        {post.recruiters.map((applicant) => (
          <Pressable
            key={applicant.applySubmissionId}
            accessibilityRole="button"
            onPress={() =>
              router.push(
                `/band/my/applications/${applicant.applySubmissionId}?status=${applicant.status}` as Parameters<
                  typeof router.push
                >[0],
              )
            }
          >
            <ApplicantRow applicant={applicant} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function ApplicantRow({
  applicant,
}: {
  applicant: ReceivedApplicant;
}) {
  return (
    <View style={styles.applicantRow}>
      <Avatar
        imageUrl={applicant.profileImageUrl}
        label={applicant.name}
        size={44}
      />
      <View style={styles.applicantText}>
        <Text numberOfLines={1} style={styles.applicantName}>
          {applicant.name}
        </Text>
        <Text numberOfLines={1} style={styles.applicantMeta}>
          {[applicant.part, applicant.level, applicant.region]
            .filter(Boolean)
            .join(" · ")}
        </Text>
      </View>
      <Text
        style={[
          styles.statusBadge,
          applicant.status === "PENDING" && styles.statusPending,
          applicant.status === "BAND_ACCEPTED" && styles.statusAcceptedWait,
          applicant.status === "ACCEPTED" && styles.statusAccepted,
          applicant.status === "REJECTED" && styles.statusRejected,
        ]}
      >
        {STATUS_LABEL[applicant.status]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 16,
    paddingHorizontal: 24,
    backgroundColor: colors.white,
  },
  tabs: {
    height: 48,
    flexDirection: "row",
    borderBottomWidth: 2,
    borderBottomColor: colors.neutral300,
    marginHorizontal: -24,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  tabSelected: {
    borderBottomWidth: 2,
    borderBottomColor: colors.secondary500,
    marginBottom: -2,
  },
  tabIdle: {},
  tabText: {
    fontSize: 15,
    fontWeight: "500",
    lineHeight: 20,
  },
  tabTextSelected: {
    color: colors.secondary500,
    fontWeight: "700",
  },
  tabTextIdle: {
    color: colors.neutral400,
  },
  summaryCard: {
    gap: 4,
    borderRadius: 12,
    backgroundColor: colors.white,
    paddingHorizontal: 24,
    paddingVertical: 14,
    shadowColor: colors.neutral900,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 2,
  },
  summaryLabel: {
    color: colors.neutral600,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 18,
  },
  summaryValue: {
    color: colors.neutral900,
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 22,
  },
  listContent: {
    paddingBottom: 32,
  },
  separator: {
    height: 14,
  },
  postCard: {
    gap: 10,
    borderRadius: 12,
    backgroundColor: colors.white,
    paddingHorizontal: 24,
    paddingVertical: 18,
    shadowColor: colors.neutral900,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 2,
  },
  postHeader: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  deadlineBadge: {
    minHeight: 22,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 22,
    paddingHorizontal: 12,
  },
  deadlineOpen: {
    backgroundColor: colors.secondary500,
    color: colors.white,
  },
  deadlineClosed: {
    backgroundColor: colors.neutral300,
    color: colors.neutral600,
  },
  countBadge: {
    minHeight: 22,
    borderRadius: 999,
    backgroundColor: colors.secondary100,
    color: colors.secondary600,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 22,
    paddingHorizontal: 12,
  },
  postTitle: {
    color: colors.neutral900,
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 22,
  },
  postMeta: {
    color: colors.neutral600,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 18,
  },
  applicants: {
    borderTopWidth: 1,
    borderTopColor: colors.neutral300,
    gap: 14,
    paddingTop: 14,
  },
  applicantRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  applicantText: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  applicantName: {
    color: colors.neutral900,
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 20,
  },
  applicantMeta: {
    color: colors.neutral600,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 18,
  },
  statusBadge: {
    minHeight: 22,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 22,
    paddingHorizontal: 12,
  },
  statusPending: {
    backgroundColor: colors.secondary100,
    color: colors.secondary600,
  },
  statusAcceptedWait: {
    backgroundColor: colors.neutral300,
    color: colors.neutral600,
  },
  statusAccepted: {
    backgroundColor: colors.secondary500,
    color: colors.white,
  },
  statusRejected: {
    backgroundColor: colors.neutral300,
    color: colors.neutral600,
  },
  footerText: {
    color: colors.neutral600,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 18,
    paddingVertical: 16,
    textAlign: "center",
  },
});

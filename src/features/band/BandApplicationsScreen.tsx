import { useMemo, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";

import { useReceivedApplicationsQuery } from "@/hooks/api/user/useReceivedApplications";
import { AppCard } from "@/shared/components/AppCard";
import { AppHeader } from "@/shared/components/AppHeader";
import { AppState } from "@/shared/components/AppState";
import { Avatar } from "@/shared/components/Avatar";
import { Badge } from "@/shared/components/Badge";
import { Chip } from "@/shared/components/Chip";
import { Screen } from "@/shared/components/Screen";
import { colors, spacing } from "@/shared/constants/theme";
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

const STATUS_TONE: Record<ApplicantStatus, "neutral" | "pink" | "yellow"> = {
  PENDING: "yellow",
  BAND_ACCEPTED: "neutral",
  ACCEPTED: "pink",
  REJECTED: "neutral",
};

const formatDate = (value: string) => {
  const dateValue = value.split(" ")[0] ?? value;
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return value;

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
        {TABS.map((tab) => (
          <Chip
            key={tab.code}
            label={tab.label}
            selected={status === tab.code}
            onPress={() => setStatus(tab.code)}
          />
        ))}
      </View>

      <AppCard style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>지원 현황 요약</Text>
        <Text style={styles.summaryValue}>
          공고 {posts.length.toLocaleString()} · 지원자{" "}
          {applicantCount.toLocaleString()}
        </Text>
      </AppCard>

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
          renderItem={({ item }) => <RecruitmentApplicationCard post={item} />}
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
}: {
  post: ReceivedRecruitmentPost;
}) {
  return (
    <AppCard style={styles.postCard}>
      <View style={styles.postHeader}>
        <Badge label={formatDate(post.dueDate)} tone="yellow" />
        <Badge label={`지원자 ${post.totalApplicants}명`} />
      </View>
      <Text style={styles.postTitle}>{post.title}</Text>
      <Text style={styles.postMeta}>
        {[post.part, post.genre, post.region].filter(Boolean).join(" · ")}
      </Text>

      <View style={styles.applicants}>
        {post.recruiters.map((applicant) => (
          <ApplicantRow key={applicant.applySubmissionId} applicant={applicant} />
        ))}
      </View>
    </AppCard>
  );
}

function ApplicantRow({ applicant }: { applicant: ReceivedApplicant }) {
  return (
    <View style={styles.applicantRow}>
      <Avatar
        imageUrl={applicant.profileImageUrl}
        label={applicant.name}
        size={44}
      />
      <View style={styles.applicantText}>
        <Text style={styles.applicantName}>{applicant.name}</Text>
        <Text style={styles.applicantMeta}>
          {[applicant.part, applicant.level, applicant.region]
            .filter(Boolean)
            .join(" · ")}
        </Text>
      </View>
      <Badge label={STATUS_LABEL[applicant.status]} tone={STATUS_TONE[applicant.status]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: spacing.lg,
  },
  tabs: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  summaryCard: {
    gap: spacing.xs,
  },
  summaryLabel: {
    color: colors.neutral600,
    fontSize: 13,
    fontWeight: "700",
  },
  summaryValue: {
    color: colors.neutral900,
    fontSize: 18,
    fontWeight: "900",
  },
  listContent: {
    paddingBottom: spacing.xxl,
  },
  postCard: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  postHeader: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  postTitle: {
    color: colors.neutral900,
    fontSize: 17,
    fontWeight: "900",
  },
  postMeta: {
    color: colors.neutral600,
    fontSize: 12,
    lineHeight: 18,
  },
  applicants: {
    borderTopWidth: 1,
    borderTopColor: colors.neutral300,
    gap: spacing.md,
    paddingTop: spacing.md,
  },
  applicantRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  applicantText: {
    flex: 1,
    gap: spacing.xs,
  },
  applicantName: {
    color: colors.neutral900,
    fontSize: 15,
    fontWeight: "800",
  },
  applicantMeta: {
    color: colors.neutral600,
    fontSize: 12,
    lineHeight: 18,
  },
  footerText: {
    color: colors.neutral600,
    fontSize: 12,
    paddingVertical: spacing.md,
    textAlign: "center",
  },
});

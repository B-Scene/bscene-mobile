import { router, type Href } from "expo-router";
import { Fragment, useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { BandBanner } from "@/features/my/BandBanner";
import { MyHeader } from "@/features/my/MyHeader";
import { EmptyState } from "@/features/my/MyProfileParts";
import { useBandMyPageQuery } from "@/hooks/api/user/useBandMyPage";
import { useActiveBandId } from "@/hooks/api/user/useMyProfiles";
import { useReceivedApplicationsQuery } from "@/hooks/api/user/useReceivedApplications";
import { AppIcon } from "@/shared/components/AppIcon";
import { AppState } from "@/shared/components/AppState";
import { ProfileImage } from "@/shared/components/ProfileImage";
import { Screen } from "@/shared/components/Screen";
import { colors, shadows, textStyles } from "@/shared/constants/theme";
import { formatDDayLabel, getDDay } from "@/shared/utils/dDay";
import type {
  ReceivedApplicant,
  ReceivedRecruitmentPost,
  RecruitmentStatusFilter,
} from "@/types/user/receivedApplications";

const TABS: { code: RecruitmentStatusFilter; label: string }[] = [
  { code: "OPEN", label: "진행중인 공고" },
  { code: "CLOSE", label: "마감된 공고" },
];

export function BandApplicationsScreen() {
  const [status, setStatus] = useState<RecruitmentStatusFilter>("OPEN");
  const { data: bandMyPage } = useBandMyPageQuery();
  const { activeBand } = useActiveBandId();
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
      <MyHeader title="받은 지원 관리" />

      <FlatList
        data={posts}
        keyExtractor={(item) => String(item.recruitmentPostId)}
        contentContainerStyle={styles.content}
        ListHeaderComponentStyle={styles.listHeader}
        ListHeaderComponent={
          <>
            <BandBanner
              bandName={bandMyPage?.bandName ?? ""}
              description="현재 선택된 밴드의 모집 공고 지원자"
              profileImageUrl={activeBand?.profileImageUrl}
            />

            <View style={styles.summaryCard}>
              <View style={styles.summaryLeft}>
                <View style={styles.summaryIcon}>
                  <AppIcon name="applyMember" width={19} height={12} />
                </View>
                <Text style={styles.summaryLabel}>지원 현황 요약</Text>
              </View>

              <Text style={styles.summaryValue}>
                공고 <Text style={styles.summaryCount}>{posts.length}</Text> ·
                지원자 <Text style={styles.summaryCount}>{applicantCount}</Text>
              </Text>
            </View>

            <View style={styles.tabs}>
              {TABS.map((tab) => {
                const selected = status === tab.code;

                return (
                  <Pressable
                    key={tab.code}
                    accessibilityRole="tab"
                    accessibilityState={{ selected }}
                    style={[styles.tab, selected && styles.tabSelected]}
                    onPress={() => setStatus(tab.code)}
                  >
                    <Text
                      style={selected ? styles.tabTextOn : styles.tabTextOff}
                    >
                      {tab.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        }
        ItemSeparatorComponent={Separator}
        renderItem={({ item }) => <RecruitmentCard post={item} />}
        onEndReached={() => {
          if (query.hasNextPage && !query.isFetchingNextPage) {
            void query.fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.4}
        ListEmptyComponent={
          query.isLoading ? (
            <AppState loading title="받은 지원을 불러오는 중이에요" />
          ) : query.isError ? (
            <AppState
              title="받은 지원을 불러오지 못했어요"
              description="잠시 후 다시 시도해 주세요."
              actionLabel="다시 시도"
              onAction={() => void query.refetch()}
            />
          ) : (
            <View style={styles.empty}>
              <EmptyState
                title={
                  status === "CLOSE"
                    ? "마감된 공고가 없어요"
                    : "진행중인 공고가 없어요"
                }
                description={
                  status === "CLOSE"
                    ? "마감된 모집 공고가 여기에 표시돼요"
                    : "진행중인 모집 공고가 여기에 표시돼요"
                }
              />
            </View>
          )
        }
      />
    </Screen>
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

function RecruitmentCard({ post }: { post: ReceivedRecruitmentPost }) {
  const dDayLabel = formatDDayLabel(
    getDDay(post.dueDate.split(" ")[0] ?? post.dueDate, new Date()),
  );

  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole="button"
        style={styles.cardHeader}
        onPress={() =>
          router.push(
            `/band/session/recruitments/${post.recruitmentPostId}` as Href,
          )
        }
      >
        <View style={styles.dDayChip}>
          <Text style={styles.dDayText}>{dDayLabel}</Text>
        </View>

        <View style={styles.cardTitleBlock}>
          <Text style={styles.cardTitle}>{post.title}</Text>
          <Text style={styles.cardMeta}>
            {`${post.part} · ${post.genre} · ${post.region}`}
            <Text style={styles.metaDivider}>{"  |  "}</Text>
            <Text style={styles.metaAccent}>
              지원자 {post.totalApplicants}명
            </Text>
          </Text>
        </View>
      </Pressable>

      <View style={styles.applicants}>
        {post.recruiters.map((applicant, index) => (
          <Fragment key={applicant.applySubmissionId}>
            {index > 0 ? <View style={styles.applicantDivider} /> : null}
            <ApplicantRow applicant={applicant} />
          </Fragment>
        ))}
      </View>
    </View>
  );
}

function ApplicantRow({ applicant }: { applicant: ReceivedApplicant }) {
  return (
    <Pressable
      accessibilityRole="button"
      style={styles.applicantRow}
      onPress={() =>
        router.push(
          `/band/my/applications/${applicant.applySubmissionId}?status=${applicant.status}` as Href,
        )
      }
    >
      <View style={styles.applicantMain}>
        <ProfileImage imageUrl={applicant.profileImageUrl} size={40} />

        <View style={styles.applicantText}>
          <Text numberOfLines={1} style={styles.applicantName}>
            {applicant.name}
          </Text>
          <Text numberOfLines={1} style={styles.applicantMeta}>
            {`${applicant.part} · ${applicant.level} · ${applicant.region}`}
            <Text style={styles.metaDivider}>{"  |  "}</Text>
            <Text style={styles.applicantLink}>지원서 확인</Text>
          </Text>
        </View>
      </View>

      {applicant.status === "PENDING" ? (
        <AppIcon name="arrowRight" />
      ) : applicant.status === "REJECTED" ? (
        <View style={[styles.statusChip, styles.statusRejected]}>
          <Text style={styles.statusRejectedText}>거절</Text>
        </View>
      ) : applicant.status === "BAND_ACCEPTED" ? (
        <View style={[styles.statusChip, styles.statusWaiting]}>
          <Text style={styles.statusWaitingText}>확정 대기</Text>
        </View>
      ) : (
        <View style={[styles.statusChip, styles.statusAccepted]}>
          <Text style={styles.statusAcceptedText}>참여 확정</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 0,
    paddingVertical: 0,
    backgroundColor: colors.white,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  listHeader: {
    gap: 24,
    marginBottom: 24,
  },
  summaryCard: {
    ...shadows.card,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    borderRadius: 8,
    backgroundColor: colors.white,
    padding: 12,
  },
  summaryLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  summaryIcon: {
    width: 35,
    height: 35,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: colors.secondary400,
  },
  summaryLabel: {
    ...textStyles.caption3,
    color: colors.neutral600,
  },
  summaryValue: {
    ...textStyles.body1,
    color: colors.neutral800,
  },
  summaryCount: {
    ...textStyles.h3,
    color: colors.secondary500,
    letterSpacing: 0.72,
  },
  tabs: {
    flexDirection: "row",
    borderBottomWidth: 2,
    borderBottomColor: colors.neutral400,
    marginHorizontal: -24,
    paddingHorizontal: 24,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    marginBottom: -2,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
    paddingBottom: 10,
  },
  tabSelected: {
    borderBottomColor: colors.secondary500,
  },
  tabTextOn: {
    ...textStyles.body6,
    color: colors.secondary500,
  },
  tabTextOff: {
    ...textStyles.body1,
    color: colors.neutral400,
  },
  separator: {
    height: 16,
  },
  empty: {
    flex: 1,
    justifyContent: "center",
  },
  card: {
    ...shadows.card,
    gap: 28,
    borderRadius: 8,
    backgroundColor: colors.white,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  cardHeader: {
    gap: 12,
  },
  dDayChip: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: colors.secondary500,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 2,
  },
  dDayText: {
    ...textStyles.caption3,
    color: colors.secondary400,
    textAlign: "center",
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
  metaAccent: {
    color: colors.secondary500,
  },
  applicants: {
    gap: 16,
  },
  applicantDivider: {
    height: 1,
    backgroundColor: colors.neutral400,
  },
  applicantRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  applicantMain: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  applicantText: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  applicantName: {
    ...textStyles.label1,
    color: "#000000",
  },
  applicantMeta: {
    ...textStyles.caption2,
    color: colors.neutral600,
  },
  applicantLink: {
    ...textStyles.caption3,
    color: colors.secondary500,
  },
  statusChip: {
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    paddingHorizontal: 15,
    paddingVertical: 2,
  },
  statusRejected: {
    backgroundColor: colors.neutral300,
  },
  statusRejectedText: {
    ...textStyles.caption3,
    color: colors.neutral600,
  },
  statusWaiting: {
    borderWidth: 1,
    borderColor: colors.secondary500,
  },
  statusWaitingText: {
    ...textStyles.caption3,
    color: colors.secondary500,
  },
  statusAccepted: {
    backgroundColor: colors.secondary400,
  },
  statusAcceptedText: {
    ...textStyles.caption3,
    color: colors.white,
  },
});

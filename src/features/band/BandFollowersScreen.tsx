import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { MyHeader } from "@/features/my/MyHeader";
import { useBandFollowersQuery } from "@/hooks/api/band/useBandFollowers";
import { ProfileImage } from "@/shared/components/ProfileImage";
import { Screen } from "@/shared/components/Screen";
import { colors, textStyles } from "@/shared/constants/theme";

export function BandFollowersScreen() {
  const query = useBandFollowersQuery();
  const followers = query.data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <Screen edges={["top"]} scroll={false} contentStyle={styles.container}>
      <MyHeader title="내 밴드 팔로워" style={styles.header} />

      <Text style={styles.count}>팔로워 {followers.length}명</Text>

      <FlatList
        data={followers}
        keyExtractor={(item) => String(item.userId)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <ProfileImage imageUrl={item.fanProfileImageUrl} size={35} />
            <Text numberOfLines={1} style={styles.nickname}>
              {item.nickname}
            </Text>
          </View>
        )}
        onEndReached={() => {
          if (query.hasNextPage && !query.isFetchingNextPage) {
            void query.fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.35}
        ListEmptyComponent={
          query.isLoading ? (
            <Text style={styles.status}>팔로워를 불러오고 있어요</Text>
          ) : query.isError ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>
                팔로워 목록을 불러오지 못했어요
              </Text>
              <Pressable
                accessibilityRole="button"
                style={styles.retryButton}
                onPress={() => void query.refetch()}
              >
                <Text style={styles.retryText}>다시 시도</Text>
              </Pressable>
            </View>
          ) : (
            <Text style={styles.status}>아직 팔로워가 없어요</Text>
          )
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 0,
    paddingVertical: 0,
    backgroundColor: colors.white,
  },
  header: {
    height: 60,
  },
  count: {
    ...textStyles.caption3,
    color: colors.neutral700,
    marginTop: 16,
    paddingHorizontal: 20,
  },
  list: {
    gap: 20,
    paddingHorizontal: 32,
    paddingTop: 16,
    paddingBottom: 24,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  nickname: {
    ...textStyles.caption3,
    flexShrink: 1,
    color: "#000000",
  },
  status: {
    ...textStyles.caption2,
    color: colors.neutral600,
    paddingVertical: 24,
    textAlign: "center",
  },
  errorBox: {
    alignItems: "center",
    gap: 12,
    paddingVertical: 24,
  },
  errorText: {
    ...textStyles.caption2,
    color: colors.neutral600,
  },
  retryButton: {
    borderRadius: 8,
    backgroundColor: colors.secondary500,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  retryText: {
    ...textStyles.caption3,
    color: colors.white,
  },
});

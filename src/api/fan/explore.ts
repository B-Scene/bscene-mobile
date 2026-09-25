import { AxiosError } from "axios";
import type { AxiosResponse } from "axios";

import { axiosInstance } from "@/api/axiosInstance";
import type {
  FanExploreApiResponse,
  FanExploreBand,
  FanExploreBandDetail,
  FanExploreContent,
  FanExplorePageResponse,
  FanExplorePerformance,
  FanExplorePostComment,
  FanExplorePostCommentsParams,
  FanExplorePostCommentsResponse,
  FanExplorePostDetail,
  FanExplorePostLikeResponse,
  FanExploreRecommendationParams,
  FanExploreSearchParams,
  NormalizedFanExploreBandsResponse,
  NormalizedFanExplorePostComment,
  NormalizedFanExploreContentsResponse,
  NormalizedFanExplorePerformancesResponse,
  UpsertFanExplorePostCommentRequest,
} from "@/types/fan/explore";

const assertSuccess = <T>({
  data,
  config,
  request,
}: Awaited<ReturnType<typeof axiosInstance.get<FanExploreApiResponse<T>>>>) => {
  if (!data.isSuccess || data.result == null) {
    throw new AxiosError(data.message, data.code, config, request, {
      data,
      config,
      request,
      status: data.status ?? 500,
      statusText: data.message,
      headers: {},
    });
  }

  return data.result;
};

const assertMutationSuccess = <T>(
  response: AxiosResponse<FanExploreApiResponse<T>>,
) => {
  const { data } = response;

  if (!data.isSuccess) {
    throw new AxiosError(
      data.message,
      data.code,
      response.config,
      response.request,
      response,
    );
  }

  return data.result;
};

const getItems = <T>(result: FanExplorePageResponse<T> | T[]) => {
  if (Array.isArray(result)) return result;

  return (
    result.items ??
    result.content ??
    result.data ??
    result.list ??
    result.results ??
    result.bands ??
    result.performances ??
    result.concerts ??
    result.posts ??
    result.contents ??
    result.recommendations ??
    result.recommendedBands ??
    result.recommendBands ??
    result.bandRecommendations ??
    []
  );
};

const normalizeCursorPage = <T>(
  result: FanExplorePageResponse<T> | T[],
): {
  items: T[];
  hasNext: boolean;
  page: number;
  nextCursor: number | null;
} => {
  if (Array.isArray(result)) {
    return {
      items: result,
      hasNext: false,
      nextCursor: null,
      page: 0,
    };
  }

  const nextCursor =
    typeof result.nextCursor === "number"
      ? result.nextCursor
      : typeof result.nextCursor === "string"
        ? Number(result.nextCursor)
        : null;

  return {
    ...result,
    items: getItems(result),
    page: result.page ?? 0,
    hasNext: result.hasNext ?? nextCursor != null,
    nextCursor: Number.isFinite(nextCursor) ? nextCursor : null,
  };
};

const removeEmptyParams = (params: Record<string, unknown>) =>
  Object.fromEntries(
    Object.entries(params).filter(([, value]) => {
      if (value === undefined || value === null) return false;
      if (typeof value === "string" && value.trim().length === 0) return false;
      return true;
    }),
  );

const normalizeBandDetail = (result: FanExploreBandDetail) => {
  const bandInfo =
    result.band ??
    result.profile ??
    result.bandProfile ??
    result.bandDetail ??
    result.bandInfo ??
    {};

  return {
    ...bandInfo,
    ...result,
    bandId: result.bandId ?? bandInfo.bandId,
    id: result.id ?? bandInfo.id,
    name: result.name ?? bandInfo.name,
    bandName: result.bandName ?? result.name ?? bandInfo.bandName ?? bandInfo.name,
    genre: result.genre ?? bandInfo.genre,
    region: result.region ?? bandInfo.region,
    profileImageUrl:
      result.profileImageUrl ??
      result.bandProfileImageUrl ??
      result.imageUrl ??
      bandInfo.profileImageUrl ??
      bandInfo.bandProfileImageUrl ??
      bandInfo.imageUrl,
    description:
      result.description ??
      result.bandDescription ??
      result.introduction ??
      bandInfo.description ??
      bandInfo.bandDescription ??
      bandInfo.introduction,
    followerCount:
      result.followerCount ??
      result.followersCount ??
      result.followerCnt ??
      result.followCount ??
      result.followers ??
      bandInfo.followerCount ??
      bandInfo.followersCount ??
      bandInfo.followerCnt ??
      bandInfo.followCount ??
      bandInfo.followers,
    isFollowing:
      result.isFollowing ??
      result.following ??
      result.followed ??
      bandInfo.isFollowing ??
      bandInfo.following ??
      bandInfo.followed,
  };
};

const toNumberOrNull = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const normalizePostDetail = (result: FanExplorePostDetail) => {
  const postInfo =
    (typeof result.content === "object" && result.content != null
      ? result.content
      : result.post ?? result.detail ?? result) as FanExplorePostDetail;
  const bandInfo = postInfo.band ?? result.band;

  return {
    ...postInfo,
    band: bandInfo,
    postId:
      postInfo.postId ??
      postInfo.contentId ??
      toNumberOrNull(postInfo.id) ??
      undefined,
    bandId: postInfo.bandId ?? bandInfo?.bandId ?? toNumberOrNull(bandInfo?.id) ?? undefined,
    bandName: postInfo.bandName ?? postInfo.name ?? bandInfo?.bandName ?? bandInfo?.name,
    profileImageUrl:
      postInfo.profileImageUrl ??
      postInfo.bandProfileImageUrl ??
      bandInfo?.profileImageUrl ??
      bandInfo?.bandProfileImageUrl ??
      bandInfo?.imageUrl,
    type: postInfo.type ?? postInfo.mediaType ?? postInfo.contentType,
    likeCount: postInfo.likeCount ?? postInfo.likes ?? 0,
    commentCount: postInfo.commentCount ?? postInfo.comments ?? 0,
    isLiked: postInfo.isLiked ?? postInfo.liked ?? false,
  };
};

const normalizePostLike = (
  result: FanExplorePostLikeResponse | null | undefined,
  fallbackIsLiked: boolean,
) => ({
  isLiked: result?.isLiked ?? result?.liked ?? fallbackIsLiked,
  likeCount: result?.likeCount ?? result?.likes,
});

const normalizePostComment = (
  result: FanExplorePostComment,
): NormalizedFanExplorePostComment => {
  const commentInfo = result.comment ?? result;
  const author =
    commentInfo.author ??
    commentInfo.user ??
    commentInfo.member ??
    commentInfo.writer ??
    commentInfo;

  return {
    commentId:
      toNumberOrNull(commentInfo.commentId) ?? toNumberOrNull(commentInfo.id),
    authorId:
      toNumberOrNull(author.userId) ??
      toNumberOrNull(author.memberId) ??
      toNumberOrNull(author.authorId) ??
      toNumberOrNull(author.writerId),
    authorName:
      author.nickname ??
      author.authorName ??
      author.userName ??
      author.memberName ??
      author.writerName ??
      author.name ??
      "사용자",
    writerMode: author.writerMode ?? commentInfo.writerMode ?? null,
    profileImageUrl:
      author.profileImageUrl ??
      author.authorProfileImageUrl ??
      author.userProfileImageUrl ??
      author.memberProfileImageUrl ??
      author.writerProfileImageUrl ??
      null,
    content:
      commentInfo.content ??
      commentInfo.body ??
      commentInfo.text ??
      commentInfo.commentText ??
      "",
    createdAt: commentInfo.createdAt ?? null,
    updatedAt: commentInfo.updatedAt ?? null,
    isMine:
      commentInfo.isMine ??
      commentInfo.mine ??
      commentInfo.owner ??
      commentInfo.editable ??
      false,
  };
};

const normalizePostComments = (
  result: FanExplorePageResponse<FanExplorePostComment> | FanExplorePostComment[],
): FanExplorePostCommentsResponse => {
  const items = getItems(result).map(normalizePostComment);
  const page = normalizeCursorPage(result);

  return {
    items,
    myComments: items.filter((item) => item.isMine),
    hasNext: page.hasNext,
    nextCursor: page.nextCursor,
  };
};

export const getRecommendedExploreBands = async ({
  size = 20,
  cursor,
  withDummy,
}: FanExploreRecommendationParams = {}): Promise<NormalizedFanExploreBandsResponse> => {
  const response = await axiosInstance.get<
    FanExploreApiResponse<FanExplorePageResponse<FanExploreBand> | FanExploreBand[]>
  >("/bands/recommendations", {
    params: {
      cursor,
      size,
      withDummy,
    },
  });
  const result = assertSuccess(response);

  if (Array.isArray(result)) {
    return {
      items: result,
      hasNext: false,
      nextCursor: null,
      page: 0,
    };
  }

  const nextCursor =
    typeof result.nextCursor === "number"
      ? result.nextCursor
      : typeof result.nextCursor === "string"
        ? Number(result.nextCursor)
        : null;

  return {
    ...result,
    items: getItems(result),
    page: result.page ?? 0,
    hasNext: result.hasNext ?? nextCursor != null,
    nextCursor: Number.isFinite(nextCursor) ? nextCursor : null,
  };
};

export const getFanExploreBandDetail = async (bandId: number) => {
  const response = await axiosInstance.get<
    FanExploreApiResponse<FanExploreBandDetail>
  >(`/bands/${bandId}/detail`);

  return normalizeBandDetail(assertSuccess(response));
};

export const getFanExplorePostDetail = async (postId: number) => {
  const response = await axiosInstance.get<
    FanExploreApiResponse<FanExplorePostDetail>
  >(`/posts/${postId}/detail`);

  return normalizePostDetail(assertSuccess(response));
};

export const likeFanExplorePost = async (postId: number) => {
  const response = await axiosInstance.post<
    FanExploreApiResponse<FanExplorePostLikeResponse>
  >(`/posts/${postId}/likes`);

  return normalizePostLike(assertMutationSuccess(response), true);
};

export const unlikeFanExplorePost = async (postId: number) => {
  const response = await axiosInstance.delete<
    FanExploreApiResponse<FanExplorePostLikeResponse>
  >(`/posts/${postId}/likes`);

  return normalizePostLike(assertMutationSuccess(response), false);
};

export const getFanExplorePostComments = async (
  postId: number,
  { cursor, size = 10 }: FanExplorePostCommentsParams = {},
) => {
  const response = await axiosInstance.get<
    FanExploreApiResponse<
      FanExplorePageResponse<FanExplorePostComment> | FanExplorePostComment[]
    >
  >(`/posts/${postId}/comments`, {
    params: removeEmptyParams({ cursor, size }),
  });

  return normalizePostComments(assertSuccess(response));
};

export const createFanExplorePostComment = async (
  postId: number,
  body: UpsertFanExplorePostCommentRequest,
) => {
  const response = await axiosInstance.post<
    FanExploreApiResponse<FanExplorePostComment | null>
  >(`/posts/${postId}/comments`, body);
  const result = assertMutationSuccess(response);

  return result ? normalizePostComment(result) : null;
};

export const deleteFanExplorePostComment = async ({
  postId,
  commentId,
}: {
  postId: number;
  commentId: number;
}) => {
  const response = await axiosInstance.delete<FanExploreApiResponse<null>>(
    `/posts/${postId}/comments/${commentId}`,
  );

  return assertMutationSuccess(response);
};

export const searchFanExploreBands = async ({
  keyword,
  sort = "POPULAR",
  cursor,
  size = 20,
  genre,
  region,
}: FanExploreSearchParams): Promise<NormalizedFanExploreBandsResponse> => {
  const response = await axiosInstance.get<
    FanExploreApiResponse<FanExplorePageResponse<FanExploreBand> | FanExploreBand[]>
  >("/explore/search", {
    params: removeEmptyParams({
      keyword,
      type: "BAND",
      sort,
      genre,
      region,
      cursor,
      size,
    }),
  });
  const result = assertSuccess(response);

  if (Array.isArray(result)) {
    return {
      items: result,
      hasNext: false,
      nextCursor: null,
      page: 0,
    };
  }

  const nextCursor =
    typeof result.nextCursor === "number"
      ? result.nextCursor
      : typeof result.nextCursor === "string"
        ? Number(result.nextCursor)
        : null;

  return {
    ...result,
    items: getItems(result),
    page: result.page ?? 0,
    hasNext: result.hasNext ?? nextCursor != null,
    nextCursor: Number.isFinite(nextCursor) ? nextCursor : null,
  };
};

export const searchFanExplorePerformances = async ({
  keyword,
  sort = "POPULAR",
  cursor,
  size = 20,
  genre,
  region,
}: FanExploreSearchParams): Promise<NormalizedFanExplorePerformancesResponse> => {
  const response = await axiosInstance.get<
    FanExploreApiResponse<
      FanExplorePageResponse<FanExplorePerformance> | FanExplorePerformance[]
    >
  >("/explore/search", {
    params: removeEmptyParams({
      keyword,
      type: "PERFORMANCE",
      sort,
      genre,
      region,
      cursor,
      size,
    }),
  });

  return normalizeCursorPage(assertSuccess(response));
};

export const searchFanExploreContents = async ({
  keyword,
  sort = "POPULAR",
  cursor,
  size = 20,
  genre,
  region,
}: FanExploreSearchParams): Promise<NormalizedFanExploreContentsResponse> => {
  const response = await axiosInstance.get<
    FanExploreApiResponse<FanExplorePageResponse<FanExploreContent> | FanExploreContent[]>
  >("/explore/search", {
    params: removeEmptyParams({
      keyword,
      type: "POST",
      sort,
      genre,
      region,
      cursor,
      size,
    }),
  });

  return normalizeCursorPage(assertSuccess(response));
};

export const followExploreBand = async (bandId: number) => {
  const response = await axiosInstance.post<FanExploreApiResponse<null>>(
    `/bands/${bandId}/follow`,
  );

  return assertMutationSuccess(response);
};

export const unfollowExploreBand = async (bandId: number) => {
  const response = await axiosInstance.delete<FanExploreApiResponse<null>>(
    `/bands/${bandId}/follow`,
  );

  return assertMutationSuccess(response);
};

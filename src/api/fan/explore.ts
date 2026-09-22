import { AxiosError } from "axios";
import type { AxiosResponse } from "axios";

import { axiosInstance } from "@/api/axiosInstance";
import type {
  FanExploreApiResponse,
  FanExploreBand,
  FanExploreBandDetail,
  FanExplorePageResponse,
  FanExploreRecommendationParams,
  NormalizedFanExploreBandsResponse,
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
    result.recommendations ??
    result.recommendedBands ??
    result.recommendBands ??
    result.bandRecommendations ??
    []
  );
};

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

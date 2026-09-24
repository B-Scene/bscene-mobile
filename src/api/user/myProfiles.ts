import { axiosInstance } from "@/api/axiosInstance";
import type {
  GetMyProfilesParams,
  MyBandProfileSummary,
  MyFanProfileSummary,
  MyProfilesResponse,
  UserApiResponse,
} from "@/types/user/myProfiles";

type RawRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is RawRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const toNumber = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const toText = (value: unknown, fallback = "") => {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return fallback;
};

const toNullableText = (value: unknown) =>
  typeof value === "string" ? value : null;

const pick = (record: RawRecord, keys: string[]) => {
  for (const key of keys) {
    const value = record[key];
    if (value !== undefined && value !== null) return value;
  }
  return undefined;
};

const getArray = (value: unknown): unknown[] | null => {
  if (Array.isArray(value)) return value;
  if (!isRecord(value)) return null;

  for (const key of ["items", "content", "data", "list", "profiles", "bands"]) {
    if (Array.isArray(value[key])) return value[key];
  }

  return null;
};

const normalizeBandProfile = (value: unknown): MyBandProfileSummary | null => {
  const record = isRecord(value) ? value : {};
  const nestedBand = isRecord(record.band) ? record.band : {};
  const bandId =
    toNumber(pick(record, ["bandId", "id"])) ??
    toNumber(pick(nestedBand, ["bandId", "id"]));
  const bandMemberProfileId =
    toNumber(
      pick(record, [
        "bandMemberProfileId",
        "bandProfileId",
        "profileId",
        "bandMemberId",
      ]),
    ) ?? bandId;

  if (bandId === null || bandMemberProfileId === null) return null;

  return {
    bandId,
    bandMemberProfileId,
    profileImageUrl: toNullableText(
      pick(record, ["profileImageUrl", "bandProfileImageUrl", "imageUrl"]) ??
        pick(nestedBand, ["profileImageUrl", "imageUrl"]),
    ),
    bandName: toText(
      pick(record, ["bandName", "name"]) ?? pick(nestedBand, ["bandName", "name"]),
      "밴드",
    ),
    genre: toText(pick(record, ["genre"]) ?? pick(nestedBand, ["genre"])),
    region: toText(pick(record, ["region"]) ?? pick(nestedBand, ["region"])),
    isActive: record.isActive === true || record.active === true,
  };
};

const normalizeFanProfile = (value: unknown): MyFanProfileSummary | null => {
  const record = isRecord(value) ? value : {};
  const fanProfileId = toNumber(pick(record, ["fanProfileId", "profileId", "id"]));

  if (fanProfileId === null) return null;

  return {
    fanProfileId,
    profileImageUrl: toNullableText(pick(record, ["profileImageUrl", "imageUrl"])),
    nickname: toText(pick(record, ["nickname", "name", "fanNickname"])),
    email: toText(pick(record, ["email", "loginId"])),
    isActive: record.isActive === true || record.active === true,
  };
};

const normalizeMyProfiles = (result: unknown): MyProfilesResponse => {
  const record = isRecord(result) ? result : {};
  const bandSource =
    getArray(result) ??
    getArray(record.bandProfiles) ??
    getArray(record.bands) ??
    getArray(record.bandMemberProfiles) ??
    [];

  return {
    bandProfiles: bandSource
      .map(normalizeBandProfile)
      .filter((profile): profile is MyBandProfileSummary => profile !== null),
    fanProfile: normalizeFanProfile(record.fanProfile ?? record.fan),
  };
};

export const getMyProfiles = async (
  params: GetMyProfilesParams = {},
): Promise<MyProfilesResponse> => {
  const { data } = await axiosInstance.get<UserApiResponse<unknown>>(
    "/users/me/profiles",
    { params },
  );

  if (data.isSuccess === false) {
    throw new Error(data.message || "프로필 목록을 조회하지 못했어요.");
  }

  return normalizeMyProfiles(data.result);
};

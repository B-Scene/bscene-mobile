import { AxiosError } from "axios";

import { axiosInstance } from "@/api/axiosInstance";

export type MediaUploadCategory =
  | "POST"
  | "POST_THUMBNAIL"
  | "STREAM_THUMBNAIL"
  | "BAND_PROFILE"
  | "PERFORMANCE_POSTER"
  | "USER_PROFILE"
  | "SESSION_PROFILE"
  | "SESSION_PORTFOLIO"
  | "ETC";

interface MediaApiResponse<T> {
  isSuccess: boolean;
  status: number;
  code: string;
  message: string;
  result: T;
  timeStamp?: string;
}

interface CreatePresignedUrlResponse {
  presignedUrl: string;
  fileUrl: string;
}

export interface UploadMediaAssetParams {
  category: MediaUploadCategory;
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
}

const createPresignedUrl = async ({
  category,
  fileName,
  contentType,
}: {
  category: MediaUploadCategory;
  fileName: string;
  contentType: string;
}) => {
  const response =
    await axiosInstance.post<
      MediaApiResponse<CreatePresignedUrlResponse>
    >(
      "/media/presigned-url",
      {
        category,
        fileName,
        contentType,
      },
    );

  const { data } = response;

  if (
    !data.isSuccess ||
    !data.result
  ) {
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

const getFileName = (
  uri: string,
  fileName?: string | null,
) => {
  if (fileName?.trim()) {
    return fileName;
  }

  const raw =
    uri.split("/").pop();

  if (raw?.trim()) {
    return raw;
  }

  return `bscene-${Date.now()}.jpg`;
};

export const uploadMediaAsset =
  async ({
    category,
    uri,
    fileName,
    mimeType,
  }: UploadMediaAssetParams) => {
    const resolvedFileName =
      getFileName(
        uri,
        fileName,
      );

    const contentType =
      mimeType?.trim() ||
      "image/jpeg";

    const {
      presignedUrl,
      fileUrl,
    } =
      await createPresignedUrl({
        category,
        fileName:
          resolvedFileName,
        contentType,
      });

    const localResponse =
      await fetch(uri);

    if (!localResponse.ok) {
      throw new Error(
        "선택한 파일을 읽지 못했어요.",
      );
    }

    const blob =
      await localResponse.blob();

    const uploadResponse =
      await fetch(
        presignedUrl,
        {
          method: "PUT",

          headers: {
            "Content-Type":
              contentType,
          },

          body: blob,
        },
      );

    if (
      !uploadResponse.ok
    ) {
      throw new Error(
        `파일 업로드에 실패했어요. (${uploadResponse.status})`,
      );
    }

    return fileUrl;
  };
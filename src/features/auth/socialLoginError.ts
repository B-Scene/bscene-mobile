import { isAxiosError } from "axios";

const getRetryAfterSeconds = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(1, Math.ceil(value));
  }

  if (typeof value === "string") {
    const seconds = Number(value);

    if (Number.isFinite(seconds)) {
      return Math.max(1, Math.ceil(seconds));
    }
  }

  return null;
};

export const getSocialLoginErrorMessage = (
  error: unknown,
  providerName: "카카오" | "Apple",
) => {
  if (isAxiosError<{ message?: string }>(error)) {
    const status = error.response?.status;
    const serverMessage = error.response?.data?.message;

    if (status === 429) {
      const retryAfter = getRetryAfterSeconds(
        error.response?.headers?.["retry-after"],
      );

      return retryAfter
        ? `요청이 많아요. ${retryAfter}초 후 다시 시도해 주세요.`
        : "요청이 많아요. 잠시 후 다시 시도해 주세요.";
    }

    if (status === 503) {
      return "인증 서비스에 연결할 수 없어요. 잠시 후 다시 시도해 주세요.";
    }

    if (status === 401) {
      return `${providerName} 인증이 유효하지 않아요. 다시 로그인해 주세요.`;
    }

    if (serverMessage) {
      return serverMessage;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return `${providerName} 로그인 중 문제가 발생했어요.`;
};

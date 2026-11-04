import { isAxiosError } from "axios";

export const getApiErrorMessage = (
  error: unknown,
  fallbackMessage: string,
) => {
  if (isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message ?? fallbackMessage;
  }

  return fallbackMessage;
};

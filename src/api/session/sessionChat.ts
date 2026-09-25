import { AxiosError, type AxiosResponse } from "axios";

import { axiosInstance } from "@/api/axiosInstance";
import { config } from "@/shared/constants/config";
import type {
  ChatRoomDetailParams,
  ChatRoomDetailResponse,
  ChatRoomsParams,
  ChatRoomsResponse,
  ChatWebSocketTicketResponse,
  CreateChatRoomRequest,
  CreateChatRoomResponse,
  SessionChatApiResponse,
} from "@/types/session/sessionChat";

const removeEmptyParams = (params: Record<string, unknown>) => {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => {
      return value !== undefined && value !== null && value !== "";
    }),
  );
};

const unwrapResponse = <T>(
  response: AxiosResponse<SessionChatApiResponse<T>>,
): T => {
  const { data } = response;

  if (!data.isSuccess || data.result == null) {
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

export const createChatRoom = async (body: CreateChatRoomRequest) => {
  const response = await axiosInstance.post<
    SessionChatApiResponse<CreateChatRoomResponse>
  >("/chat/rooms", body);

  return unwrapResponse(response);
};

export const getChatRooms = async (params: ChatRoomsParams = {}) => {
  const response = await axiosInstance.get<
    SessionChatApiResponse<ChatRoomsResponse>
  >("/chat/rooms", {
    params: removeEmptyParams(params as Record<string, unknown>),
  });

  return unwrapResponse(response);
};

export const getChatRoomDetail = async (
  chatRoomId: number,
  params: ChatRoomDetailParams = {},
) => {
  const response = await axiosInstance.get<
    SessionChatApiResponse<ChatRoomDetailResponse>
  >(`/chat/rooms/${chatRoomId}`, {
    params: removeEmptyParams(params as Record<string, unknown>),
  });

  return unwrapResponse(response);
};

export const leaveChatRoom = async (chatRoomId: number) => {
  const response = await axiosInstance.delete<SessionChatApiResponse<null>>(
    `/chat/rooms/${chatRoomId}`,
  );

  if (!response.data.isSuccess) {
    throw new AxiosError(
      response.data.message,
      response.data.code,
      response.config,
      response.request,
      response,
    );
  }
};

export const issueChatWebSocketTicket = async () => {
  const response = await axiosInstance.post<
    SessionChatApiResponse<ChatWebSocketTicketResponse>
  >("/chat/ws-ticket");

  return unwrapResponse(response);
};

export const getChatWebSocketUrl = (ticket: string) => {
  const apiBaseUrl = config.apiBaseUrl.trim().replace(/\/+$/, "");

  if (!apiBaseUrl) {
    throw new Error("EXPO_PUBLIC_API_BASE_URL이 설정되지 않았습니다.");
  }

  if (!/^https?:\/\//i.test(apiBaseUrl)) {
    throw new Error(
      "WebSocket 연결을 위해 EXPO_PUBLIC_API_BASE_URL은 http 또는 https 전체 주소여야 합니다.",
    );
  }

  const webSocketBaseUrl = apiBaseUrl
    .replace(/^https:/i, "wss:")
    .replace(/^http:/i, "ws:");

  const webSocketPath = webSocketBaseUrl.endsWith("/api")
    ? `${webSocketBaseUrl}/ws/chat`
    : `${webSocketBaseUrl}/api/ws/chat`;

  return `${webSocketPath}?ticket=${encodeURIComponent(ticket)}`;
};
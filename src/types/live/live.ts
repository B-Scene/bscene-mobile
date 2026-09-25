export interface LiveApiResponse<T> {
  isSuccess: boolean;
  status: number;
  code: string;
  message: string;
  result: T;
  timeStamp?: string;
  timestamp?: string;
}

export interface LiveNowItem {
  liveId: number;

  bandProfileImageUrl?:
    | string
    | null;

  thumbnailImageUrl?:
    | string
    | null;

  bandName: string;
  title: string;

  viewerCount: number;

  viewCount?: number;

  isMine?: boolean;
}

export interface ScheduledLiveItem {
  liveId: number;

  thumbnailImageUrl?:
    | string
    | null;

  bandProfileImageUrl?:
    | string
    | null;

  bandName: string;
  title: string;

  scheduledAt: string;

  notificationEnabled?: boolean;

  isMine?: boolean;
}

export interface LiveReplayItem {
  liveId: number;

  replayId?: number;

  thumbnailImageUrl?:
    | string
    | null;

  title: string;
  bandName: string;

  viewCount: number;

  durationSeconds?: number;
}

export interface LiveHomeResponse {
  liveNow: LiveNowItem[];

  replays: LiveReplayItem[];

  scheduled: ScheduledLiveItem[];

  myNickname?:
    | string
    | null;

  myProfileImageUrl?:
    | string
    | null;
}

export type PlaybackRole =
  | "BROADCASTER"
  | "LISTENER"
  | "CO_HOST";

export type PlaybackProtocol =
  | "WHIP"
  | "WHEP"
  | "HLS";

export interface LivePlayback {
  role: PlaybackRole;

  protocol:
    PlaybackProtocol;

  playbackUrl: string;
}

export interface LiveCoPublisher {
  userId: number;
  whepUrl: string;
}

export interface EnterLiveResponse {
  liveId: number;

  isLive: boolean;

  startedAt: string;

  viewerCount?: number;
  viewCount?: number;

  bandProfileImageUrl:
    | string
    | null;

  thumbnailImageUrl?:
    | string
    | null;

  bandName: string;
  title: string;

  description:
    | string
    | null;

  playback: LivePlayback;

  monitorPlaybackUrl?:
    | string
    | null;

  monitorPlaybackProtocol?:
    | PlaybackProtocol
    | null;

  myNickname?:
    | string
    | null;

  myProfileImageUrl?:
    | string
    | null;

  isCoHost?: boolean;

  isBroadcaster?: boolean;

  coPublishers?:
    LiveCoPublisher[];
}

export interface CreateLiveRequest {
  title: string;

  description?:
    | string
    | null;

  thumbnailImageUrl?:
    | string
    | null;

  scheduledAt?:
    | string
    | null;

  coHost?: number[];

  cohosts?:
    | number[]
    | null;
}

export interface CreateLiveResponse {
  audioStreamId: number;

  liveId?: number;

  path: string;

  title: string;

  startedAt?: string;

  playback?: LivePlayback;
}

export interface CloseLiveResponse {
  liveId: string;

  endedAt: string;
}

export interface LiveChatTicketResponse {
  ticket: string;

  subprotocol: string;

  expiresInSeconds: number;
}

export interface LiveChatMessage {
  messageId: string;

  liveId: number;

  senderId: number;

  senderName: string;

  senderProfileImageUrl:
    | string
    | null;

  content: string;

  sentAt: string;
}

export type LiveChatServerFrame =
  | {
      type: "live-chat.message";

      data: LiveChatMessage;

      clientMsgId:
        | string
        | null;
    }
  | {
      type: "system.event";

      data: {
        event:
          | "connected"
          | "live-ended";
      };

      clientMsgId: null;
    }
  | {
      type: "pong";

      data: Record<
        string,
        never
      >;

      clientMsgId: null;
    }
  | {
      type: "system.error";

      data: {
        code: string;
        message: string;
      };

      clientMsgId:
        | string
        | null;
    };
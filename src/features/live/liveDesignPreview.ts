import type {
  EnterLiveResponse,
  LiveChatMessage,
  LiveHomeResponse,
  ReplayPlaybackResponse,
} from "@/types/live/live";

export const LIVE_DESIGN_PREVIEW_ID = 99001;
export const LIVE_REPLAY_DESIGN_PREVIEW_ID = 99002;

export const liveDesignPreviewHome = {
  liveNow: [
    {
      liveId: LIVE_DESIGN_PREVIEW_ID,
      bandName: "WAVY",
      title: "신곡 데모 첫 공개!",
      viewerCount: 30,
      bandProfileImageUrl: null,
    },
    {
      liveId: LIVE_DESIGN_PREVIEW_ID + 1,
      bandName: "BLUE HOUR",
      title: "금요일 밤 합주 라이브",
      viewerCount: 68,
      bandProfileImageUrl: null,
    },
  ],
  scheduled: [
    {
      liveId: 99011,
      bandName: "WAVY",
      title: "새 앨범 이야기",
      scheduledAt: "2026-11-21T20:00:00+09:00",
      isAlarmSet: true,
      bandProfileImageUrl: null,
    },
    {
      liveId: 99012,
      bandName: "MELLOW DAY",
      title: "팬들과 함께하는 Q&A",
      scheduledAt: "2026-11-23T19:30:00+09:00",
      isAlarmSet: false,
      bandProfileImageUrl: null,
    },
  ],
  replays: [
    {
      liveId: LIVE_REPLAY_DESIGN_PREVIEW_ID,
      replayId: LIVE_REPLAY_DESIGN_PREVIEW_ID,
      title: "신곡 데모 첫 공개!",
      bandName: "WAVY",
      viewCount: 6785,
      durationSeconds: 5182,
      thumbnailImageUrl: null,
    },
    {
      liveId: LIVE_REPLAY_DESIGN_PREVIEW_ID + 1,
      title: "팬들과 함께한 라이브",
      bandName: "BLUE HOUR",
      viewCount: 2450,
      durationSeconds: 3612,
      thumbnailImageUrl: null,
    },
  ],
  myNickname: "디자인 확인",
  myProfileImageUrl: null,
} satisfies LiveHomeResponse;

export const liveDesignPreviewRoom: EnterLiveResponse = {
  liveId: LIVE_DESIGN_PREVIEW_ID,
  isLive: true,
  startedAt: new Date(Date.now() - 24 * 60 * 1000 - 15 * 1000).toISOString(),
  viewerCount: 30,
  bandProfileImageUrl: null,
  bandName: "WAVY",
  title: "신곡 데모 첫 공개!",
  description: "미공개 데모를 라이브로 들려드려요",
  playback: {
    role: "LISTENER",
    protocol: "HLS",
    playbackUrl: "",
  },
  myNickname: "디자인 확인",
  myProfileImageUrl: null,
  coPublishers: [],
};

export const liveDesignPreviewMessages: LiveChatMessage[] = [
  {
    messageId: "preview-chat-1",
    liveId: LIVE_DESIGN_PREVIEW_ID,
    senderId: 99101,
    senderName: "최준우",
    senderProfileImageUrl: null,
    content: "라이브 자주 해주세요!!",
    sentAt: "2026-11-19T20:34:00+09:00",
  },
  {
    messageId: "preview-chat-2",
    liveId: LIVE_DESIGN_PREVIEW_ID,
    senderId: 99102,
    senderName: "WAVY",
    senderProfileImageUrl: null,
    content: "여러분 감사합니다!\n신곡은 다음 달 공개 예정이에요!",
    sentAt: "2026-11-19T20:33:00+09:00",
  },
  {
    messageId: "preview-chat-3",
    liveId: LIVE_DESIGN_PREVIEW_ID,
    senderId: 99103,
    senderName: "한아영",
    senderProfileImageUrl: null,
    content: "노래 너무 좋아요!!",
    sentAt: "2026-11-19T20:32:00+09:00",
  },
];

export const liveDesignPreviewReplay: ReplayPlaybackResponse = {
  title: "신곡 데모 첫 공개!",
  bandName: "WAVY",
  bandProfileImageUrl: null,
  thumbnailImageUrl: null,
  viewCount: 6785,
  durationSec: 5182,
  playbackUrl: "",
};

export type LiveRtcHandle = {
  peerConnection: null;

  close:
    () => Promise<void>;
};

const createWebRtcUnsupportedError =
  () => {
    return new Error(
      "모바일 Live 송출 기능은 iOS 또는 Android Development Build에서 사용할 수 있어요.",
    );
  };

export const startWhipBroadcast =
  async (
    _whipUrl: string,
  ): Promise<LiveRtcHandle> => {
    throw createWebRtcUnsupportedError();
  };

export const startWhepPlayback =
  async (
    _whepUrl: string,
  ): Promise<LiveRtcHandle> => {
    throw createWebRtcUnsupportedError();
  };
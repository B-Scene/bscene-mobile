import {
    mediaDevices,
    registerGlobals,
    RTCPeerConnection,
} from "react-native-webrtc";

import {
    resolveLiveMediaUrl,
} from "@/api/live/live";
import {
    secureTokenStorage,
} from "@/shared/utils/secureTokenStorage";

registerGlobals();

const BASE64 =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

const base64EncodeAscii = (
  value: string,
) => {
  let output = "";
  let index = 0;

  while (
    index < value.length
  ) {
    const chr1 =
      value.charCodeAt(
        index++,
      );

    const chr2 =
      value.charCodeAt(
        index++,
      );

    const chr3 =
      value.charCodeAt(
        index++,
      );

    const enc1 =
      chr1 >> 2;

    const enc2 =
      ((chr1 & 3) << 4) |
      (chr2 >> 4);

    let enc3 =
      ((chr2 & 15) << 2) |
      (chr3 >> 6);

    let enc4 =
      chr3 & 63;

    if (
      Number.isNaN(chr2)
    ) {
      enc3 = 64;
      enc4 = 64;
    } else if (
      Number.isNaN(chr3)
    ) {
      enc4 = 64;
    }

    output +=
      BASE64.charAt(enc1) +
      BASE64.charAt(enc2) +
      BASE64.charAt(enc3) +
      BASE64.charAt(enc4);
  }

  return output;
};

const getRtcAuthorization =
  async () => {
    const token =
      await secureTokenStorage.getAccessToken();

    if (!token) {
      throw new Error(
        "로그인이 필요합니다.",
      );
    }

    return `Basic ${base64EncodeAscii(
      `bscene:${token}`,
    )}`;
  };

const waitForIceGatheringComplete =
  (
    peer: RTCPeerConnection,
  ) => {
    return new Promise<void>(
      (resolve) => {
        if (
          peer.iceGatheringState ===
          "complete"
        ) {
          resolve();

          return;
        }

        const timeout =
          setTimeout(() => {
            resolve();
          }, 3000);

        peer.onicegatheringstatechange =
          () => {
            if (
              peer.iceGatheringState ===
              "complete"
            ) {
              clearTimeout(
                timeout,
              );

              resolve();
            }
          };
      },
    );
  };

const createRtcSession =
  async ({
    url,
    sdpOffer,
  }: {
    url: string;
    sdpOffer: string;
  }) => {
    const authorization =
      await getRtcAuthorization();

    const response =
      await fetch(
        resolveLiveMediaUrl(
          url,
        ),
        {
          method: "POST",

          headers: {
            Authorization:
              authorization,

            "Content-Type":
              "application/sdp",

            Accept:
              "application/sdp",
          },

          body: sdpOffer,
        },
      );

    if (!response.ok) {
      throw new Error(
        `RTC 연결에 실패했어요. (${response.status})`,
      );
    }

    const sdpAnswer =
      await response.text();

    const sessionUrl =
      response.headers.get(
        "Location",
      ) ??
      response.headers.get(
        "location",
      );

    return {
      sdpAnswer,
      sessionUrl,
      authorization,
    };
  };

const deleteRtcSession =
  async (
    sessionUrl:
      | string
      | null,
    authorization: string,
  ) => {
    if (!sessionUrl) {
      return;
    }

    try {
      await fetch(
        resolveLiveMediaUrl(
          sessionUrl,
        ),
        {
          method: "DELETE",

          headers: {
            Authorization:
              authorization,
          },
        },
      );
    } catch {
      // RTC 서버 세션 정리는 best effort로 처리한다.
    }
  };

export type LiveRtcHandle = {
  peerConnection:
    RTCPeerConnection;

  close:
    () => Promise<void>;
};

export const startWhipBroadcast =
  async (
    whipUrl: string,
  ): Promise<LiveRtcHandle> => {
    const stream =
      await mediaDevices.getUserMedia(
        {
          audio: true,
          video: false,
        },
      );

    const peer =
      new RTCPeerConnection();

    stream
      .getTracks()
      .forEach(
        (track) => {
          peer.addTrack(
            track,
            stream,
          );
        },
      );

    const offer =
      await peer.createOffer();

    await peer.setLocalDescription(
      offer,
    );

    await waitForIceGatheringComplete(
      peer,
    );

    const sdpOffer =
      peer.localDescription
        ?.sdp;

    if (!sdpOffer) {
      stream
        .getTracks()
        .forEach(
          (track) =>
            track.stop(),
        );

      peer.close();

      throw new Error(
        "WHIP SDP Offer 생성에 실패했어요.",
      );
    }

    const {
      sdpAnswer,
      sessionUrl,
      authorization,
    } =
      await createRtcSession(
        {
          url: whipUrl,
          sdpOffer,
        },
      );

    await peer.setRemoteDescription(
      {
        type: "answer",
        sdp: sdpAnswer,
      },
    );

    return {
      peerConnection:
        peer,

      close: async () => {
        stream
          .getTracks()
          .forEach(
            (track) =>
              track.stop(),
          );

        peer.close();

        await deleteRtcSession(
          sessionUrl,
          authorization,
        );
      },
    };
  };

export const startWhepPlayback =
  async (
    whepUrl: string,
  ): Promise<LiveRtcHandle> => {
    const peer =
      new RTCPeerConnection();

    peer.addTransceiver(
      "audio",
      {
        direction:
          "recvonly",
      },
    );

    const offer =
      await peer.createOffer();

    await peer.setLocalDescription(
      offer,
    );

    await waitForIceGatheringComplete(
      peer,
    );

    const sdpOffer =
      peer.localDescription
        ?.sdp;

    if (!sdpOffer) {
      peer.close();

      throw new Error(
        "WHEP SDP Offer 생성에 실패했어요.",
      );
    }

    const {
      sdpAnswer,
      sessionUrl,
      authorization,
    } =
      await createRtcSession(
        {
          url: whepUrl,
          sdpOffer,
        },
      );

    await peer.setRemoteDescription(
      {
        type: "answer",
        sdp: sdpAnswer,
      },
    );

    return {
      peerConnection:
        peer,

      close: async () => {
        peer.close();

        await deleteRtcSession(
          sessionUrl,
          authorization,
        );
      },
    };
  };
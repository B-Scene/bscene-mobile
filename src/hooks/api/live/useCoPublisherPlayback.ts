import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";

import {
    startWhepPlayback,
    type LiveRtcHandle,
} from "@/shared/services/liveRtc";

import type {
    LiveCoPublisher,
} from "@/types/live/live";

const RETRY_DELAY =
  3000;

type CoPublisherPeer = {
  whepUrl: string;

  handle:
    | LiveRtcHandle
    | null;

  closed: boolean;
};

export function useCoPublisherPlayback({
  enabled,
  publishers,
}: {
  enabled: boolean;

  publishers:
    LiveCoPublisher[];
}) {
  const peersRef =
    useRef(
      new Map<
        number,
        CoPublisherPeer
      >(),
    );

  const retryTimerRef =
    useRef<
      | ReturnType<
          typeof setTimeout
        >
      | null
    >(null);

  const [
    retryNonce,
    setRetryNonce,
  ] = useState(0);

  const closePeer =
    useCallback(
      (userId: number) => {
        const peer =
          peersRef.current.get(
            userId,
          );

        if (!peer) {
          return;
        }

        peersRef.current.delete(
          userId,
        );

        peer.closed = true;

        void peer.handle
          ?.close()
          .catch(() => {});
      },
      [],
    );

  const scheduleRetry =
    useCallback(() => {
      if (
        retryTimerRef.current
      ) {
        return;
      }

      retryTimerRef.current =
        setTimeout(() => {
          retryTimerRef.current =
            null;

          setRetryNonce(
            (current) =>
              current + 1,
          );
        }, RETRY_DELAY);
    }, []);

  const connectPeer =
    useCallback(
      async (
        userId: number,
        whepUrl: string,
      ) => {
        const peer: CoPublisherPeer =
          {
            whepUrl,
            handle: null,
            closed: false,
          };

        peersRef.current.set(
          userId,
          peer,
        );

        try {
          const handle =
            await startWhepPlayback(
              whepUrl,
              {
                onConnectionLost:
                  () => {
                    if (
                      peersRef.current.get(
                        userId,
                      ) !== peer
                    ) {
                      return;
                    }

                    closePeer(
                      userId,
                    );

                    scheduleRetry();
                  },
              },
            );

          if (peer.closed) {
            await handle.close();

            return;
          }

          peer.handle =
            handle;
        } catch {
          if (
            peersRef.current.get(
              userId,
            ) === peer
          ) {
            peersRef.current.delete(
              userId,
            );

            scheduleRetry();
          }
        }
      },
      [
        closePeer,
        scheduleRetry,
      ],
    );

  useEffect(() => {
    const desired =
      new Map(
        enabled
          ? publishers.map(
              (publisher) =>
                [
                  publisher.userId,
                  publisher.whepUrl,
                ] as const,
            )
          : [],
      );

    Array.from(
      peersRef.current,
    ).forEach(
      ([userId, peer]) => {
        if (
          desired.get(
            userId,
          ) !== peer.whepUrl
        ) {
          closePeer(
            userId,
          );
        }
      },
    );

    desired.forEach(
      (whepUrl, userId) => {
        if (
          !peersRef.current.has(
            userId,
          )
        ) {
          void connectPeer(
            userId,
            whepUrl,
          );
        }
      },
    );
  }, [
    closePeer,
    connectPeer,
    enabled,
    publishers,
    retryNonce,
  ]);

  useEffect(() => {
    const peers =
      peersRef.current;

    return () => {
      if (
        retryTimerRef.current
      ) {
        clearTimeout(
          retryTimerRef.current,
        );

        retryTimerRef.current =
          null;
      }

      Array.from(
        peers.keys(),
      ).forEach(closePeer);
    };
  }, [
    closePeer,
  ]);
}

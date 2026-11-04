import {
    useEffect,
    useRef,
} from "react";

import {
    subscribeLiveEvents,
    type LiveEventHandlers,
} from "@/api/live/live";

const RECONNECT_DELAY =
  3000;

export function useLiveEvents({
  liveId,
  enabled,
  onViewerCount,
  onCoPublishersChanged,
  onCoHostUpgradeRequested,
  onCoHostUpgradeAccepted,
}: LiveEventHandlers & {
  liveId:
    | number
    | null;

  enabled: boolean;
}) {
  const handlersRef =
    useRef<LiveEventHandlers>({
      onViewerCount,
      onCoPublishersChanged,
      onCoHostUpgradeRequested,
      onCoHostUpgradeAccepted,
    });

  useEffect(() => {
    handlersRef.current = {
      onViewerCount,
      onCoPublishersChanged,
      onCoHostUpgradeRequested,
      onCoHostUpgradeAccepted,
    };
  }, [
    onCoHostUpgradeAccepted,
    onCoHostUpgradeRequested,
    onCoPublishersChanged,
    onViewerCount,
  ]);

  useEffect(() => {
    if (
      !enabled ||
      !liveId
    ) {
      return;
    }

    const controller =
      new AbortController();

    let reconnectTimer:
      | ReturnType<
          typeof setTimeout
        >
      | null = null;

    const connect =
      async () => {
        try {
          await subscribeLiveEvents({
            liveId,

            signal:
              controller.signal,

            handlers: {
              onViewerCount: (
                viewerCount,
              ) =>
                handlersRef.current.onViewerCount(
                  viewerCount,
                ),

              onCoPublishersChanged: (
                publishers,
              ) =>
                handlersRef.current.onCoPublishersChanged(
                  publishers,
                ),

              onCoHostUpgradeRequested: (
                requester,
              ) =>
                handlersRef.current.onCoHostUpgradeRequested(
                  requester,
                ),

              onCoHostUpgradeAccepted: () =>
                handlersRef.current.onCoHostUpgradeAccepted(),
            },
          });
        } catch {
          // 스트림이 끊기면 아래에서 다시 연결한다.
        }

        if (
          !controller.signal.aborted
        ) {
          reconnectTimer =
            setTimeout(() => {
              void connect();
            }, RECONNECT_DELAY);
        }
      };

    void connect();

    return () => {
      controller.abort();

      if (reconnectTimer) {
        clearTimeout(
          reconnectTimer,
        );
      }
    };
  }, [
    enabled,
    liveId,
  ]);
}

import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";

import {
    getLiveChatTicket,
    getLiveChatWebSocketUrl,
} from "@/api/live/live";

import type {
    LiveChatMessage,
    LiveChatServerFrame,
} from "@/types/live/live";

const HEARTBEAT_INTERVAL =
  15_000;

const HEARTBEAT_TIMEOUT =
  35_000;

const MAX_RECONNECT_DELAY =
  10_000;

type Timer =
  ReturnType<
    typeof setTimeout
  >;

export function useLiveChatSocket({
  liveId,
  enabled,
  onMessage,
  onEnded,
}: {
  liveId:
    | number
    | null;

  enabled: boolean;

  onMessage: (
    message: LiveChatMessage,
  ) => void;

  onEnded?: () => void;
}) {
  const socketRef =
    useRef<WebSocket | null>(
      null,
    );

  const heartbeatRef =
    useRef<Timer | null>(
      null,
    );

  const reconnectRef =
    useRef<Timer | null>(
      null,
    );

  const attemptsRef =
    useRef(0);

  const lastPongRef =
    useRef(Date.now());

  const callbacksRef =
    useRef({
      onMessage,
      onEnded,
    });

  const [
    isConnected,
    setIsConnected,
  ] = useState(false);

  const [
    lastError,
    setLastError,
  ] = useState("");

  useEffect(() => {
    callbacksRef.current = {
      onMessage,
      onEnded,
    };
  }, [
    onEnded,
    onMessage,
  ]);

  const clearTimers =
    useCallback(() => {
      if (
        heartbeatRef.current
      ) {
        clearInterval(
          heartbeatRef.current,
        );

        heartbeatRef.current =
          null;
      }

      if (
        reconnectRef.current
      ) {
        clearTimeout(
          reconnectRef.current,
        );

        reconnectRef.current =
          null;
      }
    }, []);

  useEffect(() => {
    if (
      !enabled ||
      !liveId
    ) {
      return;
    }

    let active = true;

    const connect =
      async () => {
        try {
          const ticket =
            await getLiveChatTicket(
              liveId,
            );

          if (!active) {
            return;
          }

          const socket =
            new WebSocket(
              getLiveChatWebSocketUrl(
                {
                  liveId,
                  ticket:
                    ticket.ticket,
                },
              ),
              ticket.subprotocol ||
                "live-chat.v1",
            );

          socketRef.current =
            socket;

          socket.onopen =
            () => {
              attemptsRef.current =
                0;

              lastPongRef.current =
                Date.now();

              setIsConnected(
                true,
              );

              setLastError(
                "",
              );

              heartbeatRef.current =
                setInterval(
                  () => {
                    if (
                      Date.now() -
                        lastPongRef.current >
                      HEARTBEAT_TIMEOUT
                    ) {
                      socket.close();

                      return;
                    }

                    if (
                      socket.readyState ===
                      WebSocket.OPEN
                    ) {
                      socket.send(
                        JSON.stringify(
                          {
                            type: "ping",
                            data: {},
                            clientMsgId:
                              null,
                          },
                        ),
                      );
                    }
                  },
                  HEARTBEAT_INTERVAL,
                );
            };

          socket.onmessage =
            (event) => {
              try {
                const frame =
                  JSON.parse(
                    String(
                      event.data,
                    ),
                  ) as LiveChatServerFrame;

                if (
                  frame.type ===
                  "live-chat.message"
                ) {
                  callbacksRef.current.onMessage(
                    frame.data,
                  );

                  return;
                }

                if (
                  frame.type ===
                  "pong"
                ) {
                  lastPongRef.current =
                    Date.now();

                  return;
                }

                if (
                  frame.type ===
                    "system.event" &&
                  frame.data
                    .event ===
                    "live-ended"
                ) {
                  callbacksRef.current.onEnded?.();

                  socket.close();
                }

                if (
                  frame.type ===
                  "system.error"
                ) {
                  setLastError(
                    frame.data
                      .message,
                  );
                }
              } catch {
                setLastError(
                  "라이브 채팅 응답을 처리하지 못했어요.",
                );
              }
            };

          socket.onerror =
            () => {
              setLastError(
                "라이브 채팅 연결 오류가 발생했어요.",
              );
            };

          socket.onclose =
            () => {
              setIsConnected(
                false,
              );

              if (!active) {
                return;
              }

              const delay =
                Math.min(
                  1000 *
                    2 **
                      attemptsRef.current,
                  MAX_RECONNECT_DELAY,
                );

              attemptsRef.current +=
                1;

              reconnectRef.current =
                setTimeout(
                  () => {
                    void connect();
                  },
                  delay,
                );
            };
        } catch {
          if (!active) {
            return;
          }

          setLastError(
            "라이브 채팅 연결에 실패했어요.",
          );
        }
      };

    void connect();

    return () => {
      active = false;

      clearTimers();

      socketRef.current?.close();

      socketRef.current =
        null;
    };
  }, [
    clearTimers,
    enabled,
    liveId,
  ]);

  const sendMessage =
    useCallback(
      (
        content: string,
      ) => {
        const trimmed =
          content.trim();

        const socket =
          socketRef.current;

        if (
          !trimmed ||
          !socket ||
          socket.readyState !==
            WebSocket.OPEN
        ) {
          return false;
        }

        if (
          trimmed.length >
          500
        ) {
          setLastError(
            "채팅은 최대 500자까지 입력할 수 있어요.",
          );

          return false;
        }

        socket.send(
          JSON.stringify({
            type:
              "live-chat.send",

            data: {
              content:
                trimmed,
            },

            clientMsgId:
              `${Date.now()}-${Math.random()
                .toString(16)
                .slice(2)}`,
          }),
        );

        return true;
      },
      [],
    );

  return {
    isConnected,
    lastError,
    sendMessage,
  };
}
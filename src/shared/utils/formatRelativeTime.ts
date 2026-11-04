export const formatRelativeTime = (value?: string | null) => {
  if (!value) return "";

  const date = new Date(value);
  const time = date.getTime();

  if (Number.isNaN(time)) return "";

  const diffMinutes = Math.floor(Math.max(0, Date.now() - time) / 60_000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return "방금 전";
  if (diffMinutes < 60) return `${diffMinutes}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffDays < 7) return `${diffDays}일 전`;

  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${date.getFullYear()}. ${month}. ${day}.`;
};

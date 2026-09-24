import type { BandApiResponse } from "@/types/band/band";

export type { BandApiResponse };

export type PostType = "PHOTO" | "TEXT" | "VIDEO";

export interface GetPostsParams {
  type?: PostType;
  cursor?: number;
  size?: number;
}

export interface PostListItem {
  postId: number;
  type: PostType;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  createdAt: string;
}

export interface PostListResponse {
  posts: PostListItem[];
  hasNext: boolean;
  nextCursor: number | null;
}

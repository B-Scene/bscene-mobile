import type { BandApiResponse } from "@/types/band/band";

export type { BandApiResponse };

export type PostType = "PHOTO" | "TEXT" | "VIDEO";

export interface CreatePostRequest {
  type: PostType;
  title: string;
  description?: string;
  mediaUrls?: string[];
  tags?: string[];
  thumbnailUrl?: string;
}

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

export interface PostDetailResponse {
  postId: number;
  bandId: number;
  bandName: string;
  type: PostType;
  title: string;
  description: string | null;
  mediaUrls: string[];
  thumbnailUrl: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export type CreatePostResponse = PostDetailResponse;

export interface UpdatePostRequest {
  title?: string;
  description?: string;
  mediaUrls?: string[];
  tags?: string[];
  thumbnailUrl?: string;
}

export interface UpdatePostResponse {
  postId: number;
  type: PostType;
  title: string;
  description: string | null;
  mediaUrls: string[];
  tags: string[];
  updatedAt: string;
  thumbnailUrl?: string | null;
}

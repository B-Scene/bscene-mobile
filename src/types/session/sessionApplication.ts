export interface SessionApiResponse<T> {
  isSuccess: boolean;
  status: number;
  code: string;
  message: string;
  result: T;
  timeStamp: string;
}

export interface SessionApplicationSummaryItem {
  sessionApplicationId: number;
  displayDate: string;
  isModified: boolean;
  isPublic?: boolean;
  purpose: string;
  title: string;
}

export interface SessionApplicationSummaryResponse {
  hasDefaultApplication: boolean;
  sessionApplicationId: number | null;
  nickname: string;
  profileImageUrl: string | null;
  skillLevel: string | null;
  part: string | null;
  genre: string | null;
  region: string | null;
  applicationCount: number;
  submissionCount: number;
  inProgressCount: number;
  applications: SessionApplicationSummaryItem[];
}

export interface ApplySessionRecruitmentRequest {
  sessionApplicationId: number;
}

export interface ApplySessionRecruitmentResponse {
  applicationSubmissionId: number;
  recruitmentTitle: string;
  bandName: string;
  applicationTitle: string;
}

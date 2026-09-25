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

export interface SessionApplicationCareer {
  sessionApplicationCareerId: number;
  name: string;
  period: string;
  description: string;
}

export interface SessionApplicationPortfolioLink {
  sessionApplicationLinkId: number;
  url: string;
  title: string | null;
  thumbnailUrl: string | null;
  mediaType: string | null;
}

export interface ApplicationSubmissionDetailResponse {
  applicationSubmissionId: number;
  sessionRecruitmentId: number;
  recruitmentTitle: string;
  bandId: number;
  bandName: string;
  isOwner: boolean;
  deadlineAt: string;
  sessionApplicationId: number;
  title: string;
  userId: number;
  profileImageUrl: string | null;
  nickname: string;
  defaultPart: string;
  defaultSkillLevel: string;
  defaultRegion: string;
  isPublic: boolean;
  purpose: string;
  oneLineIntro: string;
  intro: string;
  part: string;
  skillLevel: string;
  genre: string;
  region: string;
  availableActivities: string[];
  careers: SessionApplicationCareer[];
  portfolioLinks: SessionApplicationPortfolioLink[];
}

export interface ApplicationSubmissionItem {
  applicationSubmissionId: number;
  sessionRecruitmentId: number;
  sessionApplicationId: number;
  checkedAt: string | null;
  status: string;
  recruitmentTitle: string;
  bandName: string;
  appliedAgo: number;
}

export interface ApplicationSubmissionsParams {
  cursorId?: number;
  size?: number;
}

export interface ApplicationSubmissionsResponse {
  content: ApplicationSubmissionItem[];
  size: number;
  nextCursor: number | null;
  hasNext: boolean;
}

export type CancelSessionApplicationSubmissionResponse = null;

export interface FinalizeApplicationSubmissionRequest {
  isAccepted: boolean;
  nickname?: string;
  part?: string;
}

export interface FinalizeApplicationSubmissionResponse {
  bandMemberProfileId?: number | null;
}

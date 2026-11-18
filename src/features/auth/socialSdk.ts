export type AppleSdkCredential = {
  identityToken: string;
  authorizationCode: string;
};

export const loginWithKakaoSdk = async (): Promise<string> => {
  throw new Error("카카오 SDK 로그인은 네이티브 앱에서만 지원합니다.");
};

export const loginWithAppleSdk = async (
  _nonce: string,
): Promise<AppleSdkCredential> => {
  throw new Error("Apple SDK 로그인은 iOS 앱에서만 지원합니다.");
};

export const isSocialSdkCancellation = (_error: unknown) => false;

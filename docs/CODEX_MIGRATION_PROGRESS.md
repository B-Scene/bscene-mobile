# B:Scene Mobile Migration Progress

## 현재 전체 진행률

- Phase 0 모바일 기본 Architecture / Dependency / Folder Structure: 완료
- Phase 1 공통 환경: 진행 중
- Phase 2 인증: 로그인 API 연동 기반 완료, 회원가입/OAuth 상세 구현 필요
- Phase 3 Onboarding: 1차 플로우 및 API 저장 기반 완료, 약관/권한 상세 구현 필요
- 전체 기준 대략 12%

## 완료된 작업

- `bscene-client`를 read-only reference로 분석해 전체 웹 Route 구조, Auth API, Onboarding API/type/hook 구조를 파악했다.
- `bscene-mobile`에 Expo Router 기반 Stack navigation을 설정하고 Expo starter tab shell을 제거했다.
- TanStack Query provider를 추가했다.
- Axios API client를 추가하고 웹의 `/auth/reissue` 재발급 흐름을 SecureStore 기반으로 이전했다.
- Auth API, Auth type, Onboarding API, Onboarding type, TanStack Query hooks를 모바일 프로젝트에 이전했다.
- Zustand 기반 auth session store와 onboarding draft store를 추가했다.
- 공통 theme token, Screen, Button, TextInput, Chip 컴포넌트를 추가했다.
- Splash, Login, Signup placeholder, Home shell 화면을 추가했다.
- Onboarding agreement, mode, fan nickname, genre, region, notification permission, complete route를 추가했다.
- Expo ESLint 설정을 생성하고 lint/typecheck가 통과하도록 정리했다.

## 현재 작업 중인 기능

- 인증 및 온보딩을 실제 모바일 UX로 확장하는 단계.

## 다음에 해야 할 작업

1. 웹 `SignupPage`, `SignupPhoneVerification`, `agreementData`를 참고해 모바일 회원가입 전체 입력/검증/휴대폰 인증을 구현한다.
2. OAuth URL/deep link 흐름을 Expo WebBrowser/Linking 기반으로 연결한다.
3. Onboarding 약관 데이터를 실제 웹 agreement data 기준으로 반영하고 알림 권한을 Expo Notifications로 전환한다.
4. Bottom Navigation과 팬/밴드 홈 route group을 만든다.

## 변경한 주요 파일

- `src/app/_layout.tsx`
- `src/app/index.tsx`
- `src/app/login.tsx`
- `src/app/signup.tsx`
- `src/app/home.tsx`
- `src/app/onboarding/*`
- `src/api/axiosInstance.ts`
- `src/api/auth/auth.ts`
- `src/api/onboarding/onboarding.ts`
- `src/hooks/api/auth/useAuth.ts`
- `src/hooks/api/onboarding/useOnboarding.ts`
- `src/providers/AppProviders.tsx`
- `src/stores/useAuthStore.ts`
- `src/stores/useOnboardingDraftStore.ts`
- `src/shared/components/*`
- `src/shared/constants/*`
- `src/shared/utils/secureTokenStorage.ts`
- `src/types/auth/auth.ts`
- `src/types/onboarding/onboarding.ts`
- `eslint.config.js`
- `package.json`
- `package-lock.json`
- `app.json`

## 설치한 패키지

- `axios`
- `@tanstack/react-query`
- `zustand`
- `expo-secure-store`
- `eslint`
- `eslint-config-expo`

## Architecture 결정사항

- Route는 Expo Router의 `src/app` 아래에 두고, 화면/비즈니스 로직은 `src/features`, API는 `src/api`, 재사용 UI는 `src/shared`, 상태는 `src/stores`로 분리한다.
- 웹 API contract는 가능한 그대로 유지한다.
- 인증 토큰은 `localStorage` 대신 `expo-secure-store`를 사용한다.
- API client는 웹과 동일하게 401 발생 시 access token 재발급 후 원 요청을 재시도한다.
- 모바일 초기 화면은 Splash에서 SecureStore token 존재 여부를 확인한 뒤 login/home/onboarding으로 분기한다.

## 기존 Web과 Mobile의 차이

- React Router `createBrowserRouter`를 Expo Router Stack route로 전환했다.
- DOM/CSS/Tailwind 대신 React Native `View`, `Text`, `Pressable`, `TextInput`, `StyleSheet`를 사용한다.
- `localStorage` token persistence를 SecureStore로 전환했다.
- 현재 OAuth, Push, 파일 업로드, live media는 아직 모바일 네이티브 대응 전이다.

## API 관련 결정사항

- `EXPO_PUBLIC_API_BASE_URL` 환경 변수를 mobile API baseURL로 사용한다.
- Auth와 Onboarding endpoint/request/response type은 웹과 동일하게 유지했다.
- Genre/region 목록은 API query를 사용하되, env/API 미설정 상태에서도 화면 확인이 가능하도록 임시 fallback label을 두었다.

## 인증 관련 결정사항

- 로그인 성공 시 access/refresh token을 SecureStore에 저장한다.
- 401 reissue 실패 또는 refresh token 부재 시 session을 guest 상태로 비운다.
- 현재 restore 단계는 token 존재 여부만 확인한다. 다음 작업에서 `/users/me` 또는 onboarding status 조회 기반으로 user hydrate를 보강해야 한다.

## Navigation 구조

- `/`: Splash
- `/login`: Login
- `/signup`: Signup placeholder
- `/home`: 임시 authenticated home shell
- `/onboarding/agreement`
- `/onboarding/mode`
- `/onboarding/fan-nickname`
- `/onboarding/genre`
- `/onboarding/region`
- `/onboarding/notification-permission`
- `/onboarding/complete`

## 해결된 문제

- Expo starter tab shell을 B:Scene Stack shell로 교체했다.
- `expo-secure-store` SDK 호환 설치를 완료했다.
- Expo lint 자동 설정 중 발생한 network/cache 권한 문제를 승인 실행으로 해결했다.
- React lint rule이 starter `use-color-scheme.web.ts`의 effect setState를 오류로 처리하던 문제를 단순 hook 구현으로 수정했다.

## 미해결 문제

- `EXPO_PUBLIC_API_BASE_URL`이 설정되어 있지 않으면 실제 API 요청은 실패한다.
- token restore 시 user 정보가 없어서 앱 재실행 후 mode/onboarding 분기 정확도가 낮다.
- Signup 상세, OAuth, push notification permission, bottom navigation, fan/band actual home은 아직 구현 전이다.

## 알려진 버그

- 앱 재실행 후 SecureStore token만 있고 user hydrate가 안 된 경우 `/home`으로 이동하지만 user 기반 mode UI는 표시되지 않는다.
- Onboarding 약관은 아직 실제 웹 약관 데이터와 완전히 연결되지 않았다.

## 테스트가 필요한 부분

- 실제 API base URL 설정 후 로그인 성공/실패
- 401 access token reissue
- Onboarding nickname 중복 확인
- Onboarding save
- Android/iOS Safe Area 및 Keyboard Avoiding

## 마지막으로 실행한 검증 명령어와 결과

- `npx tsc --noEmit`: 통과
- `npx expo lint`: 통과

## 마지막 Commit Hash

- 커밋 전: `b8fde88`
- 이번 체크포인트 커밋 후 갱신 필요

## 다음 세션이 가장 먼저 해야 할 작업

웹 `src/pages/onboarding/SignupPage.tsx`, `src/features/onboarding/SignupPhoneVerification.tsx`, `src/features/onboarding/agreementData.ts`를 참고해 모바일 회원가입 상세 화면을 구현하고 검증한 뒤 commit한다.

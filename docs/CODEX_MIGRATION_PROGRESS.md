# B:Scene Mobile Migration Progress

## 현재 전체 진행률

- Phase 0 모바일 기본 Architecture / Dependency / Folder Structure: 완료
- Phase 1 공통 환경: 진행 중
- Phase 2 인증: 로그인, 일반 회원가입, OAuth callback/API 연동 기반 완료
- Phase 3 Onboarding: 1차 플로우 및 API 저장 기반 완료, 약관/권한 상세 구현 필요
- Phase 4 공통 UI / Navigation: 1차 기반 완료
- Phase 5 팬 홈: 1차 API 연동 완료
- Phase 6 공연 목록/상세: 1차 API 연동 완료
- Phase 7 팬 탐색 / 밴드 프로필: 1차 API 연동 완료
- Phase 8 공연 관심/알림 mutation: 1차 연동 완료
- Phase 9 팬 마이페이지: 1차 API 연동 완료
- Phase 10 Onboarding 약관 데이터: 웹 기준 반영 완료
- Phase 11 팬 마이페이지 세부 목록: 1차 API 연동 완료
- Phase 12 Expo Notifications 알림 권한: 1차 연동 완료
- Phase 13 밴드 홈: 마이 요약 API 1차 연동 완료
- 전체 기준 대략 39%

## 완료된 작업

- `bscene-client`를 read-only reference로 분석해 전체 웹 Route 구조, Auth API, Onboarding API/type/hook 구조를 파악했다.
- `bscene-mobile`에 Expo Router 기반 Stack navigation을 설정하고 Expo starter tab shell을 제거했다.
- TanStack Query provider를 추가했다.
- Axios API client를 추가하고 웹의 `/auth/reissue` 재발급 흐름을 SecureStore 기반으로 이전했다.
- Auth API, Auth type, Onboarding API, Onboarding type, TanStack Query hooks를 모바일 프로젝트에 이전했다.
- Zustand 기반 auth session store와 onboarding draft store를 추가했다.
- 공통 theme token, Screen, Button, TextInput, Chip 컴포넌트를 추가했다.
- Splash, Login, Signup, Home shell 화면을 추가했다.
- Signup placeholder를 실제 모바일 회원가입 화면으로 교체했다.
- 회원가입 비밀번호 검증, 휴대폰 인증번호 발송/검증, 생년월일/성별 입력, `/auth/signup` 제출을 구현했다.
- OAuth provider URL 실행, `/oauth/callback` code exchange, 신규 소셜 유저 signup token handoff, `/auth/oauth/signup` 제출을 구현했다.
- Onboarding agreement, mode, fan nickname, genre, region, notification permission, complete route를 추가했다.
- 공통 모바일 UI 컴포넌트 `AppHeader`, `AppCard`, `AppState`, `Avatar`, `Badge`를 추가했다.
- 팬/밴드 모드용 Expo Router route group과 Bottom Navigation을 추가했다.
- 웹 BottomNav 구조를 모바일에 반영했다. 팬: 홈/탐색/라이브/마이, 밴드: 내 밴드/세션/라이브/마이.
- `/home` 임시 화면은 현재 모드에 따라 `/fan/home` 또는 `/band/home`으로 redirect하도록 변경했다.
- `.env.example`을 추가해 Expo public env 키를 문서화했다.
- 팬 홈 `/fan/home`에 `/home`, `/performances/upcoming` API를 연결했다.
- 팬 홈의 팔로우 밴드 소식, 추천 밴드, 다가오는 공연 섹션에 Loading/Error/Empty 상태를 구현했다.
- 팬 공연 목록 `/fan/home/concerts`와 공연 상세 `/fan/home/concerts/[concertId]`를 추가했다.
- 공연 목록은 `/performances/upcoming`, 공연 상세는 `/performances/{performanceId}/detail` API를 사용한다.
- 공연 상세에서 공연 정보, 소개, 캐스팅, 예매 링크 열기를 구현했다.
- 팬 탐색 `/fan/explore`에 추천 밴드 API `/bands/recommendations`를 연결했다.
- 밴드 프로필 `/fan/bands/[bandId]`에 `/bands/{bandId}/detail` API를 연결했다.
- 공연 목록/상세에 관심 공연 등록/해제 mutation을 연결했다.
- 공연 상세에 공연 알림 설정/해제 mutation을 연결했다.
- 팬 마이페이지 `/fan/my`에 `/users/me`, `/users/me/information` API를 연결했다.
- 팬 마이페이지 프로필 요약, 팔로잉/관심 공연/참여 공연 카운트, 메뉴 섹션, 로그아웃 액션을 구현했다.
- 웹 `agreementData`를 모바일에 반영하고 Onboarding 약관 화면에 필수/선택 동의와 상세 열람 UI를 연결했다.
- 팬 마이페이지 세부 목록 `/fan/my/followed-bands`, `/fan/my/interested-concerts`, `/fan/my/attended-concerts`를 추가했다.
- 팔로우한 밴드 `/users/me/follows`, 관심 공연 `/users/me/performance/interest`, 공연 참여 기록 `/users/me/performance/history` API를 모바일 목록에 연결했다.
- Expo Notifications 기반 알림 권한 요청, Android notification channel 설정, Expo push token 발급 유틸을 추가했다.
- Onboarding 알림 권한 화면에서 Expo push token을 `/notifications/tokens` API에 등록하도록 연결했다.
- 밴드 홈 `/band/home`에 `/users/me` 밴드 마이 요약 API를 연결했다.
- 밴드 홈에 밴드명, 닉네임, 파트, 팔로워/지원자/공연 카운트와 No Band 상태를 구현했다.
- Expo ESLint 설정을 생성하고 lint/typecheck가 통과하도록 정리했다.

## 현재 작업 중인 기능

- 팬 홈, 공연 목록/상세, 팬 탐색/밴드 프로필, 공연 관심/알림 mutation, 팬 마이페이지/세부 목록, Onboarding 약관 데이터, Expo Notifications 권한 요청, 밴드 홈 요약 API를 구현한 상태. 다음은 팬 탐색 팔로우/언팔로우 mutation 또는 밴드 홈 세부 API 확장이다.

## 다음에 해야 할 작업

1. 팬 탐색 팔로우/언팔로우 mutation을 연결한다.
2. 밴드 홈 세부 API(밴드 프로필, 콘텐츠, 공연, 음원 링크)를 확장 연결한다.
3. 알림 설정 화면과 notification settings API를 연결한다.

## 변경한 주요 파일

- `src/app/_layout.tsx`
- `src/app/index.tsx`
- `src/app/login.tsx`
- `src/app/signup.tsx`
- `src/app/oauth/callback.tsx`
- `src/features/auth/SignupScreen.tsx`
- `src/features/auth/OAuthCallbackScreen.tsx`
- `src/features/onboarding/agreementData.ts`
- `src/app/home.tsx`
- `src/app/fan/*`
- `src/app/band/*`
- `src/app/onboarding/*`
- `src/api/axiosInstance.ts`
- `src/api/auth/auth.ts`
- `src/api/onboarding/onboarding.ts`
- `src/hooks/api/auth/useAuth.ts`
- `src/hooks/api/onboarding/useOnboarding.ts`
- `src/providers/AppProviders.tsx`
- `src/stores/useAuthStore.ts`
- `src/stores/useModeStore.ts`
- `src/stores/useOnboardingDraftStore.ts`
- `src/stores/useOAuthSignupStore.ts`
- `src/features/navigation/*`
- `src/features/fan/*`
- `src/features/fan/concertMappers.ts`
- `src/api/fan/home.ts`
- `src/api/fan/explore.ts`
- `src/api/user/*`
- `src/hooks/api/fan/useFanHome.ts`
- `src/hooks/api/fan/useFanExplore.ts`
- `src/hooks/api/user/*`
- `src/types/fan/home.ts`
- `src/types/fan/explore.ts`
- `src/types/user/*`
- `src/features/band/*`
- `src/shared/components/*`
- `src/shared/constants/*`
- `src/shared/utils/expoNotifications.ts`
- `src/shared/utils/secureTokenStorage.ts`
- `src/api/notification.ts`
- `src/hooks/api/notification/*`
- `src/types/notification.ts`
- `src/shared/utils/formatTime.ts`
- `src/types/auth/auth.ts`
- `src/types/onboarding/onboarding.ts`
- `eslint.config.js`
- `package.json`
- `package-lock.json`
- `app.json`
- `.env.example`

## 설치한 패키지

- `axios`
- `@tanstack/react-query`
- `zustand`
- `expo-secure-store`
- `eslint`
- `eslint-config-expo`
- `lucide-react-native`
- `react-native-svg`

## Architecture 결정사항

- Route는 Expo Router의 `src/app` 아래에 두고, 화면/비즈니스 로직은 `src/features`, API는 `src/api`, 재사용 UI는 `src/shared`, 상태는 `src/stores`로 분리한다.
- 웹 API contract는 가능한 그대로 유지한다.
- 인증 토큰은 `localStorage` 대신 `expo-secure-store`를 사용한다.
- API client는 웹과 동일하게 401 발생 시 access token 재발급 후 원 요청을 재시도한다.
- 모바일 초기 화면은 Splash에서 SecureStore token 존재 여부를 확인한 뒤 login/home/onboarding으로 분기한다.
- 모드별 메인 navigation은 `/fan/*`, `/band/*` route group 아래에서 `ModeTabLayout`과 `BottomNavigation`으로 처리한다.

## 기존 Web과 Mobile의 차이

- React Router `createBrowserRouter`를 Expo Router Stack route로 전환했다.
- DOM/CSS/Tailwind 대신 React Native `View`, `Text`, `Pressable`, `TextInput`, `StyleSheet`를 사용한다.
- `localStorage` token persistence를 SecureStore로 전환했다.
- Push, 파일 업로드, live media는 아직 모바일 네이티브 대응 전이다.
- OAuth는 WebBrowser로 provider URL을 열고 Expo Router callback에서 `code`를 교환한다.
- 회원가입 휴대폰 인증 타이머는 React Native state/effect lint rule에 맞춰 `timeLeft` 기반으로 만료 상태를 표현한다.
- Bottom Navigation은 `lucide-react-native` 아이콘을 사용한다.

## API 관련 결정사항

- `EXPO_PUBLIC_API_BASE_URL` 환경 변수를 mobile API baseURL로 사용한다.
- `EXPO_PUBLIC_KAKAO_OAUTH_URL`, `EXPO_PUBLIC_GOOGLE_OAUTH_URL` 환경 변수를 OAuth 시작 URL로 사용한다.
- 실제 값은 `.env` 등에 두고 commit하지 않는다. repository에는 `.env.example`만 포함한다.
- Auth와 Onboarding endpoint/request/response type은 웹과 동일하게 유지했다.
- Fan Home endpoint는 웹과 동일하게 `/home`, `/performances/upcoming`을 사용한다.
- 공연 상세 endpoint는 웹과 동일하게 `/performances/{performanceId}/detail`을 사용한다.
- 공연 관심/알림 mutation endpoint는 웹과 동일하게 `/performances/{performanceId}/interest`, `/performances/{performanceId}/alarm`을 사용한다.
- 팬 탐색 추천 밴드 endpoint는 웹과 동일하게 `/bands/recommendations`를 사용한다.
- 밴드 프로필 endpoint는 웹과 동일하게 `/bands/{bandId}/detail`을 사용한다.
- 팬 마이페이지 endpoint는 웹과 동일하게 `/users/me`, `/users/me/information`을 사용한다.
- 팬 마이페이지 세부 목록 endpoint는 웹과 동일하게 `/users/me/follows`, `/users/me/performance/interest`, `/users/me/performance/history`를 사용한다.
- 푸시 토큰 등록 endpoint는 웹과 동일하게 `/notifications/tokens`를 사용한다.
- 밴드 홈 요약 endpoint는 웹 Band MyPage와 동일하게 `/users/me`를 사용한다.
- Genre/region 목록은 API query를 사용하되, env/API 미설정 상태에서도 화면 확인이 가능하도록 임시 fallback label을 두었다.

## 인증 관련 결정사항

- 로그인 성공 시 access/refresh token을 SecureStore에 저장한다.
- 일반 회원가입 성공 시 웹과 동일하게 로그인 화면으로 이동한다.
- OAuth 기존 유저는 exchange 결과 token을 SecureStore에 저장한다.
- OAuth 신규 유저는 signup token/social email을 Zustand store에 임시 보관하고 `/signup`에서 소셜 회원가입으로 이어간다.
- 401 reissue 실패 또는 refresh token 부재 시 session을 guest 상태로 비운다.
- 현재 restore 단계는 token 존재 여부만 확인한다. 다음 작업에서 `/users/me` 또는 onboarding status 조회 기반으로 user hydrate를 보강해야 한다.

## Navigation 구조

- `/`: Splash
- `/login`: Login
- `/signup`: Signup
- `/oauth/callback`: OAuth callback exchange
- `/home`: 임시 authenticated home shell
- `/fan/home`: 팬 홈 탭
- `/fan/home/concerts`: 팬 공연 목록
- `/fan/home/concerts/[concertId]`: 팬 공연 상세
- `/fan/explore`: 팬 탐색 탭
- `/fan/bands/[bandId]`: 팬 밴드 프로필
- `/fan/live`: 팬 라이브 탭
- `/fan/my`: 팬 마이 탭
- `/fan/my/followed-bands`: 팬 팔로우한 밴드 목록
- `/fan/my/interested-concerts`: 팬 관심 공연 목록
- `/fan/my/attended-concerts`: 팬 공연 참여 기록
- `/band/home`: 밴드 홈 탭
- `/band/session`: 밴드 세션 탭
- `/band/live`: 밴드 라이브 탭
- `/band/my`: 밴드 마이 탭
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
- Push notification permission은 1차 구현했지만, 실제 기기/EAS projectId/백엔드 토큰 수신 검증이 필요하다.
- Band home은 `/users/me` 요약 API까지 연결했다. 밴드 프로필 상세, 콘텐츠, 공연, 음원 링크 목록은 아직 웹 parity 전이다.
- 팬 홈은 1차 API 연동을 완료했지만, 참여 여부 모달/팔로우 mutation/상세 이동은 아직 웹 parity 전이다.
- 공연 목록/상세는 조회와 관심/알림 mutation 1차 연동을 완료했다. 공유 mutation은 아직 웹 parity 전이다.
- 팬 탐색/밴드 프로필은 조회 중심으로 완료했다. 팔로우/언팔로우 mutation, 검색/필터/콘텐츠 상세는 아직 웹 parity 전이다.
- 팬 마이페이지는 프로필 요약, 카운트, 세부 목록 조회 중심으로 완료했다. 프로필 수정/알림 설정 화면은 아직 웹 parity 전이다.
- Bottom Navigation은 구현됐지만 detail route, modal route, Android hardware back QA는 추가 확인이 필요하다.
- OAuth provider URL env와 redirect URI는 실제 운영/개발 값으로 설정해야 한다.

## 알려진 버그

- 앱 재실행 후 SecureStore token만 있고 user hydrate가 안 된 경우 `/home`으로 이동하지만 user 기반 mode UI는 표시되지 않는다.
- Onboarding 약관은 웹 약관 데이터를 반영했지만, 약관 동의 결과를 별도 API에 저장하는 contract는 아직 확인되지 않았다.

## 테스트가 필요한 부분

- 실제 API base URL 설정 후 로그인 성공/실패
- 일반 회원가입 성공/실패
- 휴대폰 인증번호 발송/검증
- OAuth provider URL 열기
- OAuth callback code exchange
- OAuth 신규 유저 signup token handoff 및 소셜 회원가입
- 401 access token reissue
- Onboarding nickname 중복 확인
- Onboarding save
- Onboarding 약관 필수/선택 동의 및 상세 열람
- Onboarding 알림 권한 요청, Expo push token 발급, `/notifications/tokens` 등록
- Android/iOS Safe Area 및 Keyboard Avoiding
- Bottom Navigation tab 이동
- Fan/Band mode route group 이동
- 팬 홈 `/home`, `/performances/upcoming` 실제 API 응답 렌더링
- 공연 목록 `/performances/upcoming` pagination
- 공연 상세 `/performances/{performanceId}/detail` 실제 API 응답 렌더링
- 공연 관심 등록/해제 `/performances/{performanceId}/interest` 실제 API 상태 동기화
- 공연 알림 설정/해제 `/performances/{performanceId}/alarm` 실제 API 상태 동기화
- 공연 상세 예매 링크 `Linking.openURL`
- 팬 탐색 `/bands/recommendations` 실제 API 응답 렌더링
- 밴드 프로필 `/bands/{bandId}/detail` 실제 API 응답 렌더링
- 팬 마이페이지 `/users/me`, `/users/me/information` 실제 API 응답 렌더링
- 팬 마이페이지 로그아웃 후 `/login` 이동
- 팬 마이페이지 세부 목록 pagination 및 상세 이동
- 밴드 홈 `/users/me` 실제 API 응답 렌더링

## 마지막으로 실행한 검증 명령어와 결과

- `npx tsc --noEmit`: 통과
- `npx expo lint`: 통과

## 마지막 Commit Hash

- 최근 완료 커밋: `04be840`
- 이번 밴드 홈 요약 API 체크포인트 커밋 후 갱신 필요

## 다음 세션이 가장 먼저 해야 할 작업

팬 탐색 팔로우/언팔로우 mutation을 연결한다.

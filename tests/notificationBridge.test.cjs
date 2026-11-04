const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');

function loadTypeScript(file, modules = {}) {
  const source = readFileSync(path.join(__dirname, '..', file), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  });
  const module = { exports: {} };
  vm.runInNewContext(outputText, {
    exports: module.exports,
    require: (name) => {
      assert.ok(name in modules, `Unexpected import: ${name}`);
      return modules[name];
    },
    console,
  });
  return module.exports;
}

const { getNotificationDeepLink } = loadTypeScript('src/shared/utils/notificationDeepLink.ts');

test('web bridge renders without importing native notification APIs', () => {
  const { NativeNotificationBridge } = loadTypeScript(
    'src/shared/components/NativeNotificationBridge.web.tsx',
  );
  assert.equal(NativeNotificationBridge(), null);
});

function createBridge() {
  const state = {
    status: 'idle', user: null, mode: 'fan', pathname: '/', key: undefined,
    response: null, platform: 'ios',
  };
  const pushes = [];
  const handled = { current: new Set() };
  let effects = [];
  let clears = 0;
  const invalidations = [];
  const queryClient = { invalidateQueries: async (params) => { invalidations.push(params); } };
  const receivedListeners = new Set();
  const appStateListeners = new Set();
  const effectSlots = [];
  let effectIndex = 0;
  const notifications = {
    setNotificationHandler() {},
    addNotificationReceivedListener(listener) {
      receivedListeners.add(listener);
      return { remove: () => receivedListeners.delete(listener) };
    },
    requestPermissionsAsync: async () => ({}),
    useLastNotificationResponse: () => state.response,
    clearLastNotificationResponse() { clears++; state.response = null; },
  };
  const { NativeNotificationBridge } = loadTypeScript(
    'src/shared/components/NativeNotificationBridge.tsx', {
      '@tanstack/react-query': { useQueryClient: () => queryClient },
      '@/hooks/api/notification/useNotification': { notificationKeys: { all: ['notifications'] } },
      'expo-router': {
        router: { push: (route) => pushes.push(route) },
        usePathname: () => state.pathname,
        useRootNavigationState: () => ({ key: state.key }),
      },
      'expo-notifications': notifications,
      react: {
        useEffect: (effect, deps) => {
          const index = effectIndex++;
          const previous = effectSlots[index];
          if (!previous || deps.some((value, key) => !Object.is(value, previous.deps[key]))) {
            effects.push(() => {
              previous?.cleanup?.();
              effectSlots[index] = { deps, cleanup: effect() };
            });
          }
        },
        useRef: () => handled,
      },
      'react-native': {
        Platform: { get OS() { return state.platform; } },
        AppState: { addEventListener(event, listener) {
          assert.equal(event, 'change');
          appStateListeners.add(listener);
          return { remove: () => appStateListeners.delete(listener) };
        } },
      },
      '@/shared/utils/notificationDeepLink': { getNotificationDeepLink },
      '@/stores/useAuthStore': { useAuthStore: (selector) => selector(state) },
      '@/stores/useModeStore': { useModeStore: (selector) => selector(state) },
    },
  );
  return {
    state, pushes, invalidations,
    receive() { receivedListeners.forEach((listener) => listener()); },
    changeAppState(value) { appStateListeners.forEach((listener) => listener(value)); },
    unmount() { effectSlots.forEach((slot) => slot.cleanup?.()); },
    get listenerCount() { return receivedListeners.size + appStateListeners.size; },
    get clears() { return clears; },
    render(update = {}) {
      Object.assign(state, update);
      effects = [];
      effectIndex = 0;
      NativeNotificationBridge();
      effects.forEach((effect) => effect());
    },
  };
}

const response = (id = 'push-1', data = { type: 'LIVE_START', liveId: 42 }) => ({
  notification: { request: { identifier: id, content: { data } } },
});
const ready = {
  status: 'authenticated', user: { onboardingCompleted: true },
  key: 'root', pathname: '/fan/home',
};

for (const platform of ['ios', 'android']) {
  test(`${platform}: cold-start tap waits for restored mode and splash exit`, () => {
    const bridge = createBridge();
    bridge.render({ platform, response: response() });
    bridge.render({ ...ready, pathname: '/', mode: 'band' });
    assert.deepEqual(bridge.pushes, []);
    assert.equal(bridge.clears, 0);
    bridge.render({ pathname: '/band/home' });
    assert.deepEqual(bridge.pushes, ['/band/live/room/42']);
    assert.equal(bridge.clears, 1);
  });
}

test('tap survives login and onboarding until an authenticated screen is mounted', () => {
  const bridge = createBridge();
  bridge.render({ ...ready, response: response(), status: 'guest', pathname: '/login' });
  bridge.render({ status: 'authenticated', pathname: '/onboarding/agreement', user: { onboardingCompleted: false } });
  assert.deepEqual(bridge.pushes, []);
  bridge.render(ready);
  assert.deepEqual(bridge.pushes, ['/fan/live/room/42']);
});

test('navigation must be mounted before a response is consumed', () => {
  const bridge = createBridge();
  bridge.render({ ...ready, key: undefined, response: response() });
  assert.deepEqual(bridge.pushes, []);
  bridge.render({ key: 'root' });
  assert.equal(bridge.pushes.length, 1);
});

test('repeated delivery or mode changes do not replay a handled tap', () => {
  const bridge = createBridge();
  const tap = response();
  bridge.render({ ...ready, response: tap });
  bridge.render({ response: tap, mode: 'band' });
  bridge.render({ response: response('push-2') });
  bridge.render({ response: tap });
  assert.deepEqual(bridge.pushes, ['/fan/live/room/42', '/band/live/room/42']);
  assert.equal(bridge.clears, 2);
});

test('a later launch does not replay the cleared response', () => {
  const bridge = createBridge();
  bridge.render({ ...ready, response: response() });
  const next = createBridge();
  next.render({ ...ready, response: bridge.state.response });
  assert.deepEqual(next.pushes, []);
});

test('explicit mobile links retain invite query parameters', () => {
  const bridge = createBridge();
  bridge.render({ ...ready, response: response('invite', {
    deepLink: 'bscenemobile://band/live/room/42?coHostInvite=1&requesterUserId=7',
  }) });
  assert.deepEqual(bridge.pushes, ['/band/live/room/42?coHostInvite=1&requesterUserId=7']);
});

test('web and unknown payloads do not navigate', () => {
  const bridge = createBridge();
  bridge.render({ ...ready, platform: 'web', response: response() });
  bridge.render({ platform: 'ios', response: response('unknown', {}) });
  assert.deepEqual(bridge.pushes, []);
  assert.equal(bridge.clears, 0);
});


const { getBandNotificationAction, isBandNotification } = loadTypeScript('src/features/band/notificationActions.ts');
const notification = (update = {}) => ({
  notificationId: 1, type: 'LIVE', referenceId: 42, title: '', body: '',
  isRead: false, createdAt: '', ...update,
});

test('only an actionable band invitation uses bandId, never member referenceId', () => {
  const item = notification({ type: 'BAND_INVITE', actionable: true, bandInvite: { bandId: 7 } });
  const action = getBandNotificationAction(item);
  assert.equal(action.kind, 'bandInvite');
  assert.equal(action.targetId, 7);
  assert.equal(getBandNotificationAction({ ...item, actionable: false }), null);
  assert.equal(getBandNotificationAction({ ...item, bandInvite: null }), null);
});

test('Live invitation responses and ordinary Live notifications cannot be accepted as invitations', () => {
  assert.equal(getBandNotificationAction(notification({ title: '공동 진행자로 초대됐어요' })).kind, 'coHostInvite');
  for (const title of ['공동 진행자 초대 응답이 도착했어요', '라이브가 시작됐어요', '라이브 다시보기가 등록됐어요']) {
    assert.equal(getBandNotificationAction(notification({ title })), null);
  }
});

test('session finalize is offered only for an unread accepted application', () => {
  const item = notification({ type: 'SESSION', title: '세션 지원이 수락되었어요' });
  assert.equal(getBandNotificationAction(item).kind, 'sessionFinalize');
  assert.equal(getBandNotificationAction({ ...item, isRead: true }), null);
  assert.equal(getBandNotificationAction({ ...item, title: '세션 지원이 거절되었어요' }), null);
});

test('invalid reference IDs cannot trigger Live or session actions', () => {
  for (const referenceId of [null, 0, -1, 'bad', 1.5]) {
    assert.equal(getBandNotificationAction(notification({ title: '공동 진행자로 초대됐어요', referenceId })), null);
  }
});

test('band inbox excludes fan links and honors server mode', () => {
  assert.equal(isBandNotification(notification({ deepLink: '/fan/live/room/42' })), false);
  assert.equal(isBandNotification(notification({ mode: 'FAN' })), false);
  assert.equal(isBandNotification(notification({ mode: 'BAND' })), true);
  assert.equal(isBandNotification(notification({ type: 'SESSION', deepLink: '/band/notifications' })), true);
});

test('band invitation responses preserve web endpoints and reject application errors', async () => {
  const calls = [];
  let success = true;
  const client = Object.fromEntries(['patch', 'delete'].map((method) => [method, async (...args) => {
    calls.push([method, ...args]);
    return { data: { isSuccess: success, result: null, message: 'rejected' } };
  }]));
  const api = loadTypeScript('src/api/band/notificationInvite.ts', { '@/api/axiosInstance': { axiosInstance: client } });
  const profile = { nickname: '테스트', part: 'GUITAR' };
  await api.respondBandNotificationInvite({ bandId: 7, profile });
  await api.respondBandNotificationInvite({ bandId: 7 });
  assert.deepEqual(calls, [
    ['patch', '/bands/7/members/accept', profile], ['delete', '/bands/7/members/reject'],
  ]);
  success = false;
  await assert.rejects(api.respondBandNotificationInvite({ bandId: 7, profile }), /rejected/);
});

test('notification normalization retains nested band invitation action data', async () => {
  const api = loadTypeScript('src/api/notification.ts', {
    axios: { AxiosError: Error },
    '@/api/axiosInstance': { axiosInstance: { get: async () => ({ data: { isSuccess: true, result: {
      items: [{ notificationId: 1, type: 'BAND_INVITE', bandInvite: {
        bandId: '7', bandName: 'B:Scene', actionable: true,
        bandInviteId: '12', bandMemberId: '13', position: 'GUITAR',
        genre: 'ROCK', region: 'SEOUL', memberCount: '4', acceptedMemberCount: '3',
        profileImageUrl: 'https://example.com/band.png', extraLabel: '초대',
      } }],
    } } }) } },
  });
  const result = await api.getNotifications();
  assert.equal(result.items[0].actionable, true);
  assert.equal(result.items[0].bandInvite.bandId, 7);
  assert.equal(result.items[0].bandInvite.bandName, 'B:Scene');
  assert.equal(result.items[0].bandInvite.bandInviteId, 12);
  assert.equal(result.items[0].bandInvite.bandMemberId, 13);
  assert.equal(result.items[0].bandInvite.position, 'GUITAR');
  assert.equal(result.items[0].bandInvite.genre, 'ROCK');
  assert.equal(result.items[0].bandInvite.region, 'SEOUL');
  assert.equal(result.items[0].bandInvite.memberCount, 4);
  assert.equal(result.items[0].bandInvite.acceptedMemberCount, 3);
  assert.equal(result.items[0].bandInvite.profileImageUrl, 'https://example.com/band.png');
  assert.equal(result.items[0].bandInvite.extraLabel, '초대');
});


for (const platform of ['ios', 'android']) {
  test(`${platform}: receipt and foreground refresh the real notification query without navigating`, () => {
    const bridge = createBridge();
    bridge.render({ ...ready, platform });
    const initial = bridge.invalidations.length;
    bridge.receive();
    bridge.changeAppState('background');
    bridge.changeAppState('inactive');
    bridge.changeAppState('active');
    assert.equal(bridge.invalidations.length, initial + 2);
    assert.equal(bridge.invalidations.at(-1).queryKey[0], 'notifications');
    assert.deepEqual(bridge.pushes, []);
    bridge.unmount();
    assert.equal(bridge.listenerCount, 0);
  });
}

test('logout removes native subscriptions and prevents guest notification queries', () => {
  const bridge = createBridge();
  bridge.render(ready);
  assert.equal(bridge.listenerCount, 2);
  bridge.render({ status: 'guest', user: null, pathname: '/login' });
  const count = bridge.invalidations.length;
  assert.equal(bridge.listenerCount, 0);
  bridge.receive();
  bridge.changeAppState('active');
  assert.equal(bridge.invalidations.length, count);
});

test('ordinary rerenders do not duplicate listeners and web has none', () => {
  const bridge = createBridge();
  bridge.render(ready);
  bridge.render({ pathname: '/fan/my' });
  assert.equal(bridge.listenerCount, 2);
  const web = createBridge();
  web.render({ ...ready, platform: 'web' });
  assert.equal(web.listenerCount, 0);
});

function createPushRegistration({ platform = 'ios', device = true, permission = 'granted', requested = 'granted', projectId = 'project-test', error } = {}) {
  const calls = [];
  const fn = (name, result) => async (...args) => { calls.push([name, ...args]); return result; };
  const api = loadTypeScript('src/shared/utils/expoNotifications.ts', {
    'expo-constants': { __esModule: true, default: { easConfig: { projectId } } },
    'expo-device': { isDevice: device },
    'react-native': { Platform: { OS: platform } },
    'expo-notifications': {
      AndroidImportance: { MAX: 5 },
      setNotificationChannelAsync: fn('channel'),
      getPermissionsAsync: fn('permission', { status: permission }),
      requestPermissionsAsync: fn('request', { status: requested }),
      getExpoPushTokenAsync: async (options) => {
        calls.push(['token', options]);
        if (error) throw error;
        return { data: 'ExponentPushToken[test-only]' };
      },
    },
  });
  return { calls, run: api.requestExpoPushToken };
}

test('push registration skips unsupported simulated devices', async () => {
  const registration = createPushRegistration({ device: false });
  assert.equal((await registration.run()).status, 'unavailable');
  assert.deepEqual(registration.calls, []);
});

test('Android creates its channel before requesting permission', async () => {
  const registration = createPushRegistration({ platform: 'android', permission: 'undetermined' });
  assert.equal((await registration.run()).status, 'granted');
  assert.deepEqual(registration.calls.map(([name]) => name), ['channel', 'permission', 'request', 'token']);
});

test('denied permission never obtains a token', async () => {
  const registration = createPushRegistration({ permission: 'denied', requested: 'denied' });
  assert.equal((await registration.run()).status, 'denied');
  assert.equal(registration.calls.some(([name]) => name === 'token'), false);
});

test('granted permission uses the configured project without another permission prompt', async () => {
  const registration = createPushRegistration();
  assert.equal((await registration.run()).token, 'ExponentPushToken[test-only]');
  assert.equal(registration.calls.some(([name]) => name === 'request'), false);
  assert.equal(registration.calls.at(-1)[1].projectId, 'project-test');
});

test('push token issuance errors remain visible to the caller', async () => {
  const registration = createPushRegistration({ error: new Error('offline') });
  await assert.rejects(registration.run(), /offline/);
});

test('push registration and read requests keep the existing server contract and expose failures', async () => {
  const calls = [];
  let isSuccess = true;
  const client = Object.fromEntries(['post', 'patch'].map((method) => [method, async (...args) => {
    calls.push([method, ...args]);
    return { data: { isSuccess, result: null, message: 'server failure' } };
  }]));
  const api = loadTypeScript('src/api/notification.ts', {
    axios: { AxiosError: Error }, '@/api/axiosInstance': { axiosInstance: client },
  });
  const body = { token: 'ExponentPushToken[test-only]', platform: 'WEB' };
  await api.registerPushToken(body);
  await api.markNotificationAsRead(7);
  assert.deepEqual(calls, [
    ['post', '/notifications/tokens', body], ['patch', '/notifications/7/read'],
  ]);
  isSuccess = false;
  await assert.rejects(api.registerPushToken(body), /server failure/);
  await assert.rejects(api.markNotificationAsRead(7), /server failure/);
});

test('notification cursor requests retain server cursor and failure state', async () => {
  let received;
  let isSuccess = true;
  const api = loadTypeScript('src/api/notification.ts', {
    axios: { AxiosError: Error },
    '@/api/axiosInstance': { axiosInstance: { get: async (url, options) => {
      received = [url, options];
      return { data: { isSuccess, message: 'list failed', result: { items: [], nextCursor: -42, hasNext: true } } };
    } } },
  });
  const page = await api.getNotifications({ cursor: -7, size: 20 });
  assert.equal(received[0], '/notifications');
  assert.equal(received[1].params.cursor, -7);
  assert.equal(page.nextCursor, -42);
  assert.equal(page.hasNext, true);
  isSuccess = false;
  await assert.rejects(api.getNotifications(), /list failed/);
});

function createBandNotificationScreen(item, responses = {}) {
  const states = [];
  const refs = [];
  const calls = [];
  const alerts = [];
  const pushes = [];
  let stateIndex = 0;
  let refIndex = 0;
  const mutation = (name) => ({
    mutateAsync: async (body) => {
      calls.push([name, JSON.parse(JSON.stringify(body))]);
      return responses[name]?.(body);
    },
    mutate: (id) => calls.push([name, id]),
  });
  const jsx = (type, props) => ({ type, props });
  const { BandNotificationListScreen } = loadTypeScript(
    'src/features/band/BandNotificationListScreen.tsx', {
      'react/jsx-runtime': { jsx, jsxs: jsx },
      react: {
        useState: (initial) => {
          const index = stateIndex++;
          if (!(index in states)) states[index] = initial;
          return [states[index], (next) => {
            states[index] = typeof next === 'function' ? next(states[index]) : next;
          }];
        },
        useRef: (initial) => {
          const index = refIndex++;
          return refs[index] ??= { current: initial };
        },
      },
      'react-native': { Alert: { alert: (...args) => alerts.push(args) } },
      'expo-router': { router: {
        push: (target) => pushes.push(target), canGoBack: () => false,
        replace: (target) => pushes.push(target),
      } },
      '@tanstack/react-query': { useQueryClient: () => ({ invalidateQueries: async () => {} }) },
      '@/features/notification/BandNotificationCards': {
        ActionNotificationCard: 'ActionNotificationCard', BandInviteCard: 'BandInviteCard',
        RoleInputModal: 'RoleInputModal', RoleCompleteModal: 'RoleCompleteModal',
        getBandInviteBandName: (value) => value.bandInvite?.bandName ?? '밴드',
        isSelectablePart: () => false,
      },
      '@/features/notification/NotificationList': { NotificationList: 'NotificationList' },
      '@/hooks/api/band/useBandManagement': { useBandMemberProfileQuery: () => ({}) },
      '@/hooks/api/user/useMyProfiles': { useActiveBandId: () => ({}) },
      '@/hooks/api/live/useLive': {
        liveKeys: { all: ['live'] }, useRespondCoHostInvitationMutation: () => mutation('coHost'),
      },
      '@/hooks/api/session/useSessionApplication': {
        useFinalizeApplicationSubmissionMutation: () => mutation('finalize'),
      },
      '@/hooks/api/notification/useNotification': {
        notificationKeys: { all: ['notifications'] },
        useNotificationsInfiniteQuery: () => ({ data: { pages: [{ items: [item] }] }, refetch() {} }),
        useMarkNotificationAsRead: () => mutation('read'),
        useRespondBandNotificationInvite: () => mutation('bandInvite'),
      },
      '@/shared/utils/notificationDeepLink': { getNotificationDeepLink },
      './notificationActions': { getBandNotificationAction, isBandNotification },
    },
  );
  return {
    calls, alerts, pushes,
    render() {
      stateIndex = 0;
      refIndex = 0;
      const tree = BandNotificationListScreen();
      return {
        list: tree.props,
        card: tree.props.renderCard(item)?.props,
        input: tree.props.children.find((child) => child.type === 'RoleInputModal').props,
        complete: tree.props.children.find((child) => child.type === 'RoleCompleteModal').props,
      };
    },
  };
}

const flushNotificationScreen = () => new Promise((resolve) => setImmediate(resolve));
const actionableBandInvite = () => notification({
  type: 'BAND_INVITE', actionable: true, referenceId: 999,
  bandInvite: { bandId: 7, bandName: 'B:Scene' },
});

test('band invite modal preserves the unread request until success and blocks duplicate submissions', async () => {
  let finish;
  const screen = createBandNotificationScreen(actionableBandInvite(), {
    bandInvite: () => new Promise((resolve) => { finish = resolve; }),
  });
  screen.render().card.onAccept();
  const input = screen.render().input;
  assert.equal(input.open, true);
  assert.deepEqual(screen.calls, []);
  input.onConfirm('  테스트  ', 'GUITAR');
  input.onConfirm('  테스트  ', 'GUITAR');
  screen.render().input.onClose();
  assert.equal(screen.render().input.open, true);
  assert.deepEqual(screen.calls, [['bandInvite', { bandId: 7, profile: { nickname: '테스트', part: 'GUITAR' } }]]);
  finish();
  await flushNotificationScreen();
  assert.deepEqual(screen.calls.map(([name]) => name), ['bandInvite', 'read']);
  const result = screen.render();
  assert.equal(result.input.open, false);
  assert.equal(result.complete.open, true);
  assert.equal(result.card.notification.actionable, false);
});

test('failed band invite stays unread and allows a retry from the same role modal', async () => {
  let fail = true;
  const screen = createBandNotificationScreen(actionableBandInvite(), {
    bandInvite: async () => { if (fail) throw new Error('request failed'); },
  });
  screen.render().card.onAccept();
  screen.render().input.onConfirm('테스트', 'BASS');
  await flushNotificationScreen();
  assert.equal(screen.render().input.open, true);
  assert.equal(screen.render().card.notification.actionable, true);
  assert.deepEqual(screen.calls.map(([name]) => name), ['bandInvite']);
  fail = false;
  screen.render().input.onConfirm('테스트', 'BASS');
  await flushNotificationScreen();
  assert.deepEqual(screen.calls.map(([name]) => name), ['bandInvite', 'bandInvite', 'read']);
});

test('co-host acceptance calls the response API before marking read and does not navigate', async () => {
  const screen = createBandNotificationScreen(notification({ title: '공동 진행자로 초대됐어요' }));
  screen.render().card.onAccept();
  assert.deepEqual(screen.calls, []);
  screen.alerts.at(-1)[2].find((button) => button.text === '수락').onPress();
  await flushNotificationScreen();
  assert.deepEqual(screen.calls, [['coHost', { liveId: 42, isAccepted: true }], ['read', 1]]);
  assert.deepEqual(screen.pushes, []);
  assert.equal(screen.render().card, undefined);
});

test('session role confirmation keeps the submission ID and finalization payload', async () => {
  const screen = createBandNotificationScreen(notification({ type: 'SESSION', title: '세션 지원이 수락되었어요' }));
  screen.render().card.onAccept();
  screen.render().input.onConfirm('세션', 'DRUM');
  await flushNotificationScreen();
  assert.deepEqual(screen.calls, [
    ['finalize', { applySubmissionId: 42, body: { isAccepted: true, nickname: '세션', part: 'DRUM' } }],
    ['read', 1],
  ]);
  assert.equal(screen.render().complete.kind, 'sessionFinalize');
});

test('read failure after successful rejection does not allow the band request to be submitted twice', async () => {
  const screen = createBandNotificationScreen(actionableBandInvite(), {
    read: async () => { throw new Error('read failed'); },
  });
  const card = screen.render().card;
  card.onReject();
  screen.alerts.at(-1)[2].find((button) => button.text === '거절').onPress();
  await flushNotificationScreen();
  assert.deepEqual(screen.calls, [['bandInvite', { bandId: 7 }], ['read', 1]]);
  assert.equal(screen.render().card.notification.actionable, false);
  screen.render().card.onReject();
  assert.deepEqual(screen.calls, [['bandInvite', { bandId: 7 }], ['read', 1]]);
  assert.ok(screen.alerts.some(([title]) => title === '처리는 완료됐어요'));
});

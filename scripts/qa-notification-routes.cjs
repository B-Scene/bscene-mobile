const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'src/shared/utils/notificationDeepLink.ts'), 'utf8');
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
});
const moduleExports = {};
vm.runInNewContext(outputText, { exports: moduleExports });
const { getNotificationDeepLink } = moduleExports;
const fixtures = JSON.parse(fs.readFileSync(path.join(root, 'tests/fixtures/notificationPayloads.json'), 'utf8'));

function collectRoutes(directory, segments = []) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory()) {
      const next = /^\(.*\)$/.test(entry.name) ? segments : [...segments, entry.name];
      return collectRoutes(path.join(directory, entry.name), next);
    }
    if (!/\.(tsx?|jsx?)$/.test(entry.name) || entry.name.startsWith('_') || entry.name.startsWith('+')) {
      return [];
    }
    const name = entry.name.replace(/\.(tsx?|jsx?)$/, '');
    return [[...segments, ...(name === 'index' ? [] : [name])]];
  });
}

const routes = collectRoutes(path.join(root, 'src/app'));
function routeExists(target) {
  const segments = target.split(/[?#]/)[0].split('/').filter(Boolean);
  return routes.some((route) => route.length === segments.length && route.every((segment, index) =>
    /^\[[^\]]+\]$/.test(segment) || segment === segments[index]));
}

let failures = 0;
for (const item of fixtures.cases) {
  try {
    const target = getNotificationDeepLink(item.data, item.mode);
    assert.equal(target, item.expected);
    assert.ok(target && routeExists(target), `mobile route missing: ${target}`);
    console.log(`PASS ${item.name}: ${target}`);
  } catch (error) {
    failures++;
    console.error(`FAIL ${item.name}: ${error.message}`);
  }
}
console.log(`${fixtures.cases.length - failures}/${fixtures.cases.length} payload routes verified; ${failures} failures`);
process.exitCode = failures ? 1 : 0;

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const router = require('react-router-dom');
const source = path.resolve(__dirname, '../../frontend/src');

// Exercise the real route tree and guard without loading page clients or making requests.
function renderRoute(location, session) {
  const auth = { useAuth: () => ({ user: null, loading: false, logout() {}, ...session }) };
  const routerWithRedirectEvidence = {
    ...router,
    Navigate: ({ to, state }) => React.createElement('output', { 'data-redirect': to, 'data-from': JSON.stringify(state?.from) }),
  };
  function load(file) {
    const module = { exports: {} };
    const code = ts.transpileModule(fs.readFileSync(path.join(source, file), 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
    }).outputText;
    const requireForTest = name => {
      if (name === 'react') return { ...React, lazy: () => () => React.createElement('span', { 'data-page': 'loaded' }) };
      if (name === 'react/jsx-runtime') return require(name);
      if (name === 'react-router-dom') return routerWithRedirectEvidence;
      if (name.endsWith('/AuthContext')) return auth;
      if (name === './shared/RequireAuth') return load('shared/RequireAuth.tsx');
      if (name === './shared/SiteNavigation') return { __esModule: true, default: () => null };
      throw new Error('Unexpected module: ' + name);
    };
    vm.runInNewContext(code, { module, exports: module.exports, require: requireForTest });
    return module.exports;
  }
  const App = load('App.tsx').default;
  return renderToStaticMarkup(React.createElement(router.StaticRouter, { location }, React.createElement(App)));
}

const platformPaths = [
  '/pages', '/jobs', '/companies', '/company/012345678901234567890123', '/cv', '/ai',
  '/practice', '/practice/starter-sum', '/playground', '/support', '/questions', '/profile', '/applications', '/logout',
  ...['dashboard', 'team', 'contacts', 'history', 'invoices', 'form', 'calendar', 'companies', 'company-details', 'company-dashboard', 'applicants', 'messages'].map(page => '/admin/' + page),
  '/missing-page',
];

test('internal platform routes, including dynamic URLs and unknown pages, require a validated session and retain the requested destination', () => {
  for (const pathname of platformPaths) {
    const html = renderRoute(pathname + '?view=recent#section');
    assert.match(html, /data-redirect="\/login"/, pathname);
    assert.doesNotMatch(html, /data-page="loaded"/, pathname);
    assert.ok(html.includes(pathname.replaceAll('&', '&amp;')), pathname);
    assert.ok(html.includes('view=recent') && html.includes('#section'), pathname);
  }
});

test('the public home and authentication pages remain available while session restoration never exposes protected content', () => {
  assert.match(renderRoute('/'), /data-redirect="\/home"/);
  for (const pathname of ['/home', '/login', '/signup', '/verify-email', '/forgot-password', '/reset-password']) {
    const html = renderRoute(pathname);
    assert.match(html, /data-page="loaded"/, pathname);
    assert.doesNotMatch(html, /data-redirect=/, pathname);
  }
  const pending = renderRoute('/jobs', { loading: true });
  assert.match(pending, /جاري التحقق من الجلسة/);
  assert.doesNotMatch(pending, /data-page="loaded"/);
  assert.match(renderRoute('/home', { loading: true }), /data-page="loaded"/);
});

test('signed-in users can reach the main sections while seeker and management role restrictions remain enforced', () => {
  const seeker = { user: { role: 'seeker' } };
  for (const pathname of ['/home', '/pages', '/jobs', '/companies', '/company/012345678901234567890123', '/cv', '/ai', '/practice', '/practice/starter-sum', '/playground', '/support', '/questions', '/profile', '/applications']) {
    assert.match(renderRoute(pathname, seeker), /data-page="loaded"/, pathname);
  }
  assert.match(renderRoute('/admin/dashboard', seeker), /data-redirect="\/home"/);
  assert.match(renderRoute('/admin/dashboard', { user: { role: 'admin' } }), /data-page="loaded"/);
  assert.match(renderRoute('/admin/company-dashboard', { user: { role: 'company' } }), /data-page="loaded"/);
  assert.match(renderRoute('/applications', { user: { role: 'company' } }), /data-redirect="\/home"/);
});

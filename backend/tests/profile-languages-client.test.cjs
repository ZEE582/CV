const { test } = require('node:test'); const assert = require('node:assert/strict');
const fs = require('node:fs'); const path = require('node:path'); const vm = require('node:vm'); const ts = require('typescript');
const root = path.resolve(__dirname, '../../frontend/src');
function load(file, globals = {}) {
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(code, { module, exports: module.exports, URL, TextEncoder, require: name => {
    if (name === '../constants/api') return { API_BASE_URL: '/api' };
    if (name === '../../../shared/api') return { apiRequest: () => { throw new Error('Password flow outside these tests'); } };
    return load(path.posix.normalize(path.posix.join(path.posix.dirname(file), name)) + '.ts', globals);
  }, ...globals }); return module.exports;
}
const languages = load('features/auth/validation/languages.ts'); const profile = load('features/auth/validation/profileValidation.ts');
const copy = value => JSON.parse(JSON.stringify(value));
const account = { _id: 'fixture', name: 'Name', email: 'fixture@example.com', role: 'seeker', provider: 'local', hasCompletedQuestions: true, onboardingData: { city: 'Custom city', age: 28, university: '', major: '', programmingLanguages: ['Elixir', 'elixir'], jobTitle: 'Custom role', experienceYears: '', lookingForJob: false, jobInterest: '' } };
const reply = (status, body) => ({ status, ok: status >= 200 && status < 300, json: async () => body });

test('custom languages preserve punctuation and Arabic names, stay selected and do not change the default catalogue', () => {
  const originals = copy(languages.languageChoices([])); const selection = ['Python'];
  for (const name of ['Elixir', 'C++', 'C#', 'لغة تجريبية']) {
    const result = languages.addLanguage('  ' + name + '  ', selection);
    assert.equal(result.ok, true); assert.equal(result.language, name); assert.equal(result.selected.at(-1), name);
  }
  assert.deepEqual(selection, ['Python']); assert.deepEqual(copy(languages.languageChoices([])), originals);
  assert.ok(languages.languageChoices(['Elixir'], ['Elixir', 'Lua']).includes('Lua'));
});

test('language addition resolves existing case and Unicode variants and never duplicates an already selected language', () => {
  const result = languages.addLanguage('  python ', []); assert.equal(result.language, 'Python'); assert.deepEqual(copy(result.selected), ['Python']); assert.equal(result.existing, true);
  const duplicate = languages.addLanguage('ＰＹＴＨＯＮ', ['Python']); assert.equal(duplicate.wasSelected, true); assert.deepEqual(copy(duplicate.selected), ['Python']);
  assert.deepEqual(copy(languages.uniqueLanguages([' Elixir ', 'elixir', 'C++', 'C#', ''])), ['Elixir', 'C++', 'C#']);
  assert.equal(languages.addLanguage('Visual   Basic', []).language, 'Visual Basic');
});

test('custom language boundaries reject blanks, controls, excessive length or a 51st language without losing selection', () => {
  for (const value of ['', '   ', 'x'.repeat(81), 'Elixir\nLua', 'test\u0000']) assert.equal(languages.addLanguage(value, []).ok, false, JSON.stringify(value));
  assert.equal(languages.addLanguage('x'.repeat(80), []).ok, true);
  const selected = Array.from({ length: 50 }, (_, index) => 'Custom-' + index);
  assert.equal(languages.addLanguage('One more', selected).ok, false); assert.equal(selected.length, 50);
  assert.equal(languages.addLanguage('custom-0', selected).ok, true);
});

test('profile drafts retain custom data and normalize Arabic ages; payloads only include editable fields', () => {
  const draft = profile.profileDraft(account); assert.equal(draft.city, 'Custom city'); assert.equal(draft.jobTitle, 'Custom role'); assert.deepEqual(copy(draft.programmingLanguages), ['Elixir']);
  assert.deepEqual(account.onboardingData.programmingLanguages, ['Elixir', 'elixir']);
  draft.age = '٢٨'; draft.fullName = ' Name '; draft.programmingLanguages.push('Lua');
  assert.equal(Object.keys(profile.profileErrors(draft)).length, 0);
  const payload = profile.profilePayload({ ...draft, role: 'admin', score: 9000, extra: 'unexpected' });
  assert.equal(payload.name, 'Name'); assert.equal(payload.onboardingData.age, 28); assert.deepEqual(copy(payload.onboardingData.programmingLanguages), ['Elixir', 'Lua']);
  for (const key of ['role', 'score', 'extra']) { assert.equal(Object.hasOwn(payload, key), false); assert.equal(Object.hasOwn(payload.onboardingData, key), false); }
  assert.equal(require('../middleware/profileSchemas').profileSchema.validate(payload).error, undefined);
  assert.equal(profile.profilePayload({ ...draft, age: '' }).onboardingData.age, null);
});

test('profile validation identifies each bad field and keeps optional fields optional', () => {
  const draft = profile.profileDraft({ ...account, onboardingData: {} });
  assert.equal(Object.keys(profile.profileErrors(draft)).length, 0);
  for (const age of ['1e2', '18.5', '١٨٫٥', '151', '-2']) assert.ok(profile.profileErrors({ ...draft, age }).age);
  assert.ok(profile.profileErrors({ ...draft, fullName: ' ' }).fullName);
  assert.ok(profile.profileErrors({ ...draft, avatar: 'javascript:alert(1)' }).avatar);
  assert.ok(profile.profileErrors({ ...draft, city: 'x'.repeat(101) }).city);
  assert.equal(Object.keys(profile.profileErrors({ ...draft, age: '۱۵۰', avatar: 'https://example.com/avatar.jpg' })).length, 0);
});

test('profile requests remain bound to the original session and reject mismatched or malformed account replies', async () => {
  let token = 'original'; let calls = 0; const storage = { getItem: () => token };
  const service = load('features/auth/services/profileService.ts', { localStorage: storage, fetch: async () => { calls++; return reply(200, { user: account }); } });
  const client = service.createProfileClient('fixture'); token = 'other';
  await assert.rejects(client.save({}), /تغيّرت جلسة/); assert.equal(calls, 0);
  token = 'original';
  const changing = load('features/auth/services/profileService.ts', { localStorage: storage, fetch: async () => { token = 'other'; return reply(200, { user: account }); } }).createProfileClient('fixture');
  await assert.rejects(changing.load(), /تغيّرت جلسة/); token = 'original';
  for (const body of [{ user: { ...account, _id: 'other' } }, { user: { ...account, role: 'superuser' } }, {}]) {
    const invalid = load('features/auth/services/profileService.ts', { localStorage: storage, fetch: async () => reply(200, body) }).createProfileClient('fixture');
    await assert.rejects(invalid.load(), /تأكيد بيانات الحساب/);
  }
});

test('profile service honors abort signals and private caching, maps failures, and never treats unreadable JSON as saved data', async () => {
  const requests = []; const responses = [reply(200, { user: account }), reply(429, { message: 'private limit detail' }), { ...reply(200, {}), json: async () => { throw new SyntaxError('HTML'); } }];
  const service = load('features/auth/services/profileService.ts', { localStorage: { getItem: () => 'fixture-token' }, fetch: async (url, options) => { requests.push({ url, ...options }); return responses.shift(); } });
  const client = service.createProfileClient('fixture'); const controller = new AbortController();
  assert.equal((await client.load(controller.signal))._id, 'fixture'); assert.equal(requests[0].cache, 'no-store'); assert.equal(requests[0].signal, controller.signal); assert.equal(requests[0].credentials, 'include');
  await assert.rejects(client.save({ name: 'New' }, controller.signal), error => !error.message.includes('private') && error.message.includes('طلبات كثيرة'));
  assert.equal(requests[1].method, 'PUT'); assert.equal(requests[1].headers.Authorization, 'Bearer fixture-token');
  await assert.rejects(client.load(), /تأكيد بيانات الحساب/);
  const offline = load('features/auth/services/profileService.ts', { localStorage: { getItem: () => 'fixture' }, fetch: async () => { throw new TypeError('Failed to fetch'); } }).createProfileClient('fixture');
  await assert.rejects(offline.load(), /تعذر الاتصال/);
});

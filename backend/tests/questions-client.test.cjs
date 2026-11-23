const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'); const path = require('node:path'); const vm = require('node:vm'); const ts = require('typescript');
const root = path.resolve(__dirname, '../../frontend/src');
function load(file, globals = {}) {
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(code, { module, exports: module.exports, require: name => {
    if (name === '../../../shared/navigation') return load('shared/navigation.ts');
    if (name === '../validation/questionsValidation') return helper;
    if (name === './languages') return load('features/auth/validation/languages.ts');
    if (name === '../constants/questionsData') return load('features/auth/constants/questionsData.ts');
    if (name === '../constants/api') return { API_BASE_URL: '/api' };
    throw new Error('Unexpected dependency: ' + name);
  }, ...globals });
  return module.exports;
}
const helper = load('features/auth/validation/questionsValidation.ts');
const core = { fullName: 'Beginner', age: '22', city: 'Nablus', university: '', major: '', programmingLanguages: [], jobTitle: 'Student', experienceYears: 'Less than one year', lookingForJob: false, jobInterest: 'Web' };
const copy = value => JSON.parse(JSON.stringify(value));

test('onboarding accepts beginners and agrees with the API schema on optional education and languages', () => {
  const { questionsSchema } = require('../middleware/profileSchemas');
  assert.equal(helper.firstQuestionsError(core), null);
  const payload = helper.questionsPayload(core);
  assert.equal(questionsSchema.validate(payload).error, undefined);
  for (const patch of [{ city: '' }, { fullName: '' }, { age: '0' }, { age: '151' }, { age: '18.5' }, { jobTitle: '' }, { experienceYears: '' }, { jobInterest: '' }, { programmingLanguages: ['x'.repeat(81)] }]) {
    assert.ok(helper.firstQuestionsError({ ...core, ...patch }), JSON.stringify(patch));
    assert.ok(questionsSchema.validate(helper.questionsPayload({ ...core, ...patch })).error, JSON.stringify(patch));
  }
  assert.equal(helper.firstQuestionsError({ ...core, fullName: '', jobTitle: '' }).step, 1);
  assert.equal(helper.firstQuestionsError({ ...core, major: 'x'.repeat(201) }).step, 2);
});

test('loading onboarding preserves saved custom values and canonical names without mutating the profile', () => {
  const profile = { name: 'Canonical', onboardingData: { ...core, fullName: 'Old name', age: 38, city: 'Custom city', programmingLanguages: ['Elixir', 'Elixir', 'Python'], jobTitle: 'Custom title', jobInterest: 'Custom field', lookingForJob: true } };
  const draft = helper.questionsFromProfile(profile);
  assert.equal(draft.fullName, 'Canonical'); assert.equal(draft.age, '38'); assert.equal(draft.city, 'Custom city'); assert.equal(draft.jobTitle, 'Custom title'); assert.equal(draft.jobInterest, 'Custom field');
  assert.deepEqual(copy(draft.programmingLanguages), ['Elixir', 'Python']); assert.equal(draft.lookingForJob, true);
  draft.programmingLanguages.push('Go'); assert.equal(profile.onboardingData.programmingLanguages.length, 3);
  assert.equal(helper.questionsFromProfile({ name: 'New' }).age, '');
});

test('age normalization supports Arabic digits without turning invalid numbers into valid ages and payloads are whitelisted', () => {
  for (const age of ['٢٢', '۲۲', '22']) assert.equal(helper.questionsPayload({ ...core, age }).age, 22);
  for (const age of ['18.5', '١٨٫٥', '1e2', '-22', 'abc22']) assert.ok(helper.validateQuestionsStep(1, { ...core, age }).age);
  const payload = helper.questionsPayload({ ...core, fullName: ' Beginner ', city: ' Nablus ', programmingLanguages: [' Python ', 'Python'], role: 'admin', score: 999 });
  assert.equal(payload.fullName, 'Beginner'); assert.equal(payload.city, 'Nablus'); assert.deepEqual(copy(payload.programmingLanguages), ['Python']); assert.equal(Object.hasOwn(payload, 'role'), false); assert.equal(Object.hasOwn(payload, 'score'), false);
});

test('onboarding replies must match the active account and navigation respects roles and safe return paths', () => {
  const profile = { _id: 'account', email: 'fixture@example.com', name: 'Name', role: 'seeker', hasCompletedQuestions: true, onboardingData: {} };
  assert.equal(helper.validQuestionsProfile(profile, 'account'), true);
  for (const value of [null, {}, { ...profile, _id: 'other' }, { ...profile, role: 'owner' }, { ...profile, hasCompletedQuestions: 'true' }, { ...profile, onboardingData: [] }]) assert.equal(helper.validQuestionsProfile(value, 'account'), false);
  assert.equal(helper.questionsDestination(profile, '/jobs?q=dev'), '/jobs?q=dev');
  for (const from of ['/questions', '/login', '//evil.example', '/reset-password?x=1', 'https://evil.example']) assert.equal(helper.questionsDestination(profile, from), '/home');
  assert.equal(helper.questionsDestination({ ...profile, role: 'admin' }, '/jobs'), '/admin/dashboard'); assert.equal(helper.questionsDestination({ ...profile, role: 'company' }, '/jobs'), '/admin/company-dashboard');
});

test('onboarding binds requests to the original session, never sending one account draft with another token', async () => {
  let token = 'first'; let calls = 0;
  const storage = { getItem: () => token };
  const service = load('features/auth/services/questionsService.ts', { localStorage: storage, fetch: async () => { calls++; return { ok: true, json: async () => ({}) }; } });
  const client = service.createQuestionsClient(); token = 'second';
  await assert.rejects(client.save(core), error => error.status === 401); assert.equal(calls, 0);
  token = 'first';
  const changed = load('features/auth/services/questionsService.ts', { localStorage: storage, fetch: async () => { token = 'second'; return { ok: true, json: async () => ({ user: { _id: 'other' } }) }; } }).createQuestionsClient();
  await assert.rejects(changed.load(), error => error.status === 401);
});

test('onboarding requests honor cancellation and private caching, send only whitelisted data and hide raw failures', async () => {
  const requests = []; const responses = [{ ok: true, json: async () => ({ user: { _id: 'fixture' } }) }, { ok: false, status: 500, json: async () => ({ message: 'private internal error' }) }];
  const service = load('features/auth/services/questionsService.ts', { localStorage: { getItem: () => 'fixture-token' }, fetch: async (url, options) => { requests.push({ url, ...options }); return responses.shift(); } });
  const client = service.createQuestionsClient(); const controller = new AbortController();
  await client.load(controller.signal); assert.equal(requests[0].cache, 'no-store'); assert.equal(requests[0].signal, controller.signal); assert.equal(requests[0].credentials, 'include');
  await assert.rejects(client.save({ ...core, role: 'admin' }, controller.signal), error => error.status === 500 && !error.message.includes('private'));
  assert.equal(requests[1].url, '/api/user/questions'); assert.equal(requests[1].headers.Authorization, 'Bearer fixture-token'); assert.equal(requests[1].signal, controller.signal); assert.equal(Object.hasOwn(JSON.parse(requests[1].body), 'role'), false);
});

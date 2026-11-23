const { test } = require('node:test'); const assert = require('node:assert/strict'); const fs = require('node:fs'); const path = require('node:path'); const vm = require('node:vm'); const ts = require('typescript');
const root = path.resolve(__dirname, '../../frontend/src');
function load(file, globals = {}) { const module = { exports: {} }; const code = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText; vm.runInNewContext(code, { module, exports: module.exports, URL, URLSearchParams, Intl, require: name => name === '../../../shared/api' ? { API_BASE_URL: '/api' } : load(path.posix.normalize(path.posix.join(path.posix.dirname(file), name)) + '.ts', globals), ...globals }); return module.exports; }
const helper = load('features/platform/utils/messages.ts'); const validation = load('features/platform/utils/contactValidation.ts');
const message = { _id: 'message', company_id: 'company', sender_name: 'Fixture', sender_email: 'fixture@example.com', subject: null, sender_phone: null, message: 'Fixture message', is_read: false, createdAt: '2026-10-30T10:00:00Z', __v: 2 };
const result = values => ({ success: true, company_id: 'company', messages: [message], total: 1, page: 1, pages: 1, limit: 20, counts: { read: 0, unread: 1 }, ...values });
const reply = (status, body) => ({ status, ok: status >= 200 && status < 300, json: async () => body });

test('contact validation bounds every field and normalizes only the whitelisted public payload', () => {
  const draft = { name: ' Fixture ', email: ' FIXTURE@EXAMPLE.COM ', phone: ' ', subject: ' ', message: ' A valid fixture message. ', injected: 'private' };
  assert.equal(Object.keys(validation.contactErrors(draft)).length, 0); const body = validation.contactPayload('company', draft); assert.equal(body.sender_email, 'fixture@example.com'); assert.equal(body.sender_name, 'Fixture'); assert.equal(body.subject, 'استفسار'); assert.equal(body.injected, undefined);
  for (const [key, value] of [['name', 'x'], ['name', 'x'.repeat(201)], ['email', 'bad-email'], ['phone', 'x'.repeat(41)], ['subject', 'x'.repeat(201)], ['message', 'short'], ['message', 'x'.repeat(5001)]]) assert.ok(validation.contactErrors({ ...draft, [key]: value })[key]);
});

test('public contact sends omit credentials, retain retry identity and require a matching confirmed storage response', async () => {
  const requests = []; const responses = [reply(201, { success: true, message_id: 'saved', company_id: 'company' }), reply(201, { success: true, message_id: 'saved', company_id: 'company', replayed: true }), reply(200, { success: true }), reply(201, { success: true, message_id: 'saved', company_id: 'other' }), reply(429, { message: 'secret detail' })];
  const api = load('features/platform/api/contactService.ts', { fetch: async (url, options) => { requests.push({ url, ...options }); return responses.shift(); } }); const controller = new AbortController(); const body = { company_id: 'company', sender_name: 'Fixture', sender_email: 'fixture@example.com', message: 'Fixture message' };
  await api.submitContact(body, 'retry-id', controller.signal); await api.submitContact(body, 'retry-id'); assert.equal(requests[0].credentials, 'omit'); assert.equal(requests[0].headers.Authorization, undefined); assert.equal(requests[0].signal, controller.signal); assert.equal(requests[0].body, requests[1].body);
  await assert.rejects(api.submitContact(body, 'retry-id'), /تأكيد حفظ الرسالة/); await assert.rejects(api.submitContact(body, 'retry-id'), /تأكيد حفظ الرسالة/); await assert.rejects(api.submitContact(body, 'retry-id'), error => /طلبات كثيرة/.test(error.message) && !error.message.includes('secret'));
  const cancelled = load('features/platform/api/contactService.ts', { fetch: async () => { controller.abort(); throw new Error('cancelled'); } }); await assert.rejects(cancelled.submitContact(body, 'retry-id', controller.signal), /cancelled/);
});

test('message URL filters preserve company, reset pages, and changing companies clears stale search and read selection', () => {
  const params = new URLSearchParams({ company: 'one', q: 'C++', is_read: 'false', page: '4', sort: 'oldest' }); const changed = helper.patchMessagesSearch(params, { company: 'two' }); assert.equal(changed.get('company'), 'two'); for (const key of ['q', 'is_read', 'page', 'sort']) assert.equal(changed.has(key), false);
  const filter = helper.patchMessagesSearch(params, { is_read: 'true' }); assert.equal(filter.get('company'), 'one'); assert.equal(filter.has('page'), false); assert.equal(params.get('page'), '4');
  const state = helper.readMessagesSearch(new URLSearchParams({ page: '-5', is_read: 'unknown', q: ' C++ ' })); assert.equal(state.page, 1); assert.equal(state.filter, 'all'); assert.equal(helper.messagesQuery(state).get('search'), 'C++');
});

test('inbox reads bind to the starting account token before and after requests and validate company-scoped legacy responses', async () => {
  let token = 'original'; let calls = 0; const globals = { localStorage: { getItem: () => token }, fetch: async () => { calls++; return reply(200, result()); } };
  const client = load('features/platform/api/inboxClient.ts', globals).createInboxClient('owner', 'company'); token = 'different'; await assert.rejects(client.list('company', new URLSearchParams()), /تغيّرت جلسة/); assert.equal(calls, 0); token = 'original'; assert.equal((await client.list('company', new URLSearchParams())).messages[0].subject, null);
  const changed = load('features/platform/api/inboxClient.ts', { ...globals, fetch: async () => { token = 'different'; return reply(200, result()); } }).createInboxClient('owner', 'admin'); await assert.rejects(changed.list('company', new URLSearchParams()), /تغيّرت جلسة/); token = 'original';
  const bodies = [result({ company_id: 'other' }), result({ messages: [{ ...message, company_id: 'foreign' }] }), result({ messages: [{ ...message, is_read: 'false' }] }), result({ counts: { read: -1, unread: 2 } })]; const invalid = load('features/platform/api/inboxClient.ts', { ...globals, fetch: async () => reply(200, bodies.shift()) }).createInboxClient('owner', 'company'); for (let i = 0; i < 4; i++) await assert.rejects(invalid.list('company', new URLSearchParams()), /لا تتطابق بيانات الرسائل/);
});

test('read changes send explicit desired state with the loaded version and scope and never accept wrong acknowledgements', async () => {
  const requests = []; const bodies = [reply(200, { success: true, message_id: 'message', company_id: 'company', is_read: true, version: 3 }), reply(200, { success: true, message_id: 'message', company_id: 'company', is_read: false, version: 3 }), reply(409, {})];
  const client = load('features/platform/api/inboxClient.ts', { localStorage: { getItem: () => 'token' }, fetch: async (url, options) => { requests.push({ url, ...options }); return bodies.shift(); } }).createInboxClient('owner', 'company'); const controller = new AbortController();
  await client.setRead(message, 'company', true, controller.signal); assert.deepEqual(JSON.parse(requests[0].body), { company_id: 'company', is_read: true, expected_version: 2 }); assert.equal(requests[0].signal, controller.signal); assert.equal(requests[0].cache, 'no-store'); assert.equal(requests[0].headers.Authorization, 'Bearer token');
  await assert.rejects(client.setRead(message, 'company', true), /تأكيد حفظ حالة/); await assert.rejects(client.setRead(message, 'company', true), /تغيّرت الرسالة/); const count = requests.length; await assert.rejects(client.setRead(message, 'other', false), /لا تتطابق/); assert.equal(requests.length, count);
});

test('inbox failures and disallowed roles do not become successful changes and reply links cannot inject mail headers', async () => {
  const globals = { localStorage: { getItem: () => 'token' }, fetch: async () => { throw new Error('private transport failure'); } };
  const client = load('features/platform/api/inboxClient.ts', globals).createInboxClient('owner', 'company'); await assert.rejects(client.setRead(message, 'company', true), error => /تأكيد تغيير حالة/.test(error.message) && !error.message.includes('private'));
  const seeker = load('features/platform/api/inboxClient.ts', globals).createInboxClient('owner', 'seeker'); await assert.rejects(seeker.list('company', new URLSearchParams()), /جلسة/);
  for (const value of ['fixture@example.com\r\nBcc:other@example.com', 'invalid', 'a b@example.com']) assert.equal(helper.replyLink(value, 'subject'), undefined);
  const href = helper.replyLink('fixture+tag@example.com', 'Question\r\nBcc:other@example.com'); assert.ok(href.startsWith('mailto:fixture%2Btag%40example.com?subject=')); assert.equal(/%0[ad]/i.test(href), false); assert.equal(helper.messageDate('invalid'), 'غير محدد'); assert.ok(helper.messageDate(message.createdAt).includes('2026'));
});

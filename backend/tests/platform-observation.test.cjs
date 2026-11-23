const { test } = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const express = require('express');
const request = require('supertest');
const { createHealthChecks } = require('../services/platformHealth');
const { requestObservation } = require('../middleware/requestObservation');
const { errorHandler } = require('../middleware/errorHandler');
const { inspectPlatform, normalizeBase } = require('../../scripts/check-health.cjs');
function healthApp(connection, timeoutMS = 50) {
  const app = express(); const health = createHealthChecks({ connection, timeoutMS });
  app.get('/api/live', health.live); app.get('/api/health', health.ready); return app;
}
test('liveness stays available while readiness fails closed for disconnected, rejected and timed-out MongoDB probes', async () => {
  for (const connection of [{ readyState: 0 }, { readyState: 1, db: { command: async () => { throw new Error('mongodb://private:secret@host/database'); } } }, { readyState: 1, db: { command: () => new Promise(() => {}) } }]) {
    const app = healthApp(connection);
    const live = await request(app).get('/api/live'); assert.equal(live.status, 200); assert.deepEqual(live.body, { success: true, status: 'alive' });
    const ready = await request(app).get('/api/health'); assert.equal(ready.status, 503); assert.deepEqual(ready.body, { success: false, database: 'disconnected' }); assert.equal(ready.headers['cache-control'], 'no-store');
  }
});
test('readiness shares concurrent pings, checks actual success and does not retain stale successful health', async () => {
  let finish, calls = 0;
  const connection = { readyState: 1, db: { command: (_command, options) => { calls++; assert.equal(options.timeoutMS, 1000); return new Promise(resolve => { finish = resolve; }); } } };
  const health = createHealthChecks({ connection });
  function response() { return { code: 200, set() { return this; }, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } }; }
  const first = response(), second = response();
  const reads = [health.ready({}, first), health.ready({}, second)]; assert.equal(calls, 1); finish({ ok: 1 }); await Promise.all(reads); assert.equal(first.code, 200); assert.equal(second.code, 200);
  connection.readyState = 0; const later = response(); await health.ready({}, later); assert.equal(later.code, 503);
  connection.readyState = 1; const changed = response(); const pending = health.ready({}, changed); connection.readyState = 0; finish({ ok: 1 }); await pending; assert.equal(changed.code, 503);
  connection.readyState = 1; const invalid = response(); const invalidRead = health.ready({}, invalid); finish({ ok: 0 }); await invalidRead; assert.equal(invalid.code, 503);
});
test('request logs correlate server-generated identifiers without recording personal or authentication data', async () => {
  const lines = []; const app = express(); app.use(requestObservation({ write: line => lines.push(line) })); app.use(express.json()); app.post('/api/auth/:action', (_req, res) => res.sendStatus(204));
  const privateValues = ['PRIVATE_EMAIL@example.com', 'PRIVATE_PASSWORD', 'PRIVATE_TOKEN', 'PRIVATE_COOKIE', 'PRIVATE_IP', 'PRIVATE_AGENT', 'FORGED_REQUEST_ID'];
  const response = await request(app).post('/api/auth/PRIVATE_EMAIL@example.com?code=PRIVATE_TOKEN').set('X-Request-ID', privateValues[6]).set('Authorization', 'Bearer ' + privateValues[2]).set('Cookie', 'session=' + privateValues[3]).set('User-Agent', privateValues[5]).set('X-Forwarded-For', privateValues[4]).send({ email: privateValues[0], password: privateValues[1] });
  assert.equal(response.status, 204); assert.match(response.headers['x-request-id'], /^[\da-f-]{36}$/); assert.equal(lines.length, 1);
  const record = JSON.parse(lines[0]); assert.equal(record.request_id, response.headers['x-request-id']); assert.equal(record.group, 'auth'); assert.equal(record.outcome, 'completed'); assert.equal(record.status, 204); assert.ok(record.duration_ms >= 0);
  for (const value of privateValues) assert.equal(lines[0].includes(value), false);
  const another = await request(app).post('/api/auth/login').set('X-Request-ID', privateValues[6]).send({}); assert.notEqual(another.headers['x-request-id'], response.headers['x-request-id']);
});
test('unhandled errors and known redirect failures record fixed codes without raw exception names or messages', async () => {
  const lines = []; const app = express(); app.use(requestObservation({ write: line => lines.push(line) }));
  app.get('/api/auth/error', (_req, _res, next) => { const error = new Error('PRIVATE_PROVIDER_MESSAGE'); error.name = 'PRIVATE_ERROR_NAME'; next(error); });
  app.get('/api/auth/redirect', (req, res) => { req.observeFailure('oauth_email_delivery'); req.observeFailure('PRIVATE_INJECTED_CODE'); res.redirect('/login?error=email'); });
  app.use(errorHandler);
  const error = await request(app).get('/api/auth/error'); assert.equal(error.status, 500); assert.equal(JSON.parse(lines[0]).failure_code, 'server_error'); assert.equal(JSON.parse(lines[0]).request_id, error.headers['x-request-id']);
  assert.equal((await request(app).get('/api/auth/redirect')).status, 302); assert.equal(JSON.parse(lines[1]).failure_code, 'oauth_email_delivery'); assert.equal(JSON.parse(lines[1]).level, 'error');
  assert.equal((JSON.stringify(error.body) + lines.join('')).includes('PRIVATE_'), false);
});
test('aborted requests log once and a failed log writer cannot break a response', async () => {
  const lines = [], res = new EventEmitter(); res.setHeader = () => {}; res.statusCode = 200;
  requestObservation({ write: line => lines.push(line) })({ originalUrl: '/api/PRIVATE_VALUE?secret=PRIVATE_VALUE', method: 'PRIVATE_METHOD' }, res, () => {});
  res.emit('close'); res.emit('finish'); assert.equal(lines.length, 1); assert.deepEqual([JSON.parse(lines[0]).status, JSON.parse(lines[0]).outcome, JSON.parse(lines[0]).group, JSON.parse(lines[0]).method], [null, 'aborted', 'other_api', 'OTHER']); assert.equal(lines[0].includes('PRIVATE'), false);
  const app = express(); app.use(requestObservation({ write: () => { throw new Error('logging unavailable'); } })); app.get('/', (_req, response) => response.sendStatus(200)); assert.equal((await request(app).get('/')).status, 200);
});
test('an error after response headers closes the stream and records failure without forwarding raw diagnostics', async () => {
  const lines = []; const app = express(); app.use(requestObservation({ write: line => lines.push(line) }));
  app.get('/api/auth/partial', (_req, res, next) => { res.write('partial'); next(new Error('PRIVATE_STREAM_FAILURE')); }); app.use(errorHandler);
  await assert.rejects(request(app).get('/api/auth/partial'));
  assert.equal(lines.length, 1); const record = JSON.parse(lines[0]); assert.equal(record.outcome, 'aborted'); assert.equal(record.status, null); assert.equal(record.failure_code, 'server_error'); assert.equal(lines[0].includes('PRIVATE'), false);
});
test('health inspector validates both endpoint contracts and never forwards credentials or follows redirects', async () => {
  const calls = [];
  const healthy = await inspectPlatform({ fetchImpl: async (url, options) => { calls.push(options); return Response.json(url.endsWith('/live') ? { success: true, status: 'alive' } : { success: true, database: 'connected' }); } });
  assert.equal(healthy.healthy, true);
  for (const options of calls) { assert.equal(options.credentials, 'omit'); assert.equal(options.redirect, 'error'); assert.equal(options.cache, 'no-store'); assert.deepEqual(options.headers, { Accept: 'application/json' }); }
  const down = await inspectPlatform({ fetchImpl: async url => url.endsWith('/live') ? Response.json({ success: true, status: 'alive' }) : Response.json({ success: false, database: 'disconnected' }, { status: 503 }) });
  assert.equal(down.healthy, false); assert.equal(down.live.ok, true); assert.equal(down.ready.reason, 'database_unavailable');
});
test('health inspector rejects malformed, oversized, misleading and non-JSON replies without disclosing their contents', async () => {
  for (const reply of [() => new Response('PRIVATE_HTML', { headers: { 'content-type': 'text/html' } }), () => new Response('{invalid PRIVATE', { headers: { 'content-type': 'application/json' } }), () => Response.json({ success: true, database: 'connected', value: 'PRIVATE'.repeat(1000) }), () => Response.json({ success: true, database: 'disconnected' }), () => Response.json({ success: true, database: 'connected' }, { status: 500 })]) {
    const result = await inspectPlatform({ fetchImpl: async () => reply() }); assert.equal(result.healthy, false); assert.equal(result.ready.reason, 'invalid_response'); assert.equal(JSON.stringify(result).includes('PRIVATE'), false);
  }
  const unreachable = await inspectPlatform({ fetchImpl: async () => { throw new Error('PRIVATE_PASSWORD'); } }); assert.equal(unreachable.live.reason, 'connection_failed'); assert.equal(JSON.stringify(unreachable).includes('PRIVATE'), false);
  for (const value of ['file:///secret', 'http://user:password@localhost/', 'http://localhost/path', 'http://localhost/?token=private', 'http://localhost/#private']) assert.throws(() => normalizeBase(value));
});
test('health inspector bounds real network stalls without waiting indefinitely', async () => {
  const http = require('node:http'); const server = http.createServer(() => {}); await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try { const result = await inspectPlatform({ baseUrl: 'http://127.0.0.1:' + server.address().port, timeoutMS: 50 }); assert.equal(result.live.reason, 'connection_failed'); assert.equal(result.ready.reason, 'connection_failed'); }
  finally { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
});
test('application health endpoints run without a session or database and expose correlation IDs through allowed CORS', async () => {
  process.env.NODE_ENV = 'test'; process.env.JWT_SECRET = 'isolated-observation-test-secret-longer-than-32-characters';
  const session = require('express-session'); const lines = []; const app = require('../app').createApp({ sessionStore: new session.MemoryStore(), requestLogWriter: line => lines.push(line) });
  const live = await request(app).get('/api/live').set('Origin', 'http://127.0.0.1:5173'); assert.equal(live.status, 200); assert.equal(live.headers['set-cookie'], undefined); assert.equal(live.headers['access-control-expose-headers'], 'X-Request-ID');
  const ready = await request(app).get('/api/health'); assert.equal(ready.status, 503); assert.equal(ready.body.success, false); assert.equal(ready.headers['cache-control'], 'no-store'); assert.equal(lines.length, 2);
});
test('user event listeners do not print email addresses or attached user data', () => {
  const events = require('../modules/auth/events/userEvents'); require('../modules/auth/listeners'); const original = console.log; const lines = []; console.log = value => lines.push(value);
  try { for (const event of ['userRegistered', 'userVerified', 'profileUpdated', 'questionsCompleted']) events.emit(event, { email: 'PRIVATE_EMAIL@example.com', password: 'PRIVATE_PASSWORD' }); }
  finally { console.log = original; }
  assert.equal(lines.length, 4); assert.equal(lines.join('').includes('PRIVATE'), false);
});

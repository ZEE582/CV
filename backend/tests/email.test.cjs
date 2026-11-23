const { test } = require('node:test');
const assert = require('node:assert/strict');
const net = require('node:net');
const { emailConfiguration } = require('../modules/auth/services/email/configuration');
const { emailFailure } = require('../modules/auth/services/email/failure');
const { createMailer } = require('../modules/auth/services/email/transporter');
const { sendWithRetry } = require('../modules/auth/services/email/retry');
const { inspectEmail } = require('../../scripts/check-email.cjs');
const credentials = { EMAIL_USER: 'sender@example.com', EMAIL_PASS: 'never-log-this-secret' };

test('existing Gmail configuration stays compatible and custom SMTP requires encryption', () => {
  const gmail = emailConfiguration(credentials);
  assert.equal(gmail.transport.host, 'smtp.gmail.com'); assert.equal(gmail.transport.port, 465); assert.equal(gmail.transport.secure, true);
  assert.deepEqual(gmail.from, { name: 'تطوّر', address: credentials.EMAIL_USER });
  const custom = emailConfiguration({ ...credentials, EMAIL_USER: 'smtp-account-id', SMTP_HOST: 'smtp.example.com', EMAIL_FROM: 'verified@example.com' });
  assert.equal(custom.transport.secure, false); assert.equal(custom.transport.port, 587); assert.equal(custom.transport.requireTLS, true);
  assert.equal(custom.from.address, 'verified@example.com');
  for (const config of [gmail, custom]) {
    assert.equal(config.transport.tls.rejectUnauthorized, true); assert.equal(config.transport.tls.minVersion, 'TLSv1.2');
    assert.equal(config.transport.logger, false); assert.equal(config.transport.debug, false);
    assert.equal(config.transport.disableFileAccess, true); assert.equal(config.transport.disableUrlAccess, true);
  }
  const alternate = emailConfiguration({ ...credentials, SMTP_HOST: 'smtp.example.com', SMTP_PORT: '2465', SMTP_SECURE: 'true' });
  assert.equal(alternate.transport.secure, true); assert.equal(alternate.transport.port, 2465);
});

test('invalid or partial email configuration fails before any connection and hides values', async () => {
  for (const change of [
    { EMAIL_USER: '' }, { EMAIL_PASS: '' }, { SMTP_HOST: 'smtp://user:secret@example.com' },
    { SMTP_HOST: 'example.com/path' }, { SMTP_PORT: '0' }, { SMTP_PORT: '65536' }, { SMTP_PORT: '587abc' },
    { SMTP_SECURE: 'FALSE' }, { SMTP_PORT: '465', SMTP_SECURE: 'false' }, { SMTP_PORT: '587', SMTP_SECURE: 'true' },
    { EMAIL_FROM: 'a@example.com,b@example.com' }, { EMAIL_FROM: 'a@example.com\r\nBcc: victim@example.com' },
    { EMAIL_USER: 'provider-account', EMAIL_FROM: '' },
  ]) {
    let connected = false;
    const report = await inspectEmail({ env: { ...credentials, ...change }, connect: true, verify: async () => { connected = true; } });
    assert.equal(report.configured, false); assert.equal(report.connectionChecked, false); assert.equal(connected, false);
    assert.ok(report.fields.length); assert.equal(JSON.stringify(report).includes('never-log-this-secret'), false);
    assert.throws(() => emailConfiguration({ ...credentials, ...change }), error => error.status === 503 && !error.message.includes(credentials.EMAIL_PASS));
  }
});

test('transports use current configuration and close on success and failure', async () => {
  const options = []; let closed = 0; let env = { ...credentials };
  const mailer = createMailer({ env: () => env, createTransport: settings => {
    options.push(settings); return { close: () => closed++, verify: async () => true, sendMail: async () => { throw Object.assign(new Error('private SMTP detail'), { code: 'EAUTH' }); } };
  } });
  assert.equal(await mailer.verify(), true);
  env = { ...credentials, SMTP_HOST: 'other.example.com', SMTP_PORT: '587' };
  await assert.rejects(mailer.sendMail({}), { code: 'EAUTH' });
  assert.equal(closed, 2); assert.equal(options[0].host, 'smtp.gmail.com'); assert.equal(options[1].host, 'other.example.com');
  env = {}; await assert.rejects(mailer.verify(), { status: 503 }); assert.equal(options.length, 2);
});

test('diagnostic stays offline by default and connection verification never calls sendMail', async () => {
  let calls = 0;
  const verify = async () => { calls++; return true; };
  const local = await inspectEmail({ env: credentials, verify });
  assert.equal(local.configured, true); assert.equal(local.connectionChecked, false); assert.equal(local.verified, false); assert.equal(calls, 0);
  const connected = await inspectEmail({ env: credentials, connect: true, verify });
  assert.equal(connected.verified, true); assert.equal(calls, 1); assert.equal(connected.reason, 'connection_verified');
  assert.equal((await inspectEmail({ env: credentials, connect: true, verify: async () => false })).verified, false);
  for (const [code, reason] of [['EAUTH','authentication_failed'], ['ETLS','tls_failed'], ['ENOTFOUND','dns_failed'], ['ETIMEDOUT','timeout']]) {
    const report = await inspectEmail({ env: credentials, connect: true, verify: async () => { throw Object.assign(new Error('secret password and private address'), { code, response: 'private server transcript' }); } });
    assert.equal(report.reason, reason); assert.equal(report.verified, false); assert.equal(report.connectionChecked, true);
    assert.equal(/secret|password|private|sender@/.test(JSON.stringify(report)), false);
  }
  const transport = createMailer({ env: () => credentials, createTransport: () => ({ verify, close() {}, sendMail() { assert.fail('verify must not send a message'); } }) });
  assert.equal(await transport.verify(), true);
});

test('temporary failures retry with bounded waits while permanent failures stop immediately', async () => {
  let attempts = 0; const waits = []; const logs = [];
  await sendWithRetry({}, 3, { send: async () => { if (++attempts < 3) throw Object.assign(new Error('private details'), { responseCode: 451 }); return { accepted: ['test@example.com'] }; }, wait: async ms => waits.push(ms), warn: line => logs.push(line) });
  assert.equal(attempts, 3); assert.deepEqual(waits, [2000, 2000]); assert.equal(logs.join('').includes('private'), false);
  for (const failure of [{ code: 'EAUTH' }, { code: 'ETLS' }, { responseCode: 550 }, {}]) {
    attempts = 0;
    await assert.rejects(sendWithRetry({}, 3, { send: async () => { attempts++; throw Object.assign(new Error('SMTP password and recipient should never appear'), failure); }, wait: async () => assert.fail('permanent or unknown errors must not retry'), warn: line => { assert.equal(line.includes('password'), false); assert.equal(line.includes('recipient'), false); } }));
    assert.equal(attempts, 1);
  }
  attempts = 0;
  await assert.rejects(sendWithRetry({}, 3, { send: async () => { attempts++; throw Object.assign(new Error('temporary'), { code: 'ETIMEDOUT' }); }, wait: async () => {}, warn() {} }));
  assert.equal(attempts, 3);
});

test('an SMTP recipient rejection cannot be reported as successful delivery', async () => {
  let attempts = 0;
  await assert.rejects(sendWithRetry({}, 3, { send: async () => { attempts++; return { rejected: ['private@example.com'], accepted: [] }; }, wait: async () => assert.fail(), warn() {} }), { code: 'ERECIPIENT' });
  assert.equal(attempts, 1); assert.equal(emailFailure({ code: 'ERECIPIENT' }), 'rejected');
});

test('real SMTP connection refuses plaintext downgrade before credentials or mail are sent', { timeout: 15000 }, async () => {
  const commands = []; const sockets = new Set();
  const server = net.createServer(socket => {
    sockets.add(socket); socket.on('close', () => sockets.delete(socket)); socket.on('error', () => {}); socket.setTimeout(5000, () => socket.destroy());
    socket.write('220 localhost test SMTP\r\n'); let pending = '';
    socket.on('data', bytes => {
      pending += bytes.toString('utf8'); let newline;
      while ((newline = pending.indexOf('\r\n')) !== -1) {
        const line = pending.slice(0, newline); pending = pending.slice(newline + 2); commands.push(line);
        if (line.startsWith('EHLO')) socket.write('250-localhost\r\n250 AUTH PLAIN LOGIN\r\n');
        else if (line === 'STARTTLS') socket.write('502 STARTTLS unavailable\r\n');
        else socket.write('500 Unexpected command\r\n');
      }
    });
  });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  try {
    const mailer = createMailer({ env: () => ({ ...credentials, SMTP_HOST: '127.0.0.1', SMTP_PORT: String(server.address().port), SMTP_SECURE: 'false' }) });
    await assert.rejects(mailer.verify(), error => error.code === 'ETLS');
    assert.ok(commands.includes('STARTTLS')); assert.equal(commands.some(line => /^(AUTH|MAIL|RCPT|DATA)/.test(line)), false);
    assert.equal(commands.join('').includes(credentials.EMAIL_PASS), false);
  } finally { for (const socket of sockets) socket.destroy(); await new Promise(resolve => server.close(resolve)); }
});

test('verification and recovery mail include matching plaintext codes and a safe sender', async () => {
  const transporter = require('../modules/auth/services/email/transporter');
  const { sendVerificationCode, sendPasswordResetCode } = require('../modules/auth/services/email/emailService');
  const originalSend = transporter.sendMail; const previous = { ...process.env }; const sent = [];
  try {
    for (const key of ['SMTP_HOST','SMTP_PORT','SMTP_SECURE','EMAIL_FROM']) delete process.env[key];
    Object.assign(process.env, credentials); transporter.sendMail = async mail => { sent.push(mail); return {}; };
    await sendVerificationCode('candidate@example.com', '12345'); await sendPasswordResetCode('candidate@example.com', '123456');
    for (const [index, code] of ['12345','123456'].entries()) {
      assert.ok(sent[index].text.includes(code)); assert.ok(sent[index].html.includes(code));
      assert.equal(sent[index].from.address, credentials.EMAIL_USER); assert.equal(sent[index].to, 'candidate@example.com');
      assert.equal(JSON.stringify(sent[index]).includes(credentials.EMAIL_PASS), false);
    }
  } finally { transporter.sendMail = originalSend; for (const key of Object.keys(process.env)) if (!(key in previous)) delete process.env[key]; Object.assign(process.env, previous); }
});

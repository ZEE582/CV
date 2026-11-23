const { test, before, after } = require('node:test');
const assert = require('node:assert/strict'); const path = require('node:path');
process.env.NODE_ENV = 'test'; process.env.JWT_SECRET = 'isolated-file-upload-test-secret-longer-than-32-characters';
process.env.MONGOMS_DOWNLOAD_DIR = path.resolve(__dirname, '../../.cache/mongodb'); process.env.MONGOMS_VERSION = '7.0.24';
const mongoose = require('mongoose'); const { MongoMemoryServer } = require('mongodb-memory-server'); const session = require('express-session'); const request = require('supertest');
const User = require('../models/User'); const Company = require('../models/Company'); const Job = require('../models/Job'); const Application = require('../models/Application'); const { signToken } = require('../config/jwtConfig');
const pdf = require('./fixtures/resume-pdf.cjs')(); const { MAX_CV_BYTES } = require('../middleware/applicationUpload');
let database, app, owner, otherOwner, outsider, admin, sequence = 0;
const auth = user => 'Bearer ' + signToken(user);
before(async () => {
  database = await MongoMemoryServer.create(); const uri = database.getUri('cv_upload_tests'); assert.notEqual(new URL(uri).port, '27171'); await mongoose.connect(uri);
  app = require('../app').createApp({ sessionStore: new session.MemoryStore() }); await Application.init();
  [owner, otherOwner, outsider, admin] = await User.create(['company', 'company', 'seeker', 'admin'].map((role, index) => ({ email: 'cv-upload-role-' + index + '@example.com', role, provider: 'google' })));
}, { timeout: 180000 });
after(async () => { await mongoose.disconnect(); await database?.stop(); });
async function fixture() {
  const seeker = await User.create({ email: 'cv-upload-seeker-' + (++sequence) + '@example.com', provider: 'google' });
  const company = await Company.create({ name_ar: 'CV upload company', user_id: owner._id }); const job = await Job.create({ company_id: company._id, title: 'CV upload vacancy', description: 'A synthetic vacancy for private upload tests.' }); return { seeker, company, job };
}
function upload(f, buffer = pdf, filename = 'السيرة الذاتية.pdf', mime = 'application/pdf', actor = f.seeker) {
  const operation = request(app).post('/api/applications'); if (actor) operation.set('Authorization', auth(actor));
  return operation.field('job_id', String(f.job._id)).field('cover_letter', 'Synthetic application letter').attach('cv_file', buffer, { filename, contentType: mime });
}
function download(actor, id) {
  return request(app).get('/api/applications/' + id + '/cv').set('Authorization', auth(actor)).buffer(true).parse((res, done) => { const chunks = []; res.on('data', chunk => chunks.push(chunk)); res.on('end', () => done(null, Buffer.concat(chunks))); res.on('error', done); });
}
test('PDF is stored with its application and downloaded byte-for-byte only by the candidate, current company owner and admin', async () => {
  const f = await fixture(); const result = await upload(f); assert.equal(result.status, 201); const id = result.body.application_id;
  assert.deepEqual(result.body.cv_file, { name: 'السيرة الذاتية.pdf', size: pdf.length });
  for (const actor of [f.seeker, owner, admin]) {
    const response = await download(actor, id); assert.equal(response.status, 200); assert.deepEqual(response.body, pdf);
    assert.equal(response.headers['content-type'], 'application/pdf'); assert.equal(response.headers['cache-control'], 'private, no-store'); assert.equal(response.headers['x-content-type-options'], 'nosniff');
    assert.match(response.headers['content-disposition'], /^attachment;/); assert.ok(response.headers['content-disposition'].includes("filename*=UTF-8''")); assert.match(response.headers['content-security-policy'], /sandbox/);
  }
  assert.equal((await request(app).get('/api/applications/' + id + '/cv')).status, 401);
  for (const actor of [outsider, otherOwner]) assert.equal((await request(app).get('/api/applications/' + id + '/cv').set('Authorization', auth(actor))).status, 404);
  await Company.updateOne({ _id: f.company._id }, { $set: { user_id: otherOwner._id } });
  assert.equal((await download(owner, id)).status, 404); assert.equal((await download(otherOwner, id)).status, 200);
});
test('binary content is absent from lists and reports while attachment metadata is preserved', async () => {
  const f = await fixture(); const uploaded = await upload(f); const id = uploaded.body.application_id;
  const results = [await request(app).get('/api/applications/my').set('Authorization', auth(f.seeker)), await request(app).get('/api/applications/job/' + f.job._id).set('Authorization', auth(owner)), await request(app).get('/api/applications/' + id + '/report').set('Authorization', auth(f.seeker))];
  for (const response of results) { assert.equal(response.status, 200); assert.equal(JSON.stringify(response.body).includes('cv_file_data'), false); assert.equal(JSON.stringify(response.body).includes(pdf.toString('base64')), false); }
  assert.equal(results[0].body.applications[0].cv_file.size, pdf.length); assert.equal(results[2].body.application.cv_file.name, 'السيرة الذاتية.pdf');
  const stored = await Application.findById(id).lean(); assert.equal(stored.cv_file_data, undefined);
  const full = await Application.findById(id).select('+cv_file_data'); assert.deepEqual(Buffer.from(full.cv_file_data), pdf);
});
test('format, size and multipart boundaries reject bad uploads without saving an application', async () => {
  const f = await fixture();
  const bad = [[pdf, 'resume.docx', 'application/pdf'], [pdf, 'resume.pdf', 'image/png'], [Buffer.from('MZ executable renamed to PDF\n%%EOF'), 'resume.pdf', 'application/pdf'], [pdf.subarray(0, 100), 'resume.pdf', 'application/pdf'], [Buffer.alloc(0), 'empty.pdf', 'application/pdf']];
  for (const [buffer, name, mime] of bad) assert.equal((await upload(f, buffer, name, mime)).status, 400);
  const large = Buffer.alloc(MAX_CV_BYTES + 1, 32); pdf.copy(large); const tooLarge = await upload(f, large); assert.equal(tooLarge.status, 413); assert.equal(tooLarge.body.code, 'CV_UPLOAD_INVALID');
  assert.equal((await request(app).post('/api/applications').set('Authorization', auth(f.seeker)).field('job_id', String(f.job._id))).status, 400);
  const conflict = await upload(f).field('cv_url', 'https://example.com/resume.pdf'); assert.equal(conflict.status, 400); assert.equal(conflict.body.code, 'CV_SOURCE_CONFLICT');
  assert.equal((await upload(f).attach('cv_file', pdf, { filename: 'second.pdf', contentType: 'application/pdf' })).status, 400);
  assert.equal(await Application.countDocuments({ user_id: f.seeker._id }), 0);
  assert.equal((await request(app).post('/api/applications').set('Authorization', auth(f.seeker)).set('Content-Type', 'multipart/form-data; boundary=broken').send('--incomplete')).status, 400);
});
test('authorization precedes upload parsing and duplicate, unavailable or failed submissions leave no separate file records', async () => {
  const f = await fixture(); assert.equal((await upload(f, pdf, 'resume.pdf', 'application/pdf', null)).status, 401); assert.equal((await upload(f, pdf, 'resume.pdf', 'application/pdf', owner)).status, 403);
  const duplicate = await Promise.all([upload(f), upload(f)]); assert.deepEqual(duplicate.map(item => item.status).sort(), [201, 409]); assert.equal(await Application.countDocuments({ user_id: f.seeker._id }), 1);
  const stored = await Application.findOne({ user_id: f.seeker._id }).select('+cv_file_data'); assert.deepEqual(Buffer.from(stored.cv_file_data), pdf);
  const closed = await fixture(); await Job.updateOne({ _id: closed.job._id }, { $set: { is_active: false } }); assert.equal((await upload(closed)).status, 404); assert.equal(await Application.countDocuments({ user_id: closed.seeker._id }), 0);
  const forged = await fixture(); assert.equal((await request(app).post('/api/applications').set('Authorization', auth(forged.seeker)).send({ job_id: String(forged.job._id), cv_file: { name: 'fake.pdf', size: 10 }, cv_file_data: 'forged' })).status, 400);
});
test('saved attachments survive closed or deleted adverts and disappear with withdrawal; legacy links remain supported', async () => {
  const f = await fixture(); const result = await upload(f, pdf, '../bad<>name.pdf'); const id = result.body.application_id; assert.equal(result.body.cv_file.name, 'badname.pdf');
  await Job.deleteOne({ _id: f.job._id }); assert.equal((await download(f.seeker, id)).status, 200); assert.equal((await download(owner, id)).status, 200);
  assert.equal((await request(app).delete('/api/applications/' + id + '/withdraw').set('Authorization', auth(f.seeker)).send({ expected_version: 0 })).status, 200);
  assert.equal((await download(f.seeker, id)).status, 404); assert.equal(await Application.countDocuments({ _id: id }), 0);
  const legacy = await fixture(); const link = await request(app).post('/api/applications').set('Authorization', auth(legacy.seeker)).send({ job_id: String(legacy.job._id), cv_url: 'https://example.com/external-resume.pdf' });
  assert.equal(link.status, 201); assert.equal((await download(legacy.seeker, link.body.application_id)).status, 404);
  assert.equal((await Application.findById(link.body.application_id)).cv_url, 'https://example.com/external-resume.pdf');
});
test('multipart attempts are rate limited per authenticated account', async () => {
  const f = await fixture();
  for (let index = 0; index < 10; index++) assert.equal((await upload(f, Buffer.from('invalid file data'), 'resume.pdf')).status, 400);
  assert.equal((await upload(f)).status, 429); assert.equal(await Application.countDocuments({ user_id: f.seeker._id }), 0);
  const other = await fixture(); assert.equal((await upload(other)).status, 201);
});

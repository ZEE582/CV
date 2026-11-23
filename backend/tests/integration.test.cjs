const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'a-local-test-secret-that-is-at-least-32-characters-long';
process.env.EMAIL_USER = 'test@example.com';
process.env.EMAIL_PASS = 'local-smtp-stub';
process.env.MONGOMS_DOWNLOAD_DIR = path.resolve(__dirname, '../../.cache/mongodb');
process.env.MONGOMS_VERSION = '7.0.24';
delete process.env.GROQ_API_KEY;
delete process.env.GROQ_MODEL;
delete process.env.CODE_EXECUTOR_URL;
for (const provider of ['GOOGLE', 'GITHUB', 'LINKEDIN']) {
  delete process.env[provider + '_CLIENT_ID'];
  delete process.env[provider + '_CLIENT_SECRET'];
}
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const session = require('express-session');
const request = require('supertest');
const transporter = require('../modules/auth/services/email/transporter');
const User = require('../models/User');
const Challenge = require('../models/VerificationChallenge');
const { signToken } = require('../config/jwtConfig');
const codes = new Map();
transporter.sendMail = async mail => { const match = mail.html.match(/\b(\d{5})\b/); assert.ok(match, 'Verification email contains a code'); codes.set(mail.to, match[1]); return { messageId: 'local-stub' }; };
let database, app, admin, seeker, company;
before(async () => {
  database = await MongoMemoryServer.create();
  await mongoose.connect(database.getUri());
  app = require('../app').createApp({ sessionStore: new session.MemoryStore() });
  [admin, seeker, company] = await Promise.all(['admin', 'seeker', 'company'].map(role => User.create({ email: role + '@example.com', password: 'FixturePassword123!', role, isVerified: true })));
}, { timeout: 180000 });
after(async () => { await mongoose.disconnect(); await database?.stop(); });
function auth(user) { return 'Bearer ' + signToken(user); }
async function signup(email, extra = {}) {
  const agent = request.agent(app);
  const response = await agent.post('/api/auth/signup').send({ email, password: 'SignupPassword123!', ...extra });
  assert.equal(response.status, 201, JSON.stringify(response.body));
  return agent;
}
test('API starts without optional OAuth credentials and reads companies', async () => {
  assert.equal((await request(app).get('/api/health')).body.database, 'connected');
  assert.equal((await request(app).get('/api/companies')).status, 200);
  assert.equal((await request(app).get('/api/auth/google')).status, 503);
  assert.deepEqual((await request(app).get('/api/auth/providers')).body, { google: false, github: false, linkedin: false });
});
test('public signup cannot select admin; verified responses exclude secrets', async () => {
  const email = 'registration@example.com';
  const agent = await signup(email, { role: 'admin', score: 1000000 });
  const user = await User.findOne({ email }).select('+password');
  assert.equal(user.role, 'seeker'); assert.equal(user.score, 0);
  assert.notEqual(user.password, 'SignupPassword123!');
  const pending = await Challenge.findOne({ email }).select('+codeHash');
  assert.notEqual(pending.codeHash, codes.get(email));
  const response = await agent.post('/api/auth/verify-code').send({ email, code: codes.get(email) });
  assert.equal(response.status, 200); assert.ok(response.body.token);
  for (const key of ['password', 'password_hash', 'googleId', 'githubId', 'linkedinId']) assert.equal(Object.hasOwn(response.body.user, key), false);
  assert.equal(response.body.user.role, 'seeker');
});
test('expired OTP is rejected even before MongoDB TTL cleanup', async () => {
  const email = 'expired@example.com'; const agent = await signup(email);
  await Challenge.updateOne({ email }, { $set: { expiresAt: new Date(Date.now() - 3600000) } });
  const result = await agent.post('/api/auth/verify-code').send({ email, code: codes.get(email) });
  assert.equal(result.status, 400); assert.equal(result.body.token, undefined);
});
test('OTP is bound to its initiating browser and email', async () => {
  const email = 'bound@example.com'; const agent = await signup(email);
  assert.equal((await request(app).post('/api/auth/verify-code').send({ email, code: codes.get(email) })).status, 400);
  assert.equal((await agent.post('/api/auth/verify-code').send({ email: 'other@example.com', code: codes.get(email) })).status, 400);
  assert.equal((await agent.post('/api/auth/verify-code').send({ email, code: codes.get(email) })).status, 200);
});
test('OTP stops after five incorrect guesses', async () => {
  const email = 'attempts@example.com'; const agent = await signup(email);
  const wrong = codes.get(email) === '11111' ? '22222' : '11111';
  for (let i = 0; i < 5; i++) assert.equal((await agent.post('/api/auth/verify-code').send({ email, code: wrong })).status, 400);
  assert.equal((await agent.post('/api/auth/verify-code').send({ email, code: codes.get(email) })).status, 400);
});
test('a correct OTP cannot be consumed concurrently twice', async () => {
  const email = 'single-use@example.com'; const agent = await signup(email);
  const results = await Promise.all([1, 2].map(() => agent.post('/api/auth/verify-code').send({ email, code: codes.get(email) })));
  assert.deepEqual(results.map(result => result.status).sort(), [200, 400]);
});
test('resend requires the password-step cookie and enforces a cooldown', async () => {
  assert.equal((await request(app).post('/api/auth/resend-code').send({ email: seeker.email })).status, 401);
  const email = 'resend@example.com'; const agent = await signup(email);
  assert.equal((await agent.post('/api/auth/resend-code').send({ email })).status, 429);
  await Challenge.updateOne({ email }, { $set: { lastSentAt: new Date(Date.now() - 61000) } });
  assert.equal((await agent.post('/api/auth/resend-code').send({ email })).status, 200);
});
test('local login checks the password and creates a verified session', async () => {
  const agent = request.agent(app);
  assert.equal((await agent.post('/api/auth/login').send({ email: seeker.email, password: 'incorrect' })).status, 401);
  const login = await agent.post('/api/auth/login').send({ email: seeker.email, password: 'FixturePassword123!' });
  assert.equal(login.status, 200); assert.equal(login.body.token, undefined);
  const verified = await agent.post('/api/auth/verify-code').send({ email: seeker.email, code: codes.get(seeker.email) });
  assert.equal(verified.status, 200);
  const profile = await request(app).get('/api/auth/me').set('Authorization', 'Bearer ' + verified.body.token);
  assert.equal(profile.status, 200); assert.equal(profile.body.user.email, seeker.email);
});
test('profile updates cannot set privilege or leak password hashes', async () => {
  const result = await request(app).put('/api/user/profile').set('Authorization', auth(seeker)).send({ name: 'Updated name', role: 'admin', password: 'hacked' });
  assert.equal(result.status, 200); assert.equal(result.body.user.role, 'seeker');
  assert.equal(result.body.user.password, undefined);
});
test('points are read-only and administrative endpoints enforce roles', async () => {
  assert.equal((await request(app).patch('/api/user/score').set('Authorization', auth(seeker)).send({ points: 1000000000 })).status, 403);
  assert.equal((await User.findById(seeker._id)).score, 0);
  assert.equal((await request(app).get('/api/admin/stats')).status, 401);
  assert.equal((await request(app).get('/api/admin/stats').set('Authorization', auth(seeker))).status, 403);
  assert.equal((await request(app).get('/api/admin/stats').set('Authorization', auth(admin))).status, 200);
});
test('company CRUD requires authorization, including the compatibility endpoint', async () => {
  for (const url of ['/api/companies', '/api/company']) {
    assert.equal((await request(app).post(url).send({ name_ar: 'غير مصرح' })).status, 401);
    assert.equal((await request(app).post(url).set('Authorization', auth(seeker)).send({ name_ar: 'غير مصرح' })).status, 403);
  }
  const created = await request(app).post('/api/companies').set('Authorization', auth(admin)).send({ name_ar: 'شركة اختبار', location: 'نابلس', about_ar: 'نبذة عن الشركة للاختبارات' });
  assert.equal(created.status, 201, JSON.stringify(created.body));
  const id = created.body.company_id;
  assert.equal((await request(app).put('/api/companies/' + id).set('Authorization', auth(company)).send({ name_ar: 'محاولة تعديل', about_ar: 'نبذة عن الشركة للاختبارات' })).status, 403);
  assert.equal((await request(app).delete('/api/companies/' + id).set('Authorization', auth(admin))).status, 200);
});
test('deactivated accounts and forged tokens cannot use protected endpoints', async () => {
  const token = auth(company);
  await User.updateOne({ _id: company._id }, { $set: { is_active: false } });
  assert.equal((await request(app).get('/api/auth/me').set('Authorization', token)).status, 401);
  assert.equal((await request(app).get('/api/auth/me').set('Authorization', 'Bearer invalid')).status, 401);
});
test('management records persist and reject unauthenticated writes', async () => {
  assert.equal((await request(app).post('/api/management/events').send({ title: 'meeting', date: '2026-10-26' })).status, 401);
  const event = await request(app).post('/api/management/events').set('Authorization', auth(admin)).send({ title: 'meeting', date: '2026-10-26' });
  assert.equal(event.status, 201); assert.ok(event.body.id);
  assert.equal((await request(app).get('/api/management/events').set('Authorization', auth(admin))).body.length, 1);
  assert.equal((await request(app).delete('/api/management/events/' + event.body.id).set('Authorization', auth(admin)).send({ expected_version: 0 })).status, 200);
});
test('company messages are visible only to their owner or an administrator', async () => {
  const Company = require('../models/Company');
  const ContactMessage = require('../models/ContactMessage');
  const owner = await User.create({ name: 'Company owner', email: 'message-owner@example.com', password: 'FixturePassword123!', role: 'company' });
  const other = await User.create({ email: 'message-other@example.com', password: 'FixturePassword123!', role: 'company' });
  const record = await Company.create({ name_ar: 'شركة الرسائل', user_id: owner._id });
  const unrelated = await Company.create({ name_ar: 'شركة أخرى', user_id: other._id });
  await ContactMessage.create({ company_id: unrelated._id, sender_name: 'Other sender', sender_email: 'unrelated@example.com', message: 'رسالة خاصة بالشركة الأخرى' });
  const sent = await request(app).post('/api/messages').send({ company_id: String(record._id), sender_name: 'Test sender', sender_email: 'sender@example.com', message: 'رسالة اختبار خاصة بالشركة' });
  assert.equal(sent.status, 201);
  const url = '/api/messages/company/' + record._id;
  assert.equal((await request(app).get(url)).status, 401);
  assert.equal((await request(app).get(url).set('Authorization', auth(seeker))).status, 403);
  const denied = await request(app).get(url).set('Authorization', auth(other));
  assert.equal(denied.status, 403); assert.equal(denied.body.messages, undefined);
  for (const reader of [owner, admin]) {
    const allowed = await request(app).get(url).set('Authorization', auth(reader));
    assert.equal(allowed.status, 200); assert.equal(allowed.body.total, 1);
    assert.equal(allowed.body.messages[0].sender_email, 'sender@example.com');
  }
  assert.equal((await request(app).get('/api/messages/company/not-an-id').set('Authorization', auth(owner))).status, 400);
  assert.equal((await request(app).get('/api/messages/company/' + new mongoose.Types.ObjectId()).set('Authorization', auth(owner))).status, 404);
  assert.equal((await request(app).post('/api/messages').send({ company_id: String(record._id), sender_name: 'Test sender', sender_email: 'sender@example.com', message: 'x'.repeat(5001) })).status, 400);
});
test('calendar rejects invalid dates and empty activities without persisting them', async () => {
  const Event = require('../models/ManagementEvent');
  const count = await Event.countDocuments();
  for (const body of [{ title: '  ', date: '2026-10-28' }, { title: 'Meeting', date: 'not-a-date' }, { title: 'Meeting', date: '2026-02-30' }, { title: 'Meeting', date: '2026-10-28', color: 'invalid' }]) {
    assert.equal((await request(app).post('/api/management/events').set('Authorization', auth(admin)).send(body)).status, 400);
  }
  assert.equal(await Event.countDocuments(), count);
  const created = await request(app).post('/api/management/events').set('Authorization', auth(admin)).send({ title: '  اجتماع  ', date: '2028-02-29', color: '#2196f3' });
  assert.equal(created.status, 201); assert.equal(created.body.title, 'اجتماع');
  assert.equal(created.body.date, '2028-02-29');
  assert.equal((await request(app).delete('/api/management/events/not-an-id').set('Authorization', auth(admin))).status, 400);
});
test('applications reject closed deadlines and preserve owner access and withdrawal counts', async () => {
  const Company = require('../models/Company');
  const Job = require('../models/Job');
  const Application = require('../models/Application');
  await Application.init();
  const owner = await User.create({ email: 'applications-owner@example.com', password: 'FixturePassword123!', role: 'company' });
  const co = await Company.create({ name_ar: 'شركة توظيف', user_id: owner._id });
  const expired = await Job.create({ title: 'Expired job', description: 'Job description for tests', company_id: co._id, deadline: new Date(Date.now() - 60000) });
  const expiredResponse = await request(app).post('/api/applications').set('Authorization', auth(seeker)).send({ job_id: String(expired._id) });
  assert.equal(expiredResponse.status, 400); assert.equal(expiredResponse.body.code, 'JOB_EXPIRED');
  const inactive = await Company.create({ name_ar: 'شركة معطلة', is_active: false });
  const hidden = await Job.create({ title: 'Hidden job', description: 'Job description for tests', company_id: inactive._id });
  assert.equal((await request(app).post('/api/applications').set('Authorization', auth(seeker)).send({ job_id: String(hidden._id) })).status, 404);
  const open = await Job.create({ title: 'Open job', description: 'Job description for tests', company_id: co._id });
  const submitted = await request(app).post('/api/applications').set('Authorization', auth(seeker)).send({ job_id: String(open._id) });
  assert.equal(submitted.status, 201);
  const listed = await request(app).get('/api/applications/job/' + open._id).set('Authorization', auth(owner));
  assert.equal(listed.status, 200); assert.equal(listed.body.applications[0].user_id.name, 'Updated name');
  const id = submitted.body.application_id;
  await Job.updateOne({ _id: open._id }, { $set: { applications_count: 1 } });
  const results = await Promise.all([1, 2].map(() => request(app).delete('/api/applications/' + id + '/withdraw').set('Authorization', auth(seeker))));
  assert.equal(results.filter(result => result.status === 200).length, 1);
  assert.equal(await Application.countDocuments({ _id: id }), 0);
  assert.ok((await Job.findById(open._id)).applications_count >= 0);
});
test('restored study plans and optional external services respond predictably', async () => {
  assert.equal((await request(app).get('/api/study-plans')).status, 200);
  assert.equal((await request(app).post('/api/ai/chat').send({ message: 'Hello' })).status, 503);
  assert.equal((await request(app).post('/api/submissions/run').set('Authorization', auth(seeker)).send({ code: 'console.log(1)' })).status, 503);
  assert.equal((await request(app).get('/api/not-found')).status, 404);
});
test('recruitment lifecycle: publish, apply, review, withdraw and manage closed jobs with ownership', async () => {
  const Company = require('../models/Company');
  const Job = require('../models/Job');
  const owner = await User.create({email:'hiring-owner@example.com', password:'FixturePassword123!', role:'company'});
  const outsider = await User.create({email:'hiring-outsider@example.com', password:'FixturePassword123!', role:'company'});
  const candidate = await User.create({name:'Hiring candidate', email:'hiring-candidate@example.com', password:'FixturePassword123!', role:'seeker'});
  const owned = await Company.create({name_ar:'شركة توظيف جديدة', user_id:owner._id});
  const other = await Company.create({name_ar:'شركة مختلفة', user_id:outsider._id});
  const input = {title:'Frontend developer', description:'A detailed description for the frontend vacancy.', company_id:String(owned._id), salary_min:1000, salary_max:2000, field:'تكنولوجيا'};
  const created = await request(app).post('/api/jobs').set('Authorization',auth(owner)).send(input);
  assert.equal(created.status,201,JSON.stringify(created.body)); const jobId=created.body.job_id;
  const management='/api/jobs/manage?company_id='+owned._id;
  assert.equal((await request(app).get(management)).status,401);
  assert.equal((await request(app).get(management).set('Authorization',auth(candidate))).status,403);
  assert.equal((await request(app).get(management).set('Authorization',auth(outsider))).status,404);
  assert.equal((await request(app).get(management).set('Authorization',auth(owner))).body.jobs[0]._id,jobId);
  assert.equal((await request(app).get(management).set('Authorization',auth(admin))).status,200);
  assert.equal((await request(app).put('/api/jobs/'+jobId).set('Authorization',auth(outsider)).send(input)).status,403);
  const updated=await request(app).put('/api/jobs/'+jobId).set('Authorization',auth(owner)).send({...input,company_id:String(other._id),title:'Updated vacancy'});
  assert.equal(updated.status,200); assert.equal(String((await Job.findById(jobId)).company_id),String(owned._id));
  assert.equal((await request(app).post('/api/jobs').set('Authorization',auth(owner)).send({...input,salary_max:500})).status,400);
  const submitted=await request(app).post('/api/applications').set('Authorization',auth(candidate)).send({job_id:jobId,cover_letter:'I would like to apply for this role.',cv_url:'https://example.com/resume.pdf'});
  assert.equal(submitted.status,201); const applicationId=submitted.body.application_id;
  assert.equal((await request(app).post('/api/applications').set('Authorization',auth(candidate)).send({job_id:jobId})).status,409);
  assert.equal((await request(app).get('/api/applications/my').set('Authorization',auth(candidate))).body.applications[0].status,'pending');
  assert.equal((await request(app).get('/api/applications/job/'+jobId).set('Authorization',auth(outsider))).status,403);
  const reviewed=await request(app).patch('/api/applications/'+applicationId+'/status').set('Authorization',auth(owner)).send({status:'shortlisted'});
  assert.equal(reviewed.status,200);
  assert.equal((await request(app).get('/api/applications/my').set('Authorization',auth(candidate))).body.applications[0].status,'shortlisted');
  assert.equal((await request(app).delete('/api/applications/'+applicationId+'/withdraw').set('Authorization',auth(candidate))).status,400);
  assert.equal((await request(app).patch('/api/jobs/'+jobId+'/toggle').set('Authorization',auth(owner))).status,200);
  assert.equal((await request(app).get(management).set('Authorization',auth(owner))).body.jobs[0].is_active,false);
  assert.equal((await request(app).get('/api/jobs/'+jobId)).status,404);
});
test('only administrators provision company accounts and concurrent linking creates a single owner', async () => {
  const Company = require('../models/Company');
  const record = await Company.create({name_ar:'شركة ربط الحساب'});
  const base = {company_id:String(record._id), full_name:'مسؤول الشركة', password:'FixturePassword123!'};
  const url = '/api/auth/company-account';
  assert.equal((await request(app).post(url).send({...base,email:'no-auth-owner@example.com'})).status,401);
  assert.equal((await request(app).post(url).set('Authorization',auth(seeker)).send({...base,email:'seeker-owner@example.com'})).status,403);
  const emails=['provision-owner-a@example.com','provision-owner-b@example.com'];
  const results=await Promise.all(emails.map(email => request(app).post(url).set('Authorization',auth(admin)).send({...base,email})));
  assert.deepEqual(results.map(result=>result.status).sort(),[201,409]);
  const linked=await Company.findById(record._id);
  const user=await User.findById(linked.user_id);
  assert.equal(user.role,'company'); assert.ok(emails.includes(user.email));
  assert.equal(await User.countDocuments({email:{$in:emails}}),1);
  const created=results.find(result=>result.status===201);
  assert.equal(created.body.user.password,undefined);
});
test('CV saves all editor fields privately and rejects stale or invalid updates', async () => {
  const CV=require('../models/CV'); await CV.init();
  const owner=await User.create({email:'cv-owner@example.com',password:'FixturePassword123!',role:'seeker'});
  const other=await User.create({email:'cv-other@example.com',password:'FixturePassword123!',role:'seeker'});
  const builder={fullName:'CV Owner',jobTitle:'Developer',email:'cv-owner@example.com',templateId:8,accentColor:'#0ea5e9',projects:[{id:'project-1',name:'مشروع',description:'Project description',tech:['React'],url:'example.com',github:'github.com/example'}],certifications:[{id:'cert-1',name:'شهادة',issuer:'Test issuer',date:'2026',url:'https://example.com'}],experience:[{id:'exp-1',company:'Company',role:'Engineer',startDate:'2020',endDate:'2026',current:false,description:'Experience',tech:['TypeScript'],location:'Remote'}],education:[{id:'edu-1',school:'University',degree:'BSc',field:'CS',startDate:'2020',endDate:'2024',gpa:'3.5',description:'Legacy education notes'}],languages:[{lang:'Arabic',level:'Native'}]};
  assert.equal((await request(app).post('/api/cv').send({builder_data:builder})).status,401);
  const saved=await request(app).post('/api/cv').set('Authorization',auth(owner)).send({builder_data:builder,expected_updated_at:null,user_id:String(other._id)});
  assert.equal(saved.status,200,JSON.stringify(saved.body)); assert.ok(saved.body.updatedAt);
  const loaded=await request(app).get('/api/cv/my').set('Authorization',auth(owner));
  assert.equal(loaded.status,200); assert.equal(loaded.body.cv.user_id,String(owner._id));
  for(const field of ['projects','certifications','experience','education','languages']) assert.deepEqual(loaded.body.cv.builder_data[field],builder[field]);
  assert.equal(loaded.body.cv.builder_data.templateId,8); assert.equal(loaded.body.cv.builder_data.accentColor,'#0ea5e9');
  assert.equal((await request(app).get('/api/cv/my').set('Authorization',auth(other))).status,404);
  const newer=await request(app).post('/api/cv').set('Authorization',auth(owner)).send({builder_data:{...builder,fullName:'Updated CV'},expected_updated_at:saved.body.updatedAt});
  assert.equal(newer.status,200);
  const stale=await request(app).post('/api/cv').set('Authorization',auth(owner)).send({builder_data:{...builder,fullName:'Stale overwrite'},expected_updated_at:saved.body.updatedAt});
  assert.equal(stale.status,409); assert.equal(stale.body.code,'CV_CHANGED');
  for(const invalid of [{...builder,templateId:11},{...builder,accentColor:'url(test)'},{...builder,email:'invalid'},{...builder,projects:'invalid'}]) assert.equal((await request(app).post('/api/cv').set('Authorization',auth(owner)).send({builder_data:invalid})).status,400);
  assert.equal((await CV.findOne({user_id:owner._id})).builder_data.fullName,'Updated CV');
  assert.equal((await request(app).delete('/api/cv').set('Authorization',auth(other))).status,404);
  assert.equal((await request(app).get('/api/cv/my').set('Authorization',auth(owner))).body.cv.builder_data.fullName,'Updated CV');
});
test('legacy CV remains readable and a legacy save clears stale editor data', async () => {
  const owner=await User.create({email:'cv-legacy@example.com',password:'FixturePassword123!',role:'seeker'});
  const url='/api/cv';
  assert.equal((await request(app).post(url).set('Authorization',auth(owner)).send({builder_data:{fullName:'Editor version'}})).status,200);
  const legacy={template:'classic',personal_info:{full_name:'Legacy name',avatar_url:'https://example.com/avatar.png'},education:[{degree:'BSc',institution:'University',start_year:2020,end_year:2035,description:'Stored legacy detail'}],skills:[{name:'Python',level:'خبير'}]};
  assert.equal((await request(app).post(url).set('Authorization',auth(owner)).send(legacy)).status,200);
  const loaded=(await request(app).get('/api/cv/my').set('Authorization',auth(owner))).body.cv;
  assert.equal(loaded.builder_data,undefined); assert.equal(loaded.personal_info.full_name,'Legacy name'); assert.equal(loaded.education[0].end_year,2035); assert.equal(loaded.skills[0].level,'خبير');
});
test('message inbox supports paging, read filters and owner-only read changes', async () => {
  const Company=require('../models/Company'); const Message=require('../models/ContactMessage');
  const owner=await User.create({email:'inbox-owner@example.com',password:'FixturePassword123!',role:'company'});
  const other=await User.create({email:'inbox-other@example.com',password:'FixturePassword123!',role:'company'});
  const company=await Company.create({name_ar:'شركة صندوق الرسائل',user_id:owner._id});
  const messages=await Message.insertMany([1,2].map(number=>({company_id:company._id,sender_name:'Sender '+number,sender_email:'sender@example.com',message:'A test message for the inbox.'})));
  const list='/api/messages/company/'+company._id;
  const page=await request(app).get(list+'?page=2&limit=1').set('Authorization',auth(owner));
  assert.equal(page.status,200); assert.equal(page.body.total,2); assert.equal(page.body.messages.length,1); assert.equal(page.body.page,2);
  const url='/api/messages/'+messages[0]._id+'/read';
  assert.equal((await request(app).patch(url)).status,401);
  assert.equal((await request(app).patch(url).set('Authorization',auth(seeker))).status,403);
  assert.equal((await request(app).patch(url).set('Authorization',auth(other))).status,403);
  assert.equal((await Message.findById(messages[0]._id)).is_read,false);
  assert.equal((await request(app).patch(url).set('Authorization',auth(owner))).status,200);
  assert.equal((await request(app).patch(url).set('Authorization',auth(owner))).status,200);
  assert.equal((await request(app).get(list+'?is_read=false').set('Authorization',auth(owner))).body.total,1);
  assert.equal((await request(app).get(list+'?is_read=true').set('Authorization',auth(owner))).body.total,1);
  assert.equal((await request(app).patch('/api/messages/'+messages[1]._id+'/read').set('Authorization',auth(admin))).status,200);
  assert.equal((await request(app).get(list+'?is_read=true').set('Authorization',auth(owner))).body.total,2);
  assert.equal((await request(app).get(list+'?is_read=invalid').set('Authorization',auth(owner))).status,400);
  assert.equal((await request(app).patch('/api/messages/not-an-id/read').set('Authorization',auth(owner))).status,400);
});

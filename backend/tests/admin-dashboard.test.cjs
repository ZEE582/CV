const { test, before, after } = require('node:test'); const assert = require('node:assert/strict'); const path = require('node:path');
process.env.NODE_ENV = 'test'; process.env.JWT_SECRET = 'a-local-test-secret-that-is-at-least-32-characters-long'; process.env.MONGOMS_DOWNLOAD_DIR = path.resolve(__dirname, '../../.cache/mongodb'); process.env.MONGOMS_VERSION = '7.0.24';
const mongoose = require('mongoose'); const { MongoMemoryServer } = require('mongodb-memory-server'); const session = require('express-session'); const request = require('supertest');
const User = require('../models/User'); const Company = require('../models/Company'); const Job = require('../models/Job'); const Application = require('../models/Application'); const Message = require('../models/ContactMessage'); const { signToken } = require('../config/jwtConfig');
let database, app, admin, owner, seeker, inactive, company, paused, jobs; const auth = user => 'Bearer ' + signToken(user);
before(async () => {
 database = await MongoMemoryServer.create(); await mongoose.connect(database.getUri()); app = require('../app').createApp({ sessionStore: new session.MemoryStore() });
 [admin,owner,seeker,inactive] = await Promise.all(['admin','company','seeker','admin'].map((role,index)=>User.create({role,name:'Private fixture account '+index,email:'admin-overview-'+index+'@example.com',password:'FixturePassword123!',phone:'PRIVATE-PHONE',is_active:index!==3})));
 company=await Company.create({name_ar:'Active fixture',is_verified:true});paused=await Company.create({name_ar:'Paused fixture',is_active:false,is_verified:true});await Company.create({name_ar:'Empty fixture'});
 const base={description:'Private fixture job description',salary_min:98765};
 jobs=await Job.create([
 {...base,company_id:company._id,title:'Open job'}, {...base,company_id:company._id,title:'Future job',deadline:new Date(Date.now()+3600000)},
 {...base,company_id:company._id,title:'Expired job',deadline:new Date(Date.now()-3600000)}, {...base,company_id:company._id,title:'Paused job',is_active:false},
 {...base,company_id:paused._id,title:'Inactive company job',deadline:new Date(Date.now()-3600000)}, {...base,company_id:new mongoose.Types.ObjectId(),title:'Orphan job'},
 ]);
}, {timeout:180000});
after(async()=>{await mongoose.disconnect();await database?.stop();});
const get=()=>request(app).get('/api/admin/stats').set('Authorization',auth(admin));

test('administrative counts distinguish open jobs and reviewable records from all stored records without loading personal profiles',async()=>{
 const application=(job,co,status='pending')=>({job_id:job,company_id:co,user_id:new mongoose.Types.ObjectId(),status,cover_letter:'PRIVATE COVER LETTER'});
 await Application.create([application(jobs[0]._id,company._id),application(jobs[1]._id,company._id),application(jobs[2]._id,company._id,'viewed'),application(jobs[4]._id,paused._id),application(jobs[4]._id,company._id),application(new mongoose.Types.ObjectId(),company._id),application(jobs[5]._id,jobs[5].company_id)]);
 await Message.create([{company_id:company._id,is_read:true},{company_id:company._id,is_read:false},{company_id:paused._id,is_read:false},{company_id:new mongoose.Types.ObjectId(),is_read:false}].map(value=>({...value,sender_name:'PRIVATE SENDER',sender_email:'private-sender@example.com',message:'PRIVATE MESSAGE BODY'})));
 const response=await get();assert.equal(response.status,200,JSON.stringify(response.body));assert.equal(response.headers['cache-control'],'no-store');const s=response.body.stats;
 assert.equal(s.totalUsers,4);assert.equal(s.activeUsers,3);assert.equal(s.totalCompanies,3);assert.equal(s.activeCompanies,2);assert.equal(s.verifiedCompanies,2);
 assert.equal(s.totalJobs,6);assert.equal(s.activeJobs,5);assert.equal(s.openJobs,2);assert.equal(s.pausedJobs,1);assert.equal(s.expiredJobs,1);assert.equal(s.companyPausedJobs,1);
 assert.equal(s.totalApplications,7);assert.equal(s.pendingApplications,6);assert.equal(s.reviewableApplications,4);assert.equal(s.reviewablePendingApplications,3);
 assert.equal(s.totalMessages,4);assert.equal(s.reviewableMessages,3);assert.equal(s.unreadMessages,2);assert.deepEqual(response.body.recordIssues,{jobs:1,applications:3,messages:1});assert.equal(response.body.companies.length,3);assert.equal(response.body.recentUsers,undefined);assert.ok(Number.isFinite(Date.parse(response.body.generated_at)));
 const serialized=JSON.stringify(response.body);for(const secret of ['Private fixture account','admin-overview-','PRIVATE-PHONE','PRIVATE SENDER','private-sender@example.com','PRIVATE COVER LETTER','Private fixture job description','98765','password','token_version']) assert.equal(serialized.includes(secret),false,secret);
 assert.equal((await Job.findById(jobs[0]._id)).views_count,0);assert.equal((await Company.findById(company._id)).views_count,0);
});

test('administrative overview rejects anonymous, nonadmin and deactivated sessions with private cache headers',async()=>{
 assert.equal((await request(app).get('/api/admin/stats')).status,401);
 for(const user of [owner,seeker]){const response=await request(app).get('/api/admin/stats').set('Authorization',auth(user));assert.equal(response.status,403);assert.equal(response.headers['cache-control'],'no-store');assert.equal(response.body.stats,undefined);}
 assert.equal((await request(app).get('/api/admin/stats').set('Authorization',auth(inactive))).status,401);
});

test('recent administrative jobs are limited and stably ordered, omit orphans and carry only the fields needed for scoped review',async()=>{
 const date=new Date(Date.now()+3600000);const fresh=await Job.create(Array.from({length:7},(_,index)=>({company_id:company._id,title:'Recent fixture '+index,description:'PRIVATE RECENT DESCRIPTION',createdAt:date})));
 const response=await get();const recent=response.body.recentJobs;assert.equal(recent.length,5);assert.deepEqual(recent.map(job=>job._id),fresh.map(job=>String(job._id)).sort().reverse().slice(0,5));
 for(const job of recent){assert.equal(job.company_id,String(company._id));assert.equal(job.company_name,'Active fixture');assert.equal(job.company_active,true);for(const key of ['description','salary_min','salary_max','requirements','views_count']) assert.equal(job[key],undefined);}
 assert.equal(response.body.companies.find(item=>item._id===String(paused._id)).is_active,false);
});

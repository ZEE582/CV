const { test }=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const vm=require('node:vm');const ts=require('typescript');
const root=path.resolve(__dirname,'../../frontend/src');
function load(file,globals={}){const module={exports:{}};const code=ts.transpileModule(fs.readFileSync(path.join(root,file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;vm.runInNewContext(code,{module,exports:module.exports,URL,URLSearchParams,Intl,require:name=>name==='../../../shared/api'?{API_BASE_URL:'/api'}:load(path.posix.normalize(path.posix.join(path.posix.dirname(file),name))+'.ts',globals),...globals});return module.exports;}
const api=load('features/platform/api/adminDashboard.ts');const helper=load('features/platform/utils/adminDashboard.ts');
const company={_id:'company',name_ar:'Fixture',name_en:null,is_active:true};
const data=()=>({success:true,generated_at:'2026-11-04T12:00:00Z',stats:{totalUsers:2,activeUsers:1,totalCompanies:1,activeCompanies:1,verifiedCompanies:0,totalJobs:2,activeJobs:1,openJobs:1,pausedJobs:1,expiredJobs:0,companyPausedJobs:0,totalApplications:3,pendingApplications:2,reviewableApplications:2,reviewablePendingApplications:1,totalMessages:3,reviewableMessages:2,unreadMessages:1},recordIssues:{jobs:0,applications:1,messages:1},companies:[company],recentJobs:[{_id:'job',title:'Fixture role',company_id:'company',company_name:'Fixture',company_active:true,is_active:true,deadline:null,createdAt:null}]});
const reply=(status,body)=>({status,ok:status>=200&&status<300,json:async()=>body});

test('admin overview validates numbers, scope, timestamps and total relationships before rendering and supports legacy missing job dates',()=>{
 assert.equal(api.readAdminDashboard(data()).recentJobs[0].createdAt,null);
 const cases=[()=>({...data(),generated_at:'invalid'}),()=>{const value=data();value.stats.openJobs=99;return value;},()=>{const value=data();value.stats.unreadMessages=3;return value;},()=>{const value=data();value.recordIssues.applications=0;return value;},()=>{const value=data();value.companies.push(company);return value;},()=>{const value=data();value.recentJobs[0].company_id='foreign';return value;},()=>{const value=data();value.recentJobs[0].company_active=false;return value;},()=>{const value=data();value.stats.totalUsers='2';return value;}];
 for(const create of cases) assert.throws(()=>api.readAdminDashboard(create()),/بيانات لوحة الإدارة/);
});

test('admin overview requests use the original administrator token, private caching and cancellation signal',async()=>{
 const requests=[];const controller=new AbortController();const client=load('features/platform/api/adminDashboard.ts',{localStorage:{getItem:()=> 'original'},fetch:async(url,options)=>{requests.push({url,...options});return reply(200,data());}}).createAdminDashboardClient('admin','admin');
 assert.equal((await client.load(controller.signal)).stats.openJobs,1);assert.equal(requests[0].url,'/api/admin/stats');assert.equal(requests[0].headers.Authorization,'Bearer original');assert.equal(requests[0].cache,'no-store');assert.equal(requests[0].credentials,'include');assert.equal(requests[0].signal,controller.signal);
});

test('account changes before and after the response and nonadmin roles cannot populate an administrative overview',async()=>{
 let token='original';let calls=0;const globals={localStorage:{getItem:()=>token},fetch:async()=>{calls++;return reply(200,data());}};const module=load('features/platform/api/adminDashboard.ts',globals);const client=module.createAdminDashboardClient('admin','admin');token='different';await assert.rejects(client.load(),/جلسة/);assert.equal(calls,0);token='original';
 const changed=load('features/platform/api/adminDashboard.ts',{...globals,fetch:async()=>{token='different';return reply(200,data());}}).createAdminDashboardClient('admin','admin');await assert.rejects(changed.load(),/جلسة/);token='original';
 for(const role of ['company','seeker'])await assert.rejects(module.createAdminDashboardClient('someone',role).load(),/صلاحية/);
});

test('malformed success replies and network or permission failures do not render old counts or reveal backend details',async()=>{
 const responses=[reply(200,{}),reply(403,{message:'PRIVATE DETAIL'}),{...reply(200,{}),json:async()=>{throw new SyntaxError('HTML');}}];const globals={localStorage:{getItem:()=> 'fixture'},fetch:async()=>responses.shift()};const client=load('features/platform/api/adminDashboard.ts',globals).createAdminDashboardClient('admin','admin');
 await assert.rejects(client.load(),/التحقق/);await assert.rejects(client.load(),error=>/للمدير/.test(error.message)&&!error.message.includes('PRIVATE'));await assert.rejects(client.load(),/التحقق/);
 const controller=new AbortController();const aborted=load('features/platform/api/adminDashboard.ts',{...globals,fetch:async()=>{controller.abort();throw new Error('cancelled');}}).createAdminDashboardClient('admin','admin');await assert.rejects(aborted.load(controller.signal),/cancelled/);
 const offline=load('features/platform/api/adminDashboard.ts',{...globals,fetch:async()=>{throw new Error('PRIVATE TRANSPORT');}}).createAdminDashboardClient('admin','admin');await assert.rejects(offline.load(),/الاتصال/);
});

test('company selection has no implicit fallback and workflow links preserve the exact selected company and optional job only',()=>{
 assert.equal(helper.selectedAdminCompany([company],null),undefined);assert.equal(helper.selectedAdminCompany([company],'foreign'),undefined);assert.equal(helper.selectedAdminCompany([company],'company')._id,'company');
 const links=helper.adminCompanyLinks('company + unicodeشركة','job + id');assert.equal(new URL('https://local'+links.dashboard).searchParams.get('company'),'company + unicodeشركة');assert.equal(new URL('https://local'+links.applicants).searchParams.get('job'),'job + id');assert.equal(new URL('https://local'+links.unread).searchParams.get('is_read'),'false');assert.equal(new URL('https://local'+links.messages).searchParams.has('job'),false);
});

const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const vm=require('node:vm');const ts=require('typescript');
const root=path.resolve(__dirname,'../../frontend/src');
function load(file,globals={}){const module={exports:{}};const code=ts.transpileModule(fs.readFileSync(path.join(root,file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;vm.runInNewContext(code,{module,exports:module.exports,URL,URLSearchParams,Intl,DOMException,require:name=>name==='../../../shared/api'?{API_BASE_URL:'/api'}:load(path.posix.normalize(path.posix.join(path.posix.dirname(file),name))+'.ts',globals),...globals});return module.exports;}
const item={_id:'application',user_id:'seeker',job_id:{_id:'job',title:'مهندس [C++]',is_active:true},company_id:{_id:'company',name_ar:'شركة التقنية'},status:'pending',createdAt:'2026-11-12T08:00:00Z',__v:2,cover_letter:null,cv_url:null};
const reply=(status,data)=>({status,ok:status>=200&&status<300,json:async()=>data});
const setup=(fetch,storage=()=> 'token',role='seeker')=>load('features/platform/api/myApplicationsClient.ts',{localStorage:{getItem:storage},fetch}).createMyApplicationsClient('seeker',role);
test('my applications reads bind to the initiating seeker session, use private caching and refuse changed accounts before and after transport',async()=>{
 let token='original',calls=0;const client=setup(async(_url,options)=>{calls++;assert.equal(options.cache,'no-store');assert.equal(options.credentials,'include');assert.equal(options.headers.Authorization,'Bearer original');token='another';return reply(200,{success:true,total:1,applications:[item]});},()=>token);
 await assert.rejects(client.list(),/تغيّرت جلسة/);await assert.rejects(client.list(),/تغيّرت جلسة/);assert.equal(calls,1);assert.equal(client.isCurrent(),false);
 for(const role of['company','admin'])await assert.rejects(setup(()=>{throw Error('must not fetch');},()=> 'token',role).list(),/تغيّرت جلسة/);
});
test('my applications accepts deleted references and nullable old fields but rejects foreign owners, duplicate ids and corrupt status/date/revision data',async()=>{
 const cases=[{...item,user_id:'foreign'},{...item,status:'unknown'},{...item,createdAt:'bad'},{...item,__v:-1},{...item,job_id:{_id:'job',title:{}}},{...item,company_id:undefined},{...item,cv_url:{}},{...item,updatedAt:'invalid'}];
 for(const invalid of cases)await assert.rejects(setup(async()=>reply(200,{success:true,total:1,applications:[invalid]})).list());
 await assert.rejects(setup(async()=>reply(200,{success:true,total:2,applications:[item,item]})).list());await assert.rejects(setup(async()=>reply(200,{success:true,total:99,applications:[item]})).list());
 const result=await setup(async()=>reply(200,{success:true,total:1,applications:[{...item,job_id:null,company_id:null}]})).list();assert.equal(result[0].user_id._id,'seeker');assert.equal(result[0].job_id,null);
});
test('withdrawal sends the reviewed revision and only accepts the exact application acknowledgement, while reviewed or foreign applications never dispatch',async()=>{
 let calls=0;const responses=[reply(200,{success:true,application_id:item._id}),reply(200,{success:true,application_id:'another'}),reply(409,{})];const app={...item,user_id:{_id:'seeker'}};const controller=new AbortController();
 const client=setup(async(url,options)=>{calls++;assert.equal(url,'/api/applications/application/withdraw');assert.equal(options.method,'DELETE');assert.equal(JSON.parse(options.body).expected_version,2);assert.equal(options.signal,controller.signal);return responses.shift();});
 await client.withdraw(app,controller.signal);await assert.rejects(client.withdraw(app,controller.signal),/تأكيد سحب/);await assert.rejects(client.withdraw(app,controller.signal),/تغيّر الطلب/);
 await assert.rejects(client.withdraw({...app,status:'viewed'}));await assert.rejects(client.withdraw({...app,user_id:{_id:'other'}}));assert.equal(calls,3);
});
test('unreadable responses, network failure and cancellation never become successful withdrawals or expose raw server messages',async()=>{
 const app={...item,user_id:{_id:'seeker'}};
 await assert.rejects(setup(async()=>{throw Error('secret raw failure');}).withdraw(app),e=>/تعذر تأكيد/.test(e.message)&&!e.message.includes('secret'));
 for(const status of[401,403,429,500])await assert.rejects(setup(async()=>reply(status,{message:'secret'})).list(),e=>!e.message.includes('secret'));
 await assert.rejects(setup(async()=>reply(200,null)).withdraw(app));
 const controller=new AbortController();await assert.rejects(setup(async()=>{controller.abort();return reply(200,{success:true,application_id:item._id});}).withdraw(app,controller.signal),e=>e.name==='AbortError');
});
test('my application search is literal and Unicode aware, preserves URL filters and clamps pages without changing the original records',()=>{
 const helper=load('features/platform/utils/myApplications.ts');const items=Array.from({length:19},(_,i)=>({...item,_id:String(i).padStart(2,'0'),status:i%2?'viewed':'pending'}));const original=items.map(x=>x._id).join(',');
 const params=new URLSearchParams('q=%5BC%2B%2B%5D&page=999&sort=oldest');const state=helper.readMyApplicationsSearch(params);let result=helper.myApplicationsResults(items,state);assert.equal(result.total,19);assert.equal(result.page,3);assert.equal(result.items.length,3);assert.equal(result.counts.pending,10);assert.equal(result.items[0]._id,'16');
 assert.equal(helper.myApplicationsResults(items,{...state,q:'.*'}).total,0);assert.equal(helper.myApplicationsResults(items,{...state,q:'شركة',status:'viewed'}).total,9);assert.equal(items.map(x=>x._id).join(','),original);
 const next=helper.patchMyApplicationsSearch(params,{status:'pending'});assert.equal(next.has('page'),false);assert.equal(next.get('q'),'[C++]');assert.equal(params.get('page'),'999');assert.equal(helper.readMyApplicationsSearch(new URLSearchParams('status=unknown&page=-3')).page,1);
});

const{test,beforeEach,after}=require('node:test');const assert=require('node:assert/strict');
const{createExecutorReadiness}=require('../services/executorReadiness');
const original={url:process.env.CODE_EXECUTOR_URL,token:process.env.CODE_EXECUTOR_TOKEN,mode:process.env.NODE_ENV};
beforeEach(()=>{process.env.NODE_ENV='test';process.env.CODE_EXECUTOR_URL='https://executor.example/api/v2/execute';process.env.CODE_EXECUTOR_TOKEN='OWNER-TOKEN';});
after(()=>{for(const[key,value]of Object.entries({CODE_EXECUTOR_URL:original.url,CODE_EXECUTOR_TOKEN:original.token,NODE_ENV:original.mode})){if(value===undefined)delete process.env[key];else process.env[key]=value;}});
const rows=()=>['javascript','python','java','c','c++'].map(language=>({language,version:'1.0.0',aliases:[]}));
test('live readiness distinguishes absent configuration, unverifiable endpoint, missing languages and partial runtime availability',async()=>{
 const service=createExecutorReadiness({get:async()=>({data:[]})});
 delete process.env.CODE_EXECUTOR_URL;assert.equal((await service.check()).state,'unconfigured');
 process.env.CODE_EXECUTOR_URL='https://executor.example/private';assert.equal((await service.check()).state,'unverifiable');
 process.env.CODE_EXECUTOR_URL='https://executor.example/api/v2/execute';const empty=await service.check();assert.equal(empty.configured,true);assert.equal(empty.available,false);assert.equal(empty.state,'missing_runtimes');assert.ok(empty.checked_at);
 const partial=await createExecutorReadiness({get:async()=>({data:[{language:'node',version:'20.11.1',aliases:['javascript']}]})}).check();
 assert.equal(partial.available,true);assert.equal(partial.state,'partial');assert.deepEqual(partial.installed_languages,['javascript']);assert.equal(partial.languages.length,5);
});
test('metadata probes have bounded transport, no redirect or query forwarding, and reports never expose owner credentials or upstream bodies',async()=>{
 process.env.CODE_EXECUTOR_URL='https://executor.example/api/v2/execute?secret=PRIVATE#PRIVATE';
 const service=createExecutorReadiness({get:async(url,options)=>{assert.equal(url,'https://executor.example/api/v2/runtimes');assert.equal(options.maxRedirects,0);assert.equal(options.maxContentLength,128*1024);assert.equal(options.timeout,3000);assert.ok(options.signal);assert.deepEqual(options.headers,{Authorization:'Bearer OWNER-TOKEN'});return {data:rows()};}});
 const ready=await service.check();assert.equal(ready.state,'ready');assert.equal(ready.installed_languages.length,5);
 for(const secret of['PRIVATE','OWNER-TOKEN','/api/v2'])assert.equal(JSON.stringify(ready).includes(secret),false);
 const broken=await createExecutorReadiness({get:async()=>{throw new Error('PRIVATE OWNER-TOKEN');}}).check();assert.equal(broken.state,'unreachable');assert.equal(JSON.stringify(broken).includes('PRIVATE'),false);
 const malformed=await createExecutorReadiness({get:async()=>({data:'<html>PRIVATE</html>'})}).check();assert.equal(malformed.state,'invalid_response');
});
test('concurrent readers share one probe and five-second snapshots cannot be mutated by a caller or extended indefinitely',async()=>{
 let release,reads=0,clock=10000;const service=createExecutorReadiness({now:()=>clock,get:async()=>{reads++;return new Promise(resolve=>{release=resolve;});}});
 const first=service.check(),second=service.check();assert.equal(reads,1);release({data:rows()});
 const a=await first,b=await second;a.installed_languages.length=0;b.languages.length=0;
 const cached=await service.check();assert.equal(cached.installed_languages.length,5);assert.equal(cached.languages.length,5);assert.equal(reads,1);
 clock+=5001;const fresh=service.check();assert.equal(reads,2);release({data:[]});assert.equal((await fresh).state,'missing_runtimes');
});
test('authenticated-run preflight can bypass a cached snapshot and configuration/token changes invalidate discovery',async()=>{
 let reads=0;const service=createExecutorReadiness({get:async()=>{reads++;return {data:rows()};}});
 await service.check();await service.check();assert.equal(reads,1);await service.check({fresh:true});assert.equal(reads,2);
 process.env.CODE_EXECUTOR_TOKEN='ROTATED';await service.check();assert.equal(reads,3);
 process.env.CODE_EXECUTOR_URL='https://second.example/api/v2/execute';await service.check();assert.equal(reads,4);
 service.clear();await service.check();assert.equal(reads,5);
});
test('late discovery from an old configuration cannot poison the current cached snapshot',async()=>{
 let releaseOld,reads=0;const service=createExecutorReadiness({get:async(url)=>{reads++;return url.includes('executor.example')?new Promise(resolve=>{releaseOld=resolve;}):{data:[]};}});
 const old=service.check();process.env.CODE_EXECUTOR_URL='https://second.example/api/v2/execute';
 assert.equal((await service.check()).state,'missing_runtimes');releaseOld({data:rows()});assert.equal((await old).state,'ready');
 const current=await service.check();assert.equal(current.host,'second.example');assert.equal(current.state,'missing_runtimes');assert.equal(reads,2);
});
test('the absolute probe deadline aborts discovery and returns an unavailable snapshot',async()=>{
 let aborted=false;const service=createExecutorReadiness({timeoutMs:20,get:async(_url,options)=>new Promise((_resolve,reject)=>{options.signal.addEventListener('abort',()=>{aborted=true;reject(new Error('aborted'));},{once:true});})});
 const status=await service.check();assert.equal(aborted,true);assert.equal(status.available,false);assert.equal(status.state,'unreachable');
});

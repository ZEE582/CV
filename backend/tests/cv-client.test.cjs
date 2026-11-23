const{test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const vm=require('node:vm');const ts=require('typescript');
const platform=path.resolve(__dirname,'../../frontend/src/features/platform');
function fixture(){let token='ORIGINAL';let handler=async()=>new Response('{}',{status:500});const calls=[];
 const cache=new Map();function load(file){if(cache.has(file))return cache.get(file);const module={exports:{}};cache.set(file,module.exports);const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;vm.runInNewContext(code,{module,exports:module.exports,URL,TextEncoder,DOMException,localStorage:{getItem:()=>token},fetch:async(url,options)=>{calls.push({url,options});return handler(url,options);},require:name=>name.endsWith('/shared/api')?{API_BASE_URL:'/api'}:load(path.resolve(path.dirname(file),name+'.ts'))});return module.exports;}
 const types=load(path.join(platform,'components/cv/cv.types.ts'));const api=load(path.join(platform,'api/cvClient.ts'));const validation=load(path.join(platform,'components/cv/cv.validation.ts'));
 return{...api,...validation,cv:types.defaultCV,calls,setToken:v=>{token=v;},reply:fn=>{handler=fn;},json:(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json'}})};
}
const owner='000000000000000000000001',cvId='000000000000000000000002',other='000000000000000000000003',stamp='2026-11-11T10:00:00.000Z';
function saved(f,patch={}){return{success:true,cv:{_id:cvId,user_id:owner,updatedAt:stamp,builder_data:f.cv(),...patch}};}
test('CV reads bind to the owner, honor cancellation and private caching, and accept only the explicit no-CV response',async()=>{
 const f=fixture(),client=f.createCVClient(owner),controller=new AbortController();f.reply(async()=>f.json(saved(f)));assert.equal((await client.load(controller.signal)).updatedAt,stamp);
 const request=f.calls[0];assert.equal(request.url,'/api/cv/my');assert.equal(request.options.signal,controller.signal);assert.equal(request.options.credentials,'omit');assert.equal(request.options.cache,'no-store');assert.equal(request.options.headers.Authorization,'Bearer ORIGINAL');
 f.reply(async()=>f.json({success:false,code:'CV_NOT_FOUND'},404));assert.equal((await client.load()).updatedAt,null);
 f.reply(async()=>f.json({message:'unknown'},404));await assert.rejects(client.load());
});
test('CV reads reject wrong accounts, missing revisions, malformed editor data and legacy collections without silently replacing work',async()=>{
 const f=fixture(),client=f.createCVClient(owner);
 for(const patch of[{user_id:other},{_id:'x'},{updatedAt:'yesterday'},{updatedAt:null},{builder_data:'bad'},{builder_data:{...f.cv(),projects:'bad'}},{builder_data:{...f.cv(),languages:[{lang:'Arabic',level:42}]}}]){f.reply(async()=>f.json(saved(f,patch)));await assert.rejects(client.load());}
 f.reply(async()=>f.json(saved(f,{builder_data:undefined,personal_info:{full_name:'اسم قديم'},education:[{institution:'جامعة',start_year:2020}],experience:[]})));assert.equal((await client.load()).cv.fullName,'اسم قديم');
 f.reply(async()=>f.json(saved(f,{builder_data:undefined,education:'bad'})));await assert.rejects(client.load());
});
test('CV saves send the original revision and only CV fields and require a matching acknowledged record and valid timestamp',async()=>{
 const f=fixture(),client=f.createCVClient(owner);f.reply(async()=>f.json(saved(f)));await client.load();const cv={...f.cv(),fullName:'اسم',projects:[{id:'p',name:'مشروع',description:'تفاصيل',tech:['React'],url:'example.com',github:''}]};const controller=new AbortController();
 f.reply(async()=>f.json({success:true,cv_id:cvId,updatedAt:'2026-11-11T10:01:00.000Z'}));await client.save(cv,stamp,controller.signal);const request=f.calls.at(-1),body=JSON.parse(request.options.body);assert.equal(body.expected_updated_at,stamp);assert.equal(body.builder_data.fullName,'اسم');assert.equal(body.builder_data.projects[0].description,'تفاصيل');assert.equal('user_id'in body,false);assert.equal(request.options.signal,controller.signal);assert.equal(request.options.credentials,'omit');
 for(const reply of[{success:false},{success:true},{success:true,cv_id:other,updatedAt:stamp},{success:true,cv_id:cvId,updatedAt:'bad'},{success:true,cv_id:cvId,updatedAt:'2020-01-01T00:00:00.000Z'}]){f.reply(async()=>f.json(reply));await assert.rejects(client.save(cv,stamp));}
});
test('CV session changes before requests or while reading JSON never populate an editor or confirm a save',async()=>{
 const f=fixture(),client=f.createCVClient(owner);f.setToken('OTHER');await assert.rejects(client.load(),error=>error.status===401);assert.equal(f.calls.length,0);
 f.setToken('ORIGINAL');f.reply(async()=>({ok:true,status:200,json:async()=>{f.setToken('OTHER');return saved(f);}}));await assert.rejects(client.load(),error=>error.status===401);
 f.setToken('ORIGINAL');f.reply(async()=>({ok:true,status:200,json:async()=>{f.setToken('OTHER');return {success:true,cv_id:cvId,updatedAt:stamp};}}));await assert.rejects(client.save(f.cv(),null),error=>error.status===401);
});
test('CV failures distinguish conflict and expired sessions, suppress raw upstream data and reject cancelled or unreadable successes',async()=>{
 const f=fixture(),client=f.createCVClient(owner);
 for(const status of[400,401,409,413,500]){f.reply(async()=>f.json({message:'PRIVATE_UPSTREAM_DETAIL'},status));await assert.rejects(client.save(f.cv(),null),error=>error.status===status&&!error.message.includes('PRIVATE_'));}
 f.reply(async()=>{throw new Error('PRIVATE_NETWORK');});await assert.rejects(client.load(),error=>!error.message.includes('PRIVATE_'));
 f.reply(async()=>new Response('not JSON'));await assert.rejects(client.load());
 const controller=new AbortController();f.reply(async()=>{controller.abort();return f.json(saved(f));});await assert.rejects(client.load(controller.signal),error=>error.name==='AbortError');
});
test('invalid CV fields and oversized UTF8 payloads fail before any network save',async()=>{
 const f=fixture(),client=f.createCVClient(owner);
 for(const cv of[{...f.cv(),email:'bad'},{...f.cv(),fullName:'x'.repeat(201)},{...f.cv(),skills:['x'.repeat(201)]},{...f.cv(),templateId:11}])await assert.rejects(client.save(cv,null),error=>error.status===400);
 const cv={...f.cv(),projects:Array.from({length:40},(_,i)=>({id:String(i),name:'مشروع',description:'ع'.repeat(20000),tech:[],url:'',github:''}))};await assert.rejects(client.save(cv,null),error=>error.status===413);assert.equal(f.calls.length,0);
});
test('CV validation permits empty optional sections and all supported template and language choices',()=>{
 const f=fixture();assert.equal(f.cvIssue(f.cv()),'');for(let templateId=1;templateId<=10;templateId++)assert.equal(f.cvIssue({...f.cv(),templateId,email:'name@example.com',avatarUrl:'',skillLevels:[{name:'React',level:'خبير'}]}),'');
 const cv={...f.cv(),experience:[{id:'e',company:'شركة',role:'مطور',startDate:'2020',endDate:'',current:true,description:'',tech:[]}],education:[{id:'ed',school:'جامعة',degree:'BSc',field:'CS',startDate:'2020',endDate:'2024',gpa:''}],certifications:[{id:'c',name:'شهادة',issuer:'جهة',date:'2026',url:''}]};assert.equal(f.cvIssue(cv),'');
});
test('CV validation rejects malformed arrays and nested values instead of accepting lossy or unusable drafts',()=>{
 const f=fixture();for(const patch of[{skills:'x'},{skills:Array(101).fill('a')},{languages:[{lang:'Arabic',level:'bad'}]},{experience:[{id:'e',current:'false'}]},{education:[{school:7}]},{projects:[{name:'project',tech:'React'}]},{certifications:[{issuer:null}]},{accentColor:'url(x)'},{email:' name@example.com'}])assert.notEqual(f.cvIssue({...f.cv(),...patch}),'');assert.notEqual(f.cvIssue(null),'');
});

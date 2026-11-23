const {test,beforeEach,after}=require('node:test');
const assert=require('node:assert/strict');
const {inspectExecutor,installedLanguages}=require('../../scripts/check-executor.cjs');
const original={url:process.env.CODE_EXECUTOR_URL,token:process.env.CODE_EXECUTOR_TOKEN,mode:process.env.NODE_ENV};
const restore=(key,value)=>value===undefined?delete process.env[key]:process.env[key]=value;
beforeEach(()=>{process.env.NODE_ENV='test';process.env.CODE_EXECUTOR_URL='https://executor.example/api/v2/execute';delete process.env.CODE_EXECUTOR_TOKEN;});
after(()=>{restore('CODE_EXECUTOR_URL',original.url);restore('CODE_EXECUTOR_TOKEN',original.token);restore('NODE_ENV',original.mode);});
const all=()=>['javascript','python','java','c','c++'].map(language=>({language,version:'1.0.0',aliases:[]}));
const goodGet=async()=>({data:all()});
test('unconfigured or unsafe executor configurations cannot cause a diagnostic request or execution',async()=>{
 for(const url of ['', 'javascript:alert(1)','http://external.example/api/v2/execute','https://user:secret@executor.example/api/v2/execute']){
  process.env.CODE_EXECUTOR_URL=url;
  const report=await inspectExecutor({get:()=>assert.fail('unexpected network'),run:()=>assert.fail('unexpected execution'),smoke:true});
  assert.equal(report.configured,false);assert.equal(report.ready,false);
 }
 process.env.NODE_ENV='production';process.env.CODE_EXECUTOR_URL='http://127.0.0.1:2000/api/v2/execute';
 assert.equal((await inspectExecutor({get:()=>assert.fail('unexpected network')})).configured,false);
});
test('runtime discovery recognizes aliases and missing languages without inventing an executable runtime',async()=>{
 const rows=all();rows[0]={language:'node',version:'20.0.0',aliases:['JavaScript','js']};
 assert.deepEqual(installedLanguages(rows),['javascript','python','java','c','c++']);
 assert.deepEqual(installedLanguages([...rows,rows[0]]),['javascript','python','java','c','c++']);
 const report=await inspectExecutor({get:async()=>({data:rows.slice(0,2)}),smoke:true,run:()=>assert.fail('incomplete runtimes must not run')});
 assert.equal(report.reachable,true);assert.equal(report.ready,false);assert.equal(report.reason,'missing_languages');
 assert.deepEqual(report.missing,['java','c','c++']);assert.equal(report.smoke,null);
});
test('default readiness checks are read-only, bounded, do not follow redirects and never print endpoint queries or owner tokens',async()=>{
 process.env.CODE_EXECUTOR_URL='https://executor.example/private/api/v2/execute?private=SECRET#PRIVATE';process.env.CODE_EXECUTOR_TOKEN='OWNER-TOKEN';
 let reads=0;
 const report=await inspectExecutor({get:async(url,options)=>{
  reads++;assert.equal(url,'https://executor.example/private/api/v2/runtimes');assert.equal(options.timeout,5000);assert.equal(options.maxRedirects,0);assert.equal(options.maxContentLength,128*1024);
  assert.deepEqual(options.headers,{Authorization:'Bearer OWNER-TOKEN'});return {data:all()};
 },run:()=>assert.fail('default command must not execute code')});
 assert.equal(reads,1);assert.equal(report.ready,true);assert.equal(report.smoke,null);assert.equal(report.host,'executor.example');
 for(const secret of ['SECRET','PRIVATE','OWNER-TOKEN','/private'])assert.equal(JSON.stringify(report).includes(secret),false);
 process.env.CODE_EXECUTOR_URL='https://executor.example/custom-run';
 assert.equal((await inspectExecutor({get:()=>assert.fail('must not guess custom routes')})).reason,'nonstandard_execute_path');
});
test('malformed runtime replies and network errors fail closed without leaking upstream details',async()=>{
 for(const data of ['<html>secret</html>',null,{},Array(501).fill({}),[{language:'javascript',version:'1.0.0',aliases:'js'}],[{language:'javascript',version:'',aliases:[]}]]){
  const report=await inspectExecutor({get:async()=>({data})});assert.equal(report.ready,false);assert.equal(report.reason,'invalid_runtimes');
 }
 for(const error of [new Error('PRIVATE TOKEN secret'),null]){
  const report=await inspectExecutor({get:async()=>{throw error;}});assert.equal(report.reason,'unreachable');assert.equal(JSON.stringify(report).includes('PRIVATE'),false);
 }
});
test('explicit smoke checks send only fixed sum examples after all five runtimes are present and validate actual stdout',async()=>{
 const calls=[];
 const report=await inspectExecutor({get:goodGet,smoke:true,run:async(language,code,stdin)=>{
  calls.push(language);assert.equal(typeof code,'string');assert.ok(code.length<500);assert.equal(stdin,'2 3\n');return {state:'completed',stdout:'5\n'};
 }});
 assert.deepEqual(calls,['javascript','python','java','c','c++']);assert.equal(report.ready,true);assert.ok(Object.values(report.smoke).every(state=>state==='passed'));
});
test('a failed, incorrect or unavailable smoke execution is reported without treating process completion as correct output',async()=>{
 const report=await inspectExecutor({get:goodGet,smoke:true,run:async(language)=>{
  if(language==='java')throw new Error('PRIVATE COMPILER OUTPUT');
  return {state:language==='c'?'runtime_error':'completed',stdout:language==='python'?'wrong':'5'};
 }});
 assert.equal(report.ready,false);assert.equal(report.reason,'smoke_failed');assert.equal(report.smoke.javascript,'passed');
 for(const language of ['java','python','c'])assert.equal(report.smoke[language],'failed');
 assert.equal(JSON.stringify(report).includes('PRIVATE'),false);
});

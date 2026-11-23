const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const vm=require('node:vm');const ts=require('typescript');
const root=path.resolve(__dirname,'../../frontend/src/features/platform/utils');
function load(name,globals={}){const module={exports:{}};const js=ts.transpileModule(fs.readFileSync(path.join(root,name+'.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;vm.runInNewContext(js,{module,exports:module.exports,URLSearchParams,Blob,require:name=>load(name.replace('./',''),globals),...globals});return module.exports;}
const helper=load('practiceDrafts');const practice=load('practice');
test('draft protection detects changes in every language, including cleared code and stdin-only edits, but not untouched defaults',()=>{
 assert.equal(helper.changedDraftLanguages({}).length,0);
 const defaults=Object.fromEntries(Object.entries(practice.codeTemplates).map(([language,code])=>[language,{code,stdin:''}]));
 assert.equal(helper.changedDraftLanguages(defaults).length,0);
 defaults.python.code='';defaults.java.stdin=' 2\n3\n';
 assert.deepEqual(Array.from(helper.changedDraftLanguages(defaults)),['python','java']);
});
test('navigation protection distinguishes leaving the editor or changing a problem from harmless return filters and anchors',()=>{
 const current={pathname:'/playground',search:'?problem=LC-37&from=x'};
 assert.equal(helper.draftContextChanges(current,{pathname:'/practice',search:''}),true);
 assert.equal(helper.draftContextChanges(current,{pathname:'/playground',search:'?problem=LC-38'}),true);
 assert.equal(helper.draftContextChanges(current,{pathname:'/playground',search:'?problem=LC-37&from=other'}),false);
 assert.equal(helper.draftContextChanges({pathname:'/playground',search:''},{pathname:'/playground',search:'?from=x'}),false);
});
test('all-drafts export round-trips exact Unicode, whitespace and empty content without account, token or unknown language fields',()=>{
 const drafts={javascript:{code:'  // العربية 👋\r\nconsole.log("<script>");\n',stdin:' 2\t3\n',token:'PRIVATE'},python:{code:'',stdin:''},shell:{code:'secret',stdin:''}};
 const bundle=JSON.parse(helper.draftBundle(drafts,'java','LC-37'));
 assert.equal(bundle.format,'ttwar-playground');assert.equal(bundle.version,1);assert.equal(bundle.problem_id,'LC-37');
 assert.equal(bundle.drafts.javascript.code,drafts.javascript.code);assert.equal(bundle.drafts.javascript.stdin,drafts.javascript.stdin);
 assert.equal(bundle.drafts.python.code,'');assert.equal(bundle.drafts.java.code,practice.codeTemplates.java);
 assert.equal(bundle.drafts.shell,undefined);assert.equal(bundle.drafts.javascript.token,undefined);assert.equal(JSON.stringify(bundle).includes('PRIVATE'),false);
 assert.throws(()=>helper.draftBundle({},'shell',null));
 assert.throws(()=>helper.draftBundle({java:{code:'x'.repeat(50001),stdin:''}},'java',null));
 assert.throws(()=>helper.draftBundle({java:{code:'x',stdin:'x'.repeat(8001)}},'java',null));
 assert.equal(helper.codeFilenames.java,'Main.java');assert.equal(helper.codeFilenames['c++'],'main.cpp');
});
test('download dispatch preserves bytes, uses a local Blob URL and releases the link and URL after browser consumption',async()=>{
 const events=[];let blob,cleanup;const anchor={remove:()=>events.push('remove'),click:()=>events.push('click')};
 const module=load('practiceDrafts',{URL:{createObjectURL:value=>{blob=value;return 'blob:local';},revokeObjectURL:value=>events.push('revoke:'+value)},document:{createElement:()=>anchor,body:{appendChild:value=>{assert.equal(value,anchor);events.push('append');}}},window:{setTimeout:(fn,delay)=>{assert.equal(delay,1000);cleanup=fn;}}});
 const code='  العربية 👋\r\nprint(1)\n';module.requestTextDownload(code,'main.py');
 assert.equal(await blob.text(),code);assert.equal(anchor.href,'blob:local');assert.equal(anchor.download,'main.py');
 assert.deepEqual(events,['append','click','remove']);cleanup();assert.equal(events.at(-1),'revoke:blob:local');
});
test('failed download dispatch releases its resources and leaves the caller responsible for the retained draft',()=>{
 const events=[];const module=load('practiceDrafts',{URL:{createObjectURL:()=> 'blob:failed',revokeObjectURL:value=>events.push(value)},document:{createElement:()=>({click:()=>{throw new Error('blocked');},remove:()=>events.push('removed')}),body:{appendChild:()=>{}}},window:{setTimeout:()=>assert.fail('failed dispatch must not schedule success cleanup')}});
 assert.throws(()=>module.requestTextDownload('code','main.js'),/blocked/);assert.deepEqual(events,['blob:failed','removed']);
});
test('reload protection requests the browser prompt without mutating or storing the draft',()=>{
 let prevented=false;const event={preventDefault:()=>{prevented=true;},returnValue:undefined};helper.protectDraftReload(event);assert.equal(prevented,true);assert.equal(event.returnValue,'');
});

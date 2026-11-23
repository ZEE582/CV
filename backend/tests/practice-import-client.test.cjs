const{test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const vm=require('node:vm');const ts=require('typescript');const{File}=require('node:buffer');
const root=path.resolve(__dirname,'../../frontend/src/features/platform/utils');
function load(name){const module={exports:{}};const js=ts.transpileModule(fs.readFileSync(path.join(root,name+'.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;vm.runInNewContext(js,{module,exports:module.exports,URLSearchParams,TextDecoder,require:name=>load(name.replace('./',''))});return module.exports;}
const imports=load('practiceDraftImport'),exportsHelper=load('practiceDrafts');
const base=()=>({format:'ttwar-playground',version:1,active_language:'javascript',problem_id:'LC-37',drafts:{javascript:{code:'  // العربية 👋\r\n<script>not executed</script>\n',stdin:' 2\t3\n'}}});
const parse=value=>imports.parseDraftBundle(JSON.stringify(value));
test('exported bundles restore exact language drafts and preserve Unicode, line endings, whitespace and empty code as data',()=>{
 const drafts={javascript:base().drafts.javascript,python:{code:'',stdin:'\n'}};
 const result=imports.parseDraftBundle(exportsHelper.draftBundle(drafts,'python','LC-37'));
 assert.equal(result.activeLanguage,'python');assert.equal(result.problemId,'LC-37');
 assert.equal(result.drafts.javascript.code,drafts.javascript.code);assert.equal(result.drafts.javascript.stdin,drafts.javascript.stdin);
 assert.equal(result.drafts.python.code,'');assert.equal(result.drafts.python.stdin,'\n');
 assert.equal(imports.parseDraftBundle('\uFEFF'+JSON.stringify(base())).activeLanguage,'javascript');
});
test('unsupported formats, versions, missing fields, account fields and malformed root records cannot produce a partial import',()=>{
 for(const value of[null,[],{}, {...base(),format:'other'}, {...base(),version:'1'}, {...base(),version:2},{...base(),token:'PRIVATE'},{...base(),problem_id:7},{...base(),problem_id:'x'.repeat(161)}])assert.throws(()=>parse(value));
 for(const key of Object.keys(base())){const value=base();delete value[key];assert.throws(()=>parse(value));}
 assert.throws(()=>imports.parseDraftBundle('{"drafts":'));
 assert.throws(()=>imports.parseDraftBundle('x'.repeat(imports.maxDraftFileBytes+1)));
});
test('unknown language and prototype keys, invalid active selections and malformed draft fields are rejected',()=>{
 for(const patch of[{drafts:[]},{drafts:{}},{active_language:'shell'},{active_language:'python'},{drafts:{shell:{code:'code',stdin:''}}},{drafts:{javascript:{code:'x'}}},{drafts:{javascript:{code:1,stdin:''}}},{drafts:{javascript:{code:'x',stdin:null}}},{drafts:{javascript:{code:'x',stdin:'',extra:'x'}}}])assert.throws(()=>parse({...base(),...patch}));
 const malicious=base();malicious.drafts=JSON.parse('{"__proto__":{"polluted":true}}');assert.throws(()=>parse(malicious));assert.equal({}.polluted,undefined);
 const extra=base();extra.drafts.constructor={code:'x',stdin:''};assert.throws(()=>parse(extra));
});
test('all five language limits are accepted at the boundary and excess code or stdin is refused',()=>{
 const value=base();value.drafts=Object.fromEntries(['javascript','python','java','c','c++'].map(language=>[language,{code:'\u0001'.repeat(50000),stdin:'\u0002'.repeat(8000)}]));
 const text=JSON.stringify(value);assert.ok(Buffer.byteLength(text)<imports.maxDraftFileBytes);assert.equal(Object.keys(imports.parseDraftBundle(text).drafts).length,5);
 value.drafts.python.code+='x';assert.throws(()=>parse(value));value.drafts.python.code='x';value.drafts.python.stdin+='x';assert.throws(()=>parse(value));
});
test('actual UTF-8 JSON files including a BOM restore locally regardless of advisory MIME type',async()=>{
 const file=new File(['\uFEFF'+JSON.stringify(base())],'backup.JSON',{type:'application/octet-stream'});
 const result=await imports.readDraftFile(file);assert.equal(result.drafts.javascript.code,base().drafts.javascript.code);assert.equal(result.problemId,'LC-37');
});
test('empty, oversized, wrongly named and invalid UTF-8 files fail before a candidate can be applied',async()=>{
 await assert.rejects(imports.readDraftFile(new File([],'empty.json')));
 await assert.rejects(imports.readDraftFile(new File([JSON.stringify(base())],'script.js')));
 await assert.rejects(imports.readDraftFile(new File([new Uint8Array([255,254,255])],'invalid.json')));
 await assert.rejects(imports.readDraftFile({name:'large.json',size:imports.maxDraftFileBytes+1,slice:()=>assert.fail('must not read oversized files')}));
 await assert.rejects(imports.readDraftFile({name:'changed.json',size:1,slice:()=>new Blob([new Uint8Array(imports.maxDraftFileBytes+1)])}));
});
test('applying a validated backup replaces only included languages, preserves other work and does not mutate either input',()=>{
 const original={javascript:{code:'CURRENT',stdin:'old'},java:{code:'keep this Java code',stdin:'keep this input'}};
 const candidate=parse(base());const applied=imports.mergeImportedDrafts(original,candidate);
 assert.equal(applied.javascript.code,base().drafts.javascript.code);assert.equal(applied.java.code,original.java.code);assert.equal(applied.java.stdin,original.java.stdin);
 assert.equal(original.javascript.code,'CURRENT');applied.javascript.code='new edit';assert.equal(candidate.drafts.javascript.code,base().drafts.javascript.code);
});

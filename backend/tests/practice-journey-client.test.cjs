const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const ts=require('typescript');
const root=path.resolve(__dirname,'../../frontend/src/features/platform/utils');
function load(name){
 const module={exports:{}};
 const code=ts.transpileModule(fs.readFileSync(path.join(root,name+'.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 vm.runInNewContext(code,{module,exports:module.exports,URLSearchParams,require:name=>load(name.replace('./',''))});
 return module.exports;
}
const journey=load('practiceJourney');

test('catalogue to detail to editor and back retains the original bounded search, filters and page after a copied URL',()=>{
 const catalogue=journey.practiceCataloguePath(new URLSearchParams({q:'C++ شجرة',type:'coding',difficulty:'Easy',page:'4',token:'must not travel'}));
 const detail=new URL(journey.practiceDetailPath('LC-37',catalogue),'https://local.invalid');
 assert.equal(detail.pathname,'/practice/LC-37');
 const editor=new URL(journey.practiceEditorPath('LC-37',detail.searchParams.get('from')),'https://local.invalid');
 assert.equal(editor.searchParams.get('problem'),'LC-37');
 const back=journey.practiceReturnPath(editor.searchParams.get('from'));
 assert.equal(back,catalogue);
 const filters=new URL(back,'https://local.invalid').searchParams;
 assert.equal(filters.get('q'),'C++ شجرة');assert.equal(filters.get('page'),'4');
 assert.equal(filters.get('type'),'coding');assert.equal(filters.get('difficulty'),'Easy');
 assert.equal(filters.has('token'),false);
 assert.equal(journey.practiceDetailPath('id /?#',back).split('?')[0],'/practice/id%20%2F%3F%23');
 assert.equal(new URL(journey.practiceEditorPath(null,back),'https://local.invalid').searchParams.has('problem'),false);
});

test('return destinations cannot escape the local catalogue, carry unknown parameters or keep invalid pagination',()=>{
 for(const destination of [null,'https://evil.example/practice','//evil.example','/practice/LC-37','/practice-other','/practice#https://evil.example','/practice\\evil','/practice?'+'x'.repeat(2050)]){
  assert.equal(journey.practiceReturnPath(destination),'/practice');
  const editor=new URL(journey.practiceEditorPath('LC-37',destination),'https://local.invalid');
  assert.equal(editor.searchParams.has('from'),false);
 }
 const back=journey.practiceReturnPath('/practice?type=shell&difficulty=Fake&page=-1&from=https://evil.example&token=secret&q='+encodeURIComponent('x'.repeat(300)));
 const params=new URL(back,'https://local.invalid').searchParams;
 assert.equal(params.get('q').length,120);
 assert.deepEqual([...params.keys()],['q']);
 assert.equal(journey.practiceReturnPath('/practice?type=quiz&difficulty=Hard&page=2'),'/practice?type=quiz&difficulty=Hard&page=2');
});

test('the JavaScript input example actually reads stdin across whitespace formats and examples do not alter language defaults',()=>{
 const practice=load('practice');
 for(const language of Object.keys(practice.codeTemplates)){
  const input=journey.practiceExample(language,'input');
  assert.equal(input.stdin,'2 3\n');assert.equal(input.expected,'5');assert.ok(input.code.length>40);
  input.code='changed locally';
  assert.notEqual(journey.practiceExample(language,'input').code,input.code);
  assert.equal(journey.practiceExample(language,'hello').code,practice.codeTemplates[language]);
  assert.equal(journey.practiceExample(language,'hello').stdin,'');
 }
 for(const [stdin,expected] of [['2 3\n','5'],['  -12\n7\n','-5'],['0\t0','0']]){
  const output=[];
  vm.runInNewContext(journey.practiceExample('javascript','input').code,{
   require:name=>{assert.equal(name,'node:fs');return {readFileSync:(fd,encoding)=>{assert.equal(fd,0);assert.equal(encoding,'utf8');return stdin;}};},
   console:{log:value=>output.push(String(value))},
  },{timeout:1000});
  assert.equal(output.join('\n'),expected);
 }
});

const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'); const path=require('node:path'); const vm=require('node:vm');
const ts=require('typescript'); const React=require('react'); const {renderToStaticMarkup}=require('react-dom/server');
const folder=path.resolve(__dirname,'../../frontend/src/features/platform/components/cv');
function load(filename,dependencies={}){
  const code=ts.transpileModule(fs.readFileSync(path.join(folder,filename),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true,target:ts.ScriptTarget.ES2022}}).outputText;
  const module={exports:{}};
  vm.runInNewContext(code,{module,exports:module.exports,URL,require:name=>dependencies[name] || require(name)},{filename});
  return module.exports;
}
const types=load('cv.types.ts'); const persistence=load('cv.persistence.ts',{'./cv.types':types});
const plain=value=>JSON.parse(JSON.stringify(value));
test('editor restores legacy CV details and round-trips projects, certificates and template settings',()=>{
  const legacy={personal_info:{full_name:'Legacy',avatar_url:'https://example.com/avatar.png'},skills:[{name:'Python',level:'خبير'}],experience:[{title:'Engineer',company:'Company',location:'Remote',start_date:'2020',end_date:'2024',description:'Work detail'}],education:[{degree:'BSc',institution:'University',field:'CS',start_year:2020,end_year:2035,description:'Education detail'}],languages:[{name:'Arabic',level:'اللغة الأم'}]};
  const restored=persistence.restoreCV(legacy); const payload=persistence.cvPayload(restored);
  assert.equal(payload.personal_info.avatar_url,legacy.personal_info.avatar_url);
  assert.equal(payload.skills[0].level,'خبير'); assert.equal(payload.experience[0].location,'Remote');
  assert.equal(payload.education[0].description,'Education detail'); assert.equal(payload.education[0].end_year,2035);
  const cv={...restored,templateId:8,accentColor:'#0ea5e9',projects:[{id:'p',name:'Project',description:'Description',tech:['React'],url:'example.com',github:'github.com/example'}],certifications:[{id:'c',name:'Certificate',issuer:'Issuer',date:'2026',url:'https://example.com/cert'}]};
  const roundTrip=persistence.restoreCV({builder_data:plain(persistence.cvPayload(cv).builder_data)});
  assert.deepEqual(plain(roundTrip),plain(cv));
});
test('all ten CV templates render certificates and projects and escape user text',()=>{
  const Preview=load('CVTemplates.tsx').default;
  for(let templateId=1;templateId<=10;templateId++){
    const cv={...types.defaultCV(),templateId,fullName:'<script>unsafe</script>',projects:[{id:'p',name:'Unique project',description:'Project description',tech:[],url:'',github:''}],certifications:[{id:'c',name:'Unique certificate',issuer:'Issuer',date:'2026',url:''}]};
    const html=renderToStaticMarkup(React.createElement(Preview,{cv}));
    assert.ok(html.includes('Unique project'),'project visible in template '+templateId);
    assert.ok(html.includes('Unique certificate'),'certificate visible in template '+templateId);
    assert.equal(html.includes('<script>'),false,'text escaped in template '+templateId);
  }
});

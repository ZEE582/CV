const{test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const vm=require('node:vm');const ts=require('typescript');const{unzipSync,strFromU8}=require('fflate');const fixture=require('./fixtures/cv-export.cjs');
const folder=path.resolve(__dirname,'../../frontend/src/features/platform/components/cv');
function load(file,globals={}){const module={exports:{}};const code=ts.transpileModule(fs.readFileSync(path.join(folder,file+'.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;vm.runInNewContext(code,{module,exports:module.exports,TextEncoder,URL,...globals,require:name=>name.startsWith('./')?load(name.slice(2),globals):require(name)});return module.exports;}
const types=load('cv.types'),exportsAPI=load('cv.export'),words=load('cv.docx');
const sample=options=>fixture(types.defaultCV(),options);
test('export includes all substantive CV sections and details independently of the visual template',()=>{
 const cv=sample(),before=JSON.stringify(cv);const blocks=exportsAPI.cvExportBlocks(cv),text=blocks.map(b=>b.text).join('\n');
 for(const value of[cv.fullName,cv.jobTitle,cv.email,cv.phone,cv.location,cv.linkedin,cv.github,cv.portfolio,'TypeScript','متقدم','Remote 0','React','Node.js','3.8/4','EDUCATION_NOTES','Docker','MongoDB','https://example.com/project/code','Sample Issuer','CERTIFICATE_LAST_MARKER'])assert.ok(text.includes(value),value);
 assert.ok(text.includes('حتى الآن'));for(let templateId=1;templateId<=10;templateId++)assert.equal(JSON.stringify(exportsAPI.cvExportBlocks({...cv,templateId})),JSON.stringify(blocks));assert.equal(JSON.stringify(cv),before);
});
test('export direction follows the first strong letter per paragraph and keeps contact URLs and phone numbers left to right',()=>{
 const blocks=exportsAPI.cvExportBlocks(sample());assert.equal(blocks[0].dir,'rtl');assert.equal(blocks.find(b=>b.text===sample().phone).dir,'ltr');assert.equal(blocks.find(b=>b.text===sample().linkedin).dir,'ltr');
 const en=exportsAPI.cvExportBlocks(sample({english:true}));assert.equal(en[0].dir,'ltr');assert.ok(en.some(b=>b.text==='Experience'));assert.equal(exportsAPI.textDirection('123 العربية React'),'rtl');assert.equal(exportsAPI.textDirection('2026 React عربية'),'ltr');
});
test('export preserves long multiline descriptions and rejects invalid XML characters even in nested fields and excessive UTF8 data',()=>{
 const cv=sample({long:true});assert.ok(exportsAPI.cvExportBlocks(cv).length>50);assert.ok(exportsAPI.cvExportBlocks({...cv,summary:'a\r\nb\nc'}).some(b=>b.text==='b'));
 assert.throws(()=>exportsAPI.cvExportBlocks({...cv,projects:[{...cv.projects[0],description:'bad\0text'}]}));assert.throws(()=>exportsAPI.cvExportBlocks({...cv,fullName:'\ud800'}));assert.throws(()=>exportsAPI.cvExportBlocks({...cv,email:'invalid'}));
 assert.throws(()=>exportsAPI.cvExportBlocks({...cv,projects:Array.from({length:40},(_,i)=>({...cv.projects[0],id:String(i),description:'ع'.repeat(20000)}))}));
});
test('printable HTML escapes user content and has an A4 flowing document with no remote resources, scripts or forced page height',()=>{
 const html=exportsAPI.printableCV({...sample(),fullName:'</title><script>alert(1)</script>',summary:'<img src="https://evil.invalid/track"> & text'});
 assert.equal(html.includes('<script>'),false);assert.equal(html.includes('<img src='),false);assert.ok(html.includes('&lt;script&gt;'));assert.ok(html.includes("default-src 'none'"));assert.ok(html.includes('@page{size:A4'));assert.ok(html.includes('height:auto'));assert.equal(html.includes('height:297mm'),false);assert.ok(html.includes('CERTIFICATE_LAST_MARKER'));
});
test('export filenames retain Arabic while removing path separators controls and hidden direction overrides',()=>{
 const name=exportsAPI.exportFilename('../اسم\\اختبار:*?\u202e','docx');assert.ok(name.endsWith('_Resume.docx'));assert.ok(name.includes('اسم'));assert.equal(/[<>:"/\\|?*\u202a-\u202e]/.test(name),false);assert.equal(exportsAPI.exportFilename('','pdf'),'CV_Resume.pdf');assert.ok(exportsAPI.exportFilename('x'.repeat(1000),'docx').length<90);
});
test('Word is an actual DOCX package with complete escaped text Arabic bidi paragraphs and A4 page size',async()=>{
 const cv={...sample({long:true}),fullName:'اختبار <نص> & Word'};const{Packer}=require('docx');const bytes=await Packer.toBuffer(words.wordDocument(cv));const archive=unzipSync(bytes);const xml=strFromU8(archive['word/document.xml']);assert.ok(archive['[Content_Types].xml']);assert.ok(xml.includes('اختبار &lt;نص&gt; &amp; Word'));assert.ok(xml.includes('CERTIFICATE_LAST_MARKER'));assert.ok(xml.includes('EDUCATION_NOTES'));assert.ok(xml.includes('https://example.com/project/code'));assert.ok(xml.includes('w:bidi'));assert.ok(xml.includes('w:w="11906"'));assert.ok(xml.includes('w:h="16838"'));assert.equal(xml.includes('w:altChunk'),false);
 const rels=strFromU8(archive['word/_rels/document.xml.rels']);assert.equal(rels.includes('TargetMode="External"'),false);assert.ok(bytes.length>1000);
});
test('download dispatch releases its temporary link and URL after success or failure without marking a file as verified',()=>{
 for(const fails of[false,true]){const events=[],timers=[];const globals={URL:{createObjectURL:()=>{events.push('url');return'blob:test';},revokeObjectURL:()=>events.push('revoke')},document:{createElement:()=>({style:{},click(){events.push('click');if(fails)throw new Error('blocked');},remove(){events.push('remove');}}),body:{appendChild(){events.push('append');}}},window:{setTimeout:fn=>timers.push(fn)}};const api=load('cv.export',globals);if(fails)assert.throws(()=>api.downloadCVBlob({},'CV.docx'));else api.downloadCVBlob({},'CV.docx');assert.ok(events.includes('remove'));timers.forEach(fn=>fn());assert.equal(events.at(-1),'revoke');}
});

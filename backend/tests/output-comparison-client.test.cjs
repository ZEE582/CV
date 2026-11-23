const{test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const vm=require('node:vm');const ts=require('typescript');
const moduleUnderTest={exports:{}};const js=ts.transpileModule(fs.readFileSync(path.resolve(__dirname,'../../frontend/src/features/platform/utils/outputComparison.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
vm.runInNewContext(js,{module:moduleUnderTest,exports:moduleUnderTest.exports});const{compareOutput,outputCharacter,maxExpectedOutput}=moduleUnderTest.exports;
const run=stdout=>({state:'completed',phase:'run',exit_code:0,signal:null,status:null,stdout,stderr:'warning',output:stdout+'warning',truncated:false});
test('comparison uses stdout only and normalizes CRLF with explicit optional removal of one final newline',()=>{
 assert.equal(compareOutput(run('5\r\n'),'5',true).state,'match');assert.equal(compareOutput(run('a\r\nb\r\n'),'a\nb\n',false).state,'match');
 assert.equal(compareOutput(run('5\n'),'5',false).state,'different');assert.equal(compareOutput(run('5\n\n'),'5',true).state,'different');
 assert.equal(compareOutput(run('5\n\n'),'5\n',true).state,'different');
});
test('spaces tabs case Arabic and Unicode are compared without trimming coercion or Unicode normalization',()=>{
 for(const[a,b]of[[' 5','5'],['5 ','5'],['a\tb','a b'],['Hello','hello'],['لغة','لغه'],['é','e\u0301'],['\r','\n']])assert.equal(compareOutput(run(a),b,false).state,'different');
 assert.equal(compareOutput(run('👋 العربية\n'),'👋 العربية',true).state,'match');
});
test('empty expected output is intentional and first differences distinguish text end from a newline or space',()=>{
 assert.equal(compareOutput(run(''),'',false).state,'match');assert.equal(compareOutput(run('\n'),'',true).state,'match');
 let result=compareOutput(run(''), ' ',true);assert.equal(result.actual,null);assert.equal(result.expected,' ');assert.equal(result.line,1);assert.equal(result.column,1);
 result=compareOutput(run('a\n'), 'a',false);assert.equal(result.actual,'\n');assert.equal(result.expected,null);
});
test('difference positions count Unicode code points and logical lines instead of UTF16 units or visual tab columns',()=>{
 let result=compareOutput(run('👋\tأ\nسx'),'👋\tأ\nسy',false);assert.equal(result.line,2);assert.equal(result.column,2);assert.equal(result.actual,'x');assert.equal(result.expected,'y');
 result=compareOutput(run('👋\tx'),'👋\ty',false);assert.equal(result.column,3);
});
test('stale pending unsuccessful truncated and excessive results cannot be reported as a match',()=>{
 assert.equal(compareOutput(run('x'),'x',true,true).state,'blocked');assert.equal(compareOutput(run('x'),'x',true,false,true).state,'blocked');
 for(const patch of[{state:'runtime_error'},{state:'compile_error'},{state:'timeout'},{state:'output_limit'},{phase:'compile'},{exit_code:1},{signal:'SIGTERM'},{status:'TO'},{truncated:true},{stdout:'x'.repeat(maxExpectedOutput+1)},{stdout:null}])assert.equal(compareOutput({...run('x'),...patch},'x',true).state,'blocked');
 assert.equal(compareOutput(run('x'),'x'.repeat(maxExpectedOutput+1),true).state,'blocked');assert.equal(compareOutput(run('x'),null,true).state,'blocked');
 assert.equal(compareOutput(run('x'.repeat(maxExpectedOutput)),'x'.repeat(maxExpectedOutput),true).state,'match');
});
test('character descriptions make invisible differences explicit and all compared strings remain unmodified',()=>{
 assert.equal(outputCharacter(null),'نهاية النص');assert.equal(outputCharacter(' '),'مسافة');assert.equal(outputCharacter('\t'),'علامة Tab');assert.equal(outputCharacter('\n'),'سطر جديد');assert.match(outputCharacter('\r'),/\\r/);assert.equal(outputCharacter('<'),'"<"');
 const original=run('a\r\n');const before=JSON.stringify(original);compareOutput(original,'a',true);assert.equal(JSON.stringify(original),before);
});

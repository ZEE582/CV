const{test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const os=require('node:os');const{createRequire}=require('node:module');
test('Swagger dependency scans exactly the project route files with portable absolute globs',()=>{
 const glob=createRequire(require.resolve('swagger-jsdoc'))('glob');const backend=path.resolve(__dirname,'..');
 const folders=[path.join(backend,'routes'),path.join(backend,'modules/auth/routes')];
 function files(folder){return fs.readdirSync(folder,{withFileTypes:true}).flatMap(item=>item.isDirectory()?files(path.join(folder,item.name)):item.name.endsWith('.js')?[path.join(folder,item.name)]:[]);}
 const expected=folders.flatMap(files).sort();const patterns=[path.join(folders[0],'*.js'),path.join(folders[1],'**/*.js')].map(p=>p.replace(/\\/g,'/'));
 const actual=patterns.flatMap(pattern=>glob.sync(pattern)).map(p=>path.resolve(p)).sort();assert.deepEqual(actual,expected);assert.ok(actual.length>10);
});
test('TypeScript project service handles configured files and explicit dotted default-project matches without widening nested access',()=>{
 const parser=require('@typescript-eslint/parser');const tempRoot=path.resolve(os.tmpdir());const directory=fs.mkdtempSync(path.join(tempRoot,'ttwar-dependency-'));
 try{
  fs.mkdirSync(path.join(directory,'src'));fs.mkdirSync(path.join(directory,'nested'));
  fs.writeFileSync(path.join(directory,'tsconfig.json'),JSON.stringify({compilerOptions:{allowJs:true,strict:true},include:['src/**/*.ts']}));
  fs.writeFileSync(path.join(directory,'src/index.ts'),'export const value: number = 1;');fs.writeFileSync(path.join(directory,'.compat.js'),'export const value = 1;');fs.writeFileSync(path.join(directory,'nested/outside.js'),'export const value = 1;');
  const options={tsconfigRootDir:directory,projectService:{allowDefaultProject:['*.js'],defaultProject:'tsconfig.json'},sourceType:'module'};
  const typed=parser.parseForESLint('export const value: number = 1;',{...options,filePath:path.join(directory,'src/index.ts')});assert.ok(typed.services.program);assert.equal(typed.ast.type,'Program');
  const dotted=parser.parseForESLint('export const value = 1;',{...options,filePath:path.join(directory,'.compat.js')});assert.ok(dotted.services.program);
  assert.throws(()=>parser.parseForESLint('export const value = 1;',{...options,filePath:path.join(directory,'nested/outside.js')}),/not found|allowDefaultProject|not included/i);
 }finally{if(typeof parser.clearCaches==='function')parser.clearCaches();assert.ok(path.resolve(directory).startsWith(tempRoot+path.sep));fs.rmSync(directory,{recursive:true,force:true});}
});

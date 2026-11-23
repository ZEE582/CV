const path=require('node:path');
const axios=require('axios');
const configuration=require('../backend/services/executorConfiguration');
const runCode=require('../backend/services/compilerService');
const samples=require('../executor/smoke-samples.cjs');
const {languages,runtimesUrl,installedLanguages}=require('../backend/services/executorRuntimes');

async function inspectExecutor({smoke=false,get=axios.get,run=runCode}={}){
 const url=configuration();
 const report={configured:!!url,host:url?.host||null,reachable:false,ready:false,reason:'not_configured',installed:[],missing:[...languages],smoke:null};
 if(!url)return report;
 // Standard Piston sibling endpoint only. Do not copy URL queries or fragments.
 const runtimes=runtimesUrl(url);if(!runtimes)return {...report,reason:'nonstandard_execute_path'};
 let installed;
 try{
  const response=await get(runtimes.href,{timeout:5000,maxContentLength:128*1024,maxRedirects:0,headers:process.env.CODE_EXECUTOR_TOKEN?{Authorization:'Bearer '+process.env.CODE_EXECUTOR_TOKEN}:{}});
  installed=installedLanguages(response.data);
 }catch(error){return {...report,reason:error instanceof Error&&error.message==='invalid_runtimes'?'invalid_runtimes':'unreachable'};}
 report.reachable=true;report.installed=installed;report.missing=languages.filter(language=>!installed.includes(language));
 if(report.missing.length)return {...report,reason:'missing_languages'};
 report.ready=true;report.reason='ready';
 if(!smoke)return report;
 report.smoke={};
 for(const language of languages){
  try{
   const sample=samples[language];const result=await run(language,sample.code,sample.stdin);
   report.smoke[language]=result.state==='completed'&&result.stdout.trim()==='5'?'passed':'failed';
  }catch{report.smoke[language]='failed';}
 }
 if(Object.values(report.smoke).some(value=>value!=='passed')){report.ready=false;report.reason='smoke_failed';}
 return report;
}
module.exports={inspectExecutor,installedLanguages};
if(require.main===module){
 const args=process.argv.slice(2);
 if(args.length>1||args.some(arg=>arg!=='--smoke')){console.error('Usage: npm run check:executor -- [--smoke]');process.exitCode=1;}
 else{
  require('dotenv').config({path:path.resolve(__dirname,'../backend/.env'),quiet:true});
  inspectExecutor({smoke:args.includes('--smoke')}).then(report=>{console.log(JSON.stringify(report,null,2));process.exitCode=report.ready?0:2;}).catch(()=>{console.error('Executor diagnostic failed. Check the local configuration.');process.exitCode=1;});
 }
}

const axios=require('axios');
const configuration=require('./executorConfiguration');
const {languages,runtimesUrl,installedLanguages}=require('./executorRuntimes');
function createExecutorReadiness({get,now=()=>Date.now(),ttlMs=5000,timeoutMs=3000}={}){
 let cache=null,pending=null,generation=0;
 const key=()=>JSON.stringify([configuration()?.href||null,process.env.CODE_EXECUTOR_TOKEN||'']);
 const copy=value=>({...value,languages:[...value.languages],installed_languages:[...value.installed_languages]});
 async function check({fresh=false}={}){
  const execute=configuration();
  const baseline={success:true,configured:!!execute,available:false,host:execute?.host||null,languages:[...languages],installed_languages:[],state:'unconfigured',checked_at:null,max_code_chars:50000,max_stdin_chars:8000};
  if(!execute)return baseline;
  const url=runtimesUrl(execute);if(!url)return {...baseline,state:'unverifiable'};
  const stamp=key(),epoch=generation;
  if(!fresh&&cache?.key===stamp&&cache.expires>now())return copy(cache.value);
  if(pending?.key===stamp)return copy(await pending.promise);
  // One shared, bounded metadata request; cancelling a page must not cancel other readers.
  const token=process.env.CODE_EXECUTOR_TOKEN;
  const operation=(async()=>{
   const controller=new AbortController();const deadline=setTimeout(()=>controller.abort(),timeoutMs);
   try{
    const response=await (get||axios.get)(url.href,{timeout:timeoutMs,signal:controller.signal,maxContentLength:128*1024,maxRedirects:0,headers:token?{Authorization:'Bearer '+token}:{}});
    const installed=installedLanguages(response.data);
    return {...baseline,available:installed.length>0,installed_languages:installed,state:installed.length===languages.length?'ready':installed.length?'partial':'missing_runtimes',checked_at:new Date(now()).toISOString()};
   }catch(error){return {...baseline,state:error instanceof Error&&error.message==='invalid_runtimes'?'invalid_response':'unreachable',checked_at:new Date(now()).toISOString()};}
   finally{clearTimeout(deadline);}
  })();
  pending={key:stamp,promise:operation};
  try{
   const value=await operation;
   if(generation===epoch&&key()===stamp&&pending?.promise===operation)cache={key:stamp,value,expires:now()+ttlMs};
   return copy(value);
  }finally{if(pending?.promise===operation)pending=null;}
 }
 return {check,clear(){generation++;cache=null;pending=null;}};
}
module.exports={...createExecutorReadiness(),createExecutorReadiness};

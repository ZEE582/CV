const languages=['javascript','python','java','c','c++'];
function runtimesUrl(execute){
 if(!execute.pathname.endsWith('/execute'))return null;
 const url=new URL(execute.href);url.pathname=url.pathname.replace(/\/execute$/,'/runtimes');url.search='';url.hash='';return url;
}
function installedLanguages(data){
 if(!Array.isArray(data)||data.length>500)throw new Error('invalid_runtimes');
 const installed=new Set();
 for(const runtime of data){
  if(!runtime||typeof runtime.language!=='string'||!runtime.language||runtime.language.length>80||typeof runtime.version!=='string'||!runtime.version||runtime.version.length>80||!Array.isArray(runtime.aliases)||runtime.aliases.length>30||runtime.aliases.some(alias=>typeof alias!=='string'||alias.length>80))throw new Error('invalid_runtimes');
  const names=[runtime.language,...runtime.aliases].map(name=>name.toLowerCase());
  for(const language of languages)if(names.includes(language))installed.add(language);
 }
 return languages.filter(language=>installed.has(language));
}
module.exports={languages,runtimesUrl,installedLanguages};

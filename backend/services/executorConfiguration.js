module.exports=function configuration(){
 try{
  const url=new URL(process.env.CODE_EXECUTOR_URL||'');
  if(!['https:','http:'].includes(url.protocol)||url.username||url.password||
   (url.protocol==='http:'&&(process.env.NODE_ENV==='production'||!['localhost','127.0.0.1','[::1]'].includes(url.hostname))))return null;
  return url;
 }catch{return null;}
};

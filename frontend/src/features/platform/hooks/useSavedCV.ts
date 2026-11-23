import { useEffect, useRef, useState } from 'react';
import {createCVClient,CVError,type CVClient} from '../api/cvClient';
import { defaultCV } from '../components/cv/cv.types';

export default function useSavedCV(accountId?: string,providedClient?:CVClient) {
  const[client]=useState(()=>providedClient||createCVClient(accountId));
  const [cv,setCV]=useState(defaultCV);
  const [snapshot,setSnapshot]=useState(()=>JSON.stringify(defaultCV()));
  const [loading,setLoading]=useState(!!accountId); const [ready,setReady]=useState(!accountId);
  const [savedAt,setSavedAt]=useState<string | null>(null); const [error,setError]=useState('');
  const [saving,setSaving]=useState(false); const [attempt,setAttempt]=useState(0);
  const[conflict,setConflict]=useState(false);const[reauth,setReauth]=useState(false);
  const action=useRef<AbortController|null>(null); const mounted=useRef(true);
  const dirty=JSON.stringify(cv)!==snapshot;
  useEffect(()=>{mounted.current=true; return()=>{mounted.current=false;action.current?.abort();};},[]);
  useEffect(()=>{
    if(!accountId) return;
    const controller=new AbortController(); setLoading(true); setError('');
    void client.load(controller.signal).then(data=>{if(!controller.signal.aborted){setCV(data.cv);setSnapshot(JSON.stringify(data.cv));setSavedAt(data.updatedAt);setReady(true);setConflict(false);setReauth(false);}})
      .catch(error=>{if(!controller.signal.aborted){setError(error instanceof Error?error.message:'تعذر استرجاع السيرة.');setReauth(error instanceof CVError&&error.status===401);}})
      .finally(()=>{if(!controller.signal.aborted)setLoading(false);});
    return()=>controller.abort();
  },[accountId,client,attempt]);
  useEffect(()=>{
    if(!dirty&&!saving) return;
    const warn=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue='';};
    window.addEventListener('beforeunload',warn);
    return()=>window.removeEventListener('beforeunload',warn);
  },[dirty,saving]);
  async function save(){
    if(!accountId || !ready || loading || conflict || reauth || action.current) return;
    const controller=new AbortController();action.current=controller;setSaving(true);setError(''); const savedSnapshot=JSON.stringify(cv);
    try{
      const result=await client.save(cv,savedAt,controller.signal);
      if(mounted.current&&!controller.signal.aborted){setSavedAt(result.updatedAt);setSnapshot(savedSnapshot);}
    }catch(error){if(mounted.current&&!controller.signal.aborted){setError(error instanceof Error ? error.message : 'تعذر الحفظ.');setConflict(error instanceof CVError&&error.status===409);setReauth(error instanceof CVError&&error.status===401);}}
    finally{if(action.current===controller)action.current=null;if(mounted.current)setSaving(false);}
  }
  function reload(discard=false){if(!saving&&!loading&&(!dirty||discard))setAttempt(value=>value+1);}
  return {cv,setCV,dirty,loading,ready,savedAt,error,saving,conflict,reauth,save,reload,accountId};
}

import { Link, useLocation } from 'react-router-dom';
import {useState} from 'react';
import {Button,Dialog,DialogActions,DialogContent,DialogTitle} from '@mui/material';
import type useSavedCV from '../../hooks/useSavedCV';
import { AC, ACB } from './cv.types';

export default function CVStorageBar({storage}:{storage:ReturnType<typeof useSavedCV>}){
  const location=useLocation();
  const[confirmReload,setConfirmReload]=useState(false);
  return <section dir="rtl" aria-label="حفظ السيرة الذاتية" style={{background:'white',border:`1px solid ${ACB}`,borderRadius:12,padding:16,marginBottom:20,color:'#34445e',fontFamily:"'Tajawal',sans-serif"}}>
    {!storage.accountId ? <><p>المحرر متاح للتجربة. <Link to="/login" state={{from:location}} style={{color:AC,textDecoration:'underline'}}>سجّل الدخول لحفظ سيرتك في حسابك</Link>. بيانات التجربة الحالية لا تنتقل تلقائيًا بعد الدخول.</p><p role="status">{storage.dirty?'تعديلاتك مؤقتة في هذه الصفحة؛ صدّر نسخة من المعاينة قبل المغادرة.':'يمكنك تجربة القوالب وتصدير نسخة محلية دون حساب.'}</p></> : <>
      <p role="status">{storage.loading?'جارٍ استرجاع السيرة...':storage.saving?'جارٍ حفظ السيرة...':!storage.ready?'لم تُسترجع نسخة صالحة بعد. أعد المحاولة قبل التعديل.':storage.dirty?'لديك تغييرات غير محفوظة.':storage.savedAt?`النسخة محفوظة في حسابك — ${new Date(storage.savedAt).toLocaleString('ar-PS',{timeZone:'Asia/Hebron'})}`:'لم تحفظ سيرة في حسابك بعد.'}</p>
      <p style={{fontSize:13,marginTop:5}}>الحفظ يدوي. اضغط «حفظ في حسابي» قبل مغادرة الصفحة.</p>
      <div style={{display:'flex',flexWrap:'wrap',gap:10,marginTop:12}}><button onClick={()=>void storage.save()} disabled={storage.saving || !storage.ready || storage.loading || storage.conflict || storage.reauth || (!storage.dirty && !!storage.savedAt)} style={{background:AC,color:'white',padding:'9px 16px',border:0,borderRadius:8,cursor:'pointer'}}>حفظ في حسابي</button><button onClick={()=>{if(storage.dirty)setConfirmReload(true);else storage.reload();}} disabled={storage.loading || storage.saving} style={{color:AC,padding:'9px 16px',border:`1px solid ${ACB}`,borderRadius:8,background:'white'}}>استرجاع المحفوظ</button></div>
      {storage.reauth&&<p><Link to="/login" state={{from:location}} style={{color:AC,textDecoration:'underline'}}>تسجيل الدخول مجددًا</Link></p>}
    </>}
    {storage.error && <p role="alert" style={{color:'#b42335',marginTop:12}}>{storage.error}</p>}
    <Dialog open={confirmReload} onClose={()=>setConfirmReload(false)} fullWidth maxWidth="sm" PaperProps={{dir:'rtl',sx:{m:2,width:'calc(100% - 32px)',fontFamily:"'Tajawal',sans-serif",'& .MuiTypography-root,& .MuiButton-root':{fontFamily:'inherit'}}}} aria-labelledby="cv-reload-title"><DialogTitle id="cv-reload-title">استبدال التعديلات بالنسخة المحفوظة؟</DialogTitle><DialogContent><p>سيُستبدل عملك الحالي إذا نجح الاسترجاع. يمكنك الإلغاء ومراجعة مسودتك أو تصديرها من المعاينة أولًا.</p></DialogContent><DialogActions><Button color="inherit" onClick={()=>setConfirmReload(false)}>الاحتفاظ بالتعديلات</Button><Button color="warning" onClick={()=>{setConfirmReload(false);storage.reload(true);}}>استرجاع النسخة المحفوظة</Button></DialogActions></Dialog>
  </section>;
}

const API_BASE = 'http://localhost:5000/api';

const http = async (method, endpoint, body=null, auth=true) => {
  const headers = { 'Content-Type':'application/json' };
  const token   = localStorage.getItem('foras_token');

  if (auth && token) headers['Authorization'] = `Bearer ${token}`;

  const cfg = { method, headers };
  if (body) cfg.body = JSON.stringify(body);

  try {
    const res  = await fetch(`${API_BASE}${endpoint}`, cfg);
    const data = await res.json();

    if (!res.ok) {
      throw { status:res.status, message:data.message||'خطأ غير معروف', data };
    }

    return data;

  } catch(err) {
    if (err.status) throw err;
    throw { status:0, message:'تعذّر الاتصال بالخادم.' };
  }
};



const Auth = {
  register:        d => http('POST','/auth/register',d,false),
  registerCompany: d => http('POST','/auth/register-company',d,false),
  login:           d => http('POST','/auth/login',d,false),
  me:              () => http('GET', '/auth/me'),
  changePassword:  d => http('PUT', '/auth/change-password',d),

  saveUser(token, user) {
    localStorage.setItem('foras_token', token);
    localStorage.setItem('foras_user', JSON.stringify(user));
  },

  logout() {
    localStorage.removeItem('foras_token');
    localStorage.removeItem('foras_user');
    window.location.href = '/index.html';
  },

  getUser() {
    try { return JSON.parse(localStorage.getItem('foras_user')); }
    catch { return null; }
  },

  isLoggedIn() {
    return !!localStorage.getItem('foras_token');
  },

  isCompany() {
    return Auth.getUser()?.role === 'company';
  },

  isSeeker() {
    return Auth.getUser()?.role === 'seeker';
  }
};



const Jobs = {
  getAll:    (p={}) => http('GET','/jobs?'+new URLSearchParams(p),null,false),
  getById:   id     => http('GET',`/jobs/${id}`,null,false),
  getStats:  ()     => http('GET','/jobs/stats',null,false),
  create:    d      => http('POST','/jobs',d),
  update:    (id,d) => http('PUT',`/jobs/${id}`,d),
  remove:    id     => http('DELETE',`/jobs/${id}`),
  apply:     (id,d) => http('POST',`/jobs/${id}/apply`,d),
  save:      id     => http('POST',`/jobs/${id}/save`),
  getApps:   id     => http('GET',`/jobs/${id}/applications`),
  updateApp: (jId,aId,d) => http('PUT',`/jobs/${jId}/applications/${aId}`,d),
};



const Companies = {
  getAll:       (p={}) => http('GET','/companies?'+new URLSearchParams(p),null,false),
  getById:      id     => http('GET',`/companies/${id}`,null,false),
  updateMine:   d      => http('PUT','/companies/my',d),
  getDashboard: ()     => http('GET','/companies/my/dashboard'),
};



const AI = {
  ask: message => http('POST','/ai',{ message },false)
};



const UI = {
  toast(msg,type='success',duration=4000){
    let el=document.getElementById('foras-toast');

    if(!el){
      el=document.createElement('div');
      el.id='foras-toast';
      el.style.cssText=`
        position:fixed;
        bottom:2rem;
        left:50%;
        transform:translateX(-50%) translateY(100px);
        padding:12px 24px;
        border-radius:12px;
        font-family:'Cairo',sans-serif;
        font-size:.88rem;
        font-weight:600;
        z-index:9999;
        transition:transform .3s ease;
        white-space:nowrap;
        box-shadow:0 8px 32px rgba(0,0,0,.15);
      `;
      document.body.appendChild(el);
    }

    const colors={
      success:'background:#fff;color:#6C4FE8;border:1.5px solid rgba(108,79,232,.3)',
      error:'background:#fff;color:#ef4444;border:1.5px solid rgba(239,68,68,.3)',
      info:'background:#fff;color:#3b82f6;border:1.5px solid rgba(59,130,246,.3)'
    };

    el.style.cssText+=colors[type]||colors.success;
    el.textContent=msg;
    el.style.transform='translateX(-50%) translateY(0)';

    clearTimeout(el._t);
    el._t=setTimeout(()=>{
      el.style.transform='translateX(-50%) translateY(100px)'
    },duration);
  },

  formatSalary(min,max,cur='₪',vis=true){
    if(!vis) return 'يُحدد عند المقابلة';
    if(!min && !max) return 'راتب تنافسي';
    if(min && max) return `${min.toLocaleString()}–${max.toLocaleString()} ${cur}`;
    if(min) return `من ${min.toLocaleString()} ${cur}`;
    return `حتى ${max.toLocaleString()} ${cur}`;
  },

  timeAgo(dateStr){
    const s=(Date.now()-new Date(dateStr))/1000;

    if(s<60) return 'الآن';
    if(s<3600) return `منذ ${Math.floor(s/60)} دقيقة`;
    if(s<86400) return `منذ ${Math.floor(s/3600)} ساعة`;
    if(s<172800) return 'أمس';

    return `منذ ${Math.floor(s/86400)} أيام`;
  },

  spinner(el,on){
    if(on){
      el._html=el.innerHTML;
      el.disabled=true;
      el.innerHTML=`
        <span style="
          display:inline-block;
          width:16px;
          height:16px;
          border:2px solid rgba(255,255,255,.4);
          border-top-color:#fff;
          border-radius:50%;
          animation:spin .7s linear infinite
        "></span>
      `;
    }else{
      el.disabled=false;
      el.innerHTML=el._html || el.innerHTML;
    }
  }
};



const _s=document.createElement('style');
_s.textContent='@keyframes spin{to{transform:rotate(360deg)}}';
document.head.appendChild(_s);
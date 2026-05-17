import React, { useState } from 'react';
import { sendContactMessage } from '../../api/client';
import { useApp } from '../../context/AppContext';

interface Props { companyId: string; companyName: string; color: string; }

const inp: React.CSSProperties = { width: '100%', border: '1px solid rgba(0,0,0,0.09)', borderRadius: 10, padding: '9px 12px', fontFamily: "'Tajawal',sans-serif", fontSize: 13, background: '#fafafa', color: '#1a1a2e', outline: 'none', boxSizing: 'border-box' };
const T: React.CSSProperties  = { fontFamily: "'Tajawal',sans-serif" };
const lbl: React.CSSProperties = { ...T, fontSize: 11, color: '#9999bb', display: 'block', marginBottom: 4 };

export default function ContactForm({ companyId, companyName, color }: Props) {
  const { toast } = useApp();
  const [form, setForm]     = useState({ name:'', email:'', phone:'', subject:'استفسار', msg:'' });
  const [sending, setSending] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  const send = async () => {
    if (!form.name || !form.email || !form.msg) { toast('يرجى ملء الاسم والبريد والرسالة', 'err'); return; }
    setSending(true);
    try {
      await sendContactMessage({ company_id: companyId, sender_name: form.name, sender_email: form.email, sender_phone: form.phone || undefined, subject: form.subject, message: form.msg });
      toast('تم إرسال رسالتك بنجاح ✓');
      setForm({ name:'', email:'', phone:'', subject:'استفسار', msg:'' });
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : 'فشل الإرسال', 'err');
    } finally { setSending(false); }
  };

  return (
    <section style={{ background: 'rgba(255,255,255,0.88)', borderRadius: 18, border: '1px solid rgba(0,0,0,0.07)', padding: 24 }}>
      <h2 style={{ ...T, fontWeight: 800, fontSize: 17, color: '#1a1a2e', marginBottom: 18 }}>✉️ تواصل مع {companyName}</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div><label style={lbl}>الاسم الكامل *</label><input style={inp} value={form.name} onChange={set('name')} placeholder="محمد أحمد" /></div>
        <div><label style={lbl}>البريد الإلكتروني *</label><input style={inp} type="email" value={form.email} onChange={set('email')} placeholder="name@example.com" dir="ltr" /></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div><label style={lbl}>رقم الهاتف</label><input style={inp} value={form.phone} onChange={set('phone')} placeholder="+970..." dir="ltr" /></div>
        <div><label style={lbl}>الموضوع</label><input style={inp} value={form.subject} onChange={set('subject')} placeholder="استفسار عن وظيفة" /></div>
      </div>
      <div style={{ marginBottom: 14 }}>
        <label style={lbl}>الرسالة *</label>
        <textarea style={{ ...inp, height: 100, resize: 'none' } as React.CSSProperties} value={form.msg} onChange={set('msg')} placeholder="اكتب رسالتك هنا..." dir="rtl" />
      </div>

      <button onClick={send} disabled={sending}
        style={{ width: '100%', padding: 12, borderRadius: 12, border: 'none', background: `linear-gradient(135deg,${color},${color}cc)`, color: '#fff', ...T, fontWeight: 700, fontSize: 14, cursor: sending ? 'not-allowed' : 'pointer', opacity: sending ? 0.65 : 1, transition: 'opacity .15s' }}>
        {sending ? 'جاري الإرسال…' : '📤 إرسال الرسالة'}
      </button>
    </section>
  );
}

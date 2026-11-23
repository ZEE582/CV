import { FcGoogle } from 'react-icons/fc';
import { FaGithub, FaLinkedin } from 'react-icons/fa';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { loginWithGoogle, loginWithGithub, loginWithLinkedin } from '../services/oauthService';
import { apiRequest } from '../../../shared/api';
import { returnPath } from '../../../shared/navigation';
import Divider from './Divider';
import './SocialButtons.css';

export default function SocialButtons() {
  const location = useLocation();
  const from = returnPath(location.state) || returnPath({ from: new URLSearchParams(location.search).get('from') });
  const [providers, setProviders] = useState({ google: false, github: false, linkedin: false });
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController(); setStatus('loading');
    apiRequest<typeof providers>('/auth/providers', { signal: controller.signal }).then(result => {
      if (controller.signal.aborted) return;
      if (!result || ['google', 'github', 'linkedin'].some(key => typeof result[key as keyof typeof providers] !== 'boolean')) throw Error('Invalid providers');
      setProviders(result); setStatus('ready');
    }).catch(() => { if (!controller.signal.aborted) setStatus('error'); });
    return () => controller.abort();
  }, [attempt]);
  const googleReady = status === 'ready' && providers.google;
  return <div className="social-auth"><Divider /><button type="button" className="social-google" onClick={() => loginWithGoogle(from)} disabled={!googleReady} aria-describedby={!googleReady ? 'google-auth-status' : undefined}><FcGoogle size={22} aria-hidden="true" />المتابعة باستخدام Google</button>
    {!googleReady && <p id="google-auth-status" className="social-status" role="status">{status === 'loading' ? 'جارٍ التحقق من توفر Google…' : status === 'error' ? <>تعذر التحقق من توفر Google. <button type="button" onClick={() => setAttempt(value => value + 1)}>إعادة المحاولة</button></> : 'التسجيل بواسطة Google غير متاح حاليًا. يمكنك المتابعة بالبريد الإلكتروني.'}</p>}
    {status === 'ready' && (providers.github || providers.linkedin) && <div className="social-secondary" dir="ltr">{providers.github && <button type="button" onClick={loginWithGithub}><FaGithub size={20} aria-hidden="true" />GitHub</button>}{providers.linkedin && <button type="button" onClick={loginWithLinkedin}><FaLinkedin size={20} aria-hidden="true" />LinkedIn</button>}</div>}
  </div>;
}

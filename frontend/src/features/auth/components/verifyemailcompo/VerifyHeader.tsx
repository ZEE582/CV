import { Link } from 'react-router-dom';
import { EnvelopeIcon } from '@heroicons/react/24/outline';
export default function VerifyHeader({ email, from }: { email: string; from?: string }) {
  return <div className="verify-heading">
    <span className="verify-mail-icon" aria-hidden="true"><EnvelopeIcon /></span>
    <h1 id="verify-title">أكّد بريدك الإلكتروني</h1>
    <p>أدخل رمز التأكيد الذي وصلك إلى</p>
    <div className="verify-email-row"><bdi className="verify-email" dir="ltr">{email}</bdi><Link to="/login" state={{ from }}>تغيير البريد</Link></div>
  </div>;
}

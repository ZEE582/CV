import { useEffect, useRef } from 'react';
import { useBlocker } from 'react-router-dom';
import './UnsavedNavigation.css';

export default function UnsavedNavigation({ active, busy }: { active: () => boolean; busy: boolean }) {
  const blocker = useBlocker(({ currentLocation, nextLocation }) => active() && (currentLocation.pathname !== nextLocation.pathname || currentLocation.search !== nextLocation.search));
  const stay = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (blocker.state !== 'blocked') return;
    const previous = document.activeElement;
    stay.current?.focus();
    return () => { if (previous instanceof HTMLElement && previous.isConnected) previous.focus(); };
  }, [blocker.state]);
  if (blocker.state !== 'blocked') return null;
  return <div className="unsaved-navigation-backdrop"><section className="unsaved-navigation-dialog" role="alertdialog" aria-modal="true" aria-labelledby="unsaved-navigation-title" aria-describedby="unsaved-navigation-message" dir="rtl" onKeyDown={event => {
    if (event.key === 'Escape') { event.preventDefault(); blocker.reset(); }
    if (event.key === 'Tab') {
      const buttons = event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)');
      const first = buttons[0]; const last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
  }}><h2 id="unsaved-navigation-title">مغادرة الصفحة؟</h2><p id="unsaved-navigation-message">{busy ? 'جارٍ حفظ بياناتك. انتظر انتهاء الحفظ قبل الانتقال.' : 'لديك تغييرات غير محفوظة. ستفقدها إذا انتقلت إلى صفحة أخرى.'}</p><div><button ref={stay} type="button" onClick={() => blocker.reset()}>البقاء في الصفحة</button><button type="button" disabled={busy} onClick={() => blocker.proceed()}>المغادرة دون حفظ</button></div></section></div>;
}

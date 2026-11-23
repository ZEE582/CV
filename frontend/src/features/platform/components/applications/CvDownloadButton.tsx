import { useEffect, useRef, useState } from 'react';
import { createCvFileClient, type CvFileMetadata } from '../../api/cvFiles';
import './CvDownloadButton.css';
export default function CvDownloadButton({ applicationId, file, disabled = false, download }: { applicationId: string; file: CvFileMetadata; disabled?: boolean; download?: (id: string, file: CvFileMetadata, signal?: AbortSignal) => Promise<Blob> }) {
  const [client] = useState(() => download || createCvFileClient());
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const pending = useRef(false); const request = useRef<AbortController | null>(null);
  useEffect(() => () => request.current?.abort(), []);
  async function save() {
    if (pending.current || disabled) return;
    pending.current = true; setBusy(true); setError(''); const controller = new AbortController(); request.current = controller;
    try {
      const blob = await client(applicationId, file, controller.signal);
      if (controller.signal.aborted) return;
      const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = file.name; document.body.appendChild(link);
      try { link.click(); } finally { link.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 30000); }
    } catch (failure) { if (!controller.signal.aborted) setError(failure instanceof Error && !(failure instanceof TypeError) ? failure.message : 'تعذر تنزيل السيرة. حاول مجددًا.'); }
    finally { if (!controller.signal.aborted) { pending.current = false; setBusy(false); } }
  }
  return <span className="cv-download"><button type="button" disabled={disabled || busy} onClick={() => void save()} aria-label={'تنزيل السيرة المرفقة ' + file.name}>{busy ? 'جارٍ تحميل السيرة…' : 'تنزيل السيرة PDF'}</button><small style={{ display: 'block', overflowWrap: 'anywhere' }}>{file.name} · {(file.size / 1024).toLocaleString('ar', { maximumFractionDigits: 0 })} كيلوبايت</small>{error && <span role="alert" style={{ display: 'block', color: '#b93549' }}>{error}</span>}</span>;
}

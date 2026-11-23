import { useId, useRef, useState, type KeyboardEvent } from 'react';
import { addLanguage, languageChoices, languageKey, uniqueLanguages, MAX_LANGUAGES, MAX_LANGUAGE_LENGTH } from '../validation/languages';
import './LanguagePicker.css';
interface Props { selected: string[]; onChange: (selected: string[]) => void; disabled?: boolean }
export default function LanguagePicker({ selected, onChange, disabled }: Props) {
  const [draft, setDraft] = useState(''); const [extras, setExtras] = useState<string[]>([]);
  const [error, setError] = useState(''); const [notice, setNotice] = useState('');
  const id = useId(); const input = useRef<HTMLInputElement>(null);
  const choices = languageChoices(selected, extras);
  function add() {
    if (disabled) return;
    const result = addLanguage(draft, selected, choices); setNotice('');
    if (!result.ok) { setError(result.message); input.current?.focus(); return; }
    setExtras(previous => uniqueLanguages([...previous, result.language]));
    onChange(result.selected); setDraft(''); setError('');
    setNotice(result.wasSelected ? 'هذه اللغة مختارة بالفعل.' : result.existing ? 'اللغة موجودة في القائمة وتم اختيارها.' : 'أُضيفت اللغة إلى اختياراتك. تُحفظ عند حفظ النموذج.');
    input.current?.focus();
  }
  function keyDown(event: KeyboardEvent<HTMLInputElement>) { if (event.key === 'Enter' && !event.nativeEvent.isComposing) { event.preventDefault(); event.stopPropagation(); add(); } }
  return <div className="language-picker">
    <div className="language-picker-grid" role="group" aria-label="اختيار لغات البرمجة">{choices.map(language => {
      const checked = selected.some(value => languageKey(value) === languageKey(language));
      return <label key={languageKey(language)}><input type="checkbox" name="programmingLanguages" value={language} checked={checked} disabled={disabled || (!checked && selected.length >= MAX_LANGUAGES)} onChange={event => {
        setError(''); setNotice('');
        if (event.target.checked) { const result = addLanguage(language, selected, choices); if (result.ok) onChange(result.selected); else setError(result.message); }
        else { setExtras(previous => uniqueLanguages([...previous, ...selected.filter(value => languageKey(value) === languageKey(language))])); onChange(selected.filter(value => languageKey(value) !== languageKey(language))); }
      }} /><span dir="auto">{language}</span></label>;
    })}</div>
    <div className="language-picker-add"><label htmlFor={id}>لغة برمجة غير موجودة</label>
      <div className="language-picker-entry"><input ref={input} id={id} name="customLanguage" type="text" dir="auto" value={draft} maxLength={MAX_LANGUAGE_LENGTH} autoComplete="off" autoCapitalize="off" spellCheck={false} disabled={disabled} placeholder="مثال: Elixir" aria-invalid={!!error} aria-describedby={id + '-hint' + (error ? ' ' + id + '-error' : '')} onChange={event => { setDraft(event.target.value); setError(''); setNotice(''); }} onKeyDown={keyDown} />
        <button type="button" onClick={add} disabled={disabled}>إضافة لغة</button></div>
      <p className="language-picker-hint" id={id + '-hint'}>اكتب اسم اللغة واضغط «إضافة لغة» أو Enter. الحد الأقصى ٥٠ لغة.</p>
      {error && <p id={id + '-error'} className="language-picker-error" role="alert">{error}</p>}
      <p className="language-picker-notice" role="status">{notice || `عدد اللغات المختارة: ${selected.length.toLocaleString('ar')}`}</p>
    </div>
  </div>;
}
